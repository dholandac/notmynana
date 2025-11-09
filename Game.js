// Game.js - Classe principal do jogo

// Polyfill para roundRect (caso o navegador não suporte)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
    };
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Estado do jogo
        this.running = true;
        this.gameOver = false;
        this.lastTime = 0;
        this.inMenu = true; // Começa no menu
        
        // Entidades
        this.player = new Player(CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2);
        this.wolves = [];
        this.bossWolf = null; // Boss wolf atual (só pode haver um)
        this.decorativeWolves = []; // Lobos decorativos para o menu
        this.bullets = [];
        this.crates = [];
        this.lakes = [];
        this.trees = [];
        this.rocks = [];
        this.particles = []; // Sistema de partículas
        this.coinObjects = []; // Array de objetos de moeda no mundo
        this.house = null; // Casa que aparece após matar lobos
        this.campfire = null; // Fogueira dentro da casa
        this.dog = null; // Cachorro comprável dentro da casa
        this.petDogs = []; // Array de cachorros pets do jogador
        this.dogsPurchased = 0; // Contador de cachorros comprados (para aumentar o preço)
        this.baseDogPrice = 300; // Preço base do cachorro
        
        // Sistema de mapa/transição
        this.isInHouse = false;
        this.savedWorldState = null;
        this.houseSpawned = false;
        this.wolvesKilledForNextHouse = 10; // Casa aparece a cada 10 lobos mortos
        this.wolvesKilledSinceLastHouse = 0; // Contador desde a última casa
        
        // Gera padrão de fundo uma vez só
        this.generateGroundPattern();
        
        // Controles mobile
        this.mobileControls = new MobileControls();
        
        // Câmera
        this.camera = new Camera(
            CONFIG.WORLD_WIDTH,
            CONFIG.WORLD_HEIGHT,
            CONFIG.CANVAS_WIDTH,
            CONFIG.CANVAS_HEIGHT
        );
        
        // Sistema de ondas
        this.currentWave = 0;
        this.waveState = 'preparing'; // 'preparing', 'spawning', 'active', 'waiting'
        this.waveTimer = 0;
        this.waveWaitDuration = 10000; // 10 segundos entre ondas
        this.waveSpawnTimer = 0;
        this.waveSpawnRate = 1500; // Spawna um lobo a cada 1.5 segundos durante a onda
        this.wolvesToSpawnInWave = 0;
        this.wolvesSpawnedInWave = 0;
        this.waveNotificationTimer = 0;
        this.waveNotificationDuration = 3000; // 3 segundos
        this.waveProgressNotificationTimer = 0;
        this.waveProgressNotificationDuration = 2000; // 2 segundos para notificações de progresso
        this.lastProgressMilestone = 0; // Último marco de progresso mostrado (25%, 50%, 75%)
        this.isBossWave = false; // Flag para identificar ondas de boss
        
        // Score
        this.score = 0; // Score real que não pode ser gasto
        this.coins = 0; // Moedas que podem ser gastas (renomeado de score)
        this.wolvesKilled = 0;
        this.bossSpawned = false; // Flag para controlar se o boss já foi spawnado
        this.bossesDefeated = 0; // Contador de bosses derrotados
        this.bossWaveInterval = 5; // Boss aparece a cada 5 ondas
        
        // Boss notification
        this.bossNotificationTimer = 0;
        this.bossNotificationDuration = 3000; // 3 segundos
        
        // Feedback visual de dano do jogador
        this.damageFlashTime = 0;
        this.damageFlashDuration = 300; // ms
        
        // Notificação de powerup
        this.powerupNotificationTimer = null;
        
        // Sistema de pausa durante notificações
        this.isPaused = false;
        
        // Sistema de cura da fogueira
        this.campfireHealTimer = 0;
        this.campfireHealRate = 2000; // Cura 1 vida a cada 2 segundos
        this.campfireHealDistance = 80; // Distância para receber cura
        
        // Flag para controlar compra do cachorro
        this.dogPurchaseProcessed = false;
        
        // Flag para controlar se a música do menu já foi iniciada
        this.menuMusicStarted = false;
        
        // Inicialização
        this.init();
        this.setupMenuControls();
        this.setupCanvasClickListener();
    }
    
    setupCanvasClickListener() {
        // Inicia a música do menu quando o canvas for clicado
        this.canvas.addEventListener('click', () => {
            if (!this.menuMusicStarted && this.inMenu) {
                audioManager.playMusic('menu', true);
                this.menuMusicStarted = true;
            }
        }, { once: false }); // Permite múltiplos cliques (caso necessário)
    }
    
    init() {
        // Cria lagos primeiro
        this.spawnLakes();
        
        // Reposiciona player se spawnou em um lago
        this.repositionPlayerIfInLake();
        
        // Cria árvores
        this.spawnTrees();
        
        // Cria pedras decorativas
        this.spawnRocks();
        
        // Cria caixas de munição pelo mapa
        this.spawnCrates();
        
        // Aguarda apenas 10 segundos antes de iniciar a primeira onda
        this.waveState = 'preparing';
        this.waveTimer = -10000; // Começa negativo para esperar 10 segundos
    }
    
    repositionPlayerIfInLake() {
        // Verifica se o player está em um lago
        let isInLake = false;
        for (let lake of this.lakes) {
            if (lake.isColliding(this.player)) {
                isInLake = true;
                break;
            }
        }
        
        // Se está em um lago, encontra nova posição
        if (isInLake) {
            let validPosition = false;
            let attempts = 0;
            
            while (!validPosition && attempts < 100) {
                // Tenta posições aleatórias
                const x = randomRange(200, CONFIG.WORLD_WIDTH - 200);
                const y = randomRange(200, CONFIG.WORLD_HEIGHT - 200);
                
                this.player.x = x;
                this.player.y = y;
                
                // Verifica se a nova posição é válida
                validPosition = true;
                for (let lake of this.lakes) {
                    if (lake.isColliding(this.player)) {
                        validPosition = false;
                        break;
                    }
                }
                
                attempts++;
            }
        }
    }
    
    spawnLakes() {
        for (let i = 0; i < CONFIG.LAKE_COUNT; i++) {
            let segments = [];
            let startX, startY;
            let attempts = 0;
            let valid = false;
            
            // Tenta encontrar uma posição válida (longe do centro onde o player spawna)
            do {
                startX = randomRange(50, CONFIG.WORLD_WIDTH - 300);
                startY = randomRange(50, CONFIG.WORLD_HEIGHT - 300);
                
                // Verifica se não está muito perto do centro (spawn do player)
                const centerX = CONFIG.WORLD_WIDTH / 2;
                const centerY = CONFIG.WORLD_HEIGHT / 2;
                const distFromCenter = Math.sqrt(
                    Math.pow(startX - centerX, 2) + 
                    Math.pow(startY - centerY, 2)
                );
                
                valid = distFromCenter > 300;
                attempts++;
            } while (!valid && attempts < 30);
            
            if (!valid) continue;
            
            // Cria segmentos conectados formando um lago orgânico
            const segmentCount = randomInt(4, 8); // Número de segmentos conectados (aumentado)
            let currentX = startX;
            let currentY = startY;
            
            for (let j = 0; j < segmentCount; j++) {
                const segWidth = randomRange(80, 150); // Aumentado
                const segHeight = randomRange(80, 150); // Aumentado
                
                segments.push({
                    x: currentX,
                    y: currentY,
                    width: segWidth,
                    height: segHeight
                });
                
                // Próximo segmento conecta ao atual
                if (j < segmentCount - 1) {
                    // Decide direção: 0=direita, 1=baixo, 2=diagonal
                    const direction = randomInt(0, 2);
                    
                    if (direction === 0) {
                        // Conecta à direita
                        currentX += segWidth * randomRange(0.3, 0.7);
                        currentY += randomRange(-30, 30);
                    } else if (direction === 1) {
                        // Conecta abaixo
                        currentY += segHeight * randomRange(0.3, 0.7);
                        currentX += randomRange(-30, 30);
                    } else {
                        // Diagonal
                        currentX += segWidth * randomRange(0.2, 0.5);
                        currentY += segHeight * randomRange(0.2, 0.5);
                    }
                }
            }
            
            // Verifica se não sobrepõe outros lagos
            const newLake = new Lake(segments);
            let overlaps = false;
            
            for (let lake of this.lakes) {
                // Verifica bounds gerais
                if (checkCollision(newLake.bounds, {
                    x: lake.bounds.x - 50,
                    y: lake.bounds.y - 50,
                    width: lake.bounds.width + 100,
                    height: lake.bounds.height + 100
                })) {
                    overlaps = true;
                    break;
                }
            }
            
            if (!overlaps) {
                this.lakes.push(newLake);
            }
        }
    }
    
    spawnTrees() {
        for (let i = 0; i < CONFIG.TREE_COUNT; i++) {
            let x, y;
            let attempts = 0;
            let valid = false;
            
            // Tenta encontrar posição que não seja em cima de um lago
            do {
                x = randomRange(50, CONFIG.WORLD_WIDTH - 50);
                y = randomRange(50, CONFIG.WORLD_HEIGHT - 50);
                
                // Verifica distância do centro (spawn do player)
                const centerX = CONFIG.WORLD_WIDTH / 2;
                const centerY = CONFIG.WORLD_HEIGHT / 2;
                const distFromCenter = Math.sqrt(
                    Math.pow(x - centerX, 2) + 
                    Math.pow(y - centerY, 2)
                );
                
                valid = distFromCenter > 150; // Não spawna muito perto do player
                
                if (valid) {
                    // Verifica se não está em cima de um lago
                    const tree = new Tree(x, y);
                    for (let lake of this.lakes) {
                        if (lake.isColliding(tree)) {
                            valid = false;
                            break;
                        }
                    }
                }
                
                attempts++;
            } while (!valid && attempts < 50);
            
            if (valid) {
                this.trees.push(new Tree(x, y));
            }
        }
    }
    
    spawnNewTree() {
        // Spawna uma nova árvore em um local válido
        let x, y;
        let attempts = 0;
        let valid = false;
        
        do {
            x = randomRange(50, CONFIG.WORLD_WIDTH - 50);
            y = randomRange(50, CONFIG.WORLD_HEIGHT - 50);
            
            // Verifica distância do player
            const distFromPlayer = Math.sqrt(
                Math.pow(x - this.player.x, 2) + 
                Math.pow(y - this.player.y, 2)
            );
            
            valid = distFromPlayer > 300; // Não spawna muito perto do player
            
            if (valid) {
                // Verifica se não está em cima de um lago
                const tree = new Tree(x, y);
                for (let lake of this.lakes) {
                    if (lake.isColliding(tree)) {
                        valid = false;
                        break;
                    }
                }
            }
            
            attempts++;
        } while (!valid && attempts < 50);
        
        if (valid) {
            this.trees.push(new Tree(x, y));
        }
    }
    
    spawnRocks() {
        for (let i = 0; i < CONFIG.ROCK_COUNT; i++) {
            let x, y;
            let attempts = 0;
            let valid = false;
            
            // Define tamanho da pedra (mais pequenas, algumas médias)
            const rand = Math.random();
            let size;
            if (rand < 0.6) {
                size = 'small';
            } else if (rand < 0.9) {
                size = 'medium';
            } else {
                size = 'large';
            }
            
            // Tenta encontrar posição que não seja em cima de um lago ou árvore
            do {
                x = randomRange(50, CONFIG.WORLD_WIDTH - 50);
                y = randomRange(50, CONFIG.WORLD_HEIGHT - 50);
                
                valid = true;
                const rock = new Rock(x, y, size);
                
                // Verifica se não está em cima de um lago
                for (let lake of this.lakes) {
                    if (lake.isColliding(rock)) {
                        valid = false;
                        break;
                    }
                }
                
                // Verifica distância de árvores (não quer pedras muito próximas)
                if (valid) {
                    for (let tree of this.trees) {
                        const dist = Math.sqrt(
                            Math.pow(rock.x - tree.x, 2) + 
                            Math.pow(rock.y - tree.y, 2)
                        );
                        if (dist < 30) {
                            valid = false;
                            break;
                        }
                    }
                }
                
                attempts++;
            } while (!valid && attempts < 30);
            
            if (valid) {
                this.rocks.push(new Rock(x, y, size));
            }
        }
    }
    
    generateGroundPattern() {
        // Gera um padrão de fundo com variações de cor para dar textura
        this.groundPatterns = [];
        
        const patchSize = 80;
        const cols = Math.ceil(CONFIG.WORLD_WIDTH / patchSize);
        const rows = Math.ceil(CONFIG.WORLD_HEIGHT / patchSize);
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const baseColor = CONFIG.COLORS.GROUND;
                const variation = Math.floor(Math.random() * 20) - 10;
                
                // Pré-gera posições de grama para não piscar
                const grassLines = [];
                const hasGrass = Math.random() > 0.4;
                const grassDensity = Math.random();
                
                if (hasGrass) {
                    const numLines = Math.floor(5 * grassDensity);
                    for (let i = 0; i < numLines; i++) {
                        grassLines.push({
                            x: Math.random() * patchSize,
                            y: Math.random() * patchSize,
                            h: 3 + Math.random() * 4,
                            offset: (Math.random() - 0.5) * 2
                        });
                    }
                }
                
                // Pré-gera manchas
                const spots = [];
                const hasSpots = Math.random() > 0.7;
                if (hasSpots) {
                    const numSpots = Math.floor(Math.random() * 3) + 1;
                    for (let i = 0; i < numSpots; i++) {
                        spots.push({
                            x: Math.random() * patchSize,
                            y: Math.random() * patchSize,
                            r: Math.random() * 8 + 5
                        });
                    }
                }
                
                this.groundPatterns.push({
                    x: x * patchSize,
                    y: y * patchSize,
                    size: patchSize,
                    color: this.adjustColor(baseColor, variation),
                    hasGrass,
                    grassDensity,
                    grassLines,
                    spots
                });
            }
        }
    }
    
    adjustColor(hexColor, amount) {
        const hex = hexColor.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    spawnCrates() {
        const minDistanceBetweenCrates = 200; // Distância mínima entre caixas
        
        for (let i = 0; i < CONFIG.CRATE_COUNT; i++) {
            let x, y;
            let attempts = 0;
            let valid = false;
            
            // Tenta encontrar posição que não seja em cima de um lago e longe de outras caixas
            do {
                x = randomRange(100, CONFIG.WORLD_WIDTH - 100);
                y = randomRange(100, CONFIG.WORLD_HEIGHT - 100);
                
                valid = true;
                
                // Verifica colisão com lagos
                for (let lake of this.lakes) {
                    if (lake.isColliding({ x, y, width: CONFIG.CRATE_WIDTH, height: CONFIG.CRATE_HEIGHT })) {
                        valid = false;
                        break;
                    }
                }
                
                // Verifica distância de outras caixas
                if (valid) {
                    for (let crate of this.crates) {
                        const dx = (x + CONFIG.CRATE_WIDTH / 2) - (crate.x + crate.width / 2);
                        const dy = (y + CONFIG.CRATE_HEIGHT / 2) - (crate.y + crate.height / 2);
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < minDistanceBetweenCrates) {
                            valid = false;
                            break;
                        }
                    }
                }
                
                attempts++;
            } while (!valid && attempts < 100); // Aumentado número de tentativas
            
            if (valid) {
                this.crates.push(new Crate(x, y));
            }
        }
    }
    
    spawnWolf() {
        if (this.wolves.length >= CONFIG.MAX_WOLVES) return;
        
        // Spawna nas bordas do mapa (estilo Vampire Survivors)
        let x, y;
        const side = randomInt(0, 3); // 0=cima, 1=direita, 2=baixo, 3=esquerda
        
        switch(side) {
            case 0: // Cima
                x = randomRange(0, CONFIG.WORLD_WIDTH);
                y = randomRange(-50, 0);
                break;
            case 1: // Direita
                x = randomRange(CONFIG.WORLD_WIDTH, CONFIG.WORLD_WIDTH + 50);
                y = randomRange(0, CONFIG.WORLD_HEIGHT);
                break;
            case 2: // Baixo
                x = randomRange(0, CONFIG.WORLD_WIDTH);
                y = randomRange(CONFIG.WORLD_HEIGHT, CONFIG.WORLD_HEIGHT + 50);
                break;
            case 3: // Esquerda
                x = randomRange(-50, 0);
                y = randomRange(0, CONFIG.WORLD_HEIGHT);
                break;
        }
        
        this.wolves.push(new Wolf(x, y));
    }
    
    spawnMinionWolf() {
        if (this.wolves.length >= CONFIG.MAX_WOLVES) return;
        
        // Spawna nas bordas do mapa (estilo Vampire Survivors)
        let x, y;
        const side = randomInt(0, 3); // 0=cima, 1=direita, 2=baixo, 3=esquerda
        
        switch(side) {
            case 0: // Cima
                x = randomRange(0, CONFIG.WORLD_WIDTH);
                y = randomRange(-50, 0);
                break;
            case 1: // Direita
                x = randomRange(CONFIG.WORLD_WIDTH, CONFIG.WORLD_WIDTH + 50);
                y = randomRange(0, CONFIG.WORLD_HEIGHT);
                break;
            case 2: // Baixo
                x = randomRange(0, CONFIG.WORLD_WIDTH);
                y = randomRange(CONFIG.WORLD_HEIGHT, CONFIG.WORLD_HEIGHT + 50);
                break;
            case 3: // Esquerda
                x = randomRange(-50, 0);
                y = randomRange(0, CONFIG.WORLD_HEIGHT);
                break;
        }
        
        // Cria lobo capanga com aura vermelha
        this.wolves.push(new Wolf(x, y, true));
    }
    
    spawnCoins(x, y, minCoins, maxCoins) {
        // Spawna moedas em posições aleatórias ao redor do ponto de morte
        const coinCount = randomInt(minCoins, maxCoins);
        
        for (let i = 0; i < coinCount; i++) {
            // Espalha as moedas em um círculo ao redor do ponto
            const angle = (Math.PI * 2 / coinCount) * i + Math.random() * 0.5;
            const distance = 20 + Math.random() * 30;
            const coinX = x + Math.cos(angle) * distance;
            const coinY = y + Math.sin(angle) * distance;
            
            this.coinObjects.push(new Coin(coinX, coinY));
        }
    }
    
    startWave() {
        this.currentWave++;
        this.waveState = 'spawning';
        this.waveNotificationTimer = this.waveNotificationDuration;
        this.isPaused = true; // Pausa o jogo durante a notificação
        
        // Verifica se é uma onda de boss (a cada 5 ondas)
        this.isBossWave = (this.currentWave % this.bossWaveInterval === 0);
        
        if (this.isBossWave) {
            // Onda de Boss: Boss + lobos capangas
            const minionsCount = 5 + Math.floor(this.bossesDefeated / 2) * 2; // Aumenta capangas com progresso
            this.wolvesToSpawnInWave = minionsCount; // Apenas os capangas na contagem de spawn
            this.waveSpawnRate = 800; // Spawn mais rápido para a onda de boss
            console.log(`Onda ${this.currentWave} BOSS iniciada! Boss + ${minionsCount} capangas`);
        } else {
            // Onda normal: apenas lobos
            let wolvesCount;
            
            if (this.currentWave <= 5) {
                // Ondas 1-5: Progressão suave (5, 8, 11, 14, 17)
                wolvesCount = 5 + (this.currentWave - 1) * 3;
            } else if (this.currentWave <= 10) {
                // Ondas 6-10: Progressão moderada (20, 24, 28, 32, 36)
                wolvesCount = 20 + (this.currentWave - 6) * 4;
            } else if (this.currentWave <= 15) {
                // Ondas 11-15: Progressão acelerada (40, 45, 50, 55, 60)
                wolvesCount = 40 + (this.currentWave - 11) * 5;
            } else if (this.currentWave <= 20) {
                // Ondas 16-20: Hordas massivas (70, 80, 90, 100, 110)
                wolvesCount = 70 + (this.currentWave - 16) * 10;
            } else {
                // Onda 21+: Modo survival extremo (120, 135, 150, 165...)
                wolvesCount = 120 + (this.currentWave - 21) * 15;
            }
            
            this.wolvesToSpawnInWave = wolvesCount;
            
            // Ajusta a taxa de spawn baseado na onda para manter o jogo fluido
            if (this.currentWave <= 10) {
                this.waveSpawnRate = 1500; // 1.5s entre spawns
            } else if (this.currentWave <= 15) {
                this.waveSpawnRate = 1200; // 1.2s entre spawns
            } else if (this.currentWave <= 20) {
                this.waveSpawnRate = 1000; // 1s entre spawns
            } else {
                this.waveSpawnRate = 800; // 0.8s entre spawns
            }
            
            console.log(`Onda ${this.currentWave} iniciada! ${this.wolvesToSpawnInWave} lobos (spawn rate: ${this.waveSpawnRate}ms).`);
        }
        
        this.wolvesSpawnedInWave = 0;
        this.waveSpawnTimer = 0;
        this.lastProgressMilestone = 0; // Reset do progresso
    }
    
    updateWaveSystem(deltaTime) {
        // Atualiza notificação de progresso da onda
        if (this.waveProgressNotificationTimer > 0) {
            this.waveProgressNotificationTimer -= deltaTime;
        }
        
        // Atualiza notificação de onda
        if (this.waveNotificationTimer > 0) {
            this.waveNotificationTimer -= deltaTime;
            if (this.waveNotificationTimer <= 0) {
                this.isPaused = false;
            }
            return;
        }
        
        // Estado: preparing - preparando para iniciar a primeira onda
        if (this.waveState === 'preparing') {
            this.waveTimer += deltaTime;
            
            if (this.waveTimer >= 0) {
                this.startWave();
            }
        }
        
        // Estado: spawning - spawnando lobos da onda
        if (this.waveState === 'spawning') {
            this.waveSpawnTimer += deltaTime;
            
            if (this.waveSpawnTimer >= this.waveSpawnRate && this.wolvesSpawnedInWave < this.wolvesToSpawnInWave) {
                // Spawna lobo capanga do boss se for onda de boss
                if (this.isBossWave) {
                    this.spawnMinionWolf();
                } else {
                    this.spawnWolf();
                }
                this.wolvesSpawnedInWave++;
                this.waveSpawnTimer = 0;
                
                // Se spawnou todos os lobos, spawna o boss (se for onda de boss) e muda para estado ativo
                if (this.wolvesSpawnedInWave >= this.wolvesToSpawnInWave) {
                    if (this.isBossWave) {
                        this.spawnBoss();
                    }
                    this.waveState = 'active';
                    console.log('Todos os lobos da onda foram spawnados!');
                }
            }
        }
        
        // Estado: active - onda ativa, esperando lobos morrerem
        if (this.waveState === 'active') {
            // Se todos os lobos morreram, inicia período de espera
            if (this.wolves.length === 0 && !this.bossWolf) {
                this.waveState = 'waiting';
                this.waveTimer = 0;
                
                // Toca o som de power_up quando a onda é concluída
                audioManager.play('power_up');
                
                // Spawna 3 novas caixas de power up após completar a onda
                const previousCrateCount = CONFIG.CRATE_COUNT;
                CONFIG.CRATE_COUNT = 3;
                this.spawnCrates();
                CONFIG.CRATE_COUNT = previousCrateCount; // Restaura valor original
                
                console.log('Onda completada! Aguardando próxima onda...');
            }
        }
        
        // Estado: waiting - esperando para iniciar próxima onda
        if (this.waveState === 'waiting') {
            this.waveTimer += deltaTime;
            
            if (this.waveTimer >= this.waveWaitDuration) {
                this.startWave();
            }
        }
    }
    
    checkWaveProgress() {
        // Calcula lobos restantes (não spawnados + vivos)
        const remainingWolves = this.wolvesToSpawnInWave - this.wolvesSpawnedInWave + this.wolves.length;
        
        // Calcula quantos lobos foram eliminados
        const wolvesKilledInWave = this.wolvesToSpawnInWave - remainingWolves;
        
        // Calcula progresso em porcentagem
        const progressPercent = (wolvesKilledInWave / this.wolvesToSpawnInWave) * 100;
        
        // Verifica marcos de 25%, 50%, 75%
        let milestone = 0;
        if (progressPercent >= 75 && this.lastProgressMilestone < 75) {
            milestone = 75;
        } else if (progressPercent >= 50 && this.lastProgressMilestone < 50) {
            milestone = 50;
        } else if (progressPercent >= 25 && this.lastProgressMilestone < 25) {
            milestone = 25;
        }
        
        // Mostra notificação se atingiu um marco
        if (milestone > 0) {
            this.lastProgressMilestone = milestone;
            this.waveProgressNotificationTimer = this.waveProgressNotificationDuration;
            console.log(`Progresso da onda: ${milestone}% - ${remainingWolves} lobos restantes`);
        }
    }

    
    spawnBoss() {
        if (this.bossWolf) return; // Já existe um boss
        
        // Spawna o boss em uma das bordas do mapa
        let x, y;
        const side = randomInt(0, 3); // 0=cima, 1=direita, 2=baixo, 3=esquerda
        
        switch(side) {
            case 0: // Cima
                x = randomRange(0, CONFIG.WORLD_WIDTH);
                y = randomRange(-100, -50);
                break;
            case 1: // Direita
                x = randomRange(CONFIG.WORLD_WIDTH + 50, CONFIG.WORLD_WIDTH + 100);
                y = randomRange(0, CONFIG.WORLD_HEIGHT);
                break;
            case 2: // Baixo
                x = randomRange(0, CONFIG.WORLD_WIDTH);
                y = randomRange(CONFIG.WORLD_HEIGHT + 50, CONFIG.WORLD_HEIGHT + 100);
                break;
            case 3: // Esquerda
                x = randomRange(-100, -50);
                y = randomRange(0, CONFIG.WORLD_HEIGHT);
                break;
        }
        
        this.bossWolf = new BossWolf(x, y);
        
        // Aplica escalamento progressivo baseado em quantos bosses já foram derrotados
        const scalingFactor = 1 + (this.bossesDefeated * 0.3); // +30% por boss derrotado
        this.bossWolf.maxHealth = Math.floor(CONFIG.BOSS_HEALTH * scalingFactor);
        this.bossWolf.health = this.bossWolf.maxHealth;
        this.bossWolf.speed = CONFIG.BOSS_SPEED * (1 + this.bossesDefeated * 0.1); // +10% velocidade
        
        this.bossSpawned = true;
        this.bossNotificationTimer = this.bossNotificationDuration;
        
        // Toca o som de spawn do boss
        audioManager.play('wolf_boss_spawn');
        
        // Inicia a música de batalha do boss
        audioManager.playMusic('wolf_boss_battle', true);
        
        console.log(`Boss Wolf spawnou! Nível ${this.bossesDefeated + 1} - HP: ${this.bossWolf.health}, Speed: ${this.bossWolf.speed.toFixed(2)}`);
    }
    
    spawnHouse() {
        // Encontra uma posição válida para a casa
        let validPosition = false;
        let attempts = 0;
        let houseX, houseY;
        
        while (!validPosition && attempts < 100) {
            houseX = randomRange(200, CONFIG.WORLD_WIDTH - 320);
            houseY = randomRange(200, CONFIG.WORLD_HEIGHT - 300);
            
            const tempHouse = { x: houseX, y: houseY, width: 120, height: 100 };
            validPosition = true;
            
            // Verifica se não está em um lago
            for (let lake of this.lakes) {
                if (lake.isColliding(tempHouse)) {
                    validPosition = false;
                    break;
                }
            }
            
            // Verifica se não está muito perto de árvores
            if (validPosition) {
                for (let tree of this.trees) {
                    const dist = Math.sqrt(
                        Math.pow((houseX + 60) - (tree.x + tree.width / 2), 2) +
                        Math.pow((houseY + 50) - (tree.y + tree.height / 2), 2)
                    );
                    if (dist < 100) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            // Verifica se não está muito perto do player
            if (validPosition) {
                const dist = Math.sqrt(
                    Math.pow((houseX + 60) - this.player.x, 2) +
                    Math.pow((houseY + 50) - this.player.y, 2)
                );
                if (dist < 200) {
                    validPosition = false;
                }
            }
            
            attempts++;
        }
        
        if (validPosition) {
            this.house = new House(houseX, houseY);
            this.houseSpawned = true;
            console.log('Casa spawnou na posição:', houseX, houseY);
        }
    }
    
    enterHouse() {
        console.log('Entrando na casa...');
        
        // Pausa a música de fundo
        audioManager.pauseMusic();
        
        // Salva o estado do mundo atual (incluindo câmera)
        this.savedWorldState = {
            playerX: this.player.x,
            playerY: this.player.y,
            wolves: [...this.wolves],
            bossWolf: this.bossWolf,
            bullets: [...this.bullets],
            crates: [...this.crates],
            coins: [...this.coinObjects],
            particles: [...this.particles],
            petDogs: [...this.petDogs], // Salva os pets
            houseX: this.house.x,
            houseY: this.house.y,
            cameraX: this.camera.x,
            cameraY: this.camera.y
        };
        
        // Limpa entidades do mundo externo
        this.wolves = [];
        this.bossWolf = null;
        this.bullets = [];
        this.coinObjects = [];
        this.particles = [];
        
        // Cria o mapa interno da casa (pequeno, 5x5 árvores aproximadamente)
        this.isInHouse = true;
        
        // Troca a música para a música da casa
        audioManager.stopMusic();
        audioManager.playMusic('forgotten_biomes', true);
        
        // Define tamanho do mapa interno (pequeno)
        this.houseMapWidth = 400; // Cerca de 5 árvores de largura
        this.houseMapHeight = 400; // Cerca de 5 árvores de altura
        
        // Calcula offsets de centralização
        const offsetX = (CONFIG.WORLD_WIDTH - this.houseMapWidth) / 2;
        const offsetY = (CONFIG.WORLD_HEIGHT - this.houseMapHeight) / 2;
        
        // Posiciona player no centro-superior da casa (dentro do mapa pequeno)
        this.player.x = offsetX + this.houseMapWidth / 2 - this.player.width / 2;
        this.player.y = offsetY + 80;
        
        // Cria fogueira no centro do mapa pequeno
        this.campfire = new Campfire(
            offsetX + this.houseMapWidth / 2 - 25,
            offsetY + this.houseMapHeight / 2 - 25
        );
        
        // Cria cachorro acima da fogueira com preço escalonado
        const dogPrice = this.baseDogPrice + (this.dogsPurchased * 200); // Aumenta 200 moedas a cada cachorro
        this.dog = new Dog(
            offsetX + this.houseMapWidth / 2 - 20,
            offsetY + this.houseMapHeight / 2 - 100, // Acima da fogueira
            dogPrice,
            false // Não é pet, é para venda
        );
    }
    
    exitHouse() {
        console.log('Saindo da casa...');
        
        if (!this.savedWorldState) return;
        
        // Cria partículas de explosão na posição da casa antes de sair
        const houseX = this.savedWorldState.houseX;
        const houseY = this.savedWorldState.houseY;
        
        // Cria partículas de explosão (similar às árvores)
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = randomRange(50, 150);
            const lifetime = randomRange(800, 1500);
            
            this.particles.push(new Particle(
                houseX + 60, // Centro da casa
                houseY + 50,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                randomRange(4, 10),
                `hsl(${randomRange(20, 40)}, 70%, ${randomRange(40, 60)}%)`, // Tons de madeira
                lifetime
            ));
        }
        
        // Restaura o estado do mundo
        this.player.x = this.savedWorldState.playerX;
        this.player.y = this.savedWorldState.playerY;
        this.wolves = this.savedWorldState.wolves;
        this.bossWolf = this.savedWorldState.bossWolf;
        this.bullets = this.savedWorldState.bullets;
        this.crates = this.savedWorldState.crates;
        this.coinObjects = this.savedWorldState.coins;
        // Mantém os pets que estavam fora + os novos comprados dentro da casa
        // (não restaura do estado salvo para manter os novos)
        // Mantém as partículas de explosão e adiciona as antigas
        this.particles.push(...this.savedWorldState.particles);
        
        // Inicia animação de desaparecimento da casa
        if (this.house) {
            this.house.startDisappear();
            // A casa será removida automaticamente quando a animação terminar
        }
        
        // Reseta o contador para a próxima casa spawnar em 10 lobos
        this.wolvesKilledSinceLastHouse = 0;
        
        // Remove a fogueira e reseta o timer de cura
        this.campfire = null;
        this.campfireHealTimer = 0;
        
        // Remove o cachorro
        this.dog = null;
        
        // Para a música da casa e retoma a música do jogo
        audioManager.stopMusic();
        audioManager.playMusic('retro_forest', true);
        
        // Volta ao mapa principal
        this.isInHouse = false;
        
        // Restaura a câmera
        this.camera.x = this.savedWorldState.cameraX;
        this.camera.y = this.savedWorldState.cameraY;
        
        this.savedWorldState = null;
    }
    
    setupMenuControls() {
        const playButton = document.getElementById('playButton');
        const instructionsButton = document.getElementById('instructionsButton');
        const creditsButton = document.getElementById('creditsButton');
        
        // Adiciona som de hover para todos os botões
        const buttons = [playButton, instructionsButton, creditsButton];
        buttons.forEach(button => {
            let hasPlayed = false; // Flag para tocar o som apenas uma vez ao entrar
            
            button.addEventListener('mouseenter', () => {
                // Inicia a música do menu na primeira interação
                if (!this.menuMusicStarted) {
                    audioManager.playMusic('menu', true);
                    this.menuMusicStarted = true;
                }
                
                if (!hasPlayed) {
                    audioManager.play('select');
                    hasPlayed = true;
                }
            });
            
            button.addEventListener('mouseleave', () => {
                hasPlayed = false; // Reseta a flag quando sai do botão
            });
        });
        
        playButton.addEventListener('click', () => {
            audioManager.play('confirm');
            this.startGame();
        });
        
        instructionsButton.addEventListener('click', () => {
            // Inicia a música do menu na primeira interação (se ainda não iniciou)
            if (!this.menuMusicStarted) {
                audioManager.playMusic('menu', true);
                this.menuMusicStarted = true;
            }
            
            audioManager.play('confirm');
            alert('INSTRUÇÕES:\n\nWASD ou Setas - Mover\nEspaço - Atirar\nR - Reiniciar (quando Game Over)\n\nSobreviva aos lobos e colete powerups das caixas!');
        });
        
        creditsButton.addEventListener('click', () => {
            // Inicia a música do menu na primeira interação (se ainda não iniciou)
            if (!this.menuMusicStarted) {
                audioManager.playMusic('menu', true);
                this.menuMusicStarted = true;
            }
            
            audioManager.play('confirm');
            alert('CRÉDITOS:\n\nNot My Nana\nDesenvolvido com ❤️');
        });
        
        // Spawna lobos decorativos para o menu
        this.spawnDecorativeWolves();
    }
    
    spawnDecorativeWolves() {
        // Cria alguns lobos que vão andar pelo mapa no fundo do menu
        for (let i = 0; i < 8; i++) {
            const x = randomRange(100, CONFIG.WORLD_WIDTH - 100);
            const y = randomRange(100, CONFIG.WORLD_HEIGHT - 100);
            this.decorativeWolves.push(new Wolf(x, y));
        }
    }
    
    startGame() {
        this.inMenu = false;
        document.getElementById('menuScreen').classList.add('hidden');
        document.getElementById('logo').style.display = 'block';
        document.getElementById('lives').style.display = 'block';
        document.getElementById('score').style.display = 'block';
        document.getElementById('coins').style.display = 'block';
        document.getElementById('wolves').style.display = 'block';
        // Indicador de onda é controlado dinamicamente no updateUI
        
        // Para a música do menu e inicia a música de fundo principal
        audioManager.stopMusic();
        audioManager.playMusic('retro_forest', true);
    }
    
    update(deltaTime) {
        // Se está no menu, apenas atualiza os lobos decorativos
        if (this.inMenu) {
            this.decorativeWolves.forEach(wolf => {
                // Movimento aleatório suave
                wolf.vx = Math.sin(Date.now() / 1000 + wolf.x) * 0.5;
                wolf.vy = Math.cos(Date.now() / 1000 + wolf.y) * 0.5;
                wolf.x += wolf.vx;
                wolf.y += wolf.vy;
                
                // Mantém dentro dos limites
                wolf.x = clamp(wolf.x, 50, CONFIG.WORLD_WIDTH - 50);
                wolf.y = clamp(wolf.y, 50, CONFIG.WORLD_HEIGHT - 50);
            });
            return;
        }
        
        if (this.gameOver) {
            this.updateUI(); // Atualiza UI mesmo no game over
            return;
        }
        
        // Atualiza timer de flash de dano
        if (this.damageFlashTime > 0) {
            this.damageFlashTime -= deltaTime;
        }
        
        // Se o jogo está pausado (notificações), não atualiza movimento
        if (!this.isPaused) {
            // Guarda posição anterior do jogador
            const prevX = this.player.x;
            const prevY = this.player.y;
            
            // Atualiza jogador e verifica se criou um bullet e/ou partículas
            const playerResult = this.player.update(deltaTime, this.mobileControls);
            if (playerResult.bullet) {
                this.bullets.push(playerResult.bullet);
            }
            if (playerResult.particles && playerResult.particles.length > 0) {
                this.particles.push(...playerResult.particles);
            }
            
            // Se estiver dentro da casa, limita movimento ao mapa pequeno
            if (this.isInHouse) {
                const offsetX = (CONFIG.WORLD_WIDTH - this.houseMapWidth) / 2;
                const offsetY = (CONFIG.WORLD_HEIGHT - this.houseMapHeight) / 2;
                
                this.player.x = clamp(this.player.x, offsetX, offsetX + this.houseMapWidth - this.player.width);
                this.player.y = clamp(this.player.y, offsetY, offsetY + this.houseMapHeight - this.player.height);
            } else {
                // Verifica colisão com lagos (apenas no mundo externo)
                for (let lake of this.lakes) {
                    if (lake.isColliding(this.player)) {
                        // Reverte posição
                        this.player.x = prevX;
                        this.player.y = prevY;
                        break;
                    }
                }
                
                // Verifica colisão com árvores (apenas no mundo externo)
                for (let tree of this.trees) {
                    if (tree.isColliding(this.player)) {
                        // Reverte posição
                        this.player.x = prevX;
                        this.player.y = prevY;
                        break;
                    }
                }
            }
        }
        
        // Atualiza câmera
        this.camera.follow(this.player);
        
        // Atualiza lobos (apenas se não estiver pausado e não dentro da casa)
        if (!this.isPaused && !this.isInHouse) {
            this.wolves.forEach(wolf => {
                // Guarda posição anterior do lobo
                const prevWolfX = wolf.x;
                const prevWolfY = wolf.y;
            
            // Passa obstáculos para a IA do lobo e coleta partículas
            const obstacles = [...this.lakes, ...this.trees];
            const wolfParticles = wolf.update(deltaTime, this.player, obstacles);
            if (wolfParticles && wolfParticles.length > 0) {
                this.particles.push(...wolfParticles);
            }
            
            // Apenas verifica colisões se o lobo não está morrendo
            if (!wolf.dying) {
                // Verifica colisão do lobo com lagos - apenas reverte
                for (let lake of this.lakes) {
                    if (lake.isColliding(wolf)) {
                        wolf.x = prevWolfX;
                        wolf.y = prevWolfY;
                        break;
                    }
                }
                
                // Verifica colisão do lobo com árvores - apenas reverte
                for (let tree of this.trees) {
                    if (tree.isColliding(wolf)) {
                        wolf.x = prevWolfX;
                        wolf.y = prevWolfY;
                        break;
                    }
                }
            }
            
            // Verifica colisão com jogador (apenas se o lobo não está morrendo)
            if (!wolf.dying && checkCollision(
                { x: wolf.x, y: wolf.y, width: wolf.width, height: wolf.height },
                { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height }
            )) {
                if (this.player.takeDamage()) {
                    this.damageFlashTime = this.damageFlashDuration; // Ativa flash vermelho
                    if (this.player.lives <= 0) {
                        this.gameOver = true;
                        
                        // Pausa a música de fundo e toca o som de game over com volume reduzido
                        audioManager.pauseMusic();
                        audioManager.play('game_over', 0.5); // 50% do volume
                    }
                }
            }
        });
        } // Fecha o if (!this.isPaused) dos lobos
        
        // Remove lobos mortos (apenas após a animação de morte completar)
        const wolvesBeforeRemoval = this.wolves.length;
        this.wolves = this.wolves.filter(wolf => {
            // Remove se health < 0 (animação de morte terminou)
            if (wolf.health < 0) return false;
            // Mantém se está vivo ou morrendo (mas ainda com health >= 0)
            return true;
        });
        
        // Verifica progresso da onda após remover lobos mortos
        if (wolvesBeforeRemoval > this.wolves.length && (this.waveState === 'spawning' || this.waveState === 'active')) {
            this.checkWaveProgress();
            // Mostra a barra de informações quando um lobo é morto
            this.waveProgressNotificationTimer = this.waveProgressNotificationDuration;
        }
        
        // Atualiza pets (cachorros) - sempre, exceto dentro da casa
        if (!this.isInHouse && !this.isPaused) {
            this.petDogs.forEach(pet => {
                const obstacles = [...this.lakes, ...this.trees];
                const result = pet.update(deltaTime, this.player, this.wolves, obstacles);
                
                if (result) {
                    // Se é um array, é o formato antigo (só partículas)
                    if (Array.isArray(result)) {
                        this.particles.push(...result);
                    }
                    // Se é um objeto, é o novo formato (com partículas e killedWolf)
                    else if (typeof result === 'object') {
                        // Processa partículas
                        if (result.particles && Array.isArray(result.particles)) {
                            this.particles.push(...result.particles);
                        }
                        
                        // Processa lobo morto
                        if (result.killedWolf) {
                            const wolf = result.killedWolf;
                            // Dropa moedas
                            this.spawnCoins(wolf.x + wolf.width / 2, wolf.y + wolf.height / 2, 2, 3);
                            this.wolvesKilled++;
                            this.wolvesKilledSinceLastHouse++;
                            // Adiciona score por matar lobo
                            this.score += 100;
                        }
                    }
                }
            });
        }
        
        // Atualiza boss wolf (apenas se não estiver pausado e não dentro da casa)
        if (this.bossWolf && !this.isPaused && !this.isInHouse) {
            const prevBossX = this.bossWolf.x;
            const prevBossY = this.bossWolf.y;
            
            // Passa obstáculos e callback para destruir árvores
            const obstacles = [...this.lakes, ...this.trees];
            const bossParticles = this.bossWolf.update(deltaTime, this.player, obstacles, (tree) => {
                // Callback quando boss destrói uma árvore
                if (tree.active) {
                    tree.active = false;
                    
                    // Toca o som de explosão quando o boss derruba a árvore (70% do volume)
                    audioManager.play('explosion', 0.7);
                    
                    // Cria partículas de destruição
                    const destroyParticles = createTreeHitParticles(
                        tree.x + tree.width / 2, 
                        tree.y + tree.height / 2,
                        true // Partículas de destruição
                    );
                    this.particles.push(...destroyParticles);
                    
                    // Spawna uma nova árvore em outro lugar
                    this.spawnNewTree();
                }
            });
            
            // Adiciona partículas de movimento do boss
            if (bossParticles && bossParticles.length > 0) {
                this.particles.push(...bossParticles);
            }
            
            // Boss apenas verifica colisão com lagos (ignora árvores)
            if (!this.bossWolf.dying) {
                for (let lake of this.lakes) {
                    if (lake.isColliding(this.bossWolf)) {
                        this.bossWolf.x = prevBossX;
                        this.bossWolf.y = prevBossY;
                        break;
                    }
                }
            }
            
            // Verifica colisão com jogador
            if (!this.bossWolf.dying && checkCollision(
                { x: this.bossWolf.x, y: this.bossWolf.y, width: this.bossWolf.width, height: this.bossWolf.height },
                { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height }
            )) {
                if (this.player.takeDamage()) {
                    this.damageFlashTime = this.damageFlashDuration;
                    if (this.player.lives <= 0) {
                        this.gameOver = true;
                        
                        // Pausa a música de fundo e toca o som de game over com volume reduzido
                        audioManager.pauseMusic();
                        audioManager.play('game_over', 0.5); // 50% do volume
                    }
                }
            }
            
            // Remove boss se morreu
            if (this.bossWolf.health < 0) {
                this.bossWolf = null;
                this.bossSpawned = false; // Permite spawnar outro boss futuramente
                this.bossesDefeated++; // Incrementa contador de bosses derrotados
                
                // Para a música de batalha do boss e retoma a música de fundo
                audioManager.stopMusic();
                audioManager.playMusic('retro_forest', true);
                
                console.log(`Boss derrotado! Total de bosses derrotados: ${this.bossesDefeated}`);
            }
        }
        
        // Atualiza timer de notificação do boss
        if (this.bossNotificationTimer > 0) {
            this.bossNotificationTimer -= deltaTime;
            if (this.bossNotificationTimer <= 0) {
                this.isPaused = false; // Despausa quando a notificação do boss termina
            }
        }
        
        // Verifica se deve spawnar a casa (apenas no mapa principal, a cada 10 lobos)
        if (!this.houseSpawned && !this.isInHouse && this.wolvesKilledSinceLastHouse >= this.wolvesKilledForNextHouse) {
            this.spawnHouse();
        }
        
        // Atualiza casa se existir (apenas no mapa principal)
        if (this.house && !this.isInHouse) {
            this.house.update(deltaTime);
            
            // Remove a casa se a animação de desaparecimento terminou
            if (!this.house.active) {
                this.house = null;
                this.houseSpawned = false;
            }
            
            // Verifica se o player entrou na casa (só se não estiver desaparecendo)
            if (this.house && this.house.canEnter && this.house.isColliding(this.player)) {
                this.enterHouse();
            }
        }
        
        // Atualiza fogueira se estiver dentro da casa
        if (this.campfire && this.isInHouse) {
            this.campfire.update(deltaTime);
            
            // Sistema de cura da fogueira
            const dx = this.player.x - (this.campfire.x + this.campfire.width / 2);
            const dy = this.player.y - (this.campfire.y + this.campfire.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Se jogador está perto da fogueira e não está com vida cheia
            if (distance <= this.campfireHealDistance && this.player.lives < this.player.maxLives) {
                this.campfireHealTimer += deltaTime;
                
                if (this.campfireHealTimer >= this.campfireHealRate) {
                    this.campfireHealTimer = 0;
                    this.player.lives = Math.min(this.player.lives + 1, this.player.maxLives);
                    
                    // Efeito visual de cura (partículas verdes)
                    for (let i = 0; i < 5; i++) {
                        this.particles.push(new Particle(
                            this.player.x + this.player.width / 2,
                            this.player.y + this.player.height / 2,
                            '#00ff00',
                            1000
                        ));
                    }
                }
            } else {
                // Reset do timer se sair da área ou já estiver com vida cheia
                this.campfireHealTimer = 0;
            }
        }
        
        // Atualiza cachorro se estiver dentro da casa
        if (this.dog && this.isInHouse) {
            this.dog.update(deltaTime);
            
            // Verifica se o jogador quer comprar o cachorro (espaço ou botão de interagir mobile)
            const interactPressed = this.player.isKeyPressed(' ', this.mobileControls) || 
                                   this.player.isKeyPressed('e', this.mobileControls);
            
            if (this.dog.isPlayerNear(this.player) && interactPressed && !this.dogPurchaseProcessed) {
                if (this.dog.purchase(this)) {
                    console.log('Cachorro comprado!');
                    
                    // Cria um pet na posição do mundo (não na posição da casa)
                    // Usa savedWorldState para pegar a posição real do player no mundo
                    const worldX = this.savedWorldState ? this.savedWorldState.playerX : this.player.x;
                    const worldY = this.savedWorldState ? this.savedWorldState.playerY : this.player.y;
                    
                    const newPet = new Dog(
                        worldX + this.player.width + 10, // Ao lado direito do player no mundo
                        worldY, // Na mesma altura no mundo
                        0, // Preço não importa para pets
                        true // É um pet
                    );
                    this.petDogs.push(newPet);
                    
                    // Incrementa contador para próximo preço
                    this.dogsPurchased++;
                    
                    console.log(`Você agora tem ${this.petDogs.length} cachorro(s)!`);
                }
                this.dogPurchaseProcessed = true;
            }
            
            // Reset da flag quando soltar a tecla
            if (!interactPressed) {
                this.dogPurchaseProcessed = false;
            }
        }
        
        // Verifica se o player quer sair da casa (porta na parte inferior)
        if (this.isInHouse) {
            // Calcula posição da porta baseada no mapa pequeno centralizado
            const offsetX = (CONFIG.WORLD_WIDTH - this.houseMapWidth) / 2;
            const offsetY = (CONFIG.WORLD_HEIGHT - this.houseMapHeight) / 2;
            const exitWidth = 80;
            const exitHeight = 60;
            
            const exitArea = {
                x: offsetX + (this.houseMapWidth - exitWidth) / 2,
                y: offsetY + this.houseMapHeight - exitHeight,
                width: exitWidth,
                height: exitHeight
            };
            
            if (checkCollision(this.player, exitArea)) {
                this.exitHouse();
            }
        }
        
        // Atualiza projéteis
        this.bullets.forEach(bullet => {
            bullet.update(deltaTime);
            
            // Verifica colisão com árvores
            this.trees.forEach(tree => {
                const bulletBounds = bullet.getBounds();
                if (tree.isColliding(bulletBounds) && bullet.active) {
                    // Cria partículas na posição da colisão
                    const particles = createTreeHitParticles(bullet.x, bullet.y, false);
                    this.particles.push(...particles);
                    
                    // Dá dano na árvore
                    if (tree.takeDamage()) {
                        // Árvore foi destruída - cria mais partículas
                        const destroyParticles = createTreeHitParticles(
                            tree.x + tree.width / 2, 
                            tree.y + tree.height / 2,
                            true // Partículas de destruição
                        );
                        this.particles.push(...destroyParticles);
                        
                        // Spawna uma nova árvore em outro lugar
                        this.spawnNewTree();
                    }
                    
                    bullet.active = false; // Balas param ao colidir com árvores
                }
            });
            
            // Verifica colisão com lobos
            if (bullet.owner === 'player' && bullet.active) {
                this.wolves.forEach(wolf => {
                    const bulletBounds = bullet.getBounds();
                    // Verifica se pode atingir este inimigo (para balas perfurantes)
                    if (bullet.canHitEnemy(wolf) && checkCollision(bulletBounds, wolf)) {
                        if (wolf.takeDamage()) {
                            // Lobo morreu - dropa moedas
                            this.spawnCoins(wolf.x + wolf.width / 2, wolf.y + wolf.height / 2, 2, 3);
                            this.wolvesKilled++;
                            this.wolvesKilledSinceLastHouse++; // Incrementa contador para próxima casa
                            
                            // Adiciona score por matar lobo
                            this.score += 100;
                            
                            // Toca o som de morte do lobo
                            audioManager.play('wolf_dead');
                        }
                        // Marca que atingiu este inimigo (método markEnemyHit controla se a bala desativa)
                        bullet.markEnemyHit(wolf);
                    }
                });
                
                // Verifica colisão com boss wolf
                if (this.bossWolf && !this.bossWolf.dying) {
                    const bulletBounds = bullet.getBounds();
                    if (bullet.canHitEnemy(this.bossWolf) && checkCollision(bulletBounds, this.bossWolf)) {
                        if (this.bossWolf.takeDamage()) {
                            // Boss morreu - dropa mais moedas!
                            this.spawnCoins(this.bossWolf.x + this.bossWolf.width / 2, this.bossWolf.y + this.bossWolf.height / 2, 8, 12);
                            this.wolvesKilled += 5; // Conta como 5 lobos
                            this.wolvesKilledSinceLastHouse += 5; // Incrementa contador para próxima casa
                            
                            // Adiciona score por matar boss (vale mais!)
                            this.score += 1000;
                            
                            // Toca o som de morte do lobo boss
                            audioManager.play('wolf_dead');
                        }
                        // Marca que atingiu o boss (método markEnemyHit controla se a bala desativa)
                        bullet.markEnemyHit(this.bossWolf);
                    }
                }
            }
        });
        
        // Atualiza árvores (para animação de quebra)
        this.trees.forEach(tree => {
            tree.update(deltaTime);
        });
        
        // Remove árvores destruídas
        this.trees = this.trees.filter(tree => tree.active);
        
        // Atualiza partículas
        this.particles.forEach(particle => {
            particle.update(deltaTime);
        });
        
        // Remove partículas inativas
        this.particles = this.particles.filter(particle => particle.active);
        
        // Atualiza moedas
        this.coinObjects.forEach(coin => {
            const result = coin.update(deltaTime, this.player);
            if (result.collected) {
                this.coins += result.value; // Adiciona moedas (podem ser gastas)
                // Não adiciona ao score quando coleta moedas
            }
        });
        
        // Remove moedas inativas
        this.coinObjects = this.coinObjects.filter(coin => coin.active);
        
        // Atualiza caixas
        this.crates.forEach(crate => crate.update(deltaTime));
        
        // Verifica colisão de balas com caixas
        this.bullets.forEach(bullet => {
            this.crates.forEach(crate => {
                if (crate.active && !crate.broken && crate.isCollidingWithBullet(bullet)) {
                    const breakResult = crate.break();
                    if (breakResult && breakResult.createParticles) {
                        // Cria partículas da caixa quebrando (mesmo estilo das árvores)
                        const particleCount = 20 + Math.floor(Math.random() * 10);
                        
                        for (let i = 0; i < particleCount; i++) {
                            // Apenas tons de marrom (madeira)
                            const colors = [
                                '#654321', '#8B4513', '#A0522D', '#D2691E', '#CD853F'
                            ];
                            const color = colors[Math.floor(Math.random() * colors.length)];
                            
                            // Velocidade aleatória em todas as direções
                            const angle = Math.random() * Math.PI * 2;
                            const speed = 3 + Math.random() * 5;
                            const velocityX = Math.cos(angle) * speed;
                            const velocityY = Math.sin(angle) * speed - 3; // Mais para cima
                            
                            const size = 2 + Math.random() * 4;
                            const lifetime = 600 + Math.random() * 600;
                            
                            this.particles.push(new Particle(
                                breakResult.x,
                                breakResult.y,
                                color,
                                velocityX,
                                velocityY,
                                size,
                                lifetime
                            ));
                        }
                        
                        // Toca som de explosão
                        audioManager.play('explosion', 0.7);
                    }
                    bullet.active = false;
                }
            });
        });
        
        // Remove projéteis inativos
        this.bullets = this.bullets.filter(bullet => bullet.active);
        
        // Verifica colisão do player com caixas quebradas (powerups revelados)
        // Verifica colisão do player com caixas quebradas (powerups revelados)
        this.crates.forEach(crate => {
            if (crate.active && crate.broken && checkCollision(
                { x: crate.x, y: crate.y, width: crate.width, height: crate.height },
                { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height }
            )) {
                const powerupType = crate.collect();
                if (powerupType) {
                    console.log('Power-up coletado! Tipo:', powerupType);
                    this.player.applyPowerup(powerupType);
                    this.showPowerupNotification(powerupType); // Mostra notificação
                    
                    // Toca o som de power-up ao coletar
                    audioManager.play('power_up');
                    
                    // Adiciona score por coletar power-up
                    this.score += 50;
                }
            }
        });
        
        // Sistema de ondas (apenas se não estiver dentro da casa)
        if (!this.isInHouse) {
            this.updateWaveSystem(deltaTime);
        }
        
        // Atualiza UI
        this.updateUI();
    }
    
    draw() {
        // Limpa tela
        this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Aplica transformação da câmera
        this.ctx.save();
        
        // No menu, centraliza a câmera no meio do mundo
        if (this.inMenu) {
            this.ctx.translate(
                -CONFIG.WORLD_WIDTH / 2 + this.canvas.width / 2,
                -CONFIG.WORLD_HEIGHT / 2 + this.canvas.height / 2
            );
        } else {
            this.camera.apply(this.ctx);
        }
        
        // Desenha mundo (background pattern)
        this.drawWorld();
        
        // Desenha lagos (apenas se não estiver dentro da casa)
        if (!this.isInHouse) {
            this.lakes.forEach(lake => lake.draw(this.ctx));
        }
        
        // Desenha pedras (sempre no chão, antes de tudo) (apenas se não estiver dentro da casa)
        if (!this.isInHouse) {
            this.rocks.forEach(rock => rock.draw(this.ctx));
        }
        
        // Desenha árvores (camada inferior) (apenas se não estiver dentro da casa)
        if (!this.isInHouse) {
            this.trees.forEach(tree => {
                if (this.inMenu || tree.y < this.player.y) {
                    tree.draw(this.ctx);
                }
            });
        }
        
        // Desenha casa (apenas no mapa principal, não no menu)
        if (this.house && !this.inMenu && !this.isInHouse) {
            this.house.draw(this.ctx);
        }
        
        // Desenha fogueira (apenas dentro da casa)
        if (this.campfire && this.isInHouse) {
            this.campfire.draw(this.ctx);
        }
        
        // Desenha cachorro (apenas dentro da casa, acima da fogueira)
        if (this.dog && this.isInHouse) {
            this.dog.draw(this.ctx, this.player, this);
        }
        
        // Desenha caixas (não desenha no menu nem dentro da casa)
        if (!this.inMenu && !this.isInHouse) {
            this.crates.forEach(crate => crate.draw(this.ctx));
        }
        
        // Desenha projéteis (não desenha no menu nem dentro da casa)
        if (!this.inMenu && !this.isInHouse) {
            this.bullets.forEach(bullet => bullet.draw(this.ctx));
            
            // Desenha moedas
            this.coinObjects.forEach(coin => coin.draw(this.ctx));
            
            // Desenha partículas
            this.particles.forEach(particle => particle.draw(this.ctx));
        }
        
        // Desenha lobos ou lobos decorativos (não desenha dentro da casa)
        if (this.inMenu) {
            this.decorativeWolves.forEach(wolf => wolf.draw(this.ctx));
        } else if (!this.isInHouse) {
            this.wolves.forEach(wolf => wolf.draw(this.ctx));
            
            // Desenha boss wolf
            if (this.bossWolf) {
                this.bossWolf.draw(this.ctx);
            }
        }
        
        // Desenha jogador (não desenha no menu)
        if (!this.inMenu) {
            this.player.draw(this.ctx);
            
            // Desenha pets (cachorros) - exceto dentro da casa
            if (!this.isInHouse) {
                this.petDogs.forEach(pet => {
                    pet.draw(this.ctx, this.player, this);
                });
            }
            
            // Indicador de cura da fogueira
            if (this.campfire && this.isInHouse) {
                const dx = this.player.x - (this.campfire.x + this.campfire.width / 2);
                const dy = this.player.y - (this.campfire.y + this.campfire.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.campfireHealDistance && this.player.lives < this.player.maxLives) {
                    const progress = this.campfireHealTimer / this.campfireHealRate;
                    
                    // Configurações da barra
                    const barWidth = 60;
                    const barHeight = 8;
                    const barX = this.player.x + this.player.width / 2 - barWidth / 2;
                    const barY = this.player.y - 20;
                    const borderRadius = 4;
                    
                    // Sombra da barra
                    this.ctx.save();
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    this.ctx.shadowBlur = 4;
                    this.ctx.shadowOffsetX = 0;
                    this.ctx.shadowOffsetY = 2;
                    
                    // Fundo da barra com bordas arredondadas
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    this.ctx.beginPath();
                    this.ctx.roundRect(barX, barY, barWidth, barHeight, borderRadius);
                    this.ctx.fill();
                    
                    this.ctx.restore();
                    
                    // Gradiente de cura (verde claro para verde escuro)
                    const gradient = this.ctx.createLinearGradient(barX, barY, barX + barWidth * progress, barY);
                    gradient.addColorStop(0, '#4ade80'); // Verde claro
                    gradient.addColorStop(1, '#22c55e'); // Verde médio
                    
                    // Barra de progresso com bordas arredondadas
                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.roundRect(barX + 1, barY + 1, (barWidth - 2) * progress, barHeight - 2, borderRadius - 1);
                    this.ctx.fill();
                    
                    // Brilho na barra de progresso
                    const glowGradient = this.ctx.createLinearGradient(barX, barY, barX, barY + barHeight / 2);
                    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    this.ctx.fillStyle = glowGradient;
                    this.ctx.beginPath();
                    this.ctx.roundRect(barX + 1, barY + 1, (barWidth - 2) * progress, (barHeight - 2) / 2, borderRadius - 1);
                    this.ctx.fill();
                    
                    // Borda da barra com gradiente
                    const borderGradient = this.ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
                    borderGradient.addColorStop(0, '#86efac'); // Verde claro
                    borderGradient.addColorStop(1, '#16a34a'); // Verde escuro
                    this.ctx.strokeStyle = borderGradient;
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.roundRect(barX, barY, barWidth, barHeight, borderRadius);
                    this.ctx.stroke();
                    
                    // Texto de cura com sombra
                    this.ctx.save();
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    this.ctx.shadowBlur = 4;
                    this.ctx.shadowOffsetX = 1;
                    this.ctx.shadowOffsetY = 1;
                    
                    this.ctx.font = 'bold 14px Arial';
                    this.ctx.fillStyle = '#4ade80';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('❤ Curando...', this.player.x + this.player.width / 2, barY - 6);
                    
                    // Efeito de pulso no texto
                    const pulse = Math.sin(Date.now() / 300) * 0.5 + 0.5;
                    this.ctx.globalAlpha = 0.3 + pulse * 0.3;
                    this.ctx.fillStyle = '#86efac';
                    this.ctx.fillText('❤ Curando...', this.player.x + this.player.width / 2, barY - 6);
                    
                    this.ctx.restore();
                }
            }
        }
        
        // Desenha árvores (camada superior - na frente do player) (apenas se não estiver dentro da casa)
        if (!this.inMenu && !this.isInHouse) {
            this.trees.forEach(tree => {
                if (tree.y >= this.player.y) {
                    tree.draw(this.ctx);
                }
            });
        }
        
        // Remove transformação da câmera
        this.ctx.restore();
        
        // Desenha UI (sem transformação da câmera)
        this.drawUI();
        
        // Game Over
        if (this.gameOver) {
            this.drawGameOver();
        }
    }
    
    drawWorld() {
        // Se estiver dentro da casa, desenha chão diferente (mapa pequeno)
        if (this.isInHouse) {
            // Fundo preto ao redor
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
            
            // Calcula posição centralizada do mapa da casa
            const offsetX = (CONFIG.WORLD_WIDTH - this.houseMapWidth) / 2;
            const offsetY = (CONFIG.WORLD_HEIGHT - this.houseMapHeight) / 2;
            
            // Chão de madeira escura e elegante
            const gradient = this.ctx.createLinearGradient(offsetX, offsetY, offsetX, offsetY + this.houseMapHeight);
            gradient.addColorStop(0, '#2a1810');
            gradient.addColorStop(0.5, '#3d2516');
            gradient.addColorStop(1, '#2a1810');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(offsetX, offsetY, this.houseMapWidth, this.houseMapHeight);
            
            // Tábuas de madeira com detalhes mais sutis
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 2;
            for (let y = 0; y < this.houseMapHeight; y += 40) {
                this.ctx.beginPath();
                this.ctx.moveTo(offsetX, offsetY + y);
                this.ctx.lineTo(offsetX + this.houseMapWidth, offsetY + y);
                this.ctx.stroke();
                
                // Linhas verticais para simular tábuas
                for (let x = 0; x < this.houseMapWidth; x += 120) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(offsetX + x, offsetY + y);
                    this.ctx.lineTo(offsetX + x, offsetY + y + 40);
                    this.ctx.stroke();
                }
            }
            
            // Borda interna com sombra
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            this.ctx.strokeStyle = '#1a0f08';
            this.ctx.lineWidth = 8;
            this.ctx.strokeRect(offsetX + 4, offsetY + 4, this.houseMapWidth - 8, this.houseMapHeight - 8);
            this.ctx.shadowBlur = 0;
            
            // Porta de saída (área inferior centralizada)
            const exitWidth = 80;
            const exitHeight = 60;
            const exitX = offsetX + (this.houseMapWidth - exitWidth) / 2;
            const exitY = offsetY + this.houseMapHeight - exitHeight;
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(exitX, exitY, exitWidth, exitHeight);
            
            // Indicador de saída
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('↓ SAIR', exitX + exitWidth / 2, exitY + 35);
            
            return; // Não desenha o mundo normal
        }
        
        // Calcula área visível baseado no estado do jogo
        let startX, startY, endX, endY;
        
        if (this.inMenu) {
            // No menu, centraliza no meio do mundo
            const centerX = CONFIG.WORLD_WIDTH / 2;
            const centerY = CONFIG.WORLD_HEIGHT / 2;
            startX = Math.floor((centerX - this.canvas.width / 2) / 80) * 80;
            startY = Math.floor((centerY - this.canvas.height / 2) / 80) * 80;
            endX = centerX + this.canvas.width / 2 + 80;
            endY = centerY + this.canvas.height / 2 + 80;
        } else {
            // No jogo, usa a câmera
            startX = Math.floor(this.camera.x / 80) * 80;
            startY = Math.floor(this.camera.y / 80) * 80;
            endX = this.camera.x + CONFIG.CANVAS_WIDTH + 80;
            endY = this.camera.y + CONFIG.CANVAS_HEIGHT + 80;
        }
        
        this.groundPatterns.forEach(patch => {
            // Só desenha patches visíveis
            if (this.inMenu) {
                const centerX = CONFIG.WORLD_WIDTH / 2;
                const centerY = CONFIG.WORLD_HEIGHT / 2;
                const minX = centerX - this.canvas.width / 2;
                const minY = centerY - this.canvas.height / 2;
                const maxX = centerX + this.canvas.width / 2;
                const maxY = centerY + this.canvas.height / 2;
                
                if (patch.x + patch.size < minX || patch.x > maxX ||
                    patch.y + patch.size < minY || patch.y > maxY) {
                    return;
                }
            } else {
                if (patch.x + patch.size < this.camera.x || patch.x > endX ||
                    patch.y + patch.size < this.camera.y || patch.y > endY) {
                    return;
                }
            }
            
            // Desenha patch base
            this.ctx.fillStyle = patch.color;
            this.ctx.fillRect(patch.x, patch.y, patch.size, patch.size);
            
            // Adiciona textura de grama se tiver
            if (patch.hasGrass) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.3 * patch.grassDensity;
                
                // Desenha linhas de grama pré-geradas
                this.ctx.strokeStyle = '#4a7c2a';
                this.ctx.lineWidth = 1;
                
                patch.grassLines.forEach(grass => {
                    const gx = patch.x + grass.x;
                    const gy = patch.y + grass.y;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(gx, gy);
                    this.ctx.lineTo(gx + grass.offset, gy - grass.h);
                    this.ctx.stroke();
                });
                
                this.ctx.restore();
            }
            
            // Adiciona pequenas manchas escuras (sujeira/variação) pré-geradas
            if (patch.spots.length > 0) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                patch.spots.forEach(spot => {
                    const sx = patch.x + spot.x;
                    const sy = patch.y + spot.y;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(sx, sy, spot.r, 0, Math.PI * 2);
                    this.ctx.fill();
                });
            }
        });
        
        // Desenha grid sutil para estrutura
        const gridSize = 80;
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.lineWidth = 1;
        
        if (this.inMenu) {
            const centerX = CONFIG.WORLD_WIDTH / 2;
            const centerY = CONFIG.WORLD_HEIGHT / 2;
            const minX = centerX - this.canvas.width / 2;
            const minY = centerY - this.canvas.height / 2;
            const maxX = centerX + this.canvas.width / 2;
            const maxY = centerY + this.canvas.height / 2;
            
            for (let x = startX; x < endX; x += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, minY);
                this.ctx.lineTo(x, maxY);
                this.ctx.stroke();
            }
            
            for (let y = startY; y < endY; y += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(minX, y);
                this.ctx.lineTo(maxX, y);
                this.ctx.stroke();
            }
        } else {
            for (let x = startX; x < endX; x += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, this.camera.y);
                this.ctx.lineTo(x, this.camera.y + CONFIG.CANVAS_HEIGHT);
                this.ctx.stroke();
            }
            
            for (let y = startY; y < endY; y += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.camera.x, y);
                this.ctx.lineTo(this.camera.x + CONFIG.CANVAS_WIDTH, y);
                this.ctx.stroke();
            }
        }
        
        // Desenha bordas do mundo
        this.ctx.strokeStyle = '#2c3e2c';
        this.ctx.lineWidth = 5;
        this.ctx.strokeRect(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
    }
    
    drawUI() {
        // Flash vermelho quando o jogador leva dano
        if (this.damageFlashTime > 0) {
            const alpha = this.damageFlashTime / this.damageFlashDuration; // Fade out
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${alpha * 0.8})`;
            this.ctx.lineWidth = 15;
            this.ctx.strokeRect(5, 5, this.canvas.width - 10, this.canvas.height - 10);
            
            // Overlay vermelho sutil no centro
            const gradient = this.ctx.createRadialGradient(
                this.canvas.width / 2, this.canvas.height / 2, 0,
                this.canvas.width / 2, this.canvas.height / 2, this.canvas.width / 2
            );
            gradient.addColorStop(0, `rgba(255, 0, 0, 0)`);
            gradient.addColorStop(1, `rgba(255, 0, 0, ${alpha * 0.3})`);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Notificação de nova onda
        if (this.waveNotificationTimer > 0) {
            const alpha = Math.min(1, this.waveNotificationTimer / 1000); // Fade in/out
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            
            // Fundo escuro
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, this.canvas.height / 2 - 80, this.canvas.width, 160);
            
            // Texto da onda
            this.ctx.fillStyle = '#ffaa00';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = 'black';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText(`⚔️ ONDA ${this.currentWave} ⚔️`, this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            // Subtexto com quantidade de lobos
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(`${this.wolvesToSpawnInWave} Lobos`, this.canvas.width / 2, this.canvas.height / 2 + 20);
            
            this.ctx.restore();
        }
        
        // Notificação de spawn do boss
        if (this.bossNotificationTimer > 0) {
            const alpha = Math.min(1, this.bossNotificationTimer / 1000); // Fade in/out
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            
            // Fundo escuro
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, this.canvas.height / 2 - 80, this.canvas.width, 160);
            
            // Texto do boss
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = 'black';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText('⚠️ BOSS WOLF APARECEU! ⚠️', this.canvas.width / 2, this.canvas.height / 2);
            
            this.ctx.restore();
        }
        
        // Barra de vida do boss
        if (this.bossWolf && !this.bossWolf.dying) {
            const barWidth = 400;
            const barHeight = 30;
            const barX = (this.canvas.width - barWidth) / 2;
            const barY = 85; // Movido para 80
            
            // Fundo da barra
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);
            
            // Barra vermelha (fundo)
            this.ctx.fillStyle = '#330000';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Barra de vida (preenchimento)
            const healthPercent = this.bossWolf.health / this.bossWolf.maxHealth;
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            // Borda
            this.ctx.strokeStyle = '#ff6600';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            // Texto
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = 'black';
            this.ctx.shadowBlur = 5;
            this.ctx.fillText(`BOSS WOLF - ${this.bossWolf.health}/${this.bossWolf.maxHealth}`, this.canvas.width / 2, barY + barHeight / 2);
            this.ctx.shadowBlur = 0;
        }
    }
    
    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 60);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Score Final: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`Lobos Eliminados: ${this.wolvesKilled}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Pressione R para Reiniciar', this.canvas.width / 2, this.canvas.height / 2 + 80);
        this.ctx.fillText('Pressione M para Menu', this.canvas.width / 2, this.canvas.height / 2 + 110);
    }
    
    updateUI() {
        // Atualiza vida mostrando atual/máxima
        document.getElementById('livesCount').textContent = `${this.player.lives}/${this.player.maxLives}`;
        document.getElementById('scoreCount').textContent = this.score;
        document.getElementById('coinsCount').textContent = this.coins; // Mostra moedas separadamente
        document.getElementById('wolvesCount').textContent = this.wolvesKilled;
        
        // Não atualiza informações de onda se estiver no menu
        if (this.inMenu) return;
        
        // Atualiza informações da onda
        const waveInfo = document.getElementById('waveInfo');
        const waveElement = document.getElementById('wave');
        
        if (waveInfo && waveElement) {
            // Mostra o indicador durante a notificação inicial da onda, notificação de progresso, durante a onda ativa (spawning/active), ou durante o período de espera
            const showWaveIndicator = this.waveNotificationTimer > 0 || 
                                     this.waveProgressNotificationTimer > 0 ||
                                     this.waveState === 'preparing' ||
                                     this.waveState === 'spawning' || 
                                     this.waveState === 'active' ||
                                     this.waveState === 'waiting';
            
            if (showWaveIndicator) {
                // Mostra o elemento
                // Verifica tanto style inline quanto computed style
                const isHidden = waveElement.style.display === 'none' || 
                                window.getComputedStyle(waveElement).display === 'none';
                
                if (isHidden) {
                    waveElement.style.display = 'block';
                    console.log('Mudando display para block');
                    // Pequeno delay para garantir que o display seja aplicado antes do fade
                    setTimeout(() => {
                        waveElement.classList.remove('hide');
                        waveElement.classList.add('show');
                        console.log('Adicionando classe show');
                    }, 10);
                } else if (!waveElement.classList.contains('show')) {
                    waveElement.classList.remove('hide');
                    waveElement.classList.add('show');
                    console.log('Adicionando classe show (já estava visível)');
                }
                
                // Atualiza o texto
                if (this.waveState === 'preparing') {
                    const actualTimeRemaining = Math.abs(this.waveTimer);
                    const secondsLeft = Math.ceil(actualTimeRemaining / 1000);
                    waveInfo.textContent = `Preparando... ${secondsLeft}s`;
                } else if (this.waveState === 'waiting') {
                    const timeRemaining = this.waveWaitDuration - this.waveTimer;
                    // Se o timer ainda é negativo (antes da primeira onda), ajusta o cálculo
                    const actualTimeRemaining = this.waveTimer < 0 ? Math.abs(this.waveTimer) : timeRemaining;
                    
                    if (actualTimeRemaining > 0) {
                        const secondsLeft = Math.ceil(actualTimeRemaining / 1000);
                        if (this.currentWave === 0) {
                            waveInfo.textContent = `Preparando... ${secondsLeft}s`;
                        } else {
                            waveInfo.textContent = `Onda ${this.currentWave} | Próxima em: ${secondsLeft}s`;
                        }
                    } else {
                        waveInfo.textContent = `Preparando próxima onda...`;
                    }
                } else if (this.waveState === 'spawning' || this.waveState === 'active') {
                    const remaining = this.wolvesToSpawnInWave - this.wolvesSpawnedInWave + this.wolves.length;
                    waveInfo.textContent = `Onda ${this.currentWave} | Lobos restantes: ${remaining}`;
                }
            } else {
                // Fade out quando não deve mais mostrar
                if (waveElement.style.display === 'block' && !waveElement.classList.contains('hide')) {
                    waveElement.classList.remove('show');
                    waveElement.classList.add('hide');
                    // Esconde completamente após a animação
                    setTimeout(() => {
                        // Só esconde se não estiver em nenhum estado de onda
                        if (this.waveNotificationTimer <= 0 && 
                            this.waveProgressNotificationTimer <= 0 &&
                            this.waveState !== 'preparing' &&
                            this.waveState !== 'spawning' && 
                            this.waveState !== 'active' &&
                            this.waveState !== 'waiting') {
                            waveElement.style.display = 'none';
                        }
                    }, 500);
                }
            }
        }
        
        // Atualiza barra de cooldown do dash (apenas se não estiver no menu e não for game over)
        if (!this.inMenu && !this.gameOver) {
            const cooldownPercent = this.player.getDashCooldownPercent();
            const dashBar = document.getElementById('dashCooldownBar');
            const dashContainer = document.getElementById('dashCooldownContainer');
            
            if (cooldownPercent > 0) {
                dashContainer.style.display = 'block';
                dashBar.style.width = cooldownPercent + '%';
            } else {
                dashContainer.style.display = 'none';
            }
        } else {
            // Esconde a barra quando está no menu ou game over
            document.getElementById('dashCooldownContainer').style.display = 'none';
        }
    }
    
    showPowerupNotification(powerupType) {
        const notificationEl = document.getElementById('powerupNotification');
        
        const powerupInfo = {
            'FIRE_RATE': { text: '⚡ TAXA DE TIRO +', color: '#ff4444' },
            'BULLET_SPEED': { text: '➤ VELOCIDADE DE BALA +', color: '#44ffff' },
            'BULLET_SIZE': { text: '● TAMANHO DE BALA +', color: '#ffff44' },
            'MOVEMENT_SPEED': { text: '↑ VELOCIDADE +', color: '#44ff44' },
            'PIERCING': { 
                text: `◆ PERFURAÇÃO NÍVEL ${this.player.powerups.piercing}!`, 
                color: '#ff44ff' 
            },
            'HEALTH': { text: '❤️ VIDA MÁXIMA +', color: '#ff0000' }
        };
        
        const info = powerupInfo[powerupType];
        if (!info) {
            console.error('Powerup type não encontrado:', powerupType);
            return;
        }
        
        console.log('Mostrando notificação de powerup:', powerupType, info.text);
        
        // Limpa timer anterior se existir
        if (this.powerupNotificationTimer) {
            clearTimeout(this.powerupNotificationTimer);
            notificationEl.classList.remove('show', 'hide');
            notificationEl.style.display = 'none';
            this.isPaused = false; // Despausa se havia notificação anterior
        }
        
        // Pausa o jogo
        this.isPaused = true;
        
        // Configura e mostra a notificação
        notificationEl.style.display = 'block';
        notificationEl.textContent = info.text;
        notificationEl.style.borderColor = info.color;
        notificationEl.style.color = info.color;
        notificationEl.classList.remove('hide'); // Remove classe hide se existir
        notificationEl.classList.add('show');
        
        // Inicia fade out após 1.5 segundos (antes de esconder)
        this.powerupNotificationTimer = setTimeout(() => {
            notificationEl.classList.remove('show');
            notificationEl.classList.add('hide');
            
            // Remove completamente e despausa após a animação terminar (0.5s)
            setTimeout(() => {
                notificationEl.classList.remove('hide');
                notificationEl.style.display = 'none';
                this.isPaused = false;
            }, 500);
        }, 1500);
    }
    
    handleShoot() {
        const bullet = this.player.shoot();
        if (bullet) {
            this.bullets.push(bullet);
        }
    }
    
    restart() {
        this.player = new Player(CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2);
        this.wolves = [];
        this.bossWolf = null;
        this.bossSpawned = false;
        this.bossNotificationTimer = 0;
        this.bullets = [];
        this.coinObjects = []; // Reseta array de moedas
        this.crates = [];
        this.petDogs = []; // Reseta pets
        this.dogsPurchased = 0; // Reseta contador de cachorros
        this.lakes = [];
        this.trees = [];
        this.rocks = [];
        this.score = 0; // Reseta score
        this.coins = 0; // Reseta moedas
        this.wolvesKilled = 0;
        this.wolfSpawnTimer = 0;
        
        // Reseta sistema de ondas
        this.currentWave = 0;
        this.waveState = 'preparing';
        this.waveTimer = 0;
        this.waveSpawnTimer = 0;
        this.wolvesToSpawnInWave = 0;
        this.wolvesSpawnedInWave = 0;
        this.waveNotificationTimer = 0;
        this.waveProgressNotificationTimer = 0;
        this.lastProgressMilestone = 0;
        
        this.gameOver = false;
        this.house = null;
        this.campfire = null;
        this.campfireHealTimer = 0;
        this.houseSpawned = false;
        this.isInHouse = false;
        this.savedWorldState = null;
        this.init();
    }
    
    backToMenu() {
        // Reseta o jogo
        this.player = new Player(CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2);
        this.wolves = [];
        this.bossWolf = null;
        this.bossSpawned = false;
        this.bossNotificationTimer = 0;
        this.bullets = [];
        this.coinObjects = []; // Reseta array de moedas
        this.crates = [];
        this.score = 0; // Reseta score
        this.coins = 0; // Reseta moedas
        this.wolvesKilled = 0;
        this.wolfSpawnTimer = 0;
        
        // Reseta sistema de ondas
        this.currentWave = 0;
        this.waveState = 'preparing';
        this.waveTimer = 0;
        this.waveSpawnTimer = 0;
        this.wolvesToSpawnInWave = 0;
        this.wolvesSpawnedInWave = 0;
        this.waveNotificationTimer = 0;
        this.waveProgressNotificationTimer = 0;
        this.lastProgressMilestone = 0;
        
        this.gameOver = false;
        this.house = null;
        this.campfire = null;
        this.campfireHealTimer = 0;
        this.houseSpawned = false;
        this.isInHouse = false;
        this.savedWorldState = null;
        this.damageFlashTime = 0; // Reseta o flash de dano
        
        // Volta para o menu
        this.inMenu = true;
        document.getElementById('menuScreen').classList.remove('hidden');
        document.getElementById('logo').style.display = 'none';
        document.getElementById('lives').style.display = 'none';
        document.getElementById('score').style.display = 'none';
        document.getElementById('coins').style.display = 'none';
        document.getElementById('wolves').style.display = 'none';
        document.getElementById('wave').style.display = 'none';
        document.getElementById('dashCooldownContainer').style.display = 'none';
        
        // Respawna lobos decorativos
        this.decorativeWolves = [];
        this.spawnDecorativeWolves();
    }
    
    gameLoop(currentTime) {
        if (!this.running) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Cap em 100ms para evitar grandes saltos (ex: quando minimiza a janela)
        const cappedDeltaTime = Math.min(deltaTime, 100);
        
        this.update(cappedDeltaTime);
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}
