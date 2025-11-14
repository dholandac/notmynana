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
        
        if (isMobile) {
            // MOBILE: Usa dimensões maiores que a tela para dar mais visão ao jogador
            let screenWidth = window.innerWidth || document.documentElement.clientWidth;
            let screenHeight = window.innerHeight || document.documentElement.clientHeight;
            
            // Em mobile, usa dimensões exatas da tela
            screenWidth = window.screen.availWidth || screenWidth;
            screenHeight = window.screen.availHeight || screenHeight;
            
            // Remove qualquer barra de endereço considerada
            if (window.visualViewport) {
                screenWidth = window.visualViewport.width;
                screenHeight = window.visualViewport.height;
            }
            
            // Fator de zoom para dar mais visão ao jogador (1.5 = 150% de área visível)
            const zoomFactor = 1.5;
            
            // Em dispositivos mobile landscape, usa dimensões aumentadas para zoom out
            if (screenWidth > screenHeight) {
                return { 
                    width: Math.floor(screenWidth * zoomFactor), 
                    height: Math.floor(screenHeight * zoomFactor) 
                };
            } else {
                // Portrait - força landscape trocando dimensões com zoom out
                return { 
                    width: Math.floor(screenHeight * zoomFactor), 
                    height: Math.floor(screenWidth * zoomFactor) 
                };
            }
        } else {
            // DESKTOP: Usa área disponível com margens confortáveis
            let screenWidth = window.innerWidth || document.documentElement.clientWidth;
            let screenHeight = window.innerHeight || document.documentElement.clientHeight;
            
            // Margem para desktop - 40px de cada lado (80px total horizontal)
            const horizontalMargin = 80;
            // Margem vertical - 80px top/bottom (160px total vertical) para dar espaço para a logo
            const verticalMargin = 160;
            
            // Define proporção do jogo (16:9 é ideal para landscape)
            const gameAspectRatio = 16 / 9;
            
            let canvasWidth, canvasHeight;
            
            // Área disponível com margens
            const availableWidth = screenWidth - horizontalMargin;
            const availableHeight = screenHeight - verticalMargin;
            
            // Calcula dimensões para preencher a área disponível mantendo proporção
            const screenAspectRatio = availableWidth / availableHeight;
            
            if (screenAspectRatio > gameAspectRatio) {
                // Tela é mais larga que o jogo - usa altura disponível
                canvasHeight = availableHeight;
                canvasWidth = Math.floor(canvasHeight * gameAspectRatio);
            } else {
                // Tela é mais alta que o jogo - usa largura disponível
                canvasWidth = availableWidth;
                canvasHeight = Math.floor(canvasWidth / gameAspectRatio);
            }
            
            // Garante dimensões mínimas para desktop
            canvasWidth = Math.max(canvasWidth, 1000);
            canvasHeight = Math.max(canvasHeight, 562);
            
            // Garante dimensões máximas otimizadas para desktop
            canvasWidth = Math.min(canvasWidth, 1600);
            canvasHeight = Math.min(canvasHeight, 900);
            
            return { width: Math.floor(canvasWidth), height: Math.floor(canvasHeight) };
        }
    }
    
    // Atualiza CONFIG com dimensões da tela
    const screenDimensions = getScreenDimensions();
    CONFIG.CANVAS_WIDTH = screenDimensions.width;
    CONFIG.CANVAS_HEIGHT = screenDimensions.height;
    
    // Define as dimensões do canvas antes de criar o jogo
    canvas.width = CONFIG.CANVAS_WIDTH;
    canvas.height = CONFIG.CANVAS_HEIGHT;
    
    console.log(`Canvas dimensões: ${CONFIG.CANVAS_WIDTH}x${CONFIG.CANVAS_HEIGHT}`);
    
    const game = new Game(canvas);
    
    // Função para redimensionar o canvas
    function resizeCanvas() {
        const dimensions = getScreenDimensions();
        const width = dimensions.width;
        const height = dimensions.height;
        
        // Detecta se é mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Atualiza CONFIG
        CONFIG.CANVAS_WIDTH = width;
        CONFIG.CANVAS_HEIGHT = height;
        
        canvas.width = width;
        canvas.height = height;
        
        let scale = 1;
        
        // Se for mobile, aplica escala CSS para caber na tela
        if (isMobile) {
            const screenWidth = window.innerWidth || document.documentElement.clientWidth;
            const screenHeight = window.innerHeight || document.documentElement.clientHeight;
            
            // Calcula escala necessária para caber na tela
            const scaleX = screenWidth / width;
            const scaleY = screenHeight / height;
            scale = Math.min(scaleX, scaleY);
            
            // Aplica transformação CSS sem centralização - canvas fica no topo esquerdo
            canvas.style.transform = `scale(${scale})`;
            canvas.style.transformOrigin = 'top left';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
        } else {
            // Remove transformação no desktop
            canvas.style.transform = '';
            canvas.style.position = '';
            canvas.style.top = '';
            canvas.style.left = '';
        }
        
        // Atualiza a câmera com as novas dimensões
        if (game.camera) {
            game.camera.canvasWidth = width;
            game.camera.canvasHeight = height;
            // Força recálculo da posição da câmera para centralizar corretamente
            game.camera.initialized = false;
        }
        
        console.log(`Canvas redimensionado: ${width}x${height}${isMobile ? ` (escala: ${scale.toFixed(2)})` : ''}`);
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
                
                // Força scroll para esconder barra de endereço (funciona em alguns navegadores)
                window.scrollTo(0, 1);
                setTimeout(() => {
                    window.scrollTo(0, 0);
                }, 50);
                
                // Aguarda um pouco mais antes de redimensionar
                setTimeout(() => {
                    resizeCanvas();
                    // Tenta esconder barra novamente
                    window.scrollTo(0, 1);
                    setTimeout(() => window.scrollTo(0, 0), 50);
                }, 200);
                
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
        
        // Adiciona listener para scroll que força retorno ao topo (esconde barra de URL)
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                window.scrollTo(0, 1);
                setTimeout(() => window.scrollTo(0, 0), 50);
            }, 100);
        }, { passive: true });
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
