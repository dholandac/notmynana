// Rock.js - Classe das pedras (decorativas, atravessáveis)

class Rock {
    constructor(x, y, size = 'small') {
        this.x = x;
        this.y = y;
        this.size = size;
        
        // Escolhe uma das 3 variações de pedra
        const rockTypes = ['rock1', 'rock2', 'rock3'];
        this.rockType = rockTypes[Math.floor(Math.random() * rockTypes.length)];
        
        // Define tamanho baseado no tipo (reduzido em 20%)
        if (size === 'small') {
            this.baseSize = randomRange(20, 30) * 0.8;
        } else if (size === 'medium') {
            this.baseSize = randomRange(30, 45) * 0.8;
        } else {
            this.baseSize = randomRange(45, 60) * 0.8;
        }
        
        this.type = 'rock';
        
        // Variações visuais
        this.flipX = Math.random() > 0.5;
    }
    
    draw(ctx) {
        const img = assetLoader.getImage(this.rockType);
        if (!img) return;
        
        ctx.save();
        
        const centerX = this.x + this.baseSize / 2;
        const centerY = this.y + this.baseSize / 2;
        
        // Translada para o centro da pedra
        ctx.translate(centerX, centerY);
        
        if (this.flipX) {
            ctx.scale(-1, 1);
        }
        
        // Calcula dimensões mantendo proporção da imagem
        const aspectRatio = img.width / img.height;
        let width = this.baseSize;
        let height = this.baseSize / aspectRatio;
        
        // Desenha a imagem centralizada
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        
        ctx.restore();
    }
}
