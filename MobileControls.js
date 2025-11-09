// MobileControls.js - Sistema de controles para dispositivos móveis

class MobileControls {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isActive = false;
        
        // Estado dos controles
        this.joystickActive = false;
        this.joystickTouchId = null; // Rastreia qual toque controla o joystick
        this.joystickStartX = 0;
        this.joystickStartY = 0;
        this.joystickDeltaX = 0;
        this.joystickDeltaY = 0;
        
        // Simula teclas pressionadas
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false,
            dash: false,
            interact: false
        };
        
        // Elementos DOM
        this.mobileControls = document.getElementById('mobileControls');
        this.joystick = document.getElementById('joystick');
        this.joystickStick = document.getElementById('joystickStick');
        this.shootButton = document.getElementById('shootButton');
        this.dashButton = document.getElementById('dashButton');
        this.interactButton = document.getElementById('interactButton');
        
        if (this.isMobile) {
            this.init();
        }
    }
    
    detectMobile() {
        // Detecta se é dispositivo móvel
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isSmallScreen = window.innerWidth <= 768;
        
        return (isTouchDevice || isMobileUserAgent) && isSmallScreen;
    }
    
    init() {
        console.log('Mobile controls initialized');
        
        // Ativa controles mobile
        this.mobileControls.classList.add('active');
        this.isActive = true;
        
        // Setup joystick
        this.setupJoystick();
        
        // Setup botões
        this.setupButtons();
    }
    
    setupJoystick() {
        // Touch start
        this.joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            // Se o joystick já está ativo, ignora novos toques
            if (this.joystickActive) return;
            
            const touch = e.changedTouches[0];
            this.joystickTouchId = touch.identifier;
            
            const rect = this.joystick.getBoundingClientRect();
            
            this.joystickActive = true;
            this.joystickStartX = rect.left + rect.width / 2;
            this.joystickStartY = rect.top + rect.height / 2;
            
            this.updateJoystick(touch.clientX, touch.clientY);
        }, { passive: false });
        
        // Touch move
        this.joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.joystickActive) return;
            
            // Procura o toque específico do joystick
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === this.joystickTouchId) {
                    this.updateJoystick(e.touches[i].clientX, e.touches[i].clientY);
                    break;
                }
            }
        }, { passive: false });
        
        // Touch end
        this.joystick.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            // Verifica se o toque que terminou é o do joystick
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystickTouchId) {
                    this.resetJoystick();
                    break;
                }
            }
        }, { passive: false });
        
        this.joystick.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            
            // Verifica se o toque cancelado é o do joystick
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystickTouchId) {
                    this.resetJoystick();
                    break;
                }
            }
        }, { passive: false });
    }
    
    updateJoystick(touchX, touchY) {
        // Calcula delta do centro
        const deltaX = touchX - this.joystickStartX;
        const deltaY = touchY - this.joystickStartY;
        
        // Limita o movimento ao raio do joystick
        const maxDistance = 35; // Metade da distância do joystick base
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > maxDistance) {
            const angle = Math.atan2(deltaY, deltaX);
            this.joystickDeltaX = Math.cos(angle) * maxDistance;
            this.joystickDeltaY = Math.sin(angle) * maxDistance;
        } else {
            this.joystickDeltaX = deltaX;
            this.joystickDeltaY = deltaY;
        }
        
        // Move o stick visualmente
        this.joystickStick.style.transform = `translate(calc(-50% + ${this.joystickDeltaX}px), calc(-50% + ${this.joystickDeltaY}px))`;
        
        // Atualiza estados das direções (com zona morta)
        const deadZone = 10;
        this.keys.left = this.joystickDeltaX < -deadZone;
        this.keys.right = this.joystickDeltaX > deadZone;
        this.keys.up = this.joystickDeltaY < -deadZone;
        this.keys.down = this.joystickDeltaY > deadZone;
    }
    
    resetJoystick() {
        this.joystickActive = false;
        this.joystickTouchId = null;
        this.joystickDeltaX = 0;
        this.joystickDeltaY = 0;
        
        // Reseta posição visual
        this.joystickStick.style.transform = 'translate(-50%, -50%)';
        
        // Reseta estados das teclas
        this.keys.left = false;
        this.keys.right = false;
        this.keys.up = false;
        this.keys.down = false;
    }
    
    setupButtons() {
        // Botão de atirar
        this.shootButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.shoot = true;
        }, { passive: false });
        
        this.shootButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.shoot = false;
        }, { passive: false });
        
        // Botão de dash
        this.dashButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.dash = true;
        }, { passive: false });
        
        this.dashButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.dash = false;
        }, { passive: false });
        
        // Botão de interagir
        this.interactButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.interact = true;
        }, { passive: false });
        
        this.interactButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.interact = false;
        }, { passive: false });
    }
    
    // Métodos para serem usados pelo jogo
    isKeyPressed(key) {
        if (!this.isActive) return false;
        
        switch(key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                return this.keys.up;
            case 's':
            case 'arrowdown':
                return this.keys.down;
            case 'a':
            case 'arrowleft':
                return this.keys.left;
            case 'd':
            case 'arrowright':
                return this.keys.right;
            case ' ':
                return this.keys.shoot;
            case 'shift':
                return this.keys.dash;
            case 'e':
            case 'enter':
                return this.keys.interact;
            default:
                return false;
        }
    }
    
    getMovementVector() {
        if (!this.isActive || !this.joystickActive) {
            return { x: 0, y: 0 };
        }
        
        // Normaliza o vetor de movimento
        const length = Math.sqrt(this.joystickDeltaX * this.joystickDeltaX + this.joystickDeltaY * this.joystickDeltaY);
        
        if (length === 0) {
            return { x: 0, y: 0 };
        }
        
        return {
            x: this.joystickDeltaX / 35, // Normalizado de -1 a 1
            y: this.joystickDeltaY / 35
        };
    }
}
