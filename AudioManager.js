// AudioManager.js - Sistema de gerenciamento de áudio

class AudioManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 1.0;
        this.musicVolume = 0.3; // Volume da música de fundo (30% do volume normal)
        
        // Carrega todos os sons
        this.loadSound('coin', 'assets/sounds/coin.wav');
        this.loadSound('confirm', 'assets/sounds/confirm.wav');
        this.loadSound('explosion', 'assets/sounds/explosion.wav');
        this.loadSound('forgotten_biomes', 'assets/sounds/forgotten_biomes.wav');
        this.loadSound('game_over', 'assets/sounds/game_over.wav');
        this.loadSound('hurt', 'assets/sounds/hurt.wav');
        this.loadSound('jump', 'assets/sounds/jump.wav');
        this.loadSound('menu', 'assets/sounds/menu.mp3');
        this.loadSound('power_up', 'assets/sounds/power_up.wav');
        this.loadSound('retro_forest', 'assets/sounds/retro_forest.mp3');
        this.loadSound('select', 'assets/sounds/select.wav');
        this.loadSound('step', 'assets/sounds/step.wav');
        this.loadSound('tap', 'assets/sounds/tap.wav');
        this.loadSound('wolf_boss_battle', 'assets/sounds/wolf_boss_battle.wav');
        this.loadSound('wolf_boss_spawn', 'assets/sounds/wolf_boss_spawn.wav');
        this.loadSound('wolf_dead', 'assets/sounds/wolf_dead.wav');
        
        // Referência para músicas em loop (não clonadas)
        this.currentMusic = null;
        this.pausedMusic = null; // Música que foi pausada temporariamente
    }
    
    loadSound(name, path) {
        const audio = new Audio(path);
        audio.volume = this.volume;
        audio.preload = 'auto';
        
        audio.addEventListener('error', () => {
            console.warn(`Erro ao carregar som: ${path}`);
        });
        
        this.sounds[name] = audio;
    }
    
    play(soundName, volumeMultiplier = 1.0) {
        if (!this.enabled) return;
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Som não encontrado: ${soundName}`);
            return;
        }
        
        // Clona o áudio para permitir múltiplas reproduções simultâneas
        const clone = sound.cloneNode();
        clone.volume = this.volume * volumeMultiplier; // Aplica multiplicador de volume
        clone.play().catch(err => {
            // Ignora erros silenciosamente (ex: autoplay bloqueado pelo navegador)
            console.debug(`Não foi possível tocar som ${soundName}:`, err.message);
        });
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    playMusic(soundName, loop = true) {
        if (!this.enabled) return;
        
        // Para música anterior se houver
        this.stopMusic();
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Música não encontrada: ${soundName}`);
            return;
        }
        
        // Usa o som original (não clona) para poder controlar
        this.currentMusic = sound;
        this.currentMusic.loop = loop;
        this.currentMusic.volume = this.musicVolume; // Usa volume específico para música
        this.currentMusic.currentTime = 0; // Reinicia do início
        
        this.currentMusic.play().catch(err => {
            console.debug(`Não foi possível tocar música ${soundName}:`, err.message);
        });
    }
    
    pauseMusic() {
        if (this.currentMusic && !this.currentMusic.paused) {
            this.currentMusic.pause();
            this.pausedMusic = this.currentMusic; // Guarda referência
        }
    }
    
    resumeMusic() {
        if (this.pausedMusic) {
            this.currentMusic = this.pausedMusic;
            this.pausedMusic = null;
            this.currentMusic.play().catch(err => {
                console.debug(`Não foi possível retomar música:`, err.message);
            });
        }
    }
    
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
        this.pausedMusic = null;
    }
}

// Instância global do gerenciador de áudio
const audioManager = new AudioManager();
