class GoldMiningGame {
    constructor() {
        this.score = 0;
        this.timeLeft = 60;
        this.target = 500;
        this.gameRunning = false;
        this.hookSwinging = true;
        this.hookExtending = false;
        this.treasures = [];
        this.caughtTreasure = null;
        this.swingAngle = 0;
        this.swingDirection = 1;
        this.maxSwingAngle = 60; // 最大摆动角度（度）

        this.audioManager = new AudioManager();
        this.particleSystem = new ParticleSystem();

        this.initElements();
        this.initEventListeners();
        this.generateTreasures();
        this.startSwinging();
    }

    initElements() {
        this.scoreElement = document.getElementById('scoreValue');
        this.timerElement = document.getElementById('timeValue');
        this.targetElement = document.getElementById('targetValue');
        this.hookElement = document.getElementById('hook');
        this.lineElement = document.getElementById('line');
        this.clawElement = document.getElementById('claw');
        this.undergroundElement = document.getElementById('underground');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.gameOverElement = document.getElementById('gameOver');
        this.gameResultElement = document.getElementById('gameResult');
        this.finalScoreElement = document.getElementById('finalScore');
        this.playAgainBtn = document.getElementById('playAgainBtn');
    }

    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.playAgainBtn.addEventListener('click', () => this.resetGame());

        document.addEventListener('click', (e) => {
            if (this.gameRunning && this.hookSwinging && !this.hookExtending) {
                this.extendHook();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameRunning && this.hookSwinging && !this.hookExtending) {
                e.preventDefault();
                this.extendHook();
            }
        });
    }

    generateTreasures() {
        this.treasures = [];
        const treasureTypes = [
            { type: 'gold', size: 30, value: 100, weight: 2 },
            { type: 'silver', size: 25, value: 50, weight: 1.5 },
            { type: 'diamond', size: 20, value: 200, weight: 1 },
            { type: 'rock', size: 35, value: 10, weight: 3 }
        ];

        for (let i = 0; i < 15; i++) {
            const treasureType = treasureTypes[Math.floor(Math.random() * treasureTypes.length)];
            const treasure = {
                ...treasureType,
                x: Math.random() * (window.innerWidth - treasureType.size),
                y: Math.random() * 200 + 50,
                id: i
            };
            this.treasures.push(treasure);
            this.createTreasureElement(treasure);
        }
    }

    createTreasureElement(treasure) {
        const element = document.createElement('div');
        element.className = `treasure ${treasure.type}`;
        element.style.left = treasure.x + 'px';
        element.style.top = treasure.y + 'px';
        element.style.width = treasure.size + 'px';
        element.style.height = treasure.size + 'px';
        element.dataset.id = treasure.id;
        this.undergroundElement.appendChild(element);
    }

    startGame() {
        this.gameRunning = true;
        this.startBtn.disabled = true;
        this.startTimer();
        this.updateDisplay();
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.timerElement.textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    startSwinging() {
        if (!this.hookExtending) {
            this.hookElement.classList.add('swinging');
        }
    }

    extendHook() {
        if (!this.gameRunning || this.hookExtending) return;

        // 获取当前钩爪的旋转角度并固定它
        const currentRotation = window.getComputedStyle(this.hookElement).getPropertyValue('transform');
        this.hookElement.style.transform = currentRotation;
        
        this.hookSwinging = false;
        this.hookExtending = true;
        this.hookElement.classList.remove('swinging');
        this.lineElement.classList.add('extending');

        this.audioManager.playExtendSound();

        setTimeout(() => {
            this.checkTreasureCollision();
            this.retractHook();
        }, 1000);
    }

    checkTreasureCollision() {
        const hookRect = this.clawElement.getBoundingClientRect();
        const hookCenterX = hookRect.left + hookRect.width / 2;
        const hookCenterY = hookRect.top + hookRect.height / 2;

        for (let treasure of this.treasures) {
            const treasureElement = document.querySelector(`[data-id="${treasure.id}"]`);
            if (!treasureElement) continue;

            const treasureRect = treasureElement.getBoundingClientRect();
            const treasureCenterX = treasureRect.left + treasureRect.width / 2;
            const treasureCenterY = treasureRect.top + treasureRect.height / 2;

            const distance = Math.sqrt(
                Math.pow(hookCenterX - treasureCenterX, 2) +
                Math.pow(hookCenterY - treasureCenterY, 2)
            );

            if (distance < treasure.size) {
                this.catchTreasure(treasure, treasureElement);
                break;
            }
        }
    }

    catchTreasure(treasure, element) {
        this.caughtTreasure = treasure;
        element.classList.add('caught');

        this.score += treasure.value;
        this.updateDisplay();

        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        this.audioManager.playCatchSound(treasure.type);
        this.particleSystem.createExplosion(centerX, centerY, this.getTreasureColor(treasure.type));

        element.style.display = 'none';
        this.treasures = this.treasures.filter(t => t.id !== treasure.id);
    }

    getTreasureColor(type) {
        const colors = {
            gold: '#FFD700',
            silver: '#C0C0C0',
            diamond: '#B9F2FF',
            rock: '#696969'
        };
        return colors[type] || '#FFD700';
    }

    retractHook() {
        const retractSpeed = this.caughtTreasure ? this.caughtTreasure.weight * 500 : 300;

        this.lineElement.classList.remove('extending');
        this.lineElement.classList.add('retracting');

        this.audioManager.playRetractSound();

        setTimeout(() => {
            this.lineElement.classList.remove('retracting');
            this.hookExtending = false;
            this.hookSwinging = true;
            this.caughtTreasure = null;
            this.startSwinging();
        }, retractSpeed);
    }

    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.targetElement.textContent = this.target;
    }

    endGame() {
        this.gameRunning = false;
        clearInterval(this.timer);
        this.hookElement.classList.remove('swinging');

        this.finalScoreElement.textContent = this.score;

        if (this.score >= this.target) {
            this.gameResultElement.textContent = '恭喜你赢了！';
            this.gameResultElement.style.color = '#00FF00';
            this.audioManager.playWinSound();

            const gameOverRect = this.gameOverElement.getBoundingClientRect();
            this.particleSystem.createExplosion(
                gameOverRect.left + gameOverRect.width / 2,
                gameOverRect.top + gameOverRect.height / 2,
                '#FFD700',
                50
            );
        } else {
            this.gameResultElement.textContent = '游戏结束！';
            this.gameResultElement.style.color = '#FF6B6B';
            this.audioManager.playLoseSound();
        }

        this.gameOverElement.classList.remove('hidden');
    }

    resetGame() {
        this.score = 0;
        this.timeLeft = 60;
        this.gameRunning = false;
        this.hookSwinging = true;
        this.hookExtending = false;
        this.caughtTreasure = null;

        clearInterval(this.timer);

        this.undergroundElement.innerHTML = '';
        this.generateTreasures();

        this.hookElement.classList.remove('swinging');
        this.lineElement.classList.remove('extending', 'retracting');

        this.updateDisplay();
        this.timerElement.textContent = this.timeLeft;

        this.startBtn.disabled = false;
        this.gameOverElement.classList.add('hidden');

        setTimeout(() => {
            this.startSwinging();
        }, 100);
    }

    playSound(type) {
        // This method is deprecated - now using AudioManager
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new GoldMiningGame();

    window.addEventListener('resize', () => {
        if (game) {
            game.resetGame();
        }
    });
});