// Crate.js - Classe das caixas de powerup

class Crate {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.CRATE_WIDTH;
        this.height = CONFIG.CRATE_HEIGHT;
        this.active = true;
        
        // Escolhe powerup aleatório
        const powerupTypes = Object.values(CONFIG.POWERUPS);
        this.powerupType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
        // Define cor baseado no powerup
        this.color = this.getPowerupColor();
    }
    
    getPowerupColor() {
        switch(this.powerupType) {
            case CONFIG.POWERUPS.FIRE_RATE:
                return '#ff6b6b'; // Vermelho
            case CONFIG.POWERUPS.BULLET_SPEED:
                return '#4ecdc4'; // Ciano
            case CONFIG.POWERUPS.BULLET_SIZE:
                return '#ffe66d'; // Amarelo
            case CONFIG.POWERUPS.MOVEMENT_SPEED:
                return '#95e1d3'; // Verde água
            case CONFIG.POWERUPS.PIERCING:
                return '#c44569'; // Rosa escuro
            default:
                return '#8b4513';
        }
    }
    
    getPowerupName() {
        switch(this.powerupType) {
            case CONFIG.POWERUPS.FIRE_RATE:
                return 'Fire Rate+';
            case CONFIG.POWERUPS.BULLET_SPEED:
                return 'Speed+';
            case CONFIG.POWERUPS.BULLET_SIZE:
                return 'Size+';
            case CONFIG.POWERUPS.MOVEMENT_SPEED:
                return 'Move+';
            case CONFIG.POWERUPS.PIERCING:
                return 'Pierce';
            default:
                return 'Power';
        }
    }
    
    collect() {
        this.active = false;
        return this.powerupType;
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        // Animação de pulso
        const time = Date.now() / 500;
        const pulse = Math.sin(time) * 0.1 + 1;
        const size = Math.min(this.width, this.height) * pulse;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Brilho externo
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Desenha a caixa
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Borda mais escura
        ctx.strokeStyle = '#2c2c2c';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Detalhes da caixa (linhas)
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width, this.y + this.height / 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height);
        ctx.stroke();
        
        // Símbolo de powerup
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Desenha símbolo baseado no tipo
        let symbol = '★';
        switch(this.powerupType) {
            case CONFIG.POWERUPS.FIRE_RATE:
                symbol = '⚡';
                break;
            case CONFIG.POWERUPS.BULLET_SPEED:
                symbol = '➤';
                break;
            case CONFIG.POWERUPS.BULLET_SIZE:
                symbol = '●';
                break;
            case CONFIG.POWERUPS.MOVEMENT_SPEED:
                symbol = '↑';
                break;
            case CONFIG.POWERUPS.PIERCING:
                symbol = '◆';
                break;
        }
        
        ctx.fillText(symbol, centerX, centerY);
    }
}
