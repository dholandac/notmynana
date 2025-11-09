window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    
    // Força orientação landscape em dispositivos móveis
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(err => {
            console.log('Não foi possível forçar orientação landscape:', err);
        });
    }
    
    // Função para obter dimensões ideais da tela
    function getScreenDimensions() {
        // Detecta se é mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Obtém dimensões da tela disponível
        let screenWidth = window.innerWidth || document.documentElement.clientWidth;
        let screenHeight = window.innerHeight || document.documentElement.clientHeight;
        
        // Em mobile, usa dimensões exatas da tela
        if (isMobile) {
            screenWidth = window.screen.availWidth || screenWidth;
            screenHeight = window.screen.availHeight || screenHeight;
            
            // Remove qualquer barra de endereço considerada
            if (window.visualViewport) {
                screenWidth = window.visualViewport.width;
                screenHeight = window.visualViewport.height;
            }
        }
        
        // Define proporção do jogo (16:9 é ideal para landscape)
        const gameAspectRatio = 16 / 9;
        
        let canvasWidth, canvasHeight;
        
        // Em dispositivos mobile landscape, usa tela completa
        if (isMobile && screenWidth > screenHeight) {
            canvasWidth = screenWidth;
            canvasHeight = screenHeight;
        } else {
            // Calcula dimensões para preencher a tela mantendo proporção
            const screenAspectRatio = screenWidth / screenHeight;
            
            if (screenAspectRatio > gameAspectRatio) {
                // Tela é mais larga que o jogo - usa altura total
                canvasHeight = screenHeight;
                canvasWidth = Math.floor(canvasHeight * gameAspectRatio);
            } else {
                // Tela é mais alta que o jogo - usa largura total
                canvasWidth = screenWidth;
                canvasHeight = Math.floor(canvasWidth / gameAspectRatio);
            }
            
            // Garante dimensões mínimas apenas em desktop
            if (!isMobile) {
                canvasWidth = Math.max(canvasWidth, 800);
                canvasHeight = Math.max(canvasHeight, 450);
            }
            
            // Garante dimensões máximas
            canvasWidth = Math.min(canvasWidth, 1920);
            canvasHeight = Math.min(canvasHeight, 1080);
        }
        
        return { width: Math.floor(canvasWidth), height: Math.floor(canvasHeight) };
    }
    
    // Atualiza CONFIG com dimensões da tela
    const screenDimensions = getScreenDimensions();
    CONFIG.CANVAS_WIDTH = screenDimensions.width;
    CONFIG.CANVAS_HEIGHT = screenDimensions.height;
    
    console.log(`Canvas dimensões: ${CONFIG.CANVAS_WIDTH}x${CONFIG.CANVAS_HEIGHT}`);
    
    const game = new Game(canvas);
    
    // Função para redimensionar o canvas
    function resizeCanvas() {
        const dimensions = getScreenDimensions();
        const width = dimensions.width;
        const height = dimensions.height;
        
        // Atualiza CONFIG
        CONFIG.CANVAS_WIDTH = width;
        CONFIG.CANVAS_HEIGHT = height;
        
        canvas.width = width;
        canvas.height = height;
        
        // Atualiza a câmera com as novas dimensões
        if (game.camera) {
            game.camera.viewportWidth = width;
            game.camera.viewportHeight = height;
        }
        
        console.log(`Canvas redimensionado: ${width}x${height}`);
    }
    
    // Redimensiona inicialmente
    resizeCanvas();
    
    // Redimensiona quando a janela mudar de tamanho
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeCanvas();
        }, 100);
    });
    
    // Listener para mudanças de orientação
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            resizeCanvas();
        }, 300);
    });
    
    // Listener para visualViewport (mobile - barra de endereço)
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resizeCanvas();
            }, 100);
        });
    }
    
    // Detecta dispositivo móvel e tenta entrar em fullscreen ao tocar na tela
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        // Previne scroll/bounce em iOS
        document.body.addEventListener('touchmove', (e) => {
            if (e.target === document.body) {
                e.preventDefault();
            }
        }, { passive: false });
        
        let firstInteraction = false;
        
        const enableFullscreen = () => {
            if (!firstInteraction) {
                firstInteraction = true;
                
                // Força scroll para esconder barra de endereço
                window.scrollTo(0, 1);
                setTimeout(() => {
                    window.scrollTo(0, 0);
                    resizeCanvas();
                }, 100);
                
                // Tenta entrar em fullscreen
                const elem = document.documentElement;
                if (elem.requestFullscreen) {
                    elem.requestFullscreen().catch(err => {
                        console.log('Fullscreen não disponível:', err);
                    });
                } else if (elem.webkitRequestFullscreen) {
                    elem.webkitRequestFullscreen();
                } else if (elem.msRequestFullscreen) {
                    elem.msRequestFullscreen();
                }
                
                // Remove listener após primeira interação
                document.removeEventListener('touchstart', enableFullscreen);
                document.removeEventListener('click', enableFullscreen);
            }
        };
        
        document.addEventListener('touchstart', enableFullscreen);
        document.addEventListener('click', enableFullscreen);
    }
    
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'r' && game.gameOver) {
            game.restart();
        }
        if (e.key.toLowerCase() === 'm' && game.gameOver) {
            game.backToMenu();
        }
    });
    
    game.start();
    
    console.log('Jogo iniciado!');
    console.log(`Resolução: ${CONFIG.CANVAS_WIDTH}x${CONFIG.CANVAS_HEIGHT}`);
    console.log('Controles:');
    console.log('- WASD ou Setas: Mover');
    console.log('- Espaço: Atirar');
    console.log('- R: Reiniciar (quando Game Over)');
    console.log('- M: Voltar ao Menu (quando Game Over)');
});
