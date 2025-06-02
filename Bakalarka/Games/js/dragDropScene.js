class DragDropScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DragDropScene' });
  }

  create() {
    this.correctOrder = ["Phaser", "makes", "game", "development", "fun"];
    const scrambled = Phaser.Utils.Array.Shuffle([...this.correctOrder]);
    this.wordTexts = [];
    this.originalPositions = new Map();
    this.dropAssignments = Array(this.correctOrder.length).fill(null);
    this.submitted = false;

    const wordStyle = {
      fontSize: '18px',
      fill: '#eee',
      backgroundColor: '#222244',
      padding: { x: 12, y: 8 },
      borderRadius: 6,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
      align: 'center',
    };

    // Create draggable words
    scrambled.forEach((word, i) => {
      const wordText = this.add.text(120 + i * 210, 100, word, wordStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      this.input.setDraggable(wordText);
      this.wordTexts.push(wordText);
      this.originalPositions.set(wordText, { x: wordText.x, y: wordText.y });
    });

    // Drop zones
    this.dropZones = [];
    for (let i = 0; i < this.correctOrder.length; i++) {
      const x = 120 + i * 210;
      const y = 300;
      const zoneWidth = 200;
      const zoneHeight = 80;

      const zone = this.add.zone(x, y, zoneWidth, zoneHeight).setRectangleDropZone(zoneWidth, zoneHeight);
      const graphics = this.add.graphics();
      graphics.lineStyle(3, 0x6666aa, 1);
      graphics.strokeRoundedRect(x - zoneWidth / 2, y - zoneHeight / 2, zoneWidth, zoneHeight, 12);

      this.dropZones.push(zone);
    }

    // Drag events
    this.input.on('dragstart', (pointer, gameObject) => {
      gameObject.setStyle({ backgroundColor: '#444488' });
      this.children.bringToTop(gameObject);
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on('dragend', (pointer, gameObject, dropped) => {
      gameObject.setStyle({ backgroundColor: '#222244' });
      if (!dropped) this.returnToOriginal(gameObject);
    });

    this.input.on('drop', (pointer, gameObject, dropZone) => {
      const zoneIndex = this.dropZones.indexOf(dropZone);

      if (this.dropAssignments[zoneIndex]) {
        this.returnToOriginal(this.dropAssignments[zoneIndex]);
      }

      for (let i = 0; i < this.dropAssignments.length; i++) {
        if (this.dropAssignments[i] === gameObject) {
          this.dropAssignments[i] = null;
        }
      }

      this.dropAssignments[zoneIndex] = gameObject;
      gameObject.x = dropZone.x;
      gameObject.y = dropZone.y;
    });

    // Submit button
    this.submitButton = this.add.text(550, 400, "✅ Odeslat", {
      fontSize: '26px',
      backgroundColor: '#008800',
      color: '#fff',
      padding: { x: 18, y: 12 },
      borderRadius: 8,
      fontStyle: 'bold',
      stroke: '#004400',
      strokeThickness: 4,
    }).setInteractive({ useHandCursor: true }).setOrigin(0.5);

    this.submitButton.on('pointerdown', () => {
      if (!this.submitted) {
        this.checkAnswer();
        this.submitted = true;
      }
    });

    // Reset button
    this.resetButton = this.add.text(750, 400, "🔄 Restart", {
      fontSize: '26px',
      backgroundColor: '#880000',
      color: '#fff',
      padding: { x: 18, y: 12 },
      borderRadius: 8,
      fontStyle: 'bold',
      stroke: '#440000',
      strokeThickness: 4,
    }).setInteractive({ useHandCursor: true }).setOrigin(0.5);

    this.resetButton.on('pointerdown', () => {
      if (!this.submitted) {
        this.resetGame();
      } else {
        this.feedbackText.setText("⚠️ Nelze restartovat, už jsi hru dohrál.");
        this.feedbackText.setColor('#ffcc00');
      }
    });

    // Feedback text
    this.feedbackText = this.add.text(550, 470, '', {
      fontSize: '24px',
      color: '#eee',
      fontStyle: 'bold',
      wordWrap: { width: 900 },
      align: 'center',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  returnToOriginal(word) {
    const pos = this.originalPositions.get(word);
    word.x = pos.x;
    word.y = pos.y;

    for (let i = 0; i < this.dropAssignments.length; i++) {
      if (this.dropAssignments[i] === word) {
        this.dropAssignments[i] = null;
      }
    }
  }

  resetGame() {
    this.wordTexts.forEach(word => this.returnToOriginal(word));
    this.feedbackText.setText('');
    this.submitted = false;
  }

  checkAnswer() {
    const userOrder = this.dropAssignments.map(w => w ? w.text : null);
    if (userOrder.includes(null)) {
      this.feedbackText.setText("⚠️ Umísti všechna slova.");
      this.feedbackText.setColor('#ffff00');
      return;
    }

    if (JSON.stringify(userOrder) === JSON.stringify(this.correctOrder)) {
      this.feedbackText.setText("✅ Správně! Získáváš 1 bod.");
      this.feedbackText.setColor('#00ff00');
    } else {
      this.feedbackText.setText("❌ Správné pořadí je: " + this.correctOrder.join(" "));
      this.feedbackText.setColor('#ff4444');
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 1100,
  height: 550,
  backgroundColor: '#111122',
  scene: [DragDropScene]
};

const game = new Phaser.Game(config);
