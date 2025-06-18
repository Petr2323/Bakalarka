class QuizFightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'QuizFightScene' });
  }

  preload() {
    this.load.spritesheet('playerM', 'assets/player_tilesheet.png', {
      frameWidth: 80,
      frameHeight: 110
    });
    this.load.spritesheet('playerF', 'assets/female_tilesheet.png', {
      frameWidth: 80,
      frameHeight: 110
    });
    this.load.spritesheet('boss', 'assets/zombie_tilesheet.png', {
      frameWidth: 80,
      frameHeight: 110
    });
  }

  drawTimerIcon() {
    const g = this.timerIcon;
    g.clear();

    // Draw circle for clock face
    g.lineStyle(3, 0xffff00);
    g.fillStyle(0x333300, 1);
    g.fillCircle(25, 25, 20);
    g.strokeCircle(25, 25, 20);

    // Draw clock hands
    g.lineStyle(3, 0xffff00);
    // Hour hand (pointing at 12)
    g.beginPath();
    g.moveTo(25, 25);
    g.lineTo(25, 12);
    g.strokePath();

    // Minute hand (pointing at 3)
    g.beginPath();
    g.moveTo(25, 25);
    g.lineTo(38, 25);
    g.strokePath();
  }


  create() {
    // Initialize game state but DON'T start the game yet
    this.playerHealth = 3;
    this.opponentHealth = 3;
    this.maxHealth = 3;
    this.options = [];
    this.currentQuestionIndex = 0;
    this.selectedCharacter = null;


    this.graphics = this.add.graphics();

    // Background panel for game area
    this.add.rectangle(400, 300, 780, 580, 0x111122).setStrokeStyle(3, 0x6666aa, 1);

    this.opponent = this.add.sprite(650, 400, 'boss').setOrigin(0.5, 0.5)
      .setFrame(0)
      .setScale(1)
      .setDepth(2);

    this.opponent.setFlipX(true); // face right
    this.opponent.setVisible(false);

    // Timer icon positioned left
    this.timerIcon = this.add.graphics({ x: 350, y: 340 });
    this.drawTimerIcon();

    // Timer numeric text right next to icon, aligned vertically center
    this.timerText = this.add.text(400, 365, '15', {
      fontSize: '28px',
      fill: '#ffff66',
      fontStyle: 'bold',
      stroke: '#333300',
      strokeThickness: 3,
    }).setOrigin(0, 0.5);

    // Question bank (unchanged)
    // Question bank
    this.questionBank = [
      {
        question: "Co je phishing?",
        options: {
          A: "Podvodné pokusy získat osobní údaje přes e-mail, zprávy nebo web",
          B: "Rybaření se speciálním prutem",
          C: "Podvodné pokusy s cílem změnit hesla v počítači"
        },
        correct: "A"
      },
      {
        question: "Jaké jsou nejčastější cíle ransomwaru?",
        options: {
          A: "Získat osobní údaje",
          B: "Uzamknout počítač a žádat výkupné za odemčení",
          C: "Uzamknout počítač navždy"
        },
        correct: "B"
      },
      {
        question: "Co je spam?",
        options: {
          A: "Nechtěné nebo nevyžádané e-maily či zprávy",
          B: "Důležité e-maily či zprávy",
          C: "Podvodná webová stránka s cílem získat údaje od uživatele"
        },
        correct: "A"
      },
      {
        question: "Co je trojský kůň v kybernetice?",
        options: {
          A: "Malware, který se skrývá jen ve videohrách a škodí počítači",
          B: "Speciální typ antiviru",
          C: "Malware, který se tváří jako aplikace, ale škodí počítači"
        },
        correct: "C"
      },
      {
        question: "Jak se můžeme chránit před kybernetickými hrozbami?",
        options: {
          A: "Používat silná hesla a aktualizovat software",
          B: "Používat silná hesla a aktualizovat software jednou za půl roku",
          C: "Používat stejné heslo na všech účtech"
        },
        correct: "A"
      },
      {
        question: "Proč je důležité mít aktualizovaný antivirový program?",
        options: {
          A: "Zlepšuje rychlost počítače",
          B: "Pomáhá odhalit a odstranit škodlivý software",
          C: "Zvyšuje kvalitu připojení k internetu"
        },
        correct: "B"
      },
      {
        question: "Co bys měl udělat, když dostaneš podezřelý e-mail?",
        options: {
          A: "Otevřít ho a kliknout na odkazy",
          B: "Označit ho jako spam nebo ho smazat",
          C: "Poslat ho kamarádovi"
        },
        correct: "B"
      },
      {
        question: "Co je silné heslo?",
        options: {
          A: "Jednoduché a snadno zapamatovatelné",
          B: "Dlouhé a obsahuje různé čísla a velikosti písmen",
          C: "Dlouhé a obsahuje různé znaky, čísla a písmena"
        },
        correct: "C"
      },
      {
        question: "Proč je důležité nesdílet své heslo s ostatními?",
        options: {
          A: "Protože by mohli získat přístup k tvému účtu",
          B: "Protože heslo je tajné a nikdo ho nesmí znát",
          C: "Obojí je správně"
        },
        correct: "C"
      },
      {
        question: "Co znamená, když ti někdo nabízí 'dárky zdarma' na internetu?",
        options: {
          A: "Je to běžná nabídka, kterou můžeš využít",
          B: "Může jít o podvod nebo pokus o získání tvých osobních informací",
          C: "Vždy je to bezpečné a ověřené"
        },
        correct: "B"
      }
    ];

    this.shuffleQuestions();

    // Show start screen message & start button before game begins
    this.showStartMenu();
  }

  showStartMenu() {
    this.overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 1);

    this.startPanel = this.add.rectangle(400, 300, 700, 420, 0x222244, 0.85);
    this.startPanel.setStrokeStyle(3, 0x6666aa);

    const startMessage = "Vítejte v kvízové soubojové hře!\n\nVyberte postavu a začněte hru!";
    this.startText = this.add.text(400, 180, startMessage, {
      fontSize: '24px',
      fill: '#ffffff',
      align: 'center',
      fontStyle: 'bold',
      wordWrap: { width: 650 },
    }).setOrigin(0.5);

    // Character Selection Sprites
    const male = this.add.sprite(300, 280, 'playerM', 0).setScale(1).setInteractive({ useHandCursor: true });
    const female = this.add.sprite(500, 280, 'playerF', 0).setScale(1).setInteractive({ useHandCursor: true });

    // Selection outline
    const selectionOutline = this.add.graphics();
    const drawOutline = (sprite) => {
      selectionOutline.clear();
      selectionOutline.lineStyle(4, 0xffff00);
      selectionOutline.strokeRect(sprite.x - sprite.width / 2, sprite.y - sprite.height / 2, sprite.width, sprite.height);
    };

    male.on('pointerdown', () => {
      this.selectedCharacter = 'playerM';
      drawOutline(male);
    });

    female.on('pointerdown', () => {
      this.selectedCharacter = 'playerF';
      drawOutline(female);
    });

    this.startButton = this.add.text(400, 390, "Začít hru", {
      fontSize: '32px',
      fill: '#ffffff',
      backgroundColor: '#1a73e8',
      padding: { x: 24, y: 12 },
      fontStyle: 'bold',
      stroke: '#0c47a1',
      strokeThickness: 3,
      borderRadius: 12,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Add a variable to store the warning text
    this.characterWarningText = null;

    this.startButton.on('pointerdown', () => {
      if (!this.selectedCharacter) {
        // If warning doesn't exist yet, show it
        if (!this.characterWarningText) {
          this.characterWarningText = this.add.text(400, 430, "Vyber si postavu před začátkem!", {
            fontSize: '20px',
            fill: '#ffaaaa',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
          }).setOrigin(0.5).setDepth(10);
        }
        return;
      }

      // ✅ Destroy warning text if it exists
      if (this.characterWarningText) {
        this.characterWarningText.destroy();
        this.characterWarningText = null;
      }

      this.overlay.destroy();
      this.startPanel.destroy();
      this.startText.destroy();
      this.startButton.destroy();
      male.destroy();
      female.destroy();
      selectionOutline.destroy();

      this.startGame();
    });

  }




  startGame() {
    console.log("Game started!");

    // Now that selectedCharacter is defined, create player sprite here
    this.player = this.add.sprite(150, 400, this.selectedCharacter)
      .setOrigin(0.5, 0.5)
      .setFrame(0)
      .setScale(1)
      .setDepth(2);
    this.player.setVisible(true);

    this.opponent.setVisible(true);

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

    this.shuffleQuestions();
    this.input.enabled = true;
    this.currentQuestionIndex = 0;
    this.playerHealth = this.maxHealth;
    this.opponentHealth = this.maxHealth;
    this.updateHealthBars();
    this.showQuestion();
  }


  shuffleQuestions() {
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

    this.graphics.fillStyle(0x222222, 1);
    this.graphics.fillRect(playerX, playerY, barWidth, barHeight);
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

    this.children.bringToTop(this.graphics);
  }

  showQuestion() {
    // Destroy previous question & options if they exist
    if (this.questionText) this.questionText.destroy();
    this.options.forEach(opt => opt && opt.destroy());
    this.options = [];

    // Clear any previous timer event
    if (this.timerEvent) this.timerEvent.remove();

    if (this.currentQuestionIndex >= this.questionBank.length) {
      this.endGame(true);
      return;
    }

    this.currentQuestion = this.questionBank[this.currentQuestionIndex];

    // Show question text smaller so it fits
    this.questionText = this.add.text(50, 50, this.currentQuestion.question, {
      fontSize: '20px',
      fill: '#ccc',
      fontStyle: 'bold',
      wordWrap: { width: 700 }
    });

    // Option style smaller
    const optionStyle = {
      fontSize: '18px',
      fill: '#fff',
      backgroundColor: '#222244',
      padding: { x: 8, y: 5 },
      borderRadius: 6,
      fontStyle: 'bold'
    };

    // Create options with smaller spacing for better fit
    this.optionA = this.add.text(50, 110, "A: " + this.currentQuestion.options.A, optionStyle).setInteractive({ useHandCursor: true });
    this.optionB = this.add.text(50, 150, "B: " + this.currentQuestion.options.B, optionStyle).setInteractive({ useHandCursor: true });
    this.optionC = this.add.text(50, 190, "C: " + this.currentQuestion.options.C, optionStyle).setInteractive({ useHandCursor: true });

    this.options = [this.optionA, this.optionB, this.optionC];

    this.optionA.on('pointerdown', () => this.handleAnswer("A"));
    this.optionB.on('pointerdown', () => this.handleAnswer("B"));
    this.optionC.on('pointerdown', () => this.handleAnswer("C"));

    // Start 15-second countdown timer
    this.startTimer(15);
  }

  startTimer(seconds) {
    this.timeLeft = seconds;
    this.timerText.setText(`${this.timeLeft}s`);

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: seconds - 1,
      callback: () => {
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}s`);
        if (this.timeLeft <= 0) {
          this.timerExpired();
        }
      }
    });
  }

  timerExpired() {
    this.input.enabled = false;

    // Highlight correct answer only
    [this.optionA, this.optionB, this.optionC].forEach(opt => {
      if (opt.text.startsWith(this.currentQuestion.correct)) {
        opt.setStyle({ backgroundColor: '#006600' });
      } else {
        opt.setStyle({ backgroundColor: '#660000' });
      }
    });

    this.showFeedbackText("Čas vypršel!", '#ffcc00', this.player.x, this.player.y - this.player.height / 2 - 60, () => {
      this.playerHealth--;
      this.updateHealthBars();
      this.attackPlayer(() => this.checkGameStatus());
    });
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

    // Stop timer if active
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerText.setText('');
    }

    [this.optionA, this.optionB, this.optionC].forEach(opt => {
      if (opt.text.startsWith(selected)) {
        opt.setStyle({ backgroundColor: selected === this.currentQuestion.correct ? '#006600' : '#660000' });
      } else if (opt.text.startsWith(this.currentQuestion.correct)) {
        opt.setStyle({ backgroundColor: '#006600' });
      } else {
        opt.setStyle({ backgroundColor: '#222244' });
      }
    });

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
    let originalX = this.player.x;
    let originalFrame = this.player.frame.name; // or frame.index, usually frame.name or frame.index

    // Change player frame to attack frame (assuming 1 is attack)
    this.player.setFrame(1);
    this.opponent.setFrame(2);

    // Tween player moving right by 20 pixels
    this.tweens.add({
      targets: this.player,
      x: originalX + 20,
      duration: 300,
      yoyo: true,
      ease: 'Power1',
      onComplete: () => {
        // Reset player frame and position
        this.player.setFrame(originalFrame);
        this.player.x = originalX;
        this.opponent.setFrame(0);

        // Show attack text animation
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
    });
  }


  attackPlayer(callback) {
    let originalX = this.opponent.x;
    let originalFrame = this.opponent.frame.name;

    // Change player frame to attack frame (e.g. frame 1)
    this.opponent.setFrame(1);
    this.player.setFrame(2);

    // Tween player moving right by 20 pixels
    this.tweens.add({
      targets: this.opponent,
      x: originalX - 20,
      duration: 300,
      yoyo: true,
      ease: 'Power1',
      onComplete: () => {
        // Reset player frame and position
        this.opponent.setFrame(originalFrame);
        this.opponent.x = originalX;
        this.player.setFrame(0);

        // Show attack text animation
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
            if (callback) callback();
          }
        });
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
      this.resetOptionStyles();
      this.showQuestion();
    }
  }

  endGame(playerWon) {
    this.input.enabled = false;
    this.timerText.setText('');
    this.questionText && this.questionText.destroy();
    this.options.forEach(opt => opt && opt.destroy());
    this.timerIcon.destroy();

    if (playerWon) {
      //When player wins:
      this.player.setFrame(8);
      this.opponent.setFrame(4);
    } else {
      // When player loses:
      this.player.setFrame(4);
      this.opponent.setFrame(8);
    }
    let endText = playerWon ? "Vyhrál jsi! Získal jsi 3 body." : "Prohrál jsi, nezískáváš žádný bod!";
    let color = playerWon ? '#00ff00' : '#ff0000';

    let message = this.add.text(400, 200, endText, {
      fontSize: '36px',
      fill: color,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Add restart button
    let restartButton = this.add.text(400, 380, "Restartovat", {
      fontSize: '28px',
      fill: '#fff',
      backgroundColor: '#4444aa',
      padding: { x: 20, y: 10 },
      fontStyle: 'bold',
      stroke: '#222266',
      strokeThickness: 3,
      borderRadius: 8,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartButton.on('pointerdown', () => {
      message.destroy();
      restartButton.destroy();
      this.startGame();
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
