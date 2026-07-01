class QuizFightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'QuizFightScene' });

    // Inicializace Supabase klienta
    const SUPABASE_URL = 'https://fejkfjyoqrnqryqrlljy.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlamtmanlvcXJucXJ5cXJsbGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODI2MzMsImV4cCI6MjA5Nzg1ODYzM30.nVWNax8d5R3gVVSDfj8pyIpoaN4m9JWiIoRM8MkRF0E';
    this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    this.questionBank = [];
  }

  loadFallbackQuestions() {
    console.warn('Používám lokální fallback otázky.');
    this.questionBank = [
      {
        question: "Co je to phishing?",
        options: { A: "Typ rybaření", B: "Podvodný e-mail, zpráva či web", C: "Bezpečnostní software" },
        correct: "B"
      },
      {
        question: "Jak vytvořit silné heslo?",
        options: { A: "Použít jméno psa", B: "Kombinace znaků a čísel", C: "Kombinace znaků, čísel a symbolů" },
        correct: "C"
      },
      {
        question: "Co dělat, když vidím podezřelý odkaz?",
        options: { A: "Kliknout na něj", B: "Ignorovat ho", C: "Nahlásit jako spam" },
        correct: "C"
      },
      {
        question: "Který údaj byste nikdy neměli sdílet online?",
        options: { A: "Heslo", B: "Oblíbenou barvu", C: "Typ operačního systému" },
        correct: "A"
      },
      {
        question: "Co znamená zkratka 2FA?",
        options: { A: "Dvě falešné adresy", B: "Dvoufázové ověření", C: "Druhá firewall analýza" },
        correct: "B"
      },
      {
        question: "K čemu slouží antivirus?",
        options: { A: "K zrychlení internetu", B: "K detekci škodlivého softwaru", C: "Jako kapesník, když má PC rýmu" },
        correct: "B"
      }
    ];
    this.shuffleQuestions();
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

    g.lineStyle(3, 0xffff00);
    g.fillStyle(0x333300, 1);
    g.fillCircle(25, 25, 20);
    g.strokeCircle(25, 25, 20);

    g.lineStyle(3, 0xffff00);
    g.beginPath();
    g.moveTo(25, 25);
    g.lineTo(25, 12);
    g.strokePath();

    g.beginPath();
    g.moveTo(25, 25);
    g.lineTo(38, 25);
    g.strokePath();
  }

  async create() {
    this.playerHealth = 3;
    this.opponentHealth = 3;
    this.maxHealth = 3;
    this.options = [];
    this.currentQuestionIndex = 0;
    this.selectedCharacter = null;

    this.graphics = this.add.graphics();

    // Vycentrováno na 900x600 (střed = 450, 300), upravená velikost panelu
    this.add.rectangle(450, 300, 860, 580, 0x111122).setStrokeStyle(3, 0x6666aa, 1);

    // Přesun bosse více doprava (z 650 na 720)
    this.opponent = this.add.sprite(720, 400, 'boss').setOrigin(0.5, 0.5)
      .setFrame(0)
      .setScale(1)
      .setDepth(2);

    this.opponent.setFlipX(true);
    this.opponent.setVisible(false);

    // Vycentrování časovače na spodní střed (X posunut na 420)
    this.timerIcon = this.add.graphics({ x: 420, y: 340 });
    this.drawTimerIcon();

    this.timerText = this.add.text(475, 365, '15s', {
      fontSize: '28px',
      fill: '#ffff66',
      fontStyle: 'bold',
      stroke: '#333300',
      strokeThickness: 3,
    }).setOrigin(0, 0.5);

    // Načítání z DB před zobrazením menu
    this.loadingText = this.add.text(450, 300, "Načítám otázky z databáze...", {
      fontSize: '24px', fill: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    try {
      const { data: dbQuestions, error } = await this.supabase
        .from('QuizQuestions')
        .select('question, options, correct');

      if (error) throw error;
      if (!dbQuestions || dbQuestions.length === 0) throw new Error('Prázdná DB');

      this.questionBank = dbQuestions;
      this.shuffleQuestions();

      this.loadingText.destroy();
      this.showStartMenu();

    } catch (err) {
      console.error('Chyba při stahování otázek:', err);
      
      // ✅ Volání fallbacku
      this.loadFallbackQuestions();
      
      this.loadingText.setText('Databáze není dostupná,\nspouštím offline verzi kvízu...');
      
      // Krátká pauza pro zobrazení zprávy
      this.time.delayedCall(2000, () => {
        this.loadingText.destroy();
        this.showStartMenu();
      });
    }
  }

  showStartMenu() {
    // Roztaženo přes celé okno 900x600
    this.overlay = this.add.rectangle(450, 300, 900, 600, 0x000000, 1);

    this.startPanel = this.add.rectangle(450, 300, 750, 420, 0x222244, 0.85);
    this.startPanel.setStrokeStyle(3, 0x6666aa);

    const startMessage = "Vítejte v kvízové soubojové hře!\n\nVyberte postavu a začněte hru!";
    this.startText = this.add.text(450, 180, startMessage, {
      fontSize: '24px',
      fill: '#ffffff',
      align: 'center',
      fontStyle: 'bold',
      wordWrap: { width: 680 },
    }).setOrigin(0.5);

    // Pozice postav přizpůsobeny novému středu (350 a 550)
    const male = this.add.sprite(350, 280, 'playerM', 0).setScale(1).setInteractive({ useHandCursor: true });
    const female = this.add.sprite(550, 280, 'playerF', 0).setScale(1).setInteractive({ useHandCursor: true });

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

    this.startButton = this.add.text(450, 400, "Začít hru", {
      fontSize: '32px',
      fill: '#ffffff',
      backgroundColor: '#1a73e8',
      padding: { x: 24, y: 12 },
      fontStyle: 'bold',
      stroke: '#0c47a1',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.characterWarningText = null;

    this.startButton.on('pointerdown', () => {
      if (!this.selectedCharacter) {
        if (!this.characterWarningText) {
          this.characterWarningText = this.add.text(450, 460, "Vyber si postavu před začátkem!", {
            fontSize: '20px', fill: '#ffaaaa', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2
          }).setOrigin(0.5).setDepth(10);
        }
        return;
      }

      if (this.characterWarningText) {
        this.characterWarningText.destroy();
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

    // Hráč posunut mírně doleva pro lepší vizuální rozestup (na X = 180)
    this.player = this.add.sprite(180, 400, this.selectedCharacter)
      .setOrigin(0.5, 0.5)
      .setFrame(0)
      .setScale(1)
      .setDepth(2);
    this.player.setVisible(true);

    this.opponent.setVisible(true);

    this.playerLabel = this.add.text(this.player.x, this.player.y + 80, 'HRÁČ', {
      fontSize: '22px', fill: '#00ff00', fontStyle: 'bold',
    }).setOrigin(0.5);
    
    this.opponentLabel = this.add.text(this.opponent.x, this.opponent.y + 80, 'BOSS', {
      fontSize: '22px', fill: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5);

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
    if (this.questionText) this.questionText.destroy();
    this.options.forEach(opt => opt && opt.destroy());
    this.options = [];

    if (this.timerEvent) this.timerEvent.remove();

    if (this.currentQuestionIndex >= this.questionBank.length) {
      this.endGame(true);
      return;
    }

    this.currentQuestion = this.questionBank[this.currentQuestionIndex];

    // Otázka zarovnána bezpečně na šířku 800px s wordWrapem
    this.questionText = this.add.text(50, 45, this.currentQuestion.question, {
      fontSize: '22px',
      fill: '#ffffff',
      fontStyle: 'bold',
      wordWrap: { width: 800 }
    });

    const optionStyle = {
      fontSize: '16px',
      fill: '#fff',
      backgroundColor: '#222244',
      padding: { x: 12, y: 8 },
      borderRadius: 6,
      fontStyle: 'bold',
      wordWrap: { width: 800 } // Prvky se automaticky zalomí, pokud je text dlouhý
    };

    // Dynamický odraz pozic Y pro případ, že by byla otázka zalomená na více řádků
    const optionsY = this.questionText.y + this.questionText.displayHeight + 25;

    this.optionA = this.add.text(50, optionsY, "A: " + this.currentQuestion.options.A, optionStyle).setInteractive({ useHandCursor: true });
    this.optionB = this.add.text(50, optionsY + this.optionA.displayHeight + 12, "B: " + this.currentQuestion.options.B, optionStyle).setInteractive({ useHandCursor: true });
    this.optionC = this.add.text(50, this.optionB.y + this.optionB.displayHeight + 12, "C: " + this.currentQuestion.options.C, optionStyle).setInteractive({ useHandCursor: true });

    this.options = [this.optionA, this.optionB, this.optionC];

    this.optionA.on('pointerdown', () => this.handleAnswer("A"));
    this.optionB.on('pointerdown', () => this.handleAnswer("B"));
    this.optionC.on('pointerdown', () => this.handleAnswer("C"));

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

    this.options.forEach(opt => {
      if (opt.text.startsWith(this.currentQuestion.correct)) {
        opt.setStyle({ backgroundColor: '#006600' });
      } else {
        opt.setStyle({ backgroundColor: '#660000' });
      }
    });

    this.showFeedbackText("Čas vypršel!", '#ffcc00', 450, 310, () => {
      this.playerHealth--;
      this.updateHealthBars();
      this.attackPlayer(() => this.checkGameStatus());
    });
  }

  resetOptionStyles() {
    const defaultStyle = { fill: '#fff', backgroundColor: '#222244' };
    this.options.forEach(opt => {
      opt.setStyle({ fill: defaultStyle.fill, backgroundColor: defaultStyle.backgroundColor });
    });
  }

  handleAnswer(selected) {
    if (!this.input.enabled) return;
    this.input.enabled = false;

    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerText.setText('');
    }

    this.options.forEach(opt => {
      if (opt.text.startsWith(selected)) {
        opt.setStyle({ backgroundColor: selected === this.currentQuestion.correct ? '#006600' : '#660000' });
      } else if (opt.text.startsWith(this.currentQuestion.correct)) {
        opt.setStyle({ backgroundColor: '#006600' });
      } else {
        opt.setStyle({ backgroundColor: '#222244' });
      }
    });

    const correct = selected === this.currentQuestion.correct;
    
    // Feedback text uprostřed (450)
    this.showFeedbackText(correct ? "Správně!" : "Špatně!", correct ? '#00ff00' : '#ff0000', 450, 310, () => {
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
      fontSize: '28px', fill: color, fontStyle: 'bold', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(5);

    this.time.delayedCall(2000, () => {
      feedback.destroy();
      callback();
    });
  }

  attackOpponent(callback) {
    let originalX = this.player.x;
    let originalFrame = this.player.frame.name;

    this.player.setFrame(1);
    this.opponent.setFrame(2);

    this.tweens.add({
      targets: this.player,
      x: originalX + 30,
      duration: 300,
      yoyo: true,
      ease: 'Power1',
      onComplete: () => {
        this.player.setFrame(originalFrame);
        this.player.x = originalX;
        this.opponent.setFrame(0);

        let attackText = this.add.text(this.opponent.x, this.opponent.y - this.opponent.height / 2 - 50, "Hráč útočí!", {
          fontSize: '20px', fill: '#0f0', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
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

    this.opponent.setFrame(1);
    this.player.setFrame(2);

    this.tweens.add({
      targets: this.opponent,
      x: originalX - 30,
      duration: 300,
      yoyo: true,
      ease: 'Power1',
      onComplete: () => {
        this.opponent.setFrame(originalFrame);
        this.opponent.x = originalX;
        this.player.setFrame(0);

        let attackText = this.add.text(this.player.x, this.player.y - this.player.height / 2 - 50, "Boss útočí!", {
          fontSize: '20px', fill: '#f00', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
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
    this.input.enabled = true;

    if (this.timerEvent) this.timerEvent.remove();
    this.timerText.setText('');
    if (this.questionText) this.questionText.destroy();
    this.options.forEach(opt => opt && opt.destroy());
    if (this.timerIcon) this.timerIcon.destroy();
    
    this.score = 0;

    if (playerWon) {
      this.player.setFrame(8);
      this.opponent.setFrame(4);
      this.score = 3;
    } else {
      this.player.setFrame(4);
      this.opponent.setFrame(8);
      this.score = 0;
    }

    let endText = playerWon ? "Vyhrál jsi! Získal jsi 3 body." : "Prohrál jsi, nezískáváš žádné body!";
    let color = playerWon ? '#00ff00' : '#ff0000';

    // Výsledkový panel na přesný střed (450, 200)
    this.endMessageText = this.add.text(450, 220, endText, {
      fontSize: '32px',
      fill: color,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);

    // Tlačítko Další hra vycentrováno na střed (450)
    this.nextButton = this.add.text(450, 450, "Další hra", {
      fontSize: '28px',
      fill: '#fff',
      backgroundColor: '#228B22',
      padding: { x: 20, y: 10 },
      fontStyle: 'bold',
      stroke: '#004400',
      strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.nextButton.on('pointerover', () => this.nextButton.setStyle({ backgroundColor: '#2ecc71' }));
    this.nextButton.on('pointerout', () => this.nextButton.setStyle({ backgroundColor: '#228B22' }));

    this.nextButton.on('pointerdown', () => {
      let current = parseInt(localStorage.getItem('playerScore')) || 0;
      localStorage.setItem('playerScore', current + this.score);
      console.log("Current points:", current + this.score);

      window.location.href = 'messengerGame.html';
    });
  }
}

// Konfigurační blok upraven pro sjednocené rozlišení 900x600
const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 600,
  backgroundColor: '#1a1a2e',
  scene: [QuizFightScene]
};

const game = new Phaser.Game(config);