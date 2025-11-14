// Lake.js - Classe dos lagos (obstáculos)

class Lake {
    constructor(segments) {
        // segments é um array de retângulos conectados que formam o lago
        this.segments = segments;
        this.type = 'lake';
        
        // Calcula bounding box para colisões rápidas
        this.calculateBounds();
        
        // Posições dos droplets (geradas aleatoriamente)
        this.dropletPositions = [];
        this.lastDropletChange = 0; // Tempo da última mudança de posição
        this.initializeDroplets();
    }
    
    initializeDroplets() {
        // Limpa posições anteriores e cria novas posições aleatórias para os droplets
        this.dropletPositions = [];
        const dropletCount = Math.min(1, Math.floor(this.segments.length / 4)); // Reduzido para 1 droplet
        for (let i = 0; i < dropletCount; i++) {
            this.dropletPositions.push({
                segmentIndex: Math.floor(Math.random() * this.segments.length),
                offsetX: Math.random(),
                offsetY: Math.random(),
                phase: Math.random() * 10 // Fase inicial aleatória
            });
        }
    }
    
    calculateBounds() {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.segments.forEach(seg => {
            minX = Math.min(minX, seg.x);
            minY = Math.min(minY, seg.y);
            maxX = Math.max(maxX, seg.x + seg.width);
            maxY = Math.max(maxY, seg.y + seg.height);
        });
        
        this.bounds = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    isColliding(entity) {
        // Verifica colisão com cada segmento do lago
        for (let segment of this.segments) {
            if (checkCollision(segment, entity)) {
                return true;
            }
        }
        return false;
    }
    
    draw(ctx) {
        const waterImg = assetLoader.getImage('water');
        if (!waterImg) return;
        
        ctx.save();
        
        // Define a região de clipping (textura só aparece dentro do lago)
        ctx.beginPath();
        this.segments.forEach(seg => {
            ctx.rect(seg.x, seg.y, seg.width, seg.height);
        });
        ctx.clip();
        
        // Desenha a textura seamless repetindo para cobrir todo o lago
        const tileSize = 128; // Tamanho de cada tile da textura
        
        // Calcula quantos tiles são necessários
        const startX = Math.floor(this.bounds.x / tileSize) * tileSize;
        const startY = Math.floor(this.bounds.y / tileSize) * tileSize;
        const endX = Math.ceil((this.bounds.x + this.bounds.width) / tileSize) * tileSize;
        const endY = Math.ceil((this.bounds.y + this.bounds.height) / tileSize) * tileSize;
        
        // Desenha tiles para cobrir toda a área do lago
        ctx.globalAlpha = 0.85; // Leve transparência para integrar melhor
        for (let x = startX; x < endX; x += tileSize) {
            for (let y = startY; y < endY; y += tileSize) {
                ctx.drawImage(waterImg, x, y, tileSize, tileSize);
            }
        }
        ctx.globalAlpha = 1.0;
        
        // Overlay escuro para diminuir o brilho
        ctx.fillStyle = 'rgba(0, 50, 80, 0.25)';
        this.segments.forEach(seg => {
            ctx.fillRect(seg.x, seg.y, seg.width, seg.height);
        });
        
        ctx.restore();
    }
}
