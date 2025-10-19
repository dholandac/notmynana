// Camera.js - Sistema de câmera que segue o jogador

class Camera {
    constructor(worldWidth, worldHeight, canvasWidth, canvasHeight) {
        this.x = 0;
        this.y = 0;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.smoothing = 0.1;
    }
    
    follow(target) {
        // Calcula a posição desejada da câmera (centralizada no alvo)
        const desiredX = target.x + target.width / 2 - this.canvasWidth / 2;
        const desiredY = target.y + target.height / 2 - this.canvasHeight / 2;
        
        // Suaviza o movimento da câmera
        this.x += (desiredX - this.x) * this.smoothing;
        this.y += (desiredY - this.y) * this.smoothing;
        
        // Limita a câmera aos limites do mundo
        this.x = clamp(this.x, 0, this.worldWidth - this.canvasWidth);
        this.y = clamp(this.y, 0, this.worldHeight - this.canvasHeight);
    }
    
    apply(ctx) {
        ctx.translate(-this.x, -this.y);
    }
    
    reset(ctx) {
        ctx.translate(this.x, this.y);
    }
    
    worldToScreen(worldPos) {
        return new Vector2D(worldPos.x - this.x, worldPos.y - this.y);
    }
    
    screenToWorld(screenPos) {
        return new Vector2D(screenPos.x + this.x, screenPos.y + this.y);
    }
    
    isVisible(x, y, width, height) {
        return x + width > this.x &&
               x < this.x + this.canvasWidth &&
               y + height > this.y &&
               y < this.y + this.canvasHeight;
    }
}
