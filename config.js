const CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    
    WORLD_WIDTH: 2400,
    WORLD_HEIGHT: 2400,
    
    PLAYER_WIDTH: 40,
    PLAYER_HEIGHT: 50,
    PLAYER_SPEED: 4,
    PLAYER_MAX_LIVES: 3,
    PLAYER_SHOOT_COOLDOWN: 400,
    
    WOLF_WIDTH: 40,
    WOLF_HEIGHT: 50,
    WOLF_SPEED: 2.5,
    WOLF_DETECTION_RANGE: 800,
    WOLF_SPAWN_RATE: 2000,
    MAX_WOLVES: 50,
    WOLF_HEALTH: 2,
    
    BULLET_WIDTH: 8,
    BULLET_HEIGHT: 8,
    BULLET_SPEED: 8,
    BULLET_LIFETIME: 1000,
    
    CRATE_WIDTH: 40,
    CRATE_HEIGHT: 40,
    CRATE_COUNT: 8,
    
    POWERUPS: {
        FIRE_RATE: 'FIRE_RATE',
        BULLET_SPEED: 'BULLET_SPEED',
        BULLET_SIZE: 'BULLET_SIZE',
        MOVEMENT_SPEED: 'MOVEMENT_SPEED',
        PIERCING: 'PIERCING'
    },
    
    LAKE_COUNT: 10,
    LAKE_MIN_SIZE: 100,
    LAKE_MAX_SIZE: 250,
    
    TREE_COUNT: 40,
    
    ROCK_COUNT: 80,
    
    COLORS: {
        BACKGROUND: '#5a7c5a',
        GROUND: '#6b8e6b',
        PLAYER: '#ff69b4',
        WOLF: '#8b4513',
        BULLET: '#ffd700',
        CRATE: '#8b4513',
        LAKE: '#4a7ba7',
        LAKE_BORDER: '#3a5a7a',
        UI_BG: 'rgba(0, 0, 0, 0.7)',
        TEXT: '#ffffff'
    },
    
    ASSETS_PATH: './assets/'
};
