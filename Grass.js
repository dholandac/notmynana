// Grass.js - Classe da grama (decorativa, atravessável)

class Grass {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.type = 'grass';
        
        // Variações visuais
        this.bladeCount = randomInt(3, 6);
        this.baseWidth = randomRange(8, 15);
        this.height = randomRange(10, 20);
        this.color = this.randomGreen();
        this.rotation = Math.random() * Math.PI * 2;
        this.swayOffset = Math.random() * Math.PI * 2;
    }
    
    randomGreen() {
        const greens = ['#4a7c2a', '#5a8c3a', '#3a6b1f', '#6a9c4a'];
        return greens[Math.floor(Math.random() * greens.length)];
    }
    
    draw(ctx) {
        ctx.save();
        
        const time = Date.now() / 3000;
        const sway = Math.sin(time + this.swayOffset) * 1.5;
        
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Desenha folhas de grama
        for (let i = 0; i < this.bladeCount; i++) {
            const angle = (i / this.bladeCount) * 0.5 - 0.25;
            const bladeX = Math.sin(angle) * this.baseWidth * 0.3;
            
            ctx.save();
            ctx.translate(bladeX, 0);
            ctx.rotate(angle + sway * 0.05);
            
            // Gradiente da grama (mais escuro na base)
            const gradient = ctx.createLinearGradient(0, 0, 0, -this.height);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, this.lightenColor(this.color));
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(-1, 0);
            ctx.quadraticCurveTo(-0.5, -this.height * 0.5, 0 + sway, -this.height);
            ctx.quadraticCurveTo(0.5, -this.height * 0.5, 1, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    lightenColor(color) {
        // Clareia a cor em 20%
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + 40);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + 40);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + 40);
        return `rgb(${r}, ${g}, ${b})`;
    }
}
