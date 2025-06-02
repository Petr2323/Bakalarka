class DragDropScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DragDropScene' });

    // Sentences with up to 5 words
    this.sentences = [
      ["Phaser", "makes", "game", "development", "fun"],
      ["Coding", "is", "like", "solving", "puzzles"],
      ["JavaScript", "rocks", "web", "apps"],
      ["Drag", "and", "drop", "games"],
      ["Practice", "helps", "you", "improve", "skills"],
      ["Keep", "learning"],
      ["Good", "luck"]
    ];

    // Filter sentences with <= 5 words only
    this.sentences = this.sentences.filter(sentence => sentence.length <= 5);
  }

  create() {
    this.initGame();
  }

  initGame() {
    this.submitted = false;
    this.wordTexts = [];
    this.originalPositions = new Map();
    this.dropAssignments = [];

    // Pick random sentence (<= 5 words)
    this.correctOrder = Phaser.Utils.Array.GetRandom(this.sentences);
    this.wordCount = this.correctOrder.length;

    // Scramble words
    const scrambled = Phaser.Utils.Array.Shuffle([...this.correctOrder]);

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

    // Calculate spacing dynamically based on word count
    const sceneWidth = this.sys.game.config.width;
    const marginX = 50;
    const availableWidth = sceneWidth - marginX * 2;
    const spacingX = availableWidth / this.wordCount;

    // Create draggable words evenly spaced horizontally
    scrambled.forEach((word, i) => {
      const x = marginX + spacingX * i + spacingX / 2;
      const y = 100;

      const wordText = this.add.text(x, y, word, wordStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      this.input.setDraggable(wordText);
      this.wordTexts.push(wordText);
      this.originalPositions.set(wordText, { x: wordText.x, y: wordText.y });
    });

    // Create drop zones spaced evenly at y=300
    this.dropZones = [];
    this.dropAssignments = Array(this.wordCount).fill(null);

    for (let i = 0; i < this.wordCount; i++) {
      const x = marginX + spacingX * i + spacingX / 2;
      const y = 300;
      const zoneWidth = Math.min(200, spacingX * 0.8); // max 200px, else smaller if spacing is less
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

      // Return previous word if zone occupied
      if (this.dropAssignments[zoneIndex]) {
        this.returnToOriginal(this.dropAssignments[zoneIndex]);
      }

      // Remove word from previous drop assignment
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
    if (this.submitButton) this.submitButton.destroy();
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
      }
    });
    

    // Feedback text
    if (!this.feedbackText) {
      this.feedbackText = this.add.text(sceneWidth / 2, 470, '', {
        fontSize: '24px',
        color: '#eee',
        fontStyle: 'bold',
        wordWrap: { width: sceneWidth - 100 },
        align: 'center',
        stroke: '#000',
        strokeThickness: 3,
      }).setOrigin(0.5);
    } else {
      this.feedbackText.setText('');
    }
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

  checkAnswer() {
    const userOrder = this.dropAssignments.map(w => w ? w.text : null);
    if (userOrder.includes(null)) {
      this.feedbackText.setText("⚠️ Umísti všechna slova.");
      this.feedbackText.setColor('#ffff00');
      this.submitted = false;
      return;
    }

    if (JSON.stringify(userOrder) === JSON.stringify(this.correctOrder)) {
      this.feedbackText.setText("✅ Správně! Získáváš 1 bod.");
      this.feedbackText.setColor('#00ff00');
    } else {
      this.feedbackText.setText("❌ Správné pořadí je: " + this.correctOrder.join(" "));
      this.feedbackText.setColor('#ff4444');
    }
    this.submitted = true;  // mark as submitted only after all words placed and answer checked
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
