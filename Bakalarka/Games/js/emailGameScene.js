class EmailGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EmailGameScene' });
        this.roundCount = 0;        // to count played rounds
        this.submitButton = null;   // keep reference to submit button
        this.nextGameButton = null; // reference for "Další hra" button

        // 1. Správná HTTP URL adresa
        const SUPABASE_URL = 'https://fejkfjyoqrnqryqrlljy.supabase.co';

        // 2. Anonymní API klíč
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlamtmanlvcXJucXJ5cXJsbGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODI2MzMsImV4cCI6MjA5Nzg1ODYzM30.nVWNax8d5R3gVVSDfj8pyIpoaN4m9JWiIoRM8MkRF0E';

        // Inicializace klienta
        this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Pole pro dynamická data
        this.emails = [];
    }

    preload() { }

    async create() {
        this.usedEmails = [];
        this.round = 1;
        this.score = 0;

        // Vytvoříme dočasný načítací text
        const loadingText = this.add.text(450, 300, 'Načítám e-maily z databáze...', {
            fontSize: '24px',
            color: '#d8caff',
            fontFamily: '"Segoe UI Mono", monospace'
        }).setOrigin(0.5);

        try {
            // Načtení dat z tabulky "Emails" podle tvé přesné struktury
            const { data: dbEmails, error } = await this.supabase
                .from('Emails')
                .select('sender, title, body, suspiciousParts, suspiciousReasons');

            if (error) throw error;

            // Kontrola prázdné DB
            if (!dbEmails || dbEmails.length === 0) {
                throw new Error('Databáze vrátila prázdné pole e-mailů.');
            }

            // Přemapování dat s ohledem na správné názvy sloupců (camelCase)
            this.emails = dbEmails.map(email => ({
                sender: email.sender,
                title: email.title,
                body: email.body,
                suspicious: email.suspiciousParts || [],     // Opraveno zde ✔️
                suspiciousReasons: email.suspiciousReasons || {} // Opraveno zde ✔️
            }));

            // Výběr prvního náhodného emailu
            this.currentEmail = Phaser.Utils.Array.GetRandom(this.emails);
            
            if (!this.currentEmail) {
                throw new Error('Nepodařilo se vybrat náhodný e-mail.');
            }

            this.usedEmails.push(this.currentEmail);

            // Smazání textu a start hry
            loadingText.destroy();
            this.showTutorial();

        } catch (err) {
            console.error('Chyba při stahování e-mailů:', err);
            loadingText.setText('Chyba při načítání dat. Zkuste obnovit stránku.');
        }
    }

    showTutorial() {
        const w = this.sys.game.config.width;
        const h = this.sys.game.config.height;

        this.tutorialBg = this.add.rectangle(0, 0, w, h, 0x000000, 0.8).setOrigin(0);

        const panelWidth = w * 0.75;
        const panelHeight = h * 0.65;
        const panelX = (w - panelWidth) / 2;
        const panelY = (h - panelHeight) / 2;

        this.tutorialPanel = this.add.graphics();
        this.tutorialPanel.fillStyle(0x3a345e, 0.95);
        this.tutorialPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
        this.tutorialPanel.lineStyle(4, 0x6441a5, 1);
        this.tutorialPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);

        this.tutorialTitle = this.add.text(w / 2, panelY + 60, 'Vítej ve hře Email Phishing!', {
            fontSize: '32px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5);

        const instructions = [
            "Úkolem je vybrat podezřelé části e-mailu kliknutím na ně.",
            "",
            "Správné označení či neoznačení části e-mailu ti přinese body.",
            ""
        ];

        let startY = panelY + 140;
        this.instructionTexts = [];
        instructions.forEach((line, i) => {
            const t = this.add.text(w / 2, startY + i * 40, line, {
                fontSize: '22px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                wordWrap: { width: panelWidth - 40 },
                align: 'center'
            }).setOrigin(0.5);
            this.instructionTexts.push(t);
        });

        const btnWidth = 180;
        const btnHeight = 60;
        const btnX = w / 2 - btnWidth / 2;
        const btnY = panelY + panelHeight - btnHeight - 40;

        this.startButtonBg = this.add.graphics();
        this.startButtonBg.fillStyle(0x5a4dcf, 1);
        this.startButtonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
        this.startButtonBg.lineStyle(3, 0x3a2c8d, 1);
        this.startButtonBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);

        this.startButton = this.add.text(w / 2, btnY + btnHeight / 2, 'Začít hru', {
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
            this.instructionTexts.forEach(t => t.destroy());
            this.startButtonBg.destroy();
            this.startButton.destroy();
            this.initGame();
        });
    }

    initGame() {
        this.suspiciousSelections = [];
        this.textElements = {};

        this.cameras.main.setBackgroundColor('#1a1a2e');

        const emailX = 50;
        const emailY = 60;
        const emailWidth = 800;
        const emailHeight = 320;

        this.emailBox = this.add.rectangle(emailX, emailY, emailWidth, emailHeight, 0x2e2b4e)
            .setOrigin(0)
            .setStrokeStyle(3, 0x6441a5);

        this.correctSuspicious = this.currentEmail.suspicious;

        this.createEmailPart('sender', this.currentEmail.sender, emailX + 20, emailY + 20, emailWidth - 40, 50);
        this.createEmailPart('title', this.currentEmail.title, emailX + 20, emailY + 90, emailWidth - 40, 50);
        this.createEmailPart('body', this.currentEmail.body, emailX + 20, emailY + 160, emailWidth - 40, 160);

        this.submitButton = this.add.text(emailX + 10, emailY + emailHeight + 25, "✅ Potvrdit", {
            fontSize: '28px',
            backgroundColor: '#7b68ee',
            color: '#f0e6ff',
            padding: { x: 20, y: 12 },
            fontStyle: 'bold',
            stroke: '#4b367c',
            strokeThickness: 5,
            shadow: { offsetX: 2, offsetY: 2, color: '#2b1f54', blur: 3 }
        }).setInteractive({ useHandCursor: true });

        this.submitButton.on('pointerover', () => this.submitButton.setStyle({ backgroundColor: '#9a7eea', color: '#ffffff' }));
        this.submitButton.on('pointerout', () => this.submitButton.setStyle({ backgroundColor: '#7b68ee', color: '#f0e6ff' }));
        this.submitButton.on('pointerdown', () => this.checkSelections());

        this.feedbackText = this.add.text(emailX + 250, emailY + emailHeight + 35, '', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000',
            strokeThickness: 4,
            wordWrap: { width: 600 },
        });

        this.createLegend(emailX + 500, emailY + emailHeight + 15);
    }

    createEmailPart(key, content, x, y, width, height) {
        // 👇 TENTO ŘÁDEK PŘIDEJ: Nahradí textové "\n" za skutečný nový řádek
        const formattedContent = content ? content.replace(/\\n/g, '\n') : '';
    
        const border = this.add.rectangle(x, y, width, height, 0x3a345e)
            .setOrigin(0)
            .setStrokeStyle(3, 0x6441a5)
            .setInteractive({ useHandCursor: true });
    
        // 👇 ZMĚŇ 'content' NA 'formattedContent'
        const text = this.add.text(x + 15, y + 15, formattedContent, {
            fontSize: '20px',
            color: '#d8caff',
            wordWrap: { width: width - 30 },
            fontFamily: '"Segoe UI Mono", monospace'
        });
    
        border.on('pointerdown', () => this.toggleSelection(key, border));
        this.textElements[key] = { text, border };
    }

    toggleSelection(part, borderRect) {
        const isSelected = this.suspiciousSelections.includes(part);
        if (isSelected) {
            this.suspiciousSelections = this.suspiciousSelections.filter(p => p !== part);
            borderRect.setStrokeStyle(3, 0x6441a5);
        } else {
            this.suspiciousSelections.push(part);
            borderRect.setStrokeStyle(4, 0x00ffff);
        }
    }

    showFeedbackWindow(feedbackText, scoreEarned) {
        const width = 500;
        const height = 300;

        if (this.feedbackContainer) {
            this.feedbackContainer.destroy();
        }

        this.feedbackContainer = this.add.container(100, 100);

        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0)
            .setStrokeStyle(2, 0xffffff);

        const text = this.add.text(20, 20, feedbackText + `\n\nZískal/a jsi ${scoreEarned}/3 bodů.`, {
            font: '16px Arial',
            fill: '#fff',
            wordWrap: { width: 460 }
        });

        const okButton = this.add.text(width / 2, height - 40, 'OK', {
            font: '20px Arial',
            fill: '#ffffff',
            backgroundColor: '#007bff',
            padding: { x: 10, y: 5 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.feedbackContainer.setVisible(false);
                this.submitButton.disableInteractive();
                Object.values(this.textElements).forEach(part => part.border.disableInteractive());
                this.showNextGameButton();
            });

        this.feedbackContainer.add([bg, text, okButton]);
    }

    checkSelections() {
        const email = this.currentEmail;
        const selected = this.suspiciousSelections;
        const correctSelections = email.suspicious;
        const currentReasons = email.suspiciousReasons || {};

        let feedback = '';
        let score = 3;

        ['sender', 'title', 'body'].forEach(part => {
            const border = this.textElements[part].border;
            const isSelected = selected.includes(part);
            const isSuspicious = correctSelections.includes(part);

            if (isSuspicious && isSelected) {
                feedback += `✔️ ${part}: ${currentReasons[part] || 'Správně označeno.'}\n`;
                border.setStrokeStyle(4, 0x00ff00);
            } else if (isSuspicious && !isSelected) {
                feedback += `❌ ${part} měl být označen! ${currentReasons[part] || ''}\n`;
                border.setStrokeStyle(4, 0xffff00);
                score--;
            } else if (!isSuspicious && isSelected) {
                feedback += `❌ ${part} neměl být označen.\n`;
                border.setStrokeStyle(4, 0xf50505);
                score--;
            } else {
                border.setStrokeStyle(4, 0x00ff00);
            }
        });

        score = Math.max(0, score);
        this.score += score;

        this.showFeedbackWindow(feedback, score);
    }

    loadNextEmail() {
        this.suspiciousSelections = [];
        const remainingEmails = this.emails.filter(e => !this.usedEmails.includes(e));

        if (remainingEmails.length === 0) {
            console.warn("Nedostatek unikátních e-mailů v databázi!");
            return;
        }

        for (const key in this.textElements) {
            this.textElements[key].text.destroy();
            this.textElements[key].border.destroy();
        }
        this.textElements = {};

        if (this.submitButton) this.submitButton.destroy();
        if (this.feedbackContainer) this.feedbackContainer.destroy();

        this.currentEmail = Phaser.Utils.Array.GetRandom(remainingEmails);
        this.usedEmails.push(this.currentEmail);

        const emailX = 50;
        const emailY = 60;
        const emailWidth = 800;

        this.createEmailPart('sender', this.currentEmail.sender, emailX + 20, emailY + 20, emailWidth - 40, 50);
        this.createEmailPart('title', this.currentEmail.title, emailX + 20, emailY + 90, emailWidth - 40, 50);
        this.createEmailPart('body', this.currentEmail.body, emailX + 20, emailY + 160, emailWidth - 40, 160);

        this.submitButton = this.add.text(emailX + 10, emailY + 320 + 25, "✅ Potvrdit", {
            fontSize: '28px',
            backgroundColor: '#7b68ee',
            color: '#f0e6ff',
            padding: { x: 20, y: 12 },
            fontStyle: 'bold',
            stroke: '#4b367c',
            strokeThickness: 5,
            shadow: { offsetX: 2, offsetY: 2, color: '#2b1f54', blur: 3 }
        }).setInteractive({ useHandCursor: true });

        this.submitButton.on('pointerover', () => this.submitButton.setStyle({ backgroundColor: '#9a7eea', color: '#ffffff' }));
        this.submitButton.on('pointerout', () => this.submitButton.setStyle({ backgroundColor: '#7b68ee', color: '#f0e6ff' }));
        this.submitButton.on('pointerdown', () => this.checkSelections());
    }

    showNextGameButton() {
        if (this.nextGameButton) this.nextGameButton.destroy();

        this.nextGameButton = this.add.text(450, 550, 'Další hra', {
            font: '24px Arial',
            fill: '#fff',
            backgroundColor: '#28a745',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);

        this.nextGameButton.on('pointerdown', () => {
            if (localStorage.getItem('playerScore') !== null) {
                let current = parseInt(localStorage.getItem('playerScore'));
                localStorage.setItem('playerScore', current + this.score);
            } else {
                localStorage.setItem('playerScore', this.score);
            }

            this.score = 0;

            if (this.round < 2) {
                this.round++;
                this.submitButton.setInteractive({ useHandCursor: true });
                Object.values(this.textElements).forEach(part => part.border.setInteractive({ useHandCursor: true }));
                this.nextGameButton.destroy();
                this.loadNextEmail();
            } else {
                window.location.href = 'endlessRunner.html';
            }
        });
    }

    createLegend(baseX, baseY) {
        const legendX = baseX + 100;
        const legendY = baseY + 2;

        this.add.text(legendX, legendY, "Legenda:", {
            fontSize: '20px',
            fill: '#d8caff',
            fontStyle: 'bold',
            fontFamily: '"Segoe UI Mono", monospace'
        });

        const legendItems = [
            { color: 0x00ff00, label: '✔️ Správně' },
            { color: 0xf50505, label: '❌ Špatně' },
            { color: 0xffff00, label: '⚠️ Chybělo označit' },
        ];

        legendItems.forEach((item, i) => {
            this.add.rectangle(legendX, legendY + 35 + i * 35, 25, 25, 0x3a345e)
                .setOrigin(0)
                .setStrokeStyle(4, item.color);

            this.add.text(legendX + 40, legendY + 33 + i * 35, item.label, {
                fontSize: '18px',
                fill: '#d8caff',
                fontFamily: '"Segoe UI Mono", monospace'
            });
        });
    }
}