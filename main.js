// main.js - Ponto de entrada do jogo

// Aguarda o carregamento do DOM
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    
    // Controle de reiniciar
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'r' && game.gameOver) {
            game.restart();
        }
        if (e.key.toLowerCase() === 'm' && game.gameOver) {
            game.backToMenu();
        }
    });
    
    // Inicia o jogo
    game.start();
    
    console.log('Jogo iniciado!');
    console.log('Controles:');
    console.log('- WASD ou Setas: Mover');
    console.log('- Espaço: Atirar');
    console.log('- R: Reiniciar (quando Game Over)');
    console.log('- M: Voltar ao Menu (quando Game Over)');
});
