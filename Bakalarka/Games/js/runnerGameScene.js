class RunnerGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RunnerGameScene' });
    this.weakPasswords = ["123456", "password", "qwerty", "tatinek", "Pepicek", "Marie", "veslo", "borec", "zezlo", "smrcek"];
    this.mediumPasswords = ["369852147", "leto2005", "Harik2323", "ZmrZliNa", "Sup3rMan", "wes1o", "Maminka123", "superHeszl0", 
      "11dolar22", "SmRk11"];
    this.strongPasswords = ["MamRad$k0lu", "B@lonek7", "$rd1ck0", "Kra1#123", "BE@Ttl3s", "SlUn1ck0", "St@rHv3zd@",
      "koCk@3113", "$tud3ntZSH150", "AqVariU$56"];

  }

  preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('bg', 'assets/runnerBG.jpeg'); // Or .png

  }

  create() {
    // Inicializace dostupných hesel
    this.availableWeakPasswords = [...this.weakPasswords];
    this.availableMediumPasswords = [...this.mediumPasswords];
    this.availableStrongPasswords = [...this.strongPasswords];

    // Add background first, set behind everything
    this.bg = this.add.tileSprite(0, 0, this.sys.game.config.width, this.sys.game.config.height, 'bg')
      .setOrigin(0, 0)
      .setDepth(0); // put it behind

    this.lanes = [135, 305, 475];
    this.currentLane = 1;
    this.score = 0;
    this.totalWords = 6;
    this.wordsPassed = 0;
    this.gameStarted = false;
    this.collisionHandled = false;

    // Player sprite, hidden initially
    this.player = this.add.sprite(this.lanes[this.currentLane], 500, 'player')
      .setVisible(false)
      .setDepth(2); // above background and UI

    // Score background rectangle
    this.scoreBackground = this.add.rectangle(85, 22, 160, 36, 0x000000, 0.6)
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(1.5);

    // Score text
    this.scoreText = this.add.text(10, 10, 'Skóre: 0', {
      fontSize: '24px',
      fill: '#fff'
    }).setVisible(false).setDepth(2);


    this.passwordsGroup = this.add.group();

    // Show instructions and start button (added after background)
    this.showInstructions();
  }


  showInstructions() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    this.instructionBackground = this.add.rectangle(centerX, centerY, 600, 420, 0x000000, 0.85)
      .setStrokeStyle(3, 0xffffff)
      .setOrigin(0.5)
      .setDepth(1);

    const instructions = [
      "🎮 Ovládání:",
      "• Šipky vlevo/vpravo nebo A/D pro pohyb mezi pruhy.",
      "• Projeďte správným slovem pro zisk bodu.",
      "• Správné slovo zezelená, špatné zčervená.",
      "• Pokud trefíte špatné slovo, správné zmodrá.",
      "• Celkem proběhne 6 slov, hra trvá asi 1 minutu.",
      "",
      "👇 Klikněte na tlačítko pro spuštění hry:"
    ];

    this.instructionTexts = instructions.map((line, i) => {
      return this.add.text(centerX, centerY - 160 + i * 32, line, {
        fontSize: '20px',
        fill: '#ffffff',
        align: 'center',
        wordWrap: { width: 560 }
      }).setOrigin(0.5).setDepth(1);
    });

    this.startButton = this.add.text(centerX, centerY + 150, "▶ Start Game", {
      fontSize: '28px',
      backgroundColor: '#007700',
      padding: { x: 20, y: 10 },
      fill: '#fff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setInteractive().setDepth(1);

    this.startButton.on('pointerover', () => this.startButton.setStyle({ backgroundColor: '#00aa00' }));
    this.startButton.on('pointerout', () => this.startButton.setStyle({ backgroundColor: '#007700' }));
    this.startButton.on('pointerdown', () => this.startGame());
  }




  startGame() {
    // Remove instruction elements
    this.instructionTexts.forEach(t => t.destroy());
    this.startButton.destroy();
    this.instructionBackground.destroy();

    // Show player and score
    this.player.setVisible(true);
    this.scoreText.setVisible(true);
    this.scoreBackground.setVisible(true);


    // Enable controls
    this.enableControls();

    this.gameStarted = true;

    // Spawn the first word after 3 seconds delay
    this.time.delayedCall(3000, () => {
      this.spawnPasswords();
      // Then spawn every 7 seconds
      this.spawnTimer = this.time.addEvent({
        delay: 9000,
        callback: this.spawnPasswords,
        callbackScope: this,
        loop: true
      });
    });
  }

  enableControls() {
    this.input.keyboard.on('keydown-LEFT', () => this.switchLane(-1));
    this.input.keyboard.on('keydown-A', () => this.switchLane(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.switchLane(1));
    this.input.keyboard.on('keydown-D', () => this.switchLane(1));
  }

  switchLane(dir) {
    if (!this.gameStarted) return;
    let newLane = this.currentLane + dir;
    if (newLane >= 0 && newLane < this.lanes.length) {
      this.currentLane = newLane;
      this.player.x = this.lanes[this.currentLane];
    }
  }

  getUniquePassword(strength) {
    let pool;
    if (strength === 'weak') pool = this.availableWeakPasswords;
    else if (strength === 'medium') pool = this.availableMediumPasswords;
    else if (strength === 'strong') pool = this.availableStrongPasswords;

    if (pool.length === 0) {
      if (strength === 'weak') this.availableWeakPasswords = [...this.weakPasswords];
      else if (strength === 'medium') this.availableMediumPasswords = [...this.mediumPasswords];
      else if (strength === 'strong') this.availableStrongPasswords = [...this.strongPasswords];
      pool = this[`available${strength.charAt(0).toUpperCase() + strength.slice(1)}Passwords`];
    }

    const index = Phaser.Math.Between(0, pool.length - 1);
    const password = pool.splice(index, 1)[0];
    return password;
  }

  spawnPasswords() {
    if (this.wordsPassed >= this.totalWords) return;

    // Vyber náhodná hesla, která se nesmí opakovat
    const weak = this.getUniquePassword('weak');
    const medium = this.getUniquePassword('medium');
    const strong = this.getUniquePassword('strong');

    // Náhodně promícháme sady hesel
    const passwordSet = [
      { text: weak, strength: 'weak' },
      { text: medium, strength: 'medium' },
      { text: strong, strength: 'strong' }
    ];
    Phaser.Utils.Array.Shuffle(passwordSet);

    // Vytvoříme vizuální prvky pro každé heslo v jednotlivých pruzích
    for (let i = 0; i < 3; i++) {
      const { text, strength } = passwordSet[i];
      const isCorrect = (strength === 'strong');

      const container = this.add.container(this.lanes[i], 0);
      container.setSize(160, 40);

      const rect = this.add.rectangle(0, 0, 160, 40, 0x222222)
        .setStrokeStyle(3, 0xffffff)
        .setOrigin(0.5);

      const label = this.add.text(0, 0, text, {
        fontSize: '18px',
        color: '#fff',
        align: 'center',
        wordWrap: { width: 150 }
      }).setOrigin(0.5);

      container.add([rect, label]);
      container.isCorrect = isCorrect;

      this.passwordsGroup.add(container);

      // Animace, jak heslo "padá" dolů
      this.tweens.add({
        targets: container,
        y: 600,
        duration: 8000,
        ease: 'Linear',
        onComplete: () => {
          container.destroy();
          // Po dokončení posledního hesla zvýšíme počet prošlých slov
          if (i === 2) {
            this.wordsPassed++;
            if (this.wordsPassed >= this.totalWords) {
              this.endGame();
            }
          }
        }
      });
    }

    this.collisionHandled = false; // reset kolize flagy
  }


  update() {
    if (this.gameStarted) {
      this.bg.tilePositionY -= 0.5; // Scroll down slowly
    }

    if (!this.collisionHandled) {
      this.passwordsGroup.getChildren().forEach(word => {
        if (!word.hit && Phaser.Geom.Intersects.RectangleToRectangle(
          this.player.getBounds(), word.getBounds()
        )) {
          word.hit = true;
          this.collisionHandled = true;

          if (word.isCorrect) {
            this.score++;
            word.list[0].setStrokeStyle(3, 0x00ff00); // green
          } else {
            word.list[0].setStrokeStyle(3, 0xff0000); // red
          }

          // Highlight correct word (blue) if not hit
          this.passwordsGroup.getChildren().forEach(w => {
            if (w.isCorrect && !w.hit) {
              w.list[0].setStrokeStyle(3, 0x0000ff); // blue
            }
          });

          this.scoreText.setText(`Skóre: ${this.score}`);
        }
      });
    }
  }

  endGame() {
    if (!this.gameStarted) return;
    this.gameStarted = false;

    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }
    this.passwordsGroup.clear(true, true);

    this.input.keyboard.removeAllListeners();

    this.player.setVisible(false);

    const endMessage = `🎉 Konec hry!\nZískal si ${this.score}/${this.totalWords} bodů.`;

    this.endBackground = this.add.rectangle(300, 280, 420, 120, 0x000000, 0.7)
      .setOrigin(0.5)
      .setDepth(1);

    this.add.text(300, 280, endMessage, {
      fontSize: '26px',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setDepth(2);

  }
}

const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 600,
  backgroundColor: '#222',
  scene: [RunnerGameScene]
};

const game = new Phaser.Game(config);
