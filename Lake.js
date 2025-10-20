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
        ctx.save();
        
        const centerX = this.bounds.x + this.bounds.width / 2;
        const centerY = this.bounds.y + this.bounds.height / 2;
        
        // Define a região de clipping (os efeitos só aparecem dentro do lago)
        ctx.beginPath();
        this.segments.forEach(seg => {
            ctx.rect(seg.x, seg.y, seg.width, seg.height);
        });
        ctx.clip(); // Aplica o clipping
        
        // Desenha os segmentos preenchidos
        ctx.beginPath();
        this.segments.forEach(seg => {
            ctx.rect(seg.x, seg.y, seg.width, seg.height);
        });
        
        // Preenche com gradiente de água
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY,
            Math.max(this.bounds.width, this.bounds.height) / 2
        );
        gradient.addColorStop(0, '#6ba3d4');
        gradient.addColorStop(0.6, CONFIG.COLORS.LAKE);
        gradient.addColorStop(1, '#3a5a7a');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Efeito de brilho na água
        ctx.globalAlpha = 0.4;
        const highlightGradient = ctx.createRadialGradient(
            centerX - this.bounds.width * 0.2,
            centerY - this.bounds.height * 0.2,
            0,
            centerX,
            centerY,
            Math.max(this.bounds.width, this.bounds.height) / 3
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        this.segments.forEach(seg => {
            ctx.rect(seg.x, seg.y, seg.width, seg.height);
        });
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Ondulações animadas - círculos concêntricos expandindo (mais raros)
        const time = Date.now() / 1000;
        
        // Muda a posição dos droplets periodicamente (a cada 10 segundos)
        if (time - this.lastDropletChange > 10) {
            this.lastDropletChange = time;
            this.initializeDroplets();
        }
        
        for (let i = 0; i < this.dropletPositions.length; i++) {
            const droplet = this.dropletPositions[i];
            const segment = this.segments[droplet.segmentIndex];
            
            // Verifica se o segmento existe
            if (!segment) continue;
            
            // Posição baseada nos offsets aleatórios (dentro dos limites do segmento)
            const baseX = segment.x + segment.width * droplet.offsetX;
            const baseY = segment.y + segment.height * droplet.offsetY;
            
            // Pequeno movimento adicional para vida (reduzido para não sair dos limites)
            const offsetX = Math.sin(time * 0.2 + droplet.phase) * 5;
            const offsetY = Math.cos(time * 0.2 + droplet.phase + 1) * 5;
            
            // Cria 3 círculos concêntricos para cada ondinha
            for (let ring = 0; ring < 3; ring++) {
                const phase = (time * 0.8 + droplet.phase + ring * 0.5) % 3; // Ciclo mais longo (3 ao invés de 2)
                const radius = 5 + phase * 15;
                const alpha = Math.max(0, 0.5 - phase * 0.15);
                
                ctx.strokeStyle = `rgba(200, 220, 255, ${alpha})`;
                ctx.lineWidth = 2 - phase * 0.5;
                
                ctx.beginPath();
                ctx.arc(baseX + offsetX, baseY + offsetY, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        // Linhas onduladas na superfície da água
        ctx.strokeStyle = 'rgba(180, 210, 240, 0.3)';
        ctx.lineWidth = 1.5;
        
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            const waveTime = time + i * 0.5;
            const startX = this.bounds.x;
            const endX = this.bounds.x + this.bounds.width;
            const baseY = this.bounds.y + (this.bounds.height / 5) * (i + 1);
            
            for (let x = startX; x <= endX; x += 10) {
                const offset = Math.sin((x - startX) * 0.05 + waveTime * 2) * 5;
                if (x === startX) {
                    ctx.moveTo(x, baseY + offset);
                } else {
                    ctx.lineTo(x, baseY + offset);
                }
            }
            ctx.stroke();
        }
        
        ctx.restore();
    }
}
