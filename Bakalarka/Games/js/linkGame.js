class SuspiciousLinkGame extends Phaser.Scene {
    constructor() {
        super({ key: 'SuspiciousLinkGame' });
        
        const SUPABASE_URL = 'https://fejkfjyoqrnqryqrlljy.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlamtmanlvcXJucXJ5cXJsbGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODI2MzMsImV4cCI6MjA5Nzg1ODYzM30.nVWNax8d5R3gVVSDfj8pyIpoaN4m9JWiIoRM8MkRF0E';
        
        this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Výchozí fallback data přímo v konstruktoru pro případ, že Supabase kompletně selže
        this.links = [
            { url: "https://www.youtube.com", suspicious: false },
            { url: "https://www.youtub.com", suspicious: true },
            { url: "https://www.csob.cz", suspicious: false },
            { url: "https://www.csob.ru", suspicious: true },
            { url: "https://www.facebook.com", suspicious: false }
        ];
    }

    async preload() {
        console.log("Načítám odkazy ze Supabase...");
        
        try {
            // 🔥 OPRAVA: Změna 'Links' na malá písmena 'links'
            const { data, error } = await this.supabase
                .from('links') 
                .select('url, suspicious');

            if (error) throw error;

            if (data && data.length > 0) {
                this.links = data;
                console.log(`Úspěšně načteno ${this.links.length} odkazů z databáze.`);
            } else {
                console.warn('Databáze vrátila prázdná data, používám fallback.');
            }
        } catch (error) {
            console.error('Chyba při stahování dat ze Supabase, používám záložní odkazy:', error.message);
            // Fallback je bezpečně jištěn z constructoru
        }
    }

    create() {
        this.gameWidth = this.sys.game.config.width;
        this.gameHeight = this.sys.game.config.height;

        this.score = 0;
        this.currentIndex = 0;
        this.wrongAnswers = []; 

        // Náhodný výběr 5 unikátních odkazů
        this.gameLinks = Phaser.Utils.Array.Shuffle(this.links).slice(0, 5);

        this.showTutorial();
    }

    showTutorial() {
        this.tutorialBg = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x000000, 0.85).setOrigin(0);

        const panelWidth = this.gameWidth * 0.8;
        const panelHeight = this.gameHeight * 0.5;
        const panelX = (this.gameWidth - panelWidth) / 2;
        const panelY = (this.gameHeight - panelHeight) / 2;

        this.tutorialPanel = this.add.graphics();
        this.tutorialPanel.fillStyle(0x3a345e, 0.95);
        this.tutorialPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
        this.tutorialPanel.lineStyle(4, 0x6441a5, 1);
        this.tutorialPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);

        this.tutorialTitle = this.add.text(this.gameWidth / 2, panelY + 60, "Je odkaz podezřelý?", {
            fontSize: '32px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5);

        const instructions = [
            "Urči, zda je adresa bezpečná či podezřelá.",
            "Na určení máš 7 sekund. Za správnou odpověď máš bod."
        ];

        this.tutorialInstructions = [];
        let startY = panelY + 130;

        instructions.forEach((line, i) => {
            const text = this.add.text(this.gameWidth / 2, startY + i * 35, line, {
                fontSize: '22px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }).setOrigin(0.5);
            this.tutorialInstructions.push(text);
        });

        const btnWidth = 200;
        const btnHeight = 60;
        const btnX = this.gameWidth / 2 - btnWidth / 2;
        const btnY = panelY + panelHeight - btnHeight - 40;

        this.startButtonBg = this.add.graphics();
        this.startButtonBg.fillStyle(0x5a4dcf, 1);
        this.startButtonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
        this.startButtonBg.lineStyle(3, 0x3a2c8d, 1);
        this.startButtonBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);

        this.startButton = this.add.text(this.gameWidth / 2, btnY + btnHeight / 2, 'Start Game', {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#1b1164',
            strokeThickness: 4,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.startButton.on('pointerover', () => {
            this.startButtonBg.clear();
            this.startButtonBg.fillStyle(0x7a69ff, 1);
            this.startButtonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
            this.startButtonBg.lineStyle(3, 0x5a4dcf, 1);
            this.startButtonBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
            this.startButton.setFill('#ffffff');
        });

        this.startButton.on('pointerout', () => {
            this.startButtonBg.clear();
            this.startButtonBg.fillStyle(0x5a4dcf, 1);
            this.startButtonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
            this.startButtonBg.lineStyle(3, 0x3a2c8d, 1);
            this.startButtonBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
            this.startButton.setFill('#e0dfff');
        });

        this.startButton.on('pointerdown', () => {
            this.tutorialBg.destroy();
            this.tutorialPanel.destroy();
            this.tutorialTitle.destroy();
            this.startButtonBg.destroy();
            this.startButton.destroy();
            this.tutorialInstructions.forEach(t => t.destroy());

            this.startGame();
        });
    }

    startGame() {
        this.score = 0;
        this.currentIndex = 0;
        this.showNextLink();
    }

    showNextLink() {
        if (this.currentLinkText) this.currentLinkText.destroy();
        if (this.safeButton) {
            this.safeButton.destroy();
            this.suspiciousButton.destroy();
            this.timerText.destroy();
        }

        // Pokud pole obsahuje prvky, hra už neskočí hned do GameOver
        if (this.currentIndex >= this.gameLinks.length) {
            this.showGameOver();
            return;
        }

        const link = this.gameLinks[this.currentIndex];

        this.currentLinkText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 50, link.url, {
            fontSize: '24px',
            fill: '#d8caff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
            wordWrap: { width: this.gameWidth * 0.8 },
            align: 'center'
        }).setOrigin(0.5);

        this.safeButton = this.add.text(this.gameWidth / 2 - 150, this.gameHeight / 2 + 70, 'Bezpečný', {
            fontSize: '26px',
            backgroundColor: '#4CAF50',
            color: '#ffffff',
            padding: { x: 30, y: 15 },
            fontStyle: 'bold',
            stroke: '#2e7d32',
            strokeThickness: 4,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.suspiciousButton = this.add.text(this.gameWidth / 2 + 150, this.gameHeight / 2 + 70, 'Podezřelý', {
            fontSize: '26px',
            backgroundColor: '#f44336',
            color: '#ffffff',
            padding: { x: 30, y: 15 },
            fontStyle: 'bold',
            stroke: '#b71c1c',
            strokeThickness: 4,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.safeButton.on('pointerover', () => this.safeButton.setStyle({ backgroundColor: '#66bb6a' }));
        this.safeButton.on('pointerout', () => this.safeButton.setStyle({ backgroundColor: '#4CAF50' }));

        this.suspiciousButton.on('pointerover', () => this.suspiciousButton.setStyle({ backgroundColor: '#e57373' }));
        this.suspiciousButton.on('pointerout', () => this.suspiciousButton.setStyle({ backgroundColor: '#f44336' }));

        this.safeButton.once('pointerdown', () => this.handleAnswer(false));
        this.suspiciousButton.once('pointerdown', () => this.handleAnswer(true));

        this.timeLeft = 7;
        this.timerText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 150, `Čas: ${this.timeLeft}`, {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    updateTimer() {
        this.timeLeft--;
        this.timerText.setText(`Čas: ${this.timeLeft}`);

        if (this.timeLeft <= 0) {
            this.timerEvent.remove(false);
            this.handleAnswer(null);  
        }
    }

    handleAnswer(selectedSuspicious) {
        if (this.timerEvent) {
            this.timerEvent.remove(false);
        }

        const currentLink = this.gameLinks[this.currentIndex];

        if (selectedSuspicious === null) {
            this.wrongAnswers.push({
                url: currentLink.url,
                correctSuspicious: currentLink.suspicious,
                userAnswer: null
            });
        } else if (selectedSuspicious === currentLink.suspicious) {
            this.score++;
        } else {
            this.wrongAnswers.push({
                url: currentLink.url,
                correctSuspicious: currentLink.suspicious,
                userAnswer: selectedSuspicious
            });
        }

        this.currentIndex++;
        this.showNextLink();
    }

    showGameOver() {
        let finalPoints = 0;
        if (this.score >= 4) {
            finalPoints = 2;
        } else if (this.score >= 2) {
            finalPoints = 1;
        } else {
            finalPoints = 0;
        }

        this.cameras.main.setBackgroundColor('#1a1a2e');
        this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x1a1a2e).setOrigin(0);

        this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 90, "Konec hry!", {
            fontSize: '40px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 30, `Správně: ${this.score} / ${this.gameLinks.length}\n Získané body: ${finalPoints}/2`, {
            fontSize: '28px',
            fill: '#d8caff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);

        let startY = this.gameHeight / 2 + 20;
        if (this.wrongAnswers && this.wrongAnswers.length > 0) {
            this.add.text(this.gameWidth / 2, startY, "Špatné odpovědi:", {
                fontSize: '26px',
                fill: '#ff6b6b',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);

            this.wrongAnswers.forEach((item, index) => {
                const correctStr = item.correctSuspicious ? "Podezřelá" : "Bezpečná";

                this.add.text(this.gameWidth / 2, startY + 35 + index * 30,
                    `${item.url} | Správná odpověď: ${correctStr}`, {
                    fontSize: '18px',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2,
                    wordWrap: { width: this.gameWidth * 0.9 },
                    align: 'center'
                }).setOrigin(0.5);
            });

            startY += 35 + this.wrongAnswers.length * 30 + 30;
        } else {
            startY += 70;
        }

        const btnWidth = 220;
        const btnHeight = 60;
        const btnX = this.gameWidth / 2 - btnWidth / 2;
        const btnY = startY;

        this.restartButtonBg = this.add.graphics();
        this.restartButtonBg.fillStyle(0x5a4dcf, 1);
        this.restartButtonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
        this.restartButtonBg.lineStyle(3, 0x3a2c8d, 1);
        this.restartButtonBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);

        this.restartButton = this.add.text(this.gameWidth / 2, btnY + btnHeight / 2, 'Hodnocení', {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#1b1164',
            strokeThickness: 4,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.restartButton.on('pointerover', () => {
            this.restartButtonBg.clear();
            this.restartButtonBg.fillStyle(0x7a69ff, 1);
            this.restartButtonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
            this.restartButtonBg.lineStyle(3, 0x5a4dcf, 1);
            this.restartButtonBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
            this.restartButton.setFill('#ffffff');
        });

        this.restartButton.on('pointerout', () => {
            this.restartButtonBg.clear();
            this.restartButtonBg.fillStyle(0x5a4dcf, 1);
            this.restartButtonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
            this.restartButtonBg.lineStyle(3, 0x3a2c8d, 1);
            this.restartButtonBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
            this.restartButton.setFill('#e0dfff');
        });

        this.restartButton.on('pointerdown', () => {
            if (localStorage.getItem('playerScore') !== null) {
                let current = parseInt(localStorage.getItem('playerScore'));
                localStorage.setItem('playerScore', current + finalPoints);
            } else {
                localStorage.setItem('playerScore', finalPoints); 
            }

            window.location.href = 'results.html';
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    backgroundColor: '#1a1a2e',
    parent: 'game-container',
    scene: [SuspiciousLinkGame]
};

const game = new Phaser.Game(config);