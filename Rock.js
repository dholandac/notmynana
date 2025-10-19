// Rock.js - Classe das pedras (decorativas, atravessáveis)

class Rock {
    constructor(x, y, size = 'small') {
        this.x = x;
        this.y = y;
        this.size = size;
        
        // Define tamanho baseado no tipo
        if (size === 'small') {
            this.width = randomRange(8, 15);
            this.height = randomRange(8, 15);
        } else if (size === 'medium') {
            this.width = randomRange(15, 25);
            this.height = randomRange(15, 25);
        } else {
            this.width = randomRange(25, 35);
            this.height = randomRange(25, 35);
        }
        
        this.type = 'rock';
        
        // Variações visuais
        this.rotation = Math.random() * Math.PI * 2;
        this.color1 = this.randomGray();
        this.color2 = this.randomDarkGray();
    }
    
    randomGray() {
        const grays = ['#8c8c8c', '#9a9a9a', '#7a7a7a', '#888888'];
        return grays[Math.floor(Math.random() * grays.length)];
    }
    
    randomDarkGray() {
        const darkGrays = ['#5a5a5a', '#6a6a6a', '#4a4a4a', '#555555'];
        return darkGrays[Math.floor(Math.random() * darkGrays.length)];
    }
    
    draw(ctx) {
        ctx.save();
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Translada para o centro da pedra
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        
        // Sombra sutil
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(2, 2, this.width / 2, this.height / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Corpo da pedra (forma irregular usando elipse)
        ctx.fillStyle = this.color1;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Borda mais escura
        ctx.strokeStyle = this.color2;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Highlight (brilho)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-this.width * 0.15, -this.height * 0.15, this.width * 0.2, this.height * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
