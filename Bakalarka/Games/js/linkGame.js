class SuspiciousLinkGame extends Phaser.Scene {
    constructor() {
        super({ key: 'SuspiciousLinkGame' });
    }

    preload() {
        // preload assets if any
    }

    create() {
        this.gameWidth = this.sys.game.config.width;
        this.gameHeight = this.sys.game.config.height;

        this.links = [
            { url: "http://safe-site.com", suspicious: false },
            { url: "http://secure-login.example.com", suspicious: false },
            { url: "http://192.168.1.1", suspicious: false },
            { url: "http://secure-login.paypal.com.fake.com", suspicious: true },
            { url: "http://update-your-password-now.com", suspicious: true },
            { url: "http://paypal.com.login.update-info.com", suspicious: true },
            { url: "http://example.com", suspicious: false },
            { url: "http://free-gift-card.scam.com", suspicious: true },
            { url: "http://login.microsoft.com", suspicious: false },
            { url: "http://microsoft.com.verify-account.com", suspicious: true }
        ];

        this.score = 0;
        this.currentIndex = 0;

        // Randomly pick 5 unique links
        this.gameLinks = Phaser.Utils.Array.Shuffle(this.links).slice(0, 5);

        this.showTutorial();
    }

    showTutorial() {
        // semi-transparent overlay
        this.tutorialBg = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x000000, 0.85).setOrigin(0);

        // panel
        const panelWidth = this.gameWidth * 0.8;
        const panelHeight = this.gameHeight * 0.5;
        const panelX = (this.gameWidth - panelWidth) / 2;
        const panelY = (this.gameHeight - panelHeight) / 2;

        this.tutorialPanel = this.add.graphics();
        this.tutorialPanel.fillStyle(0x3a345e, 0.95);
        this.tutorialPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
        this.tutorialPanel.lineStyle(4, 0x6441a5, 1);
        this.tutorialPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);

        // title
        this.tutorialTitle = this.add.text(this.gameWidth / 2, panelY + 60, "Je odkaz podezřelý?", {
            fontSize: '32px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5);

        // instructions
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

        // start button
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
            // destroy tutorial elements
            this.tutorialBg.destroy();
            this.tutorialPanel.destroy();
            this.tutorialTitle.destroy();
            this.startButtonBg.destroy();
            this.startButton.destroy();
            this.tutorialInstructions.forEach(t => t.destroy());

            // start game
            this.startGame();
        });
    }


    startGame() {
        this.score = 0;
        this.currentIndex = 0;

        this.showNextLink();
    }

    showNextLink() {
        if (this.currentLinkText) {
            this.currentLinkText.destroy();
        }
        if (this.safeButton) {
            this.safeButton.destroy();
            this.suspiciousButton.destroy();
            this.timerText.destroy();
        }

        if (this.currentIndex >= this.gameLinks.length) {
            this.showGameOver();
            return;
        }

        const link = this.gameLinks[this.currentIndex];

        // Display the link big and centered
        this.currentLinkText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 50, link.url, {
            fontSize: '28px',
            fill: '#d8caff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
            wordWrap: { width: this.gameWidth * 0.8 },
            align: 'center'
        }).setOrigin(0.5);

        // Safe button
        this.safeButton = this.add.text(this.gameWidth / 2 - 150, this.gameHeight / 2 + 70, 'Bezpečný', {
            fontSize: '26px',
            backgroundColor: '#4CAF50',
            color: '#ffffff',
            padding: { x: 30, y: 15 },
            fontStyle: 'bold',
            stroke: '#2e7d32',
            strokeThickness: 4,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Suspicious button
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

        // Timer display
        this.timeLeft = 7;
        this.timerText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 150, `Čas: ${this.timeLeft}`, {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Countdown timer event
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
            this.handleAnswer(null);  // no answer chosen
        }
    }

    handleAnswer(selectedSuspicious) {
        if (this.timerEvent) {
            this.timerEvent.remove(false);
        }

        const currentLink = this.gameLinks[this.currentIndex];

        // Initialize wrongAnswers array if not yet
        if (!this.wrongAnswers) {
            this.wrongAnswers = [];
        }

        if (selectedSuspicious === null) {
            // timed out - count as wrong answer with userAnswer = null
            this.wrongAnswers.push({
                url: currentLink.url,
                correctSuspicious: currentLink.suspicious,
                userAnswer: null
            });
        } else if (selectedSuspicious === currentLink.suspicious) {
            this.score++;
        } else {
            // wrong answer
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
        this.cameras.main.setBackgroundColor('#1a1a2e');
        this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0x1a1a2e).setOrigin(0);

        this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 90, "Konec hry!", {
            fontSize: '40px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 30, `Skóre: ${this.score} / ${this.gameLinks.length}`, {
            fontSize: '28px',
            fill: '#d8caff',
            stroke: '#000000',
            strokeThickness: 3
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
                const userAnsStr = item.userAnswer === null ? "Žádná" : (item.userAnswer ? "Podezřelá" : "Bezpečná");
                const correctStr = item.correctSuspicious ? "Podezřelá" : "Bezpečná";

                this.add.text(this.gameWidth / 2, startY + 35 + index * 30,
                    `${item.url} | Vaše odpověď: ${userAnsStr} | Správně: ${correctStr}`, {
                    fontSize: '18px',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2,
                    wordWrap: { width: this.gameWidth * 0.9 },
                    align: 'center'
                }).setOrigin(0.5);
            });

            // Adjust button Y position based on number of wrong answers
            startY += 35 + this.wrongAnswers.length * 30 + 30;
        } else {
            // No wrong answers, set button a bit lower
            startY += 70;
        }

        // Restart button
        const btnWidth = 220;
        const btnHeight = 60;
        const btnX = this.gameWidth / 2 - btnWidth / 2;
        const btnY = startY;

        this.restartButtonBg = this.add.graphics();
        this.restartButtonBg.fillStyle(0x5a4dcf, 1);
        this.restartButtonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
        this.restartButtonBg.lineStyle(3, 0x3a2c8d, 1);
        this.restartButtonBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);

        this.restartButton = this.add.text(this.gameWidth / 2, btnY + btnHeight / 2, 'Hraj znovu', {
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
            this.restartButtonBg.destroy();
            this.restartButton.destroy();
            this.scene.restart();
        });
    }

}

const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    backgroundColor: '#1a1a2e',
    scene: [SuspiciousLinkGame]
};

const game = new Phaser.Game(config);
