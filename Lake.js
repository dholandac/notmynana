// Lake.js - Classe dos lagos (obstáculos)

class Lake {
    constructor(segments) {
        // segments é um array de retângulos conectados que formam o lago
        this.segments = segments;
        this.type = 'lake';
        
        // Calcula bounding box para colisões rápidas
        this.calculateBounds();
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
        
        // Efeito de brilho na água (sem sombra)
        ctx.globalAlpha = 0.3;
        const highlightGradient = ctx.createRadialGradient(
            centerX - this.bounds.width * 0.2,
            centerY - this.bounds.height * 0.2,
            0,
            centerX,
            centerY,
            Math.max(this.bounds.width, this.bounds.height) / 3
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        this.segments.forEach(seg => {
            ctx.rect(seg.x, seg.y, seg.width, seg.height);
        });
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Efeito de ondulação animada (alguns círculos)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        
        const time = Date.now() / 2000;
        const rippleCount = Math.max(2, Math.floor(this.segments.length / 2));
        
        for (let i = 0; i < rippleCount; i++) {
            const segment = this.segments[i % this.segments.length];
            const offsetX = (Math.sin(time + i) * 15) + segment.width * 0.5;
            const offsetY = (Math.cos(time + i * 1.3) * 15) + segment.height * 0.5;
            const radius = 8 + Math.sin(time * 2 + i * 2) * 4;
            
            ctx.beginPath();
            ctx.arc(segment.x + offsetX, segment.y + offsetY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}
