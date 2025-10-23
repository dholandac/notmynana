// Game.js - Classe principal do jogo

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
        
        // Gera padrão de fundo uma vez só
        this.generateGroundPattern();
        
        // Câmera
        this.camera = new Camera(
            CONFIG.WORLD_WIDTH,
            CONFIG.WORLD_HEIGHT,
            CONFIG.CANVAS_WIDTH,
            CONFIG.CANVAS_HEIGHT
        );
        
        // Spawn de lobos
        this.wolfSpawnTimer = 0;
        this.wolfSpawnRate = CONFIG.WOLF_SPAWN_RATE;
        
        // Score
        this.score = 0;
        this.wolvesKilled = 0;
        this.bossSpawned = false; // Flag para controlar se o boss já foi spawnado
        
        // Boss notification
        this.bossNotificationTimer = 0;
        this.bossNotificationDuration = 3000; // 3 segundos
        
        // Feedback visual de dano do jogador
        this.damageFlashTime = 0;
        this.damageFlashDuration = 300; // ms
        
        // Notificação de powerup
        this.powerupNotificationTimer = null;
        
        // Inicialização
        this.init();
        this.setupMenuControls();
    }
    
    init() {
        // Cria lagos primeiro
        this.spawnLakes();
        
        // Cria árvores
        this.spawnTrees();
        
        // Cria pedras decorativas
        this.spawnRocks();
        
        // Cria caixas de munição pelo mapa
        this.spawnCrates();
        
        // Spawna alguns lobos iniciais
        for (let i = 0; i < 3; i++) {
            this.spawnWolf();
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
        for (let i = 0; i < CONFIG.CRATE_COUNT; i++) {
            let x, y;
            let attempts = 0;
            let valid = false;
            
            // Tenta encontrar posição que não seja em cima de um lago
            do {
                x = randomRange(100, CONFIG.WORLD_WIDTH - 100);
                y = randomRange(100, CONFIG.WORLD_HEIGHT - 100);
                
                valid = true;
                for (let lake of this.lakes) {
                    if (lake.isColliding({ x, y, width: CONFIG.CRATE_WIDTH, height: CONFIG.CRATE_HEIGHT })) {
                        valid = false;
                        break;
                    }
                }
                
                attempts++;
            } while (!valid && attempts < 50);
            
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
        this.bossSpawned = true;
        this.bossNotificationTimer = this.bossNotificationDuration;
        
        console.log('Boss Wolf spawnou!');
    }
    
    setupMenuControls() {
        const playButton = document.getElementById('playButton');
        const instructionsButton = document.getElementById('instructionsButton');
        const creditsButton = document.getElementById('creditsButton');
        
        playButton.addEventListener('click', () => this.startGame());
        
        instructionsButton.addEventListener('click', () => {
            alert('INSTRUÇÕES:\n\nWASD ou Setas - Mover\nEspaço - Atirar\nR - Reiniciar (quando Game Over)\n\nSobreviva aos lobos e colete powerups das caixas!');
        });
        
        creditsButton.addEventListener('click', () => {
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
        document.getElementById('wolves').style.display = 'block';
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
        
        if (this.gameOver) return;
        
        // Atualiza timer de flash de dano
        if (this.damageFlashTime > 0) {
            this.damageFlashTime -= deltaTime;
        }
        
        // Guarda posição anterior do jogador
        const prevX = this.player.x;
        const prevY = this.player.y;
        
        // Atualiza jogador e verifica se criou um bullet e/ou partículas
        const playerResult = this.player.update(deltaTime);
        if (playerResult.bullet) {
            this.bullets.push(playerResult.bullet);
        }
        if (playerResult.particles && playerResult.particles.length > 0) {
            this.particles.push(...playerResult.particles);
        }
        
        // Verifica colisão com lagos
        for (let lake of this.lakes) {
            if (lake.isColliding(this.player)) {
                // Reverte posição
                this.player.x = prevX;
                this.player.y = prevY;
                break;
            }
        }
        
        // Verifica colisão com árvores
        for (let tree of this.trees) {
            if (tree.isColliding(this.player)) {
                // Reverte posição
                this.player.x = prevX;
                this.player.y = prevY;
                break;
            }
        }
        
        // Atualiza câmera
        this.camera.follow(this.player);
        
        // Atualiza lobos
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
                    }
                }
            }
        });
        
        // Remove lobos mortos (apenas após a animação de morte completar)
        this.wolves = this.wolves.filter(wolf => {
            // Remove se health < 0 (animação de morte terminou)
            if (wolf.health < 0) return false;
            // Mantém se está vivo ou morrendo (mas ainda com health >= 0)
            return true;
        });
        
        // Atualiza boss wolf
        if (this.bossWolf) {
            const prevBossX = this.bossWolf.x;
            const prevBossY = this.bossWolf.y;
            
            // Passa obstáculos e callback para destruir árvores
            const obstacles = [...this.lakes, ...this.trees];
            const bossParticles = this.bossWolf.update(deltaTime, this.player, obstacles, (tree) => {
                // Callback quando boss destrói uma árvore
                if (tree.active) {
                    tree.active = false;
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
                    }
                }
            }
            
            // Remove boss se morreu
            if (this.bossWolf.health < 0) {
                this.bossWolf = null;
                this.bossSpawned = false; // Permite spawnar outro boss futuramente
            }
        }
        
        // Atualiza timer de notificação do boss
        if (this.bossNotificationTimer > 0) {
            this.bossNotificationTimer -= deltaTime;
        }
        
        // Verifica se deve spawnar o boss
        if (!this.bossSpawned && this.wolvesKilled >= CONFIG.BOSS_SPAWN_KILLS) {
            this.spawnBoss();
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
                            this.score += 10;
                            this.wolvesKilled++;
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
                            // Boss morreu - pontuação maior!
                            this.score += 100;
                            this.wolvesKilled += 5; // Conta como 5 lobos
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
        
        // Remove projéteis inativos
        this.bullets = this.bullets.filter(bullet => bullet.active);
        
        // Verifica colisão com caixas (powerups)
        this.crates.forEach(crate => {
            if (crate.active && checkCollision(
                { x: crate.x, y: crate.y, width: crate.width, height: crate.height },
                { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height }
            )) {
                const powerupType = crate.collect();
                console.log('Crate coletada! Powerup type:', powerupType);
                this.player.applyPowerup(powerupType);
                this.showPowerupNotification(powerupType); // Mostra notificação
                this.score += 10; // Powerups valem mais pontos
            }
        });
        
        // Spawn de lobos
        this.wolfSpawnTimer += deltaTime;
        if (this.wolfSpawnTimer >= this.wolfSpawnRate) {
            this.spawnWolf();
            this.wolfSpawnTimer = 0;
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
        
        // Desenha lagos
        this.lakes.forEach(lake => lake.draw(this.ctx));
        
        // Desenha pedras (sempre no chão, antes de tudo)
        this.rocks.forEach(rock => rock.draw(this.ctx));
        
        // Desenha árvores (camada inferior)
        this.trees.forEach(tree => {
            if (this.inMenu || tree.y < this.player.y) {
                tree.draw(this.ctx);
            }
        });
        
        // Desenha caixas (não desenha no menu)
        if (!this.inMenu) {
            this.crates.forEach(crate => crate.draw(this.ctx));
        }
        
        // Desenha projéteis (não desenha no menu)
        if (!this.inMenu) {
            this.bullets.forEach(bullet => bullet.draw(this.ctx));
            
            // Desenha partículas
            this.particles.forEach(particle => particle.draw(this.ctx));
        }
        
        // Desenha lobos ou lobos decorativos
        if (this.inMenu) {
            this.decorativeWolves.forEach(wolf => wolf.draw(this.ctx));
        } else {
            this.wolves.forEach(wolf => wolf.draw(this.ctx));
            
            // Desenha boss wolf
            if (this.bossWolf) {
                this.bossWolf.draw(this.ctx);
            }
        }
        
        // Desenha jogador (não desenha no menu)
        if (!this.inMenu) {
            this.player.draw(this.ctx);
        }
        
        // Desenha árvores (camada superior - na frente do player)
        if (!this.inMenu) {
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
        document.getElementById('livesCount').textContent = this.player.lives;
        document.getElementById('scoreCount').textContent = this.score;
        document.getElementById('wolvesCount').textContent = this.wolvesKilled;
        
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
            }
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
            notificationEl.classList.remove('show');
        }
        
        // Configura e mostra a notificação
        notificationEl.textContent = info.text;
        notificationEl.style.borderColor = info.color;
        notificationEl.style.color = info.color;
        notificationEl.classList.add('show');
        
        // Esconde após 2 segundos
        this.powerupNotificationTimer = setTimeout(() => {
            notificationEl.classList.remove('show');
        }, 2000);
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
        this.crates = [];
        this.lakes = [];
        this.trees = [];
        this.rocks = [];
        this.score = 0;
        this.wolvesKilled = 0;
        this.wolfSpawnTimer = 0;
        this.gameOver = false;
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
        this.crates = [];
        this.score = 0;
        this.wolvesKilled = 0;
        this.wolfSpawnTimer = 0;
        this.gameOver = false;
        this.damageFlashTime = 0; // Reseta o flash de dano
        
        // Volta para o menu
        this.inMenu = true;
        document.getElementById('menuScreen').classList.remove('hidden');
        document.getElementById('logo').style.display = 'none';
        document.getElementById('lives').style.display = 'none';
        document.getElementById('score').style.display = 'none';
        document.getElementById('wolves').style.display = 'none';
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
