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
      this.submitted = false;  // track submission status
  
      const style = {
        fontSize: '16px',
        backgroundColor: '#444',
        color: '#fff',
        padding: { x: 10, y: 6 },
        borderRadius: 4
      };
  
      // Create draggable words
      scrambled.forEach((word, i) => {
        const wordText = this.add.text(120 + i * 205, 100, word, style)
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });
  
        this.input.setDraggable(wordText);
        this.wordTexts.push(wordText);
        this.originalPositions.set(wordText, { x: wordText.x, y: wordText.y });
  
        // Clicking words no longer unplaces, so no pointerdown handler here
      });
  
      // Drop zones (same as before)
      this.dropZones = [];
      for (let i = 0; i < this.correctOrder.length; i++) {
        const x = 120 + i * 205;
        const y = 300;
        const zoneWidth = 200;
        const zoneHeight = 80;
  
        const zone = this.add.zone(x, y, zoneWidth, zoneHeight).setRectangleDropZone(zoneWidth, zoneHeight);
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x00ffff);
        graphics.strokeRoundedRect(x - zoneWidth / 2, y - zoneHeight / 2, zoneWidth, zoneHeight, 10);
  
        this.dropZones.push(zone);
      }
  
      // Drag events (same as before)
      this.input.on('dragstart', (pointer, gameObject) => {
        gameObject.setStyle({ backgroundColor: '#666' });
      });
  
      this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
      });
  
      this.input.on('dragend', (pointer, gameObject, dropped) => {
        gameObject.setStyle({ backgroundColor: '#444' });
        if (!dropped) this.returnToOriginal(gameObject);
      });
  
      this.input.on('drop', (pointer, gameObject, dropZone) => {
        const zoneIndex = this.dropZones.indexOf(dropZone);
  
        // Unplace old word in this zone if needed
        if (this.dropAssignments[zoneIndex]) {
          this.returnToOriginal(this.dropAssignments[zoneIndex]);
        }
  
        // Remove current word from any old zone
        for (let i = 0; i < this.dropAssignments.length; i++) {
          if (this.dropAssignments[i] === gameObject) {
            this.dropAssignments[i] = null;
          }
        }
  
        // Assign and snap to zone
        this.dropAssignments[zoneIndex] = gameObject;
        gameObject.x = dropZone.x;
        gameObject.y = dropZone.y;
      });
  
      // Submit button
      this.submitButton = this.add.text(550, 400, "✅ Odeslat", {
        fontSize: '22px',
        backgroundColor: '#008800',
        color: '#fff',
        padding: { x: 16, y: 8 },
        borderRadius: 5
      }).setInteractive({ useHandCursor: true }).setOrigin(0.5);
  
      this.submitButton.on('pointerdown', () => {
        this.checkAnswer();
        this.submitted = true;  // mark submitted
      });
  
      // Reset button
      this.resetButton = this.add.text(550+180, 400, "🔄 Restart", {
        fontSize: '22px',
        backgroundColor: '#880000',
        color: '#fff',
        padding: { x: 16, y: 8 },
        borderRadius: 5
      }).setInteractive({ useHandCursor: true }).setOrigin(0.5);
  
      this.resetButton.on('pointerdown', () => {
        if (!this.submitted) {
          this.resetGame();
        } else {
          // Optional: feedback if already submitted
          this.feedbackText.setText("⚠️ Nelze restartovat, už jsi hru dohrál.");
          this.feedbackText.setColor('#ffcc00');
        }
      });
  
      this.feedbackText = this.add.text(400, 460, '', {
        fontSize: '20px',
        color: '#fff',
        wordWrap: { width: 1000, useAdvancedWrap: true }, // wrap text nicely within 1000px width
        align: 'center'
      }).setOrigin(0.5, 0);  // center horizontally, align top vertically
      
    }
  
    isInOriginalPosition(word) {
      const orig = this.originalPositions.get(word);
      return word.x === orig.x && word.y === orig.y;
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
      // Return all words to original positions and clear assignments
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
        this.feedbackText.setText(
          "❌ Správné pořadí je: " + this.correctOrder.join(" ")
        );
        this.feedbackText.setColor('#ff0000');
      }
    }
  }
  

const config = {
    type: Phaser.AUTO,
    width: 1100,
    height: 550,
    backgroundColor: '#1d1d1d',
    scene: [DragDropScene]
};

const game = new Phaser.Game(config);
