class EmailGameScene extends Phaser.Scene {
  constructor() {
      super({ key: 'EmailGameScene' });
  }

  preload() {
      // Load any assets (images, custom fonts, etc.) if needed.
  }

  create() {
      // Create email layout elements.
      this.suspiciousSelections = [];
      this.feedbackText = this.add.text(50, 350, '', { fontSize: '20px', fill: '#fff' });

      // Display sender text.
      let senderText = this.add.text(50, 50, "From: suspicious@example.com", { fontSize: '20px', fill: '#fff' });
      senderText.setInteractive();
      senderText.on('pointerdown', () => { this.toggleSelection('sender', senderText); });

      // Display title/subject text.
      let titleText = this.add.text(50, 100, "Subject: Urgent - Please update", { fontSize: '20px', fill: '#fff' });
      titleText.setInteractive();
      titleText.on('pointerdown', () => { this.toggleSelection('title', titleText); });

      // Display body text.
      let bodyText = this.add.text(50, 150, "Body: This email contains a link that might be dangerous.", {
          fontSize: '20px',
          fill: '#fff',
          wordWrap: { width: 700 }
      });
      bodyText.setInteractive();
      bodyText.on('pointerdown', () => { this.toggleSelection('body', bodyText); });

      // Create a submit button.
      let submitButton = this.add.text(50, 300, "Submit", { fontSize: '20px', fill: '#0f0' });
      submitButton.setInteractive();
      submitButton.on('pointerdown', () => { this.checkSelections(); });
  }

  toggleSelection(part, textObject) {
      // Toggle visual feedback (e.g., tint) and add/remove the selection.
      if (this.suspiciousSelections.includes(part)) {
          this.suspiciousSelections = this.suspiciousSelections.filter(p => p !== part);
          textObject.clearTint();
      } else {
          this.suspiciousSelections.push(part);
          textObject.setTint(0xff0000);
      }
      console.log("Selected parts:", this.suspiciousSelections);
  }

  checkSelections() {
      // Define which parts are actually suspicious.
      let correctSuspicious = ['sender', 'title'];

      // Compare sorted arrays (a simple check—consider more robust methods in a full project).
      let isCorrect = JSON.stringify(this.suspiciousSelections.sort()) === JSON.stringify(correctSuspicious.sort());

      if (isCorrect) {
          console.log("Correct selection!");
          this.feedbackText.setText("✅ Correct selection!");
          this.feedbackText.setColor('#0f0');
      } else {
          console.log("Incorrect selection. Try again.");
          this.feedbackText.setText("❌ Incorrect selection. Try again.");
          this.feedbackText.setColor('#f00');
      }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#222',
  scene: [EmailGameScene]
};

const game = new Phaser.Game(config);