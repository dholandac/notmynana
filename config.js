// config.js - Configurações do jogo

const CONFIG = {
    // Tela
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    
    // Mundo
    WORLD_WIDTH: 2400,
    WORLD_HEIGHT: 2400,
    
    // Player
    PLAYER_WIDTH: 40,
    PLAYER_HEIGHT: 50,
    PLAYER_SPEED: 4,
    PLAYER_MAX_LIVES: 3,
    PLAYER_SHOOT_COOLDOWN: 400, // ms - cooldown maior
    
    // Lobos (Inimigos)
    WOLF_WIDTH: 40,
    WOLF_HEIGHT: 50,
    WOLF_SPEED: 2.5,
    WOLF_DETECTION_RANGE: 800, // Sempre persegue o player
    WOLF_SPAWN_RATE: 2000, // ms - mais rápido
    MAX_WOLVES: 50, // Muito mais lobos
    WOLF_HEALTH: 2, // Lobos aguentam 2 tiros
    
    // Projéteis
    BULLET_WIDTH: 8,
    BULLET_HEIGHT: 8,
    BULLET_SPEED: 8,
    BULLET_LIFETIME: 1000, // ms
    
    // Caixas (agora são powerups)
    CRATE_WIDTH: 40,
    CRATE_HEIGHT: 40,
    CRATE_COUNT: 8, // Muito menos caixas
    
    // Powerups disponíveis
    POWERUPS: {
        FIRE_RATE: 'FIRE_RATE',         // Aumenta velocidade de tiro
        BULLET_SPEED: 'BULLET_SPEED',   // Projéteis mais rápidos
        BULLET_SIZE: 'BULLET_SIZE',     // Projéteis maiores (mais dano)
        MOVEMENT_SPEED: 'MOVEMENT_SPEED', // Movimento mais rápido
        PIERCING: 'PIERCING'            // Projéteis atravessam inimigos
    },
    
    // Lagos
    LAKE_COUNT: 10,
    LAKE_MIN_SIZE: 100,
    LAKE_MAX_SIZE: 250,
    
    // Árvores
    TREE_COUNT: 40,
    
    // Pedras
    ROCK_COUNT: 80,
    
    // Cores
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
    
    // Assets
    ASSETS_PATH: './assets/'
};
