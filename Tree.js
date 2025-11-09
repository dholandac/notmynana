// Tree.js - Classe das árvores (obstáculos decorativos)

class Tree {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60; // Árvore tem altura maior que largura
        this.trunkWidth = 15;
        this.trunkHeight = 25;
        this.crownRadius = 25;
        this.type = 'tree';
        
        // Sistema de vida
        this.health = 5;
        this.maxHealth = 5;
        this.active = true;
        
        // Animação de destruição
        this.breaking = false;
        this.breakTimer = 0;
        this.breakDuration = 800; // 800ms para a animação
        this.fallRotation = 0;
        this.fallDirection = Math.random() > 0.5 ? 1 : -1; // Cai para direita ou esquerda
        
        // Variação visual
        this.crownColor1 = this.randomGreen();
        this.crownColor2 = this.randomDarkGreen();
        this.swayOffset = Math.random() * Math.PI * 2; // Para animação de balanço
    }
    
    randomGreen() {
        const greens = ['#2d5016', '#3a6b1f', '#4a7c2a', '#2f5a1a'];
        return greens[Math.floor(Math.random() * greens.length)];
    }
    
    randomDarkGreen() {
        const darkGreens = ['#1a3a0f', '#234516', '#2a4f1a', '#1f3d12'];
        return darkGreens[Math.floor(Math.random() * darkGreens.length)];
    }
    
    takeDamage() {
        if (this.breaking) return false;
        
        this.health--;
        if (this.health <= 0) {
            this.breaking = true;
            
            // Toca o som de explosão quando a árvore é derrubada (70% do volume)
            audioManager.play('explosion', 0.7);
            
            return true; // Árvore foi destruída
        }
        return false; // Árvore ainda está de pé
    }
    
    update(deltaTime) {
        if (this.breaking) {
            this.breakTimer += deltaTime;
            
            // Progresso da animação (0 a 1)
            const progress = Math.min(this.breakTimer / this.breakDuration, 1);
            
            // Rotação aumenta até 90 graus
            this.fallRotation = progress * Math.PI / 2 * this.fallDirection;
            
            // Quando a animação termina, marca como inativa
            if (progress >= 1) {
                this.active = false;
            }
        }
    }
    
    isColliding(entity) {
        // Não colide se está quebrando
        if (this.breaking) return false;
        
        // Colisão apenas com o tronco (mais realista)
        const trunkX = this.x + (this.width - this.trunkWidth) / 2;
        const trunkY = this.y + this.height - this.trunkHeight;
        
        return checkCollision(
            { x: trunkX, y: trunkY, width: this.trunkWidth, height: this.trunkHeight },
            entity
        );
    }
    
    draw(ctx) {
        ctx.save();
        
        const time = Date.now() / 1000;
        const centerX = this.x + this.width / 2;
        const trunkY = this.y + this.height - this.trunkHeight;
        const crownY = this.y + this.height - this.trunkHeight - this.crownRadius + 10;
        
        // Se está quebrando, aplica transformação de rotação
        if (this.breaking) {
            const progress = this.breakTimer / this.breakDuration;
            
            // Translada para o ponto de pivô (base do tronco)
            ctx.translate(centerX, this.y + this.height);
            ctx.rotate(this.fallRotation);
            ctx.translate(-centerX, -(this.y + this.height));
            
            // Fade out
            ctx.globalAlpha = 1 - progress * 0.5; // Transparência gradual
        }
        
        const sway = this.breaking ? 0 : Math.sin(time + this.swayOffset) * 2; // Sem balanço ao quebrar
        
        // Sombra da árvore
        if (!this.breaking) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(centerX + 3, this.y + this.height + 2, this.width / 2, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Tronco
        ctx.fillStyle = '#4a3728';
        const trunkX = centerX - this.trunkWidth / 2;
        ctx.fillRect(trunkX + sway * 0.3, trunkY, this.trunkWidth, this.trunkHeight);
        
        // Detalhes do tronco (textura)
        ctx.strokeStyle = '#3a2718';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const y = trunkY + (this.trunkHeight / 4) * (i + 1);
            ctx.beginPath();
            ctx.moveTo(trunkX + sway * 0.3, y);
            ctx.lineTo(trunkX + this.trunkWidth + sway * 0.3, y);
            ctx.stroke();
        }
        
        // Copa da árvore (3 círculos para dar volume)
        // Círculo traseiro (mais escuro)
        ctx.fillStyle = this.crownColor2;
        ctx.beginPath();
        ctx.arc(centerX - 8 + sway, crownY + 5, this.crownRadius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Círculo direito
        ctx.fillStyle = this.crownColor1;
        ctx.beginPath();
        ctx.arc(centerX + 10 + sway, crownY, this.crownRadius * 0.85, 0, Math.PI * 2);
        ctx.fill();
        
        // Círculo principal (centro)
        ctx.fillStyle = this.crownColor1;
        ctx.beginPath();
        ctx.arc(centerX + sway, crownY - 5, this.crownRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Borda escura da copa
        ctx.strokeStyle = this.crownColor2;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX + sway, crownY - 5, this.crownRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Highlights (brilho nas folhas)
        ctx.fillStyle = 'rgba(150, 200, 100, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX - 5 + sway, crownY - 10, this.crownRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
