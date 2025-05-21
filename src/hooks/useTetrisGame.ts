import { use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useGameField } from "./useGameField";
import { useGameLoop } from "./useGameLoop";
import { GAME_MODE_SETTINGS, GAME_SPEED_SETTINGS } from "../constants/game";
import { GameModeId } from "../constants/game";
import { saveRecord } from "../components/RecordsManager";

export const useTetrisGame = (mode: GameModeId = 0, startImmediately: boolean = true) => {
    const { 
        minDelay: minGravityDelay,
        maxDelay: maxGravityDelay,
        softDropDelay
    } = GAME_SPEED_SETTINGS;

    // Извлекаем конфигурацию выбранного режима игры.
    const {
        field:  fieldSettings,
        limits: limitSettings,
        score:  scoreSettings,
        speed:  speedSettings
    } = GAME_MODE_SETTINGS[mode];

    const {
        single: scoreSingle,
        double: scoreDouble,
        triple: scoreTriple,
        tetris: scoreTetris,
        combo:  scoreCombo
    } = scoreSettings;

    const {
        from:   minGameSpeed,
        to:     maxGameSpeed,
        step:   gameSpeedIncreaseValue,
        per:    gameSpeedIncreaseInterval
    } = speedSettings;

    const {
        time: timeLimit,
        lines: lineLimit,
        overflows: overflowLimit
    } = limitSettings;

    const {
        width: fieldWidth,
        height: fieldHeight
    } = fieldSettings;

    // Сохраняет время, прошедшее с последнего увеличения скорости игры.
    const timeSinceLastSpeedup = useRef<number>(0);
    // Сохраняет время, прошедшее с последнего снижения активной фигуры.
    const timeSinceLastGravityTrigger = useRef<number>(0);
    // Управляет режимом "мягкого падения" - ускоренным снижением активной фигуры.
    const isSoftDropEnabled = useRef<boolean>(false);
    // Предотвращает слишком быстрые активации мягкого падения.
    const softDropCooldown = useRef<number>(0);
    // Предотвращает срабатывания гравитации во время закрепления фигуры на игровом поле.
    const pieceLockCooldown = useRef<number>(0);
    // Определяет, была ли уже повёрнута активная фигура при текущем нажатии клавиши поворота.
    const rotatedOnThisPress = useRef<boolean>(false);
    // Определяет, была ли уже жёстко сброшена активная фигура при текущем нажатии клавиши жёсткого падения.
    const hardDroppedOnThisPress = useRef<boolean>(false);
    // Определяет, находится ли игра в стадии перезапуска.
    const gameInRestartProcessRef = useRef<boolean>(false);
    // Определяет, сколько времени остаётся до того как будет включена возможность управлять игрой.
    const timeUntilControlsAvailableRef = useRef<number>(0);
    // Хранит в себе ссылку на функцию сброса игрового поля.
    const resetGameFieldFnRef = useRef<() => void>(() => null);
    // Хранит в себе ссылку на функцию сохранения счёта.
    const submitScoreFnRef = useRef<() => void>(() => null);
    // Хранит флаг, указывающий, сколько предыдущих ходов подряд очищались линии.
    const consecutiveLineClearsRef = useRef<number>(0);
    const [gameSpeed, setGameSpeed] = useState<number>(minGameSpeed);
    // Хранит количество переполнений за текущую игровую сессию.
    const [overflowCount, setOverflowCount] = useState<number>(0);
    // Хранит количество очков, набранных за текущую игровую сессию.
    const [score, setScore] = useState<number>(0);
    const [isOver, setIsOver] = useState<boolean>(false);

    // Обработка переполнения игрового поля в зависимости от режима.
    const handleOverflow = useCallback(() => {
        // Если ограничение на переполнения существует и не достигнуто, 
        // то просто очищаем поле и продолжаем игру дальше.
        if ((overflowLimit === 0) || ((overflowLimit > 0) && (overflowLimit > overflowCount + 1))) {
            // Увеличиваем счётчик переполнений игрового поля.
            setOverflowCount(value => value + 1);
            resetGameFieldFnRef.current?.();
        } else {
            // Если ограничение на переполнения достигнуто или превышено,
            // то текущее переполнение равносильно окончанию игры.
            if(!isOver) {
                setIsOver(true);
            }
        }
    }, [overflowLimit, overflowCount]);

    // Обработка увеличения количества очищенных линий.
    const handleLineClear = useCallback((count: number) => {
         // Если линий не очищено, то сбрасываем счёт ходов, когда линии очищались.
        if(count === 0) {
            consecutiveLineClearsRef.current = 0;
        } else {
            let scoreEarned: number = 0;

            // Начисляем очки в зависимости от количества линий, очищенных за этот ход.
            if(count === 1) {
                scoreEarned += scoreSingle;
            } else if(count === 2) {
                scoreEarned += scoreDouble;
            } else if(count === 3) {
                scoreEarned += scoreTriple;
            } else if(count >= 4) {
                scoreEarned += scoreTetris;
            }

            // Начисляем очки за комбо: они зависят от количества очищенных за текущий ход линий
            // и от количества последовательных очисток линий.
            scoreEarned += Math.floor((1 + (1 / count)) * scoreCombo) * consecutiveLineClearsRef.current

            setScore(score + scoreEarned);

            // Добавляем количество последовательных очисток линий
            consecutiveLineClearsRef.current++;
        }
    }, [scoreSingle, scoreDouble, scoreTriple, scoreTetris, scoreCombo, score]);

    const {
        grid, nextPiece,
        linesCleared, clearLines, setLinesCleared,
        resetGameField, tetromino, isCellEmpty,
        lockCurrentPiece, spawnNextPiece,
        safeMoveUp, safeMoveDown, safeMoveLeft, safeMoveRight,
        safeRotateClockwise, safeRotateCounterClockwise,
        safeHardDrop
    } = useGameField({
        width: fieldWidth,
        height: fieldHeight,
        onOverflow: handleOverflow,
        onLineClear: handleLineClear
    });

    useEffect(() => {
        resetGameFieldFnRef.current = resetGameField;
    }, [resetGameField]);

    // Рассчитывает показатель задержки гравитации
    const gravityDelay: number = useMemo(() => {
        if(maxGameSpeed <= minGameSpeed)
            return maxGravityDelay;

        // Рассчитываем разность в заданных показателях задержки гравитации
        const delayDelta: number = maxGravityDelay - minGravityDelay;
        const speedDelta: number = maxGameSpeed - minGameSpeed;
        return maxGravityDelay - ( delayDelta / speedDelta ) * ( gameSpeed - minGameSpeed );
    }, [gameSpeed, minGameSpeed, maxGameSpeed, softDropDelay]);

    // Если включён режим мягкого падения (Soft Drop), то возвращается его задержка.
    const activeGravityDelay = isSoftDropEnabled.current ? softDropDelay : gravityDelay;

    const activateSoftDrop = useCallback(() => {
        if(softDropCooldown.current === 0) {
            softDropCooldown.current = softDropDelay;
            isSoftDropEnabled.current = true;
            timeSinceLastGravityTrigger.current = activeGravityDelay;
        }
    }, [activeGravityDelay]);

    const deactivateSoftDrop = useCallback(() => {
        isSoftDropEnabled.current = false;
    }, []);

    // Переключить режим мягкого падения.
    const toggleSoftDrop = useCallback(() => {
        return isSoftDropEnabled.current ? deactivateSoftDrop() : activateSoftDrop();
    }, [activateSoftDrop, deactivateSoftDrop]);

    const triggerGravity = useCallback(() => {
        // При срабатывании гравитации пробуем сместить текущую деталь вниз.
        const hasMoved: boolean = safeMoveDown();

        if(hasMoved) {

        } else {
            if(tetromino.position.y < 0) {
                handleOverflow();
            } else {
                // Когда деталь сместить не удалось, её необходимо закрепить на игровом поле и создать новую деталь.
                pieceLockCooldown.current = 300;
                lockCurrentPiece();
                spawnNextPiece();
            }
        }
    }, [safeMoveDown, handleOverflow, lockCurrentPiece, spawnNextPiece]);

    // Функция обратного вызова, запускаемая каждое обновление игрового кадра.
    const onFrameUpdate = useCallback((dt: number) => {
        const shouldIncreaseSpeed: boolean = (gameSpeedIncreaseValue > 0) && (gameSpeed < maxGameSpeed);

        if(shouldIncreaseSpeed) {
            timeSinceLastSpeedup.current += dt;

            // Если прошло достаточно времени с момента последнего увеличения скорости игры,
            // проводим очередное увеличение скорости игры.
            if(timeSinceLastSpeedup.current >= gameSpeedIncreaseInterval) {
                setGameSpeed(currentGameSpeed => Math.min(currentGameSpeed + gameSpeedIncreaseValue, maxGameSpeed));
                // Время не обнуляется, а именно уменьшается на заданный интервал.
                timeSinceLastSpeedup.current -= Math.floor(timeSinceLastSpeedup.current / gameSpeedIncreaseInterval) * gameSpeedIncreaseInterval;
            }
        }

        // Если управление игрой ещё недоступно, снижаем задержку до него.
        if(timeUntilControlsAvailableRef.current > 0) {
            timeUntilControlsAvailableRef.current = Math.max(0, timeUntilControlsAvailableRef.current - dt);
        }

        pieceLockCooldown.current = Math.max(0, pieceLockCooldown.current - dt);

        timeSinceLastGravityTrigger.current += dt;

        softDropCooldown.current = Math.max(0, softDropCooldown.current - dt);

        if(timeSinceLastGravityTrigger.current >= activeGravityDelay) {
            // Запуск действий, связанных с гравитацией.
            if(pieceLockCooldown.current === 0) 
                triggerGravity();

            timeSinceLastGravityTrigger.current -= Math.floor(timeSinceLastGravityTrigger.current / activeGravityDelay) * activeGravityDelay;
        }
    }, [gameSpeed, activeGravityDelay, maxGameSpeed, gameSpeedIncreaseInterval, triggerGravity]);

    const {
        timeActive, timeOnHold, resetTimers,
        isGameLoopActive, toggleGameLoop, activateGameLoop, deactivateGameLoop,
        isGameLoopOnHold, toggleGameLoopSuspension, putGameLoopOnHold, putGameLoopOffHold
    } = useGameLoop({
        onFrameUpdate,
        activateImmediately: startImmediately
    });

    const [isStarted, setIsStarted] = useState<boolean>(startImmediately);

    // Хранит логическое значение, определяющее, есть ли у активного режима ограничение по времени.
    // Если режим игры вдруг обновится, то это условие поддержит свою актуальность.
    const hasTimeLimit: boolean = useMemo(() => (timeLimit > 0), [timeLimit]);

    const hasLineLimit: boolean = useMemo(() => (lineLimit > 0), [lineLimit]);
    
    //Есть ограничение по времени - отображает оставшееся время, нет - с начала игры
    const displayedTime: number = useMemo(() => 
        hasTimeLimit ? Math.max(timeLimit - timeActive, 0) : timeActive
    , [timeActive, hasTimeLimit]);

    const onSoftDropKeyPress = useCallback(() => {
        activateSoftDrop();
    }, [activateSoftDrop]);

    const onSoftDropKeyRelease = useCallback(() => {
        deactivateSoftDrop();
    }, [deactivateSoftDrop]);

    const onRotationKeyPress = useCallback((clockwise: boolean = true) => {
        // Если за текущее нажатие фигура уже была повёрнута, ничего не делать.
        if(!rotatedOnThisPress.current) {
            rotatedOnThisPress.current = true;
            if(clockwise) {
                safeRotateClockwise();
            } else {
                safeRotateCounterClockwise();
            }
        }
    }, [safeRotateClockwise, safeRotateCounterClockwise]);

    const onRotationKeyRelease = useCallback(() => {
        rotatedOnThisPress.current = false;
    }, []);

    const onHardDropKeyRelease = useCallback(() => {
        hardDroppedOnThisPress.current = false;
    }, []);

    const onMoveLeftKeyPress = useCallback(() => {
        safeMoveLeft();
    }, [safeMoveLeft]);

    const onMoveRightKeyPress = useCallback(() => {
        safeMoveRight();
    }, [safeMoveRight]);

    const onHardDropKeyPress = useCallback(() => {
        // Если жёсткое падение при текущем нажатии уже произошло, ничего не делать.
        if(!hardDroppedOnThisPress.current) { 
            safeHardDrop();
            timeSinceLastGravityTrigger.current = activeGravityDelay;
            hardDroppedOnThisPress.current = true;
        }
    }, [activeGravityDelay, safeHardDrop]);

    // Отлов нажатия на клавиши для управления игрой.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const controlsAvailable: boolean = isGameLoopActive() && !isGameLoopOnHold() && timeUntilControlsAvailableRef.current === 0;

            // Не отлавливаем нажатия клавиш управления на паузе или при завершении игры.
            switch (e.code) {
                case 'ArrowDown':
                    if(controlsAvailable)
                        onSoftDropKeyPress();
                    break;
                case 'ArrowUp':
                case 'KeyX':
                    if(controlsAvailable)
                        onRotationKeyPress(true);
                    break;
                case 'ArrowLeft':
                    if(controlsAvailable)
                        onMoveLeftKeyPress();
                    break;
                case 'ArrowRight':
                    if(controlsAvailable)
                        onMoveRightKeyPress();
                    break;
                case 'KeyZ':
                    if(controlsAvailable)
                        onRotationKeyPress(false);
                    break;
                case 'Space':
                    if(controlsAvailable)
                        onHardDropKeyPress();
                    break;
            }
        };

        // Отпускания клавиш управления на паузе продолжают отлавливаться.
        // Это необходимо для корректной работы с управлением.
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'ArrowDown') {
                onSoftDropKeyRelease();
            } else if (e.code === 'Space') {
                onHardDropKeyRelease();
            } else if ((e.code === 'ArrowUp') || (e.code === 'KeyZ') || (e.code === 'KeyX')) {
                onRotationKeyRelease();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [
        isGameLoopActive, isGameLoopOnHold,
        onSoftDropKeyPress, onSoftDropKeyRelease,
        onRotationKeyPress, onRotationKeyRelease,
        onMoveLeftKeyPress,
        onMoveRightKeyPress,
        onHardDropKeyPress, onHardDropKeyRelease
    ]);

    useEffect(() => {
        if (!isOver && (lineLimit > 0) && (lineLimit <= linesCleared)) {
            setIsOver(true);
        }
    }, [linesCleared, lineLimit]);

    useEffect(() => {
        if (!isOver && (timeLimit > 0) && (timeLimit <= timeActive)) {
            setIsOver(true);
        }
    }, [timeActive, timeLimit]);

    const submitScore = useCallback(() => {
        saveRecord({
            mode: mode + 1,
            score,
            time: timeActive
        });
    }, [mode, score, timeActive]);

    useEffect(() => {
        if(isOver) {
            // Завершение игры деактивирует игровой цикл, затем сохраняет счёт в рекорды.
            deactivateGameLoop();
            submitScore();

            timeSinceLastGravityTrigger.current = 0;
        } else if(gameInRestartProcessRef.current) {
            gameInRestartProcessRef.current = false;

            // Задаём задержку 300ms до доступности управления игрой.
            timeUntilControlsAvailableRef.current = 300;

            resetTimers();
            
            spawnNextPiece();
            activateGameLoop();
            putGameLoopOffHold();
            setIsStarted(true);
        }
    }, [isOver, minGameSpeed, activateGameLoop, putGameLoopOffHold, spawnNextPiece, deactivateGameLoop]);

    useEffect(() => {
        submitScoreFnRef.current = submitScore;
    }, [submitScore]);

    // Полностью перезапускает игру.
    const restartGame = useCallback(() => {
        if(gameInRestartProcessRef.current) return;

        gameInRestartProcessRef.current = true;
        setGameSpeed(minGameSpeed);
        setScore(0);
        setOverflowCount(0);
        setLinesCleared(0);
        resetGameField();
        setIsOver(false);
        
    }, [
        minGameSpeed,
        resetGameField,
        resetTimers,
        resetGameField,
    ]);

    return {
        grid, nextPiece,
        isStarted, isOver,
        tetromino, isCellEmpty,
        setIsStarted,

        timeActive,
        score,
        displayedTime, hasTimeLimit, linesCleared, hasLineLimit,
        isGameLoopOnHold, toggleGameLoopSuspension, putGameLoopOnHold, putGameLoopOffHold,
        restartGame, submitScore,
        lineLimit
    }
}