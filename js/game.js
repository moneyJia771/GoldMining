// 游戏主类
class GoldMiner {
    constructor() {
        // 游戏状态
        this.gameState = 'start'; // start, playing, paused, success, fail
        this.currentLevel = 1;
        this.score = 0;
        this.targetScore = 0;
        this.timeLeft = 60;
        this.timerInterval = null;
        
        // 游戏元素
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.hook = null;
        this.items = [];
        
        // 屏幕元素
        this.screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            success: document.getElementById('success-screen'),
            fail: document.getElementById('fail-screen'),
            pause: document.getElementById('pause-screen'),
            levelSelect: document.getElementById('level-select-screen')
        };
        
        // 游戏信息元素
        this.elements = {
            currentLevel: document.getElementById('current-level'),
            targetAmount: document.getElementById('target-amount'),
            currentAmount: document.getElementById('current-amount'),
            timeLeft: document.getElementById('time-left')
        };
        
        // 初始化
        this.init();
    }
    
    // 初始化游戏
    init() {
        // 设置画布尺寸
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 初始化钩子
        this.hook = new Hook(this.canvas.width / 2, 60, this.ctx);
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化关卡选择界面
        this.initLevelSelect();
        
        // 显示开始界面
        this.showScreen('start');
        
        // 启动钩子摆动动画
        this.animateHook();
    }
    
    // 钩子摆动动画
    animateHook() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.drawBackground();
        
        // 更新并绘制钩子
        if (this.gameState !== 'playing') {
            this.hook.update();
        }
        this.hook.draw();
        
        // 如果游戏正在进行中，则使用gameLoop
        if (this.gameState === 'playing') {
            this.gameLoop();
        } else {
            // 否则继续钩子摆动动画
            requestAnimationFrame(() => this.animateHook());
        }
    }
    
    // 调整画布尺寸
    resizeCanvas() {
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    // 绑定事件
    bindEvents() {
        // 开始界面按钮
        document.getElementById('start-game').addEventListener('click', () => this.startGame(1));
        document.getElementById('level-select').addEventListener('click', () => this.showScreen('levelSelect'));
        
        // 游戏界面按钮
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        
        // 成功界面按钮
        document.getElementById('next-level').addEventListener('click', () => this.startGame(this.currentLevel + 1));
        document.getElementById('replay-level').addEventListener('click', () => this.startGame(this.currentLevel));
        document.getElementById('back-to-menu').addEventListener('click', () => this.showScreen('start'));
        
        // 失败界面按钮
        document.getElementById('restart-level').addEventListener('click', () => this.startGame(this.currentLevel));
        document.getElementById('use-props').addEventListener('click', () => {
            // 道具功能待实现
            alert('道具功能尚未实现');
        });
        document.getElementById('back-to-menu-fail').addEventListener('click', () => this.showScreen('start'));
        
        // 暂停界面按钮
        document.getElementById('continue-game').addEventListener('click', () => this.continueGame());
        document.getElementById('restart-game').addEventListener('click', () => this.startGame(this.currentLevel));
        document.getElementById('exit-level').addEventListener('click', () => this.showScreen('start'));
        
        // 关卡选择界面按钮
        document.getElementById('back-from-levels').addEventListener('click', () => this.showScreen('start'));
        
        // 游戏操作 - 点击/触摸发射钩子
        this.canvas.addEventListener('click', () => {
            if (this.gameState === 'playing' && !this.hook.isLaunched) {
                this.hook.launch();
            }
        });
        
        // 键盘操作 - 空格键发射钩子
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameState === 'playing' && !this.hook.isLaunched) {
                this.hook.launch();
            }
        });
    }
    
    // 初始化关卡选择界面
    initLevelSelect() {
        const levelsGrid = document.getElementById('levels-grid');
        levelsGrid.innerHTML = '';
        
        // 创建10个关卡按钮
        for (let i = 1; i <= 10; i++) {
            const levelBtn = document.createElement('div');
            levelBtn.className = i <= this.currentLevel ? 'level-btn' : 'level-btn locked';
            levelBtn.textContent = i;
            
            if (i <= this.currentLevel) {
                levelBtn.addEventListener('click', () => this.startGame(i));
            }
            
            levelsGrid.appendChild(levelBtn);
        }
    }
    
    // 显示指定界面
    showScreen(screen) {
        // 隐藏所有界面
        Object.values(this.screens).forEach(s => s.classList.add('hidden'));
        
        // 显示指定界面
        this.screens[screen].classList.remove('hidden');
        
        // 更新游戏状态
        this.gameState = screen === 'game' ? 'playing' : screen;
        
        // 如果显示关卡选择界面，更新关卡按钮
        if (screen === 'levelSelect') {
            this.initLevelSelect();
        }
    }
    
    // 开始游戏
    startGame(level) {
        // 设置当前关卡
        this.currentLevel = level;
        
        // 重置游戏数据
        this.score = 0;
        this.targetScore = level * 500; // 目标分数随关卡增加
        this.timeLeft = 60 - (level - 1) * 3; // 时间随关卡减少
        this.timeLeft = Math.max(this.timeLeft, 30); // 最少30秒
        
        // 更新界面数据
        this.elements.currentLevel.textContent = level;
        this.elements.targetAmount.textContent = this.targetScore;
        this.elements.currentAmount.textContent = this.score;
        this.elements.timeLeft.textContent = this.timeLeft;
        
        // 重置钩子
        this.hook.reset();
        
        // 生成关卡物品
        this.generateItems(level);
        
        // 显示游戏界面
        this.showScreen('game');
        
        // 开始游戏循环
        this.gameLoop();
        
        // 开始计时器
        this.startTimer();
    }
    
    // 生成关卡物品
    generateItems(level) {
        this.items = [];
        
        // 根据关卡难度生成不同数量和类型的物品
        const itemCount = 10 + level * 2;
        
        for (let i = 0; i < itemCount; i++) {
            const type = this.getRandomItemType(level);
            const x = Math.random() * (this.canvas.width - 100) + 50;
            const y = Math.random() * (this.canvas.height - 200) + 150;
            
            let size, value, weight;
            
            switch (type) {
                case 'gold_small':
                    size = 20;
                    value = 50;
                    weight = 1;
                    break;
                case 'gold_medium':
                    size = 30;
                    value = 100;
                    weight = 2;
                    break;
                case 'gold_large':
                    size = 40;
                    value = 250;
                    weight = 3;
                    break;
                case 'diamond':
                    size = 15;
                    value = 600;
                    weight = 0.5;
                    break;
                case 'stone':
                    size = 35;
                    value = 20;
                    weight = 4;
                    break;
                default:
                    size = 25;
                    value = 50;
                    weight = 1;
            }
            
            this.items.push(new Item(x, y, size, type, value, weight));
        }
    }
    
    // 获取随机物品类型
    getRandomItemType(level) {
        const rand = Math.random();
        
        if (rand < 0.1 && level > 2) {
            return 'diamond'; // 10%几率出现钻石，仅在3级以上关卡
        } else if (rand < 0.3) {
            return 'gold_large'; // 20%几率出现大金块
        } else if (rand < 0.6) {
            return 'gold_medium'; // 30%几率出现中金块
        } else if (rand < 0.8) {
            return 'gold_small'; // 20%几率出现小金块
        } else {
            return 'stone'; // 20%几率出现石头
        }
    }
    
    // 开始计时器
    startTimer() {
        // 清除之前的计时器
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // 设置新计时器
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.elements.timeLeft.textContent = this.timeLeft;
            
            // 时间到，游戏结束
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.endGame();
            }
        }, 1000);
    }
    
    // 暂停游戏
    pauseGame() {
        // 暂停计时器
        clearInterval(this.timerInterval);
        
        // 显示暂停界面
        this.showScreen('pause');
    }
    
    // 继续游戏
    continueGame() {
        // 显示游戏界面
        this.showScreen('game');
        
        // 重新开始计时器
        this.startTimer();
    }
    
    // 结束游戏
    endGame() {
        // 停止计时器
        clearInterval(this.timerInterval);
        
        // 判断成功或失败
        if (this.score >= this.targetScore) {
            // 成功，解锁下一关
            if (this.currentLevel < 10) {
                this.currentLevel++;
            }
            
            // 显示成功界面
            this.showScreen('success');
        } else {
            // 失败，显示失败界面
            this.showScreen('fail');
        }
    }
    
    // 游戏主循环
    gameLoop() {
        // 如果游戏不在进行中，切换回钩子摆动动画
        if (this.gameState !== 'playing') {
            requestAnimationFrame(() => this.animateHook());
            return;
        }
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.drawBackground();
        
        // 更新并绘制物品
        this.items.forEach(item => {
            item.draw(this.ctx);
        });
        
        // 更新并绘制钩子
        this.hook.update();
        this.hook.draw();
        
        // 检测碰撞
        if (this.hook.isLaunched && !this.hook.hasCaught) {
            this.checkCollision();
        }
        
        // 请求下一帧
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // 绘制背景
    drawBackground() {
        // 绘制天空
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制地面
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, 60, this.canvas.width, 40);
        
        // 绘制矿洞
        this.ctx.fillStyle = '#555';
        this.ctx.fillRect(0, 100, this.canvas.width, this.canvas.height - 100);
        
        // 绘制矿工
        this.drawMiner();
    }
    
    // 绘制矿工
    drawMiner() {
        const x = this.canvas.width / 2;
        const y = 40;
        
        // 绘制矿工头部
        this.ctx.beginPath();
        this.ctx.arc(x, y, 15, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFC0CB';
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // 绘制矿工帽子
        this.ctx.beginPath();
        this.ctx.arc(x, y - 5, 12, Math.PI, Math.PI * 2);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.stroke();
        
        // 绘制矿工眼睛
        this.ctx.beginPath();
        this.ctx.arc(x - 5, y, 2, 0, Math.PI * 2);
        this.ctx.arc(x + 5, y, 2, 0, Math.PI * 2);
        this.ctx.fillStyle = '#000';
        this.ctx.fill();
        
        // 绘制矿工嘴巴
        this.ctx.beginPath();
        this.ctx.arc(x, y + 5, 5, 0, Math.PI);
        this.ctx.strokeStyle = '#000';
        this.ctx.stroke();
        
        // 绘制矿工身体
        this.ctx.beginPath();
        this.ctx.rect(x - 10, y + 15, 20, 25);
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.stroke();
    }
    
    // 检测碰撞
    checkCollision() {
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const distance = Math.sqrt(
                Math.pow(this.hook.x - item.x, 2) + 
                Math.pow(this.hook.y - item.y, 2)
            );
            
            // 如果钩子碰到物品
            if (distance < item.size) {
                this.hook.catch(item);
                this.items.splice(i, 1);
                break;
            }
        }
    }
    
    // 物品被成功回收
    collectItem(item) {
        // 增加分数
        this.score += item.value;
        
        // 更新分数显示
        this.elements.currentAmount.textContent = this.score;
        
        // 检查是否达到目标
        if (this.score >= this.targetScore && this.gameState === 'playing') {
            this.endGame();
        }
    }
}

