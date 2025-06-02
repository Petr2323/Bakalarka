class QuizFightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'QuizFightScene' });
  }

  preload() {
    // No assets needed
  }

  create() {
    this.playerHealth = 3;
    this.opponentHealth = 3;
    this.maxHealth = 3;
    this.options = [];


    this.graphics = this.add.graphics();

    // Background panel for game area
    this.add.rectangle(400, 300, 780, 580, 0x111122).setStrokeStyle(3, 0x6666aa, 1);

    // Player and opponent rectangles (stylish with stroke)
    this.player = this.add
      .rectangle(150, 400, 120, 120, 0x00aa00)
      .setStrokeStyle(4, 0x00ff00);
    this.opponent = this.add
      .rectangle(650, 400, 120, 120, 0xaa0000)
      .setStrokeStyle(4, 0xff0000);

    // Player and opponent labels
    this.add.text(this.player.x, this.player.y + 80, 'HRÁČ', {
      fontSize: '22px',
      fill: '#00ff00',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(this.opponent.x, this.opponent.y + 80, 'BOSS', {
      fontSize: '22px',
      fill: '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.updateHealthBars();

    // Question bank
    this.questionBank = [
      {
        question: "What is the capital of France?",
        options: { A: "Paris", B: "London", C: "Berlin" },
        correct: "A"
      },
      {
        question: "What is 5 + 7?",
        options: { A: "12", B: "10", C: "14" },
        correct: "A"
      },
      {
        question: "Which planet is known as the Red Planet?",
        options: { A: "Venus", B: "Mars", C: "Jupiter" },
        correct: "B"
      },
      {
        question: "What is the largest ocean on Earth?",
        options: { A: "Atlantic", B: "Indian", C: "Pacific" },
        correct: "C"
      },
      {
        question: "Who wrote 'Romeo and Juliet'?",
        options: { A: "Shakespeare", B: "Dickens", C: "Tolstoy" },
        correct: "A"
      }
    ];

    this.shuffleQuestions();
    this.currentQuestionIndex = 0;

    this.input.enabled = true;
    this.showQuestion();
  }

  shuffleQuestions() {
    // Fisher-Yates shuffle
    for (let i = this.questionBank.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [this.questionBank[i], this.questionBank[j]] = [this.questionBank[j], this.questionBank[i]];
    }
  }

  updateHealthBars() {
    this.graphics.clear();

    const barWidth = 150;
    const barHeight = 20;
    const padding = 5;

    // Player health bar above player
    let playerX = this.player.x - barWidth / 2;
    let playerY = this.player.y - this.player.height / 2 - 30;

    // Background bar
    this.graphics.fillStyle(0x222222, 1);
    this.graphics.fillRect(playerX, playerY, barWidth, barHeight);
    // Health fill
    this.graphics.fillStyle(0x00ff00, 1);
    this.graphics.fillRect(
      playerX + padding,
      playerY + padding,
      (barWidth - padding * 2) * (this.playerHealth / this.maxHealth),
      barHeight - padding * 2
    );

    // Opponent health bar above opponent
    let oppX = this.opponent.x - barWidth / 2;
    let oppY = this.opponent.y - this.opponent.height / 2 - 30;

    this.graphics.fillStyle(0x222222, 1);
    this.graphics.fillRect(oppX, oppY, barWidth, barHeight);
    this.graphics.fillStyle(0xff4444, 1);
    this.graphics.fillRect(
      oppX + padding,
      oppY + padding,
      (barWidth - padding * 2) * (this.opponentHealth / this.maxHealth),
      barHeight - padding * 2
    );

    // Bring graphics above background but below text/buttons
    this.children.bringToTop(this.graphics);
  }

  showQuestion() {
    // Destroy previous question text
    if (this.questionText) {
      this.questionText.destroy();
    }

    // Destroy all old options
    this.options.forEach(opt => {
      if (opt) opt.destroy();
    });
    this.options = [];

    // If no more questions, end game
    if (this.currentQuestionIndex >= this.questionBank.length) {
      this.endGame(true);
      return;
    }

    this.currentQuestion = this.questionBank[this.currentQuestionIndex];

    // Show question text
    this.questionText = this.add.text(50, 50, this.currentQuestion.question, {
      fontSize: '24px',
      fill: '#ccc',
      fontStyle: 'bold',
      wordWrap: { width: 700 }
    });

    // Style for options
    const optionStyle = {
      fontSize: '22px',
      fill: '#fff',
      backgroundColor: '#222244',
      padding: { x: 10, y: 6 },
      borderRadius: 6,
      fontStyle: 'bold'
    };

    // Create new options and store references
    this.optionA = this.add.text(50, 110, "A: " + this.currentQuestion.options.A, optionStyle).setInteractive({ useHandCursor: true });
    this.optionB = this.add.text(50, 160, "B: " + this.currentQuestion.options.B, optionStyle).setInteractive({ useHandCursor: true });
    this.optionC = this.add.text(50, 210, "C: " + this.currentQuestion.options.C, optionStyle).setInteractive({ useHandCursor: true });

    this.options = [this.optionA, this.optionB, this.optionC];

    this.optionA.on('pointerdown', () => this.handleAnswer("A"));
    this.optionB.on('pointerdown', () => this.handleAnswer("B"));
    this.optionC.on('pointerdown', () => this.handleAnswer("C"));
  }



  resetOptionStyles() {
    const defaultStyle = {
      fill: '#fff',
      backgroundColor: '#222244',
    };
    [this.optionA, this.optionB, this.optionC].forEach(opt => {
      opt.setStyle({
        fill: defaultStyle.fill,
        backgroundColor: defaultStyle.backgroundColor,
      });
    });
  }


  handleAnswer(selected) {
    if (!this.input.enabled) return;
    this.input.enabled = false;

    // Highlight answers: green correct, red others
    [this.optionA, this.optionB, this.optionC].forEach(opt => {
      if (opt.text.startsWith(selected)) {
        opt.setStyle({ backgroundColor: selected === this.currentQuestion.correct ? '#006600' : '#660000' });
      } else if (opt.text.startsWith(this.currentQuestion.correct)) {
        opt.setStyle({ backgroundColor: '#006600' });
      } else {
        opt.setStyle({ backgroundColor: '#222244' });
      }
    });

    // Show feedback text above player (green or red)
    const correct = selected === this.currentQuestion.correct;
    this.showFeedbackText(correct ? "Správně!" : "Špatně!", correct ? '#00ff00' : '#ff0000', this.player.x, this.player.y - this.player.height / 2 - 60, () => {
      if (correct) {
        this.opponentHealth--;
        this.updateHealthBars();
        this.attackOpponent(() => this.checkGameStatus());
      } else {
        this.playerHealth--;
        this.updateHealthBars();
        this.attackPlayer(() => this.checkGameStatus());
      }
    });
  }

  showFeedbackText(text, color, x, y, callback) {
    let feedback = this.add.text(x, y, text, {
      fontSize: '24px',
      fill: color,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      feedback.destroy();
      callback();
    });
  }

  attackOpponent(callback) {
    let attackText = this.add.text(this.opponent.x, this.opponent.y - this.opponent.height / 2 - 50, "Hráč útočí!", {
      fontSize: '20px',
      fill: '#0f0',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: attackText,
      y: attackText.y - 20,
      alpha: { from: 1, to: 0 },
      duration: 1000,
      ease: 'Power1',
      onComplete: () => {
        attackText.destroy();
        callback();
      }
    });
  }

  attackPlayer(callback) {
    let attackText = this.add.text(this.player.x, this.player.y - this.player.height / 2 - 50, "Boss útočí!", {
      fontSize: '20px',
      fill: '#f00',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: attackText,
      y: attackText.y - 20,
      alpha: { from: 1, to: 0 },
      duration: 1000,
      ease: 'Power1',
      onComplete: () => {
        attackText.destroy();
        callback();
      }
    });
  }

  checkGameStatus() {
    if (this.playerHealth <= 0) {
      this.endGame(false);
    } else if (this.opponentHealth <= 0) {
      this.endGame(true);
    } else {
      this.currentQuestionIndex++;
      this.input.enabled = true;
      this.showQuestion();
    }
  }

  endGame(playerWon) {
    const message = playerWon ? "Gratuluji! Získáváš 3 body." : "Prohrál jsi!";

    this.add.text(400, 300, message, {
      fontSize: '36px',
      fill: '#fff',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.input.enabled = false;

    this.time.delayedCall(3000, () => {
      this.scene.restart();
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  scene: [QuizFightScene]
};

const game = new Phaser.Game(config);
