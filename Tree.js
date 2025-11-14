// Tree.js - Classe das árvores (obstáculos decorativos)

class Tree {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        // 20% das árvores serão chopped_tree.png
        this.isChopped = Math.random() < 0.2;
        this.treeType = this.isChopped ? 'chopped_tree' : 'tree';
        
        // Define tamanho baseado na sprite
        this.baseSize = 60; // Tamanho base para manter proporções
        this.width = this.baseSize;
        this.height = this.baseSize * 1.5; // Árvores são mais altas
        
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
        
        // Variações visuais
        this.flipX = Math.random() > 0.5;
        this.swayOffset = Math.random() * Math.PI * 2; // Para animação de balanço
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
        
        // Colisão com a área central da árvore (ajustada para cima)
        const collisionWidth = this.width * 0.4;
        const collisionHeight = this.height * 0.3;
        const collisionX = this.x + (this.width - collisionWidth) / 2;
        const collisionY = this.y + this.height - collisionHeight - this.height * 0.15; // Movida 15% para cima
        
        return checkCollision(
            { x: collisionX, y: collisionY, width: collisionWidth, height: collisionHeight },
            entity
        );
    }
    
    draw(ctx) {
        const img = assetLoader.getImage(this.treeType);
        if (!img) return;
        
        ctx.save();
        
        const time = Date.now() / 1000;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height;
        
        // Se está quebrando, aplica transformação de rotação
        if (this.breaking) {
            const progress = this.breakTimer / this.breakDuration;
            
            // Translada para o ponto de pivô (base da árvore)
            ctx.translate(centerX, centerY);
            ctx.rotate(this.fallRotation);
            ctx.translate(-centerX, -centerY);
            
            // Fade out
            ctx.globalAlpha = 1 - progress * 0.5;
        }
        
        const sway = this.breaking ? 0 : Math.sin(time + this.swayOffset) * 1.5;
        
        // Sombra da árvore
        if (!this.breaking) {
            // Ajusta posição da sombra baseado no tipo de árvore
            const shadowOffsetY = this.isChopped ? -this.height * 0.15 : -this.height * 0.07;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(centerX - 0.5, centerY + shadowOffsetY, this.width / 2, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Desenha a árvore
        ctx.translate(centerX, centerY);
        
        // Adiciona leve rotação para simular vento (apenas se não está quebrando)
        if (!this.breaking) {
            ctx.rotate(sway * 0.01); // Rotação sutil com base no sway
        }
        
        if (this.flipX) {
            ctx.scale(-1, 1);
        }
        
        // Calcula dimensões mantendo proporção da imagem
        const aspectRatio = img.width / img.height;
        let width = this.width;
        let height = this.width / aspectRatio;
        
        // Desenha a imagem centralizada na base
        ctx.drawImage(img, -width / 2, -height, width, height);
        
        ctx.restore();
    }
}
