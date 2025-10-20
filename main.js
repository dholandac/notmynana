window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    
    // Função para redimensionar o canvas
    function resizeCanvas() {
        const width = CONFIG.CANVAS_WIDTH;
        const height = CONFIG.CANVAS_HEIGHT;
        
        canvas.width = width;
        canvas.height = height;
        
        // Atualiza a câmera com as novas dimensões
        if (game.camera) {
            game.camera.viewportWidth = width;
            game.camera.viewportHeight = height;
        }
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
    console.log('Controles:');
    console.log('- WASD ou Setas: Mover');
    console.log('- Espaço: Atirar');
    console.log('- R: Reiniciar (quando Game Over)');
    console.log('- M: Voltar ao Menu (quando Game Over)');
});
