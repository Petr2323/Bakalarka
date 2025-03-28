class DragDropScene extends Phaser.Scene {
  constructor() {
      super({ key: 'DragDropScene' });
  }

  preload() {
      // Load assets if required.
  }

  create() {
      // Define the correct sentence order.
      this.correctOrder = ["Phaser", "makes", "game", "development", "fun"];
      
      // Shuffle the words.
      let scrambled = Phaser.Utils.Array.Shuffle([...this.correctOrder]);
      this.wordTexts = [];

      // Create draggable text objects.
      scrambled.forEach((word, index) => {
          let wordText = this.add.text(100 + index * 100, 200, word, { fontSize: '20px', fill: '#fff' });
          wordText.setInteractive();
          this.input.setDraggable(wordText);
          this.wordTexts.push(wordText);
      });

      // Create drop zones where words should be placed.
      this.dropZones = [];
      for (let i = 0; i < this.correctOrder.length; i++) {
          let zone = this.add.zone(100 + i * 100, 400, 80, 40).setRectangleDropZone(80, 40);
          // Optional: Draw a rectangle to visualize the zone.
          let graphics = this.add.graphics();
          graphics.lineStyle(2, 0xff0000);
          graphics.strokeRect(zone.x - 40, zone.y - 20, 80, 40);
          this.dropZones.push(zone);
      }

      // Set up drag events.
      this.input.on('dragstart', (pointer, gameObject) => {
          gameObject.setTint(0xff0000);
      });

      this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
          gameObject.x = dragX;
          gameObject.y = dragY;
      });

      this.input.on('dragend', (pointer, gameObject, dropped) => {
          gameObject.clearTint();
          if (!dropped) {
              // Return to original position if not dropped in a zone.
              gameObject.x = gameObject.input.dragStartX;
              gameObject.y = gameObject.input.dragStartY;
          }
      });

      this.input.on('drop', (pointer, gameObject, dropZone) => {
          // Snap the word to the center of the drop zone.
          gameObject.x = dropZone.x - gameObject.width / 2;
          gameObject.y = dropZone.y - gameObject.height / 2;
          gameObject.setData('droppedIndex', this.dropZones.indexOf(dropZone));

          // Once all words are placed, check the order.
          if (this.allWordsDropped()) {
              this.checkOrder();
          }
      }, this);

      // Provide feedback text.
      this.feedbackText = this.add.text(300, 500, '', { fontSize: '24px', fill: '#fff' });
  }

  allWordsDropped() {
      return this.wordTexts.every(word => word.getData('droppedIndex') !== undefined);
  }

  checkOrder() {
      // Sort the words based on the drop zone order.
      let order = this.wordTexts
          .slice()
          .sort((a, b) => a.getData('droppedIndex') - b.getData('droppedIndex'))
          .map(word => word.text);

      // Check if the order is correct.
      if (JSON.stringify(order) === JSON.stringify(this.correctOrder)) {
          this.feedbackText.setText("✅ Correct Order!");
          this.feedbackText.setColor("#0f0");
      } else {
          this.feedbackText.setText("❌ Incorrect Order. Try Again.");
          this.feedbackText.setColor("#f00");
      }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#222',
  scene: [DragDropScene]
};

const game = new Phaser.Game(config);