// 钩子类
class Hook {
    constructor(x, y, ctx) {
        this.baseX = x;
        this.baseY = y;
        this.x = x;
        this.y = y;
        this.ctx = ctx;
        this.angle = 0;
        this.angleSpeed = 0.0167; // 降为原来的1/3 (0.05/3)
        this.angleDirection = 1;
        this.maxAngle = Math.PI / 3; // 最大摆动角度为60度
        this.isLaunched = false;
        this.hasCaught = false;
        this.caughtItem = null;
        this.speed = 5;
        this.maxLength = 500;
        this.currentLength = 0;
        this.state = 'swing'; // swing, extending, retracting
    }
    
    // 更新钩子状态
    update() {
        switch (this.state) {
            case 'swing':
                // 钩子摆动
                this.angle += this.angleSpeed * this.angleDirection;
                
                // 限制摆动角度
                if (this.angle > this.maxAngle) {
                    this.angle = this.maxAngle;
                    this.angleDirection = -1;
                } else if (this.angle < -this.maxAngle) {
                    this.angle = -this.maxAngle;
                    this.angleDirection = 1;
                }
                
                // 更新钩子位置 - 让锤子在摆动时也有位置变化
                this.x = this.baseX + Math.sin(this.angle) * 30;
                this.y = this.baseY + 30;
                break;
                
            case 'extending':
                // 钩子延伸
                this.currentLength += this.speed;
                
                // 计算钩子位置
                this.x = this.baseX + Math.sin(this.angle) * this.currentLength;
                this.y = this.baseY + Math.cos(this.angle) * this.currentLength;
                
                // 检查是否达到最大长度
                if (this.currentLength >= this.maxLength) {
                    this.state = 'retracting';
                }
                break;
                
            case 'retracting':
                // 钩子收回
                let retractionSpeed = this.speed;
                
                // 如果抓到物品，根据物品重量减慢收回速度
                if (this.hasCaught) {
                    retractionSpeed = this.speed / this.caughtItem.weight;
                }
                
                this.currentLength -= retractionSpeed;
                
                // 计算钩子位置
                this.x = this.baseX + Math.sin(this.angle) * this.currentLength;
                this.y = this.baseY + Math.cos(this.angle) * this.currentLength;
                
                // 如果抓到物品，更新物品位置
                if (this.hasCaught) {
                    this.caughtItem.x = this.x;
                    this.caughtItem.y = this.y;
                }
                
                // 检查是否收回到起点
                if (this.currentLength <= 0) {
                    
                    // 如果抓到物品，收集物品
                    if (this.hasCaught) {
                        window.game.collectItem(this.caughtItem);
                        this.hasCaught = false;
                        this.caughtItem = null;
                    }
                    
                    // 重置钩子状态（在处理完物品后再重置）
                    this.reset();
                }
                break;
        }
    }
    
