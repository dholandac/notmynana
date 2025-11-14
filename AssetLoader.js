// AssetLoader.js - Gerenciador de carregamento de assets

class AssetLoader {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalCount = 0;
        this.onComplete = null;
    }
    
    loadImage(key, path) {
        this.totalCount++;
        
        const img = new Image();
        img.onload = () => {
            this.loadedCount++;
            this.images[key] = img;
            
            if (this.loadedCount === this.totalCount && this.onComplete) {
                this.onComplete();
            }
        };
        
        img.onerror = () => {
            console.error(`Erro ao carregar imagem: ${path}`);
            this.loadedCount++;
            
            if (this.loadedCount === this.totalCount && this.onComplete) {
                this.onComplete();
            }
        };
        
        img.src = path;
    }
    
    getImage(key) {
        return this.images[key];
    }
    
    isLoaded() {
        return this.loadedCount === this.totalCount && this.totalCount > 0;
    }
    
    getProgress() {
        if (this.totalCount === 0) return 0;
        return this.loadedCount / this.totalCount;
    }
}

// Instância global
const assetLoader = new AssetLoader();
