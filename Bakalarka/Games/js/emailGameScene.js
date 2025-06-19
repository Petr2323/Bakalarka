class EmailGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EmailGameScene' });
        this.roundCount = 0;        // to count played rounds
        this.submitButton = null;   // keep reference to submit button
        this.nextGameButton = null; // reference for "Další hra" button

        // Array of emails, each with text and suspicious parts
        this.emails = [
            {
                sender: "Od: podpora@sesnam.cz",
                title: "Předmět: POZOR!!! Vaše účty budou zablokovány!!!!!!!",
                body: "Dobrý den,\n\nProsíme vás o zkontrolování údajů ve vašem účtu. \n\nDěkujeme, podpora týmu Seznam.",
                suspicious: ['sender', 'title'],
                suspiciousReasons: {
                    sender: 'sesnam.cz namísto seznam.cz',
                    title: 'Zastrašující předmět má přimět k rychlé reakci.'
                }
            },
            {
                sender: "Od: info@vasebanka.cz",
                title: "Předmět: Nutná kontrola vašeho bankovního účtu",
                body: "Vážený zákasníku,\n\nVaše banka zjistil podezřelé transaktion, proto zvás prosíme o zadání važih přihlašovacích údajú v odpovědi na tuto správu.\n\nVďaka",
                suspicious: ['body'],
                suspiciousReasons: {
                    body: 'Hodně chyb v textu a zaslání citlivých informací e-mailem.'
                }
            },
            {
                sender: "Od: pepa.novy@seznam.cz",
                title: "Předmět: Máme úkol z Fyziky!",
                body: "Ahoj,\n\nZjistil jsem, že máme úkol z Fyziky, je to úloha 5.1.3c. Klidně ti s tím pomůžu, ozvi se.",
                suspicious: []
            },
            {
                sender: "Od: reditel@hluboka150.ru",
                title: "Předmět: ZmĚNA!! Výlet se zdraží!!!!",
                body: "Dobrý den žáci,\n\n Zítřejší výlet se nečekaně zdražil, potřebuji abyste poslali 250Kč na účet 256987456/2010 s VS 1256 a v poznámce napsali Vaše jméno - výlet. Omlouvám se za vzniklé potíže. \n\n S pozdravem, ředitel",
                suspicious: ['sender', 'title', 'body'],
                suspiciousReasons: {
                    sender: 'Ředitel české školy nebude mít školní email s .ru(Rusko)',
                    title: 'Zastrašující a podezřele vypadající předmět má přimět k rychlé reakci.',
                    body: 'Naléhavost a posílání peněz z údajů v e-mailu je podezřelé.'
                }
            },
            {
                sender: "Od: podpora@seznam.cz",
                title: "Předmět: URGENTNÍ! Odpovězte RYCHLE!!",
                body: "Vážený uživateli,\n\nNa vašem účtu byla zaznamenána neobvyklá aktivita. Pokud jste to nebyl vy, kontaktujte nás.",
                suspicious: ['title'],
                suspiciousReasons: {
                    title: 'Zastrašující předmět má přimět k rychlé reakci.'
                }
            },
            {
                sender: "Od: alenka.zvonkova@xyz.cz",
                title: "Předmět: Gratulujeme! Vyhráli jste!",
                body: "Váš účet je náhodně vybrán k výhře peněz. Napište nám číslo vašeho účtu a telefonní číslo, abychom Vám peníze mohli poslat.",
                suspicious: ['sender', 'body', 'title'],
                suspiciousReasons: {
                    sender: 'xyz.cz je podezřelá vlastní adresa.',
                    title: 'Předmět Vás má nalákat.',
                    body: 'Neposílat podezřelé osobě Vaše osobní údaje.'
                }
            },
            {
                sender: "Od: podpora@firma.cz",
                title: "Předmět: Aktualizace informací o vašem zákaznickém účtu",
                body: "Vážený zákazníku,\n\nProsíme o potvrzení vašich údajů, abychom mohli pokračovat ve službách. Úpravy proveďte po přihlášení k Vašemu účtu v záložce Nastavení údajů. \n\nDěkujeme, že jste s námi, vaše Firma",
                suspicious: []
            },
            {
                sender: "Od: ucetni@firma.cs",
                title: "Předmět: Vaše faktura je připravena",
                body: "Dobrý den,\n\nVaše faktura za provedenou práci je k dispozici v příloze.",
                suspicious: ['sender'],
                suspiciousReasons: {
                    sender: 'Falešná adresa – používá .cs namísto .cz'
                }
            },
            {
                sender: "Od: podpora@firma.cz",
                title: "Předmět: Váš účet byl deaktivován",
                body: "Váš účet byl dočasně deaktivován kvůli podezřelé aktivitě. Klikněte na odkaz a ověřte si to. https://www.f1rma.net\n\n Děkujeme za pochopení, vaše Firma",
                suspicious: ['body'],
                suspiciousReasons: {
                    body: 'Odkaz je podezřelý, neklikat.'
                }
            },
            {
                sender: "Od: info@seznam.cs",
                title: "Předmět: Důležitá aktualizace účtu",
                body: "Vážený uživateli,\n\nProsíme vás o potvrzení vašich údajů prostřednictvím odkazu níže.\n\n https://www.seznan.cz/ucet",
                suspicious: ['sender', 'body'],
                suspiciousReasons: {
                    sender: 'Falešná adresa – .cs namísto .cz',
                    body: 'Neklikat na podezřelý odkaz.'
                }
            }
        ];
    }

    preload() { }

    create() {
        // Show tutorial overlay first
        this.showTutorial();
        this.usedEmails = [];
        this.round = 1;
        this.score = 0;
        this.currentEmail = Phaser.Utils.Array.GetRandom(this.emails.filter(e => !this.usedEmails.includes(e)));
        this.usedEmails.push(this.currentEmail);

    }

    showTutorial() {
        const w = this.sys.game.config.width;
        const h = this.sys.game.config.height;

        // Semi-transparent dark background
        this.tutorialBg = this.add.rectangle(0, 0, w, h, 0x000000, 0.8).setOrigin(0);

        // Panel dimensions and position (taller height)
        const panelWidth = w * 0.75;
        const panelHeight = h * 0.65;   // increased height from 0.5 to 0.65 of game height
        const panelX = (w - panelWidth) / 2;
        const panelY = (h - panelHeight) / 2;

        // Create a graphics object for the panel background (rounded rect)
        this.tutorialPanel = this.add.graphics();

        // Draw rounded rectangle background with fill and stroke
        this.tutorialPanel.fillStyle(0x3a345e, 0.95);
        this.tutorialPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
        this.tutorialPanel.lineStyle(4, 0x6441a5, 1);
        this.tutorialPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);

        // Title text
        this.tutorialTitle = this.add.text(w / 2, panelY + 60, 'Vítej ve hře Email Phishing!', {
            fontSize: '32px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5);

        // Instructions lines
        const instructions = [
            "Úkolem je vybrat podezřelé části e-mailu kliknutím na ně.",
            "",
            "Správné označení či neoznačení části e-mailu ti přinese body.",
            ""
        ];

        let startY = panelY + 140; // shifted down to give more space below title
        this.instructionTexts = [];
        instructions.forEach((line, i) => {
            const t = this.add.text(w / 2, startY + i * 40, line, {  // increased line spacing to 40px
                fontSize: '22px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                wordWrap: { width: panelWidth - 40 },
                align: 'center'
            }).setOrigin(0.5);
            this.instructionTexts.push(t);
        });

        // Button position and dimensions
        const btnWidth = 180;
        const btnHeight = 60;
        const btnX = w / 2 - btnWidth / 2;
        const btnY = panelY + panelHeight - btnHeight - 40;  // moved button further down with more margin

        // Button background graphics
        this.startButtonBg = this.add.graphics();
        this.startButtonBg.fillStyle(0x5a4dcf, 1);
        this.startButtonBg.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);
        this.startButtonBg.lineStyle(3, 0x3a2c8d, 1);
        this.startButtonBg.strokeRoundedRect(btnX, btnY, btnWidth, btnHeight, 15);

        // Button text
        this.startButton = this.add.text(w / 2, btnY + btnHeight / 2, 'Začít hru', {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#1b1164',
            strokeThickness: 4,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Button hover effects
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

        // Button click starts game and destroys tutorial
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

        // Pick random email
        this.currentEmail = Phaser.Utils.Array.GetRandom(this.emails);
        this.correctSuspicious = this.currentEmail.suspicious;

        // Create email parts using current email data
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
        const border = this.add.rectangle(x, y, width, height, 0x3a345e)
            .setOrigin(0)
            .setStrokeStyle(3, 0x6441a5)
            .setInteractive({ useHandCursor: true });

        const text = this.add.text(x + 15, y + 15, content, {
            fontSize: '20px',
            color: '#d8caff',
            wordWrap: { width: width - 30 },
            fontFamily: '"Segoe UI Mono", monospace'
        });

        border.on('pointerdown', () => this.toggleSelection(key, border));
        this.textElements[key] = { text, border };

        // 👇 Fix: Add this line to store parts
        /*if (!this.emailParts) this.emailParts = [];
        this.emailParts.push(border);*/
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

        // If already exists, destroy previous
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

                // Disable further interaction for submit and email parts
                this.submitButton.disableInteractive();
                Object.values(this.textElements).forEach(part => part.border.disableInteractive());

                // Show next game button
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
    
        // Highlight all parts with their result
        ['sender', 'title', 'body'].forEach(part => {
            const border = this.textElements[part].border;
            const isSelected = selected.includes(part);
            const isSuspicious = correctSelections.includes(part);
    
            if (isSuspicious && isSelected) {
                feedback += `✔️ ${part}: ${currentReasons[part] || 'Správně označeno.'}\n`;
                border.setStrokeStyle(4, 0x00ff00); // Green for correct
            } else if (isSuspicious && !isSelected) {
                feedback += `❌ ${part} měl být označen! ${currentReasons[part] || ''}\n`;
                border.setStrokeStyle(4, 0xffff00); // Yellow for missed suspicious
                score--;
            } else if (!isSuspicious && isSelected) {
                feedback += `❌ ${part} neměl být označen.\n`;
                border.setStrokeStyle(4, 0xf50505); // Red for incorrect selection
                score--;
            } else {
                // ✅ Correctly not selected and not suspicious
                border.setStrokeStyle(4, 0x00ff00); // Green for correct non-selection
            }
        });
    
        score = Math.max(0, score);
        this.score += score;
    
        this.showFeedbackWindow(feedback, score);
    }
    
    

    loadNextEmail() {
        this.suspiciousSelections = [];
    
        const remainingEmails = this.emails.filter(e => !this.usedEmails.includes(e));
        if (remainingEmails.length === 0) return;
    
        // 👇 Destroy old text + borders
        for (const key in this.textElements) {
            this.textElements[key].text.destroy();
            this.textElements[key].border.destroy();
        }
        this.textElements = {};
        this.emailParts = [];
    
        this.submitButton.destroy();
        if (this.feedbackContainer) this.feedbackContainer.destroy();
    
        this.currentEmail = Phaser.Utils.Array.GetRandom(remainingEmails);
        this.usedEmails.push(this.currentEmail);
    
        const emailX = 50;
        const emailY = 60;
        const emailWidth = 800;
    
        this.createEmailPart('sender', this.currentEmail.sender, emailX + 20, emailY + 20, emailWidth - 40, 50);
        this.createEmailPart('title', this.currentEmail.title, emailX + 20, emailY + 90, emailWidth - 40, 50);
        this.createEmailPart('body', this.currentEmail.body, emailX + 20, emailY + 160, emailWidth - 40, 160);
    
        // Re-create submit button
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
        if (this.nextGameButton) {
            this.nextGameButton.destroy(); // Remove previous if any
        }

        this.nextGameButton = this.add.text(450, 550, 'Další hra', {
            font: '24px Arial',
            fill: '#fff',
            backgroundColor: '#28a745',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);


        this.nextGameButton.on('pointerdown', () => {
            // Save score to localStorage
            if (localStorage.getItem('playerScore') !== null) {
                // It exists
                let current = parseInt(localStorage.getItem('playerScore'));
                localStorage.setItem('playerScore', current + this.score);
                console.log("Current points:", current + this.score);
            } else {
                // It does not exist yet
                console.log("No points stored yet.");
                localStorage.setItem('playerScore', this.score); // Optionally initialize it
            }
            
            this.score = 0;

            if (this.round < 2) {
                this.round++;
                this.submitButton.setInteractive({ useHandCursor: true });
                Object.values(this.textElements).forEach(part => part.border.setInteractive({ useHandCursor: true }));
                this.nextGameButton.destroy();
                this.loadNextEmail();
            } else {
                // Redirect to next game HTML
                window.location.href = 'endlessRunner.html';
            }
        });
    }



    restartGame() {
        // Clear old email text and borders
        for (const key in this.textElements) {
            this.textElements[key].text.destroy();
            this.textElements[key].border.destroy();
        }
        this.textElements = {};
        this.suspiciousSelections = [];
        this.feedbackText.setText('');

        this.reasonTexts.forEach(t => t.destroy());
        this.reasonTexts = [];


        // Enable submit button again
        this.submitButton.setInteractive({ useHandCursor: true });
        this.submitButton.setAlpha(1);

        // Pick a new email different from current one
        let newEmail;
        do {
            newEmail = Phaser.Utils.Array.GetRandom(this.emails);
        } while (newEmail === this.currentEmail);

        this.currentEmail = newEmail;
        this.correctSuspicious = new Set(this.currentEmail.suspicious);

        // Create email parts for new email
        const emailX = 50;
        const emailY = 60;
        const emailWidth = 800;
        const emailHeight = 320;

        this.createEmailPart('sender', this.currentEmail.sender, emailX + 20, emailY + 20, emailWidth - 40, 50);
        this.createEmailPart('title', this.currentEmail.title, emailX + 20, emailY + 90, emailWidth - 40, 50);
        this.createEmailPart('body', this.currentEmail.body, emailX + 20, emailY + 160, emailWidth - 40, 160);
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

const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    backgroundColor: '#1a1a2e',
    scene: [EmailGameScene]
};

const game = new Phaser.Game(config);
