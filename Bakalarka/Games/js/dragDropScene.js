class CybersecurityScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CybersecurityScene' });

    // Cybersecurity scenarios with 4-5 correct actions in order
    this.scenarios = [
      {
        title: "Your Google Account Was Hacked",
        actions: [
          "Change your password immediately",
          "Check recent login activity",
          "Check for unauthorized emails sent",
          "Review and revoke suspicious app permissions",
          "Enable two-factor authentication"
        ]
      },
      {
        title: "Your Computer Is Infected with Ransomware",
        actions: [
          "Disconnect from the internet",
          "Take screenshots of ransom messages",
          "Check if you have recent backups",
          "Contact cybersecurity professionals"
        ]
      },
      {
        title: "You Received Suspicious Spam Email",
        actions: [
          "Don't click any links or attachments",
          "Report it as spam/phishing",
          "Block the sender",
          "Delete the email"
        ]
      },
      {
        title: "Your Gaming Account Shows Suspicious Activity",
        actions: [
          "Change password from a secure device",
          "Log out from all devices",
          "Check recent purchase history",
          "Review account security settings",
          "Enable two-factor authentication"
        ]
      },
      {
        title: "Unknown Software Installed on Your Computer",
        actions: [
          "Don't run the unknown software",
          "Check when it was installed",
          "Run full antivirus scan",
          "Uninstall suspicious programs",
          "Update your security software"
        ]
      }
    ];
  }

  create() {
    this.showStartMenu();
  }

  showStartMenu() {
    // Create overlay background
    this.overlay = this.add.rectangle(550, 300, 1100, 600, 0x000000, 0.7);

    // Instructions in Czech
    const instructions = "Vítejte ve hře!\n\nDrag akce na správná čísla ve správném pořadí.\n\nKlikněte na 'Začít hru' pro začátek.";

    this.guideText = this.add.text(550, 250, instructions, {
      fontSize: '24px',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: 1000 }
    }).setOrigin(0.5);

    // Start button
    this.startButton = this.add.text(550, 400, 'Začít hru', {
      fontSize: '28px',
      fill: '#fff',
      backgroundColor: '#0066ff',
      padding: { x: 20, y: 10 },
      borderRadius: 10,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.startButton.on('pointerdown', () => {
      // Remove overlay and start game
      this.overlay.destroy();
      this.guideText.destroy();
      this.startButton.destroy();
      this.initGame();
    });
  }

  initGame() {
    this.submitted = false;
    this.actionTexts = [];
    this.originalPositions = new Map();
    this.dropAssignments = [];
    this.score = this.score || 0;

    // Pick a random scenario
    this.currentScenario = Phaser.Utils.Array.GetRandom(this.scenarios);
    this.correctOrder = [...this.currentScenario.actions];
    this.actionCount = this.correctOrder.length;

    // Scramble actions
    const scrambledActions = Phaser.Utils.Array.Shuffle([...this.correctOrder]);

    // Title and subtitle (your existing code)
    this.titleText = this.add.text(550, 40, this.currentScenario.title, {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2,
      align: 'center',
      wordWrap: { width: 800 }
    }).setOrigin(0.5);

    // Define styles for text elements
    const actionStyle = {
      fontSize: '16px',
      fill: '#eee',
      backgroundColor: '#223366',
      padding: { x: 15, y: 10 },
      borderRadius: 8,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2,
    };

    const numberStyle = {
      fontSize: '24px',
      fill: '#ffffff',
      backgroundColor: '#664422',
      padding: { x: 15, y: 12 },
      borderRadius: 10,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
    };

    // Create numbered drop zones and labels
    this.dropZones = [];
    this.dropAssignments = Array(this.actionCount).fill(null);
    this.numberLabels = [];

    const numberX = 60; // X position for number labels
    const zoneX = 200;   // X position for drop zones
    const startY = 140;  // Y start position
    const numberSpacing = 80; // spacing between zones
    const zoneWidth = 350; // width of drop zones
    const zoneHeight = 60; // height of drop zones

    const marginX = 175; // Fixed horizontal margin from number label

    for (let i = 0; i < this.actionCount; i++) {
      const y = startY + i * numberSpacing;

      // Create drop zone
      const zone = this.add.zone(zoneX, y, zoneWidth, zoneHeight)
        .setRectangleDropZone(zoneWidth, zoneHeight);

      // Create number label
      const numberLabel = this.add.text(numberX, y, (i + 1).toString(), numberStyle)
        .setOrigin(0.5);

      this.dropZones.push(zone);
      this.numberLabels.push(numberLabel);
    }

    // Create draggable actions on the right side
    const rightX = 750; // X position for actions
    const actionsStartY = 140;
    const actionSpacing = 80;

    scrambledActions.forEach((action, i) => {
      const x = rightX;
      const y = actionsStartY + i * actionSpacing;
      const actionText = this.add.text(x, y, action, {
        fontSize: '16px',
        fill: '#eee',
        backgroundColor: '#223366',
        padding: { x: 15, y: 10 },
        borderRadius: 8,
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      this.input.setDraggable(actionText);
      this.actionTexts.push(actionText);
      this.originalPositions.set(actionText, { x: actionText.x, y: actionText.y });
    });

    // Drag events
    this.input.on('dragstart', (pointer, gameObject) => {
      gameObject.setStyle({ backgroundColor: '#334477' });
      this.children.bringToTop(gameObject);
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on('dragend', (pointer, gameObject, dropped) => {
      gameObject.setStyle({ backgroundColor: '#223366' });
      if (!dropped) this.returnToOriginal(gameObject);
    });

    this.input.on('drop', (pointer, gameObject, dropZone) => {
      const zoneIndex = this.dropZones.indexOf(dropZone);
      const numberLabel = this.numberLabels[zoneIndex];

      // Remove previous assignment if any
      if (this.dropAssignments[zoneIndex]) {
        this.returnToOriginal(this.dropAssignments[zoneIndex]);
      }

      // Remove any previous assignment of this action
      for (let i = 0; i < this.dropAssignments.length; i++) {
        if (this.dropAssignments[i] === gameObject) {
          this.dropAssignments[i] = null;
        }
      }

      // Assign the current action to this zone
      this.dropAssignments[zoneIndex] = gameObject;

      // Set a fixed margin from the number label
      // Adjust marginX as needed for consistent visual spacing
      const marginX = 175;

      // Position the action relative to the number label
      gameObject.x = numberLabel.x + marginX;
      gameObject.y = numberLabel.y;
    });

    // Submit button
    if (this.submitButton) this.submitButton.destroy();
    this.submitButton = this.add.text(400, 500, "✅ Submit Answer", {
      fontSize: '24px',
      backgroundColor: '#008800',
      color: '#fff',
      padding: { x: 20, y: 12 },
      borderRadius: 10,
      fontStyle: 'bold',
      stroke: '#004400',
      strokeThickness: 3,
    }).setInteractive({ useHandCursor: true }).setOrigin(0.5);

    this.submitButton.on('pointerdown', () => {
      if (!this.submitted) {
        this.checkAnswer();
      }
    });

    // New Game button
    if (this.newGameButton) this.newGameButton.destroy();
    this.newGameButton = this.add.text(650, 500, "🔄 New Scenario", {
      fontSize: '20px',
      backgroundColor: '#0066cc',
      color: '#fff',
      padding: { x: 15, y: 10 },
      borderRadius: 8,
      fontStyle: 'bold',
      stroke: '#003366',
      strokeThickness: 2,
    }).setInteractive({ useHandCursor: true }).setOrigin(0.5);

    this.newGameButton.on('pointerdown', () => {
      this.restartGame();
    });

    // Score display
    if (!this.scoreText) {
      this.scoreText = this.add.text(50, 30, `Score: ${this.score}`, {
        fontSize: '20px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 2,
      });
    } else {
      this.scoreText.setText(`Score: ${this.score}`);
    }

    // Feedback text
    const sceneWidth = this.sys.game.config.width;
    if (!this.feedbackText) {
      this.feedbackText = this.add.text(sceneWidth / 2, 550, '', {
        fontSize: '20px',
        color: '#eee',
        fontStyle: 'bold',
        wordWrap: { width: sceneWidth - 100 },
        align: 'center',
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(0.5);
    } else {
      this.feedbackText.setText('');
    }
  }

  returnToOriginal(action) {
    const pos = this.originalPositions.get(action);
    action.x = pos.x;
    action.y = pos.y;

    for (let i = 0; i < this.dropAssignments.length; i++) {
      if (this.dropAssignments[i] === action) {
        this.dropAssignments[i] = null;
      }
    }
  }

  checkAnswer() {
    const userOrder = this.dropAssignments.map(a => a ? a.text : null);

    // Check if all positions are filled
    if (userOrder.includes(null)) {
      this.feedbackText.setText("⚠️ Please place all actions in the numbered positions.");
      this.feedbackText.setColor('#ffff00');
      this.submitted = false;
      return;
    }

    // Check if order is correct
    if (JSON.stringify(userOrder) === JSON.stringify(this.correctOrder)) {
      this.score += 3;
      this.scoreText.setText(`Score: ${this.score}`);
      this.feedbackText.setText("✅ Correct! You earned 3 points!");
      this.feedbackText.setColor('#00ff00');
    } else {
      this.feedbackText.setText("❌ Correct order is:\n1. " + this.correctOrder.join("\n2. ").replace(/\n2\. /g, function (match, offset) {
        const num = Math.floor(offset / 20) + 2;
        return `\n${num}. `;
      }));
      this.feedbackText.setColor('#ff4444');
    }
    this.submitted = true;
  }

  restartGame() {
    // Clear existing elements
    this.actionTexts.forEach(action => action.destroy());
    this.dropZones.forEach(zone => zone.destroy());
    this.numberLabels.forEach(label => label.destroy());
    this.children.removeAll();

    // Reset arrays
    this.actionTexts = [];
    this.dropZones = [];
    this.numberLabels = [];
    this.originalPositions.clear();

    // Remove all input listeners
    this.input.removeAllListeners();

    // Start new game
    this.initGame();
  }
}

const config = {
  type: Phaser.AUTO,
  width: 1100,
  height: 600,
  backgroundColor: '#1a1a2e',
  scene: [CybersecurityScene]
};

const game = new Phaser.Game(config);