    // 绘制钩子和锤子
    draw() {
        this.ctx.save();
        
        // 绘制绳子
        this.ctx.beginPath();
        this.ctx.moveTo(this.baseX, this.baseY);
        this.ctx.lineTo(this.x, this.y);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 绘制锤子头部
        this.ctx.beginPath();
        this.ctx.rect(this.x - 10, this.y - 5, 20, 15);
        this.ctx.fillStyle = '#555';
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // 绘制锤子把手
        this.ctx.beginPath();
        this.ctx.rect(this.x - 2, this.y - 15, 4, 10);
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.stroke();
        
        // 如果抓到物品，绘制物品
        if (this.hasCaught) {
            this.caughtItem.draw(this.ctx);
        }
        
        this.ctx.restore();
    }
    
    // 发射钩子
    launch() {
        if (this.state === 'swing') {
            this.isLaunched = true;
            this.state = 'extending';
        }
    }
    
    // 抓取物品
    catch(item) {
        this.hasCaught = true;
        this.caughtItem = item;
        this.state = 'retracting';
    }
    
    // 重置钩子
    reset() {
        this.x = this.baseX;
        this.y = this.baseY;
        this.isLaunched = false;
        this.hasCaught = false;
        this.caughtItem = null;
        this.currentLength = 0;
        this.state = 'swing';
    }
}

// 物品类
class Item {
    constructor(x, y, size, type, value, weight) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.type = type;
        this.value = value;
        this.weight = weight;
    }
    
    // 绘制物品
    draw(ctx) {
        ctx.save();
        
        switch (this.type) {
            case 'gold_small':
            case 'gold_medium':
            case 'gold_large':
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = '#FFD700';
                ctx.fill();
                ctx.strokeStyle = '#FFA500';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
                
            case 'diamond':
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.size);
                ctx.lineTo(this.x + this.size, this.y);
                ctx.lineTo(this.x, this.y + this.size);
                ctx.lineTo(this.x - this.size, this.y);
                ctx.closePath();
                ctx.fillStyle = '#00FFFF';
                ctx.fill();
                ctx.strokeStyle = '#0000FF';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
                
            case 'stone':
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = '#808080';
                ctx.fill();
                ctx.strokeStyle = '#505050';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }
}

// 创建游戏实例
let game;

// 页面加载完成后初始化游戏
window.addEventListener('load', () => {
    game = new GoldMiner();
    
    // 将game实例设置为全局变量，确保Hook类可以访问
    window.game = game;
});