class EmailGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EmailGameScene' });
    }

    preload() {}

    create() {
        this.suspiciousSelections = [];
        this.correctSuspicious = ['sender', 'title'];
        this.textElements = {};

        // Set camera background
        this.cameras.main.setBackgroundColor('#1e2a38');

        const emailX = 50;
        const emailY = 60;
        const emailWidth = 700;
        const emailHeight = 320;

        // Email background box
        const emailBox = this.add.rectangle(emailX, emailY, emailWidth, emailHeight, 0xffffff)
            .setOrigin(0)
            .setStrokeStyle(2, 0xcccccc);

        // Email content positions (inside the email box!)
        this.createEmailPart('sender', "From: suspicious@example.com", emailX + 10, emailY + 10, emailWidth - 20, 40);
        this.createEmailPart('title', "Subject: Urgent - Please update", emailX + 10, emailY + 60, emailWidth - 20, 40);
        this.createEmailPart('body',
            "Body: Hello,\n\nNot suspicious.\n\nHezký den,\nPetr.",
            emailX + 10, emailY + 110, emailWidth - 20, 160
        );

        // Submit button
        const submitButton = this.add.text(emailX + 10, emailY + emailHeight + 20, "✅ Submit", {
            fontSize: '22px',
            fill: '#ffffff',
            backgroundColor: '#007700',
            padding: { x: 10, y: 6 }
        }).setInteractive();

        submitButton.on('pointerover', () => submitButton.setStyle({ fill: '#ccffcc' }));
        submitButton.on('pointerout', () => submitButton.setStyle({ fill: '#ffffff' }));
        submitButton.on('pointerdown', () => this.checkSelections());

        // Feedback
        this.feedbackText = this.add.text(emailX + 200, emailY + emailHeight + 50, '', {
            fontSize: '22px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });

        // Legend on the right
        this.createLegend(emailX + 350, emailY + emailHeight + 20);
    }

    createEmailPart(key, content, x, y, width, height) {
        const border = this.add.rectangle(x, y, width, height, 0xffffff)
            .setOrigin(0)
            .setStrokeStyle(2, 0xaaaaaa)
            .setInteractive();

        const text = this.add.text(x + 10, y + 10, content, {
            fontSize: '18px',
            color: '#000000',
            wordWrap: { width: width - 20 }
        });

        border.on('pointerdown', () => this.toggleSelection(key, border));
        this.textElements[key] = { text, border };
    }

    toggleSelection(part, borderRect) {
        const isSelected = this.suspiciousSelections.includes(part);
        if (isSelected) {
            this.suspiciousSelections = this.suspiciousSelections.filter(p => p !== part);
            borderRect.setStrokeStyle(2, 0xaaaaaa); // default gray
        } else {
            this.suspiciousSelections.push(part);
            borderRect.setStrokeStyle(3, 0xffa500); // orange
        }
    }

    checkSelections() {
        const correct = new Set(this.correctSuspicious);
        const selected = new Set(this.suspiciousSelections);
    
        let score = 0;
        const maxScore = 3; // Fixed number of parts
    
        for (let key in this.textElements) {
            const { border } = this.textElements[key];
            const isSuspicious = correct.has(key);
            const isSelected = selected.has(key);
    
            if (isSuspicious && isSelected) {
                // Correctly identified suspicious
                border.setStrokeStyle(3, 0x00ff00); // green
                score++;
            } else if (!isSuspicious && !isSelected) {
                // Correctly ignored safe part
                border.setStrokeStyle(3, 0x00ff00); // green
                score++;
            } else if (!isSuspicious && isSelected) {
                // Incorrectly flagged safe part
                border.setStrokeStyle(3, 0x0000ff); // blue
            } else if (isSuspicious && !isSelected) {
                // Missed suspicious part
                border.setStrokeStyle(3, 0xffff00); // yellow
            } else {
                // Default
                border.setStrokeStyle(2, 0xaaaaaa);
            }
        }
    
        this.feedbackText.setText(`Získala si ${score}/${maxScore} bodů.`);
        this.feedbackText.setColor(score === maxScore ? '#00ff00' : '#ffcc00');
    }
    
    

    createLegend(baseX, baseY) {
        const legendX = baseX + 160;  // To the right of the submit button
        const legendY = baseY + 2;
    
        this.add.text(legendX, legendY, "Legenda:", {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
    
        const legendItems = [
            { color: 0x00ff00, label: '✔️ Správně' },
            { color: 0x0000ff, label: '❌ Špatně' },
            { color: 0xffff00, label: '⚠️ Chybělo označit' },
        ];
    
        legendItems.forEach((item, i) => {
            this.add.rectangle(legendX, legendY + 30 + i * 30, 20, 20, 0xffffff)
                .setOrigin(0)
                .setStrokeStyle(3, item.color);
    
            this.add.text(legendX + 30, legendY + 28 + i * 30, item.label, {
                fontSize: '16px',
                fill: '#ffffff'
            });
        });
    }
    
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [EmailGameScene]
};

const game = new Phaser.Game(config);
