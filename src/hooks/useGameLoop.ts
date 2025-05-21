import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_LOOP_SETTINGS } from "../constants/game";

type GameLoopParams = {
    onFrameUpdate: (dt: number) => void;
    activateImmediately?: boolean;
    frameRate?: number;
};

type GameLoopControls = {
    timeActive: number;
    timeOnHold: number;
    resetTimers: () => void;
    isGameLoopActive: () => boolean;
    isGameLoopOnHold: () => boolean;
    toggleGameLoop: () => void;
    activateGameLoop: () => void;
    deactivateGameLoop: () => void;
    toggleGameLoopSuspension: () => void;
    putGameLoopOnHold: () => void;
    putGameLoopOffHold: () => void;
};

export const useGameLoop = ({
    onFrameUpdate,
    activateImmediately = true,
    frameRate = GAME_LOOP_SETTINGS.frameRate
}: GameLoopParams): GameLoopControls => {
    const frameInterval = 1000 / frameRate;
    
    const frameRequestRef = useRef<number>(0);
    const prevFrameTimeRef = useRef<number>(performance.now());
    const accumulatedTimeRef = useRef<number>(0);

    // Сохраняет состояние игрового цикла: на паузе он или же нет.
    const isGameLoopOnHoldRef = useRef<boolean>(false);
    // Сохраняет состояние игрового цикла: активирован он или же нет.
    const isGameLoopActiveRef = useRef<boolean>(activateImmediately);
    // Отслеживает то, находится ли пользователь на вкладке, где запущен игровой цикл.
    const isOnTabRef = useRef<boolean>(true);

    const [timeActive, setTimeActive] = useState<number>(0);
    const [timeOnHold, setTimeOnHold] = useState<number>(0);

    // Сохраняет время, проведённое в игре до последнего сброса таймеров.
    const [timeActiveBeforeLastReset, setTimeActiveBeforeLastReset] = useState<number>(0);
    const [timeOnHoldBeforeLastReset, setTimeOnHoldBeforeLastReset] = useState<number>(0);

    // Функция, позволяющая сбросить время, проведённое в игре и в паузе.
    const resetTimers = useCallback(() => {
        setTimeActiveBeforeLastReset(timeActive);
        setTimeOnHoldBeforeLastReset(timeOnHold);

        setTimeActive(0);
        setTimeOnHold(0);
    }, []);

    // возможность узнать, активен ли в данный момент игровой цикл.
    const isGameLoopActive = useCallback(() => isGameLoopActiveRef.current, []);

    const activateGameLoop = useCallback(() => {
        isGameLoopActiveRef.current = true;
    }, []);

    const deactivateGameLoop = useCallback(() => {
        // Немедленно отменяем отлов следующей отрисовки, чтобы остановить цикл мгновенно.
        cancelAnimationFrame(frameRequestRef.current);
        isGameLoopActiveRef.current = false;

        // Сбрасываем накопленное время, чтобы при реактивации цикла корректно учитывать
        // интервал между кадрами. В противном случае накопленное до деактивации небольшое
        // время может сломать точность отмеряемого времени.
        accumulatedTimeRef.current = 0;
    }, []);

    // Переключает состояние игрового цикла и возвращает значение, полученное после переключения.
    const toggleGameLoop = useCallback((): boolean => {
        // Если игровой цикл активен, деактивируем его, иначе активируем.
        if(isGameLoopActiveRef.current) {
            deactivateGameLoop();
        } else {
            activateGameLoop();
        }

        // Изменение состояния происходит мгновенно, потому возвращать его безопасно.
        return isGameLoopActiveRef.current;
    }, [activateGameLoop, deactivateGameLoop]);

    // К этой функции будут обращаться вне хука.
    // Она не даёт напрямую внедряться в переменную состояния, но предоставляет
    // возможность узнать, на паузе ли в данный момент игра.
    const isGameLoopOnHold = useCallback(() => isGameLoopOnHoldRef.current, []);

    const putGameLoopOnHold = useCallback(() => {
        isGameLoopOnHoldRef.current = true;
    }, []);

    const putGameLoopOffHold = useCallback(() => {
        isGameLoopOnHoldRef.current = false;
    }, []);

    const toggleGameLoopSuspension = useCallback(() => {
        isGameLoopOnHoldRef.current = !isGameLoopOnHoldRef.current;
    }, []);

    const onRedraw = useCallback((thisFrameTime: number) => {
        // dt, или deltaTime - время, прошедшее между двумя отрисовками.
        // Не является постоянной величиной, потому требует постоянного отслеживания.
        const dt: number = thisFrameTime - prevFrameTimeRef.current;

        // Здесь будет сохранено количество обработанных за текущую отрисовку кадров.
        let framesProcessed: number = 0;

        // Заменяем время предыдущей отрисовки временем текущей отрисовки, чтобы
        // время текущей отрисовки воспринималось на следующей отрисовке временем
        // предыдущей отрисовки.
        prevFrameTimeRef.current = thisFrameTime;

        // Добавляем `dt` к накопленному времени.
        accumulatedTimeRef.current += dt;
        
        // Как только накопленное время достигает планируемого интервала между кадрами,
        // запускаем действия, совершаемые при переходе на следующий кадр.
        // Действия запускаются столько же раз подряд, сколько накопилось кадров.
        while (accumulatedTimeRef.current >= frameInterval) {
            // Действия при обновлении кадра запускаются только если игра не приостановлена.
            if(!isGameLoopOnHoldRef.current)
                onFrameUpdate(frameInterval);

            accumulatedTimeRef.current -= frameInterval;
            framesProcessed++;
        }

        // Если за текущую отрисовку был обработан хотя бы один кадр, запускаем действия,
        // сопряжённые с обработкой кадра.
        if(framesProcessed > 0) {
            if(isGameLoopOnHoldRef.current) {
                setTimeOnHold(accumulatedTime => accumulatedTime + framesProcessed * frameInterval);
            } else {
                setTimeActive(accumulatedTime => accumulatedTime + framesProcessed * frameInterval);
            }
        }

        frameRequestRef.current = requestAnimationFrame(onRedraw);
    }, [frameInterval, onFrameUpdate]);

    // активное состояние -  отследить следующую отрисовку, неактивное - прекратить отслеживание
    // не отслеживать если пользователь не на вкладке  
    useEffect(() => {
        // После любой активации игрового цикла временем предыдущей отрисовки считается время
        // активации игрового цикла (чтобы не было большого кол-ва мгновенных обновлений кадров)
        if(isGameLoopActiveRef.current && isOnTabRef.current) {
            prevFrameTimeRef.current = performance.now();
            frameRequestRef.current = requestAnimationFrame(onRedraw);
        } else {
            cancelAnimationFrame(frameRequestRef.current);
        }

        return () => cancelAnimationFrame(frameRequestRef.current);
    }, [onRedraw]);

        // Отлов ухода с вкладки или возврат на вкладку, Page Visibility API
    useEffect(() => {
        const handleVisibilityChange = () => {
            // Вкладка активна, если document.hidden === false
            // Вкладка фоновая, если document.hidden === true
            isOnTabRef.current = !document.hidden;
        };
         // При инициализации хука начинается отлов изменений активности вкладки.
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    return {
        timeActive, timeOnHold, resetTimers,
        isGameLoopActive, toggleGameLoop, activateGameLoop, deactivateGameLoop,
        isGameLoopOnHold, toggleGameLoopSuspension, putGameLoopOnHold, putGameLoopOffHold
    }
}