class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.initAudio();
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    playTone(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playSwingSound() {
        this.playTone(200, 0.1, 'sawtooth', 0.05);
    }

    playCatchSound(treasureType) {
        switch(treasureType) {
            case 'gold':
                this.playTone(800, 0.3, 'sine', 0.15);
                setTimeout(() => this.playTone(1000, 0.2, 'sine', 0.1), 100);
                break;
            case 'silver':
                this.playTone(600, 0.25, 'sine', 0.12);
                break;
            case 'diamond':
                this.playTone(1200, 0.2, 'sine', 0.2);
                setTimeout(() => this.playTone(1500, 0.15, 'sine', 0.15), 80);
                setTimeout(() => this.playTone(1800, 0.1, 'sine', 0.1), 160);
                break;
            case 'rock':
                this.playTone(150, 0.4, 'sawtooth', 0.08);
                break;
        }
    }

    playExtendSound() {
        this.playTone(300, 0.8, 'triangle', 0.08);
    }

    playRetractSound() {
        this.playTone(400, 0.6, 'triangle', 0.06);
    }

    playWinSound() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((note, index) => {
            setTimeout(() => this.playTone(note, 0.5, 'sine', 0.15), index * 200);
        });
    }

    playLoseSound() {
        this.playTone(200, 0.8, 'sawtooth', 0.15);
        setTimeout(() => this.playTone(150, 0.8, 'sawtooth', 0.12), 300);
        setTimeout(() => this.playTone(100, 1.0, 'sawtooth', 0.1), 600);
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.animate();
    }

    setupCanvas() {
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '50';
        document.body.appendChild(this.canvas);
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createExplosion(x, y, color = '#FFD700', count = 20) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                decay: 0.02,
                size: Math.random() * 8 + 2,
                color: color
            });
        }
    }

    createSparkle(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 1.0,
                decay: 0.05,
                size: Math.random() * 4 + 1,
                color: '#FFFFFF'
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2;
            particle.life -= particle.decay;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (const particle of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    animate() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

window.AudioManager = AudioManager;
window.ParticleSystem = ParticleSystem;