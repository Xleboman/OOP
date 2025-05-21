// Для послледующего извлечения конфигурации выбранного режима игры  
export interface GameMode {
    title: string;
    inGameTitle: string;
    description: string;
    field: {
        width: number;
        height: number;
    },
    limits: {
        lines: number;
        time: number;
        moves: number;
        blocks: number;
        overflows: number;
    };
    score: {
        single: number;
        double: number;
        triple: number;
        tetris: number;
        combo: number;
    };
    speed: {
        from: number;
        to: number;
        step: number;
        per: number;
    };
}

export type GameModeId = 0 | 1 | 2 | 3  | 4;

export const GAME_LOOP_SETTINGS = {
    frameRate: 60,  // FPS, на котором работает игра.
} as const;

export const GAME_SPEED_SETTINGS = {
    minDelay: 250,      // Наименьшая задержка между падениями фигуры (в ms)
    maxDelay: 800,      // Наибольшая задержка между падениями фигуры (в ms)
    softDropDelay: 50,  // Скорость падения фигуры в режиме мягкого падения (в ms)
} as const;

export const GAME_MODE_1_SETTINGS: GameMode = {
    title: "Обычный режим",
    inGameTitle: "Обычный режим",
    description: "Классический тетрис",
    field: {
        width: 10,
        height: 20
    },
    limits: {
        lines: 0,
        time: 0,
        moves: 0,
        blocks: 0,
        overflows: 1
    },
    score: {
        single: 100,
        double: 200,
        triple: 400,
        tetris: 600,
        combo: 150
    },
    speed: {
        from: 150,
        to: 800,
        step: 50,
        per: 20000
    }
} as const;

export const GAME_MODE_2_SETTINGS: GameMode = {
    title: "Бесконечный режим",
    inGameTitle: "Бесконечный режим",
    description: "Фигуры падают бесконечно, поле очищается при заполнении",
    field: {
        width: 10,
        height: 20
    },
    limits: {
        lines: 0,
        time: 0,
        moves: 0,
        blocks: 0,
        overflows: 0
    },
    score: {
        single: 100,
        double: 200,
        triple: 400,
        tetris: 600,
        combo: 150
    },
    speed: {
        from: 150,
        to: 800,
        step: 50,
        per: 20000
    }
} as const;

export const GAME_MODE_3_SETTINGS: GameMode = {
    title: "40 линий",
    inGameTitle: "Режим 40 линий",
    description: "Собери 40 линий для победы",
    field: {
        width: 10,
        height: 20
    },
    limits: {
        lines: 40,
        time: 0,
        moves: 0,
        blocks: 0,
        overflows: 0
    },
    score: {
        single: 100,
        double: 200,
        triple: 400,
        tetris: 600,
        combo: 150
    },
    speed: {
        from: 150,
        to: 800,
        step: 50,
        per: 20000
    }
} as const;

export const GAME_MODE_4_SETTINGS: GameMode = {
    title: "8×8",
    inGameTitle: "Режим 8×8",
    description: "Игра на уменьшенном поле 8x8",
    field: {
        width: 8,
        height: 8
    },
    limits: {
        lines: 0,
        time: 0,
        moves: 0,
        blocks: 0,
        overflows: 1
    },
    score: {
        single: 100,
        double: 200,
        triple: 400,
        tetris: 600,
        combo: 150
    },
    speed: {
        from: 150,
        to: 800,
        step: 50,
        per: 20000
    }
} as const;

export const GAME_MODE_5_SETTINGS: GameMode = {
    title: "2 минуты",
    inGameTitle: "Режим 2 минуты",
    description: "2 минуты на максимум очков",
    field: {
        width: 10,
        height: 20
    },
    limits: {
        lines: 0,
        time: 120000,
        moves: 0,
        blocks: 0,
        overflows: 0
    },
    score: {
        single: 100,
        double: 200,
        triple: 400,
        tetris: 600,
        combo: 150
    },
    speed: {
        from: 150,
        to: 800,
        step: 50,
        per: 20000
    }
} as const;

export const GAME_MODE_REGULAR      = 0;
export const GAME_MODE_INFINITE     = 1;
export const GAME_MODE_LINE_LIMIT   = 2;
export const GAME_MODE_TINY_FIELD   = 3;
export const GAME_MODE_TIME_LIMIT   = 4;

export const GAME_MODE_SETTINGS: GameMode[] = [
    GAME_MODE_1_SETTINGS,
    GAME_MODE_2_SETTINGS,
    GAME_MODE_3_SETTINGS,
    GAME_MODE_4_SETTINGS,
    GAME_MODE_5_SETTINGS
] as const;