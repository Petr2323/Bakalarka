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
    this.load.spritesheet('playerM', 'assets/player_tilesheet.png', {
      frameWidth: 80,
      frameHeight: 110
    });
    this.load.spritesheet('playerF', 'assets/female_tilesheet.png', {
      frameWidth: 80,
      frameHeight: 110
    });

    this.load.image('bg', 'assets/runnerBG.jpeg'); // Or .png

  }

  create() {
    // Inicializace dostupných hesel
    this.availableWeakPasswords = [...this.weakPasswords];
    this.availableMediumPasswords = [...this.mediumPasswords];
    this.availableStrongPasswords = [...this.strongPasswords];

    this.passwordsFrozenUntil = 0;
    this.originalFrame = 1; // 1 is the default player frame
    this.wrongFrame = 4;    // 2 is a "wrong" frame — change as needed

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

    this.instructionBackground = this.add.rectangle(centerX, centerY, 600, 480, 0x000000, 0.85)
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
      ""
    ];

    this.instructionTexts = instructions.map((line, i) => {
      return this.add.text(centerX, centerY - 190 + i * 28, line, {
        fontSize: '20px',
        fill: '#ffffff',
        align: 'center',
        wordWrap: { width: 560 }
      }).setOrigin(0.5).setDepth(1);
    });

    // Character selection
    const characters = ['playerM', 'playerF'];
    this.selectedPlayer = 'playerM'; // default

    this.characterSprites = characters.map((key, i) => {
      const sprite = this.add.sprite(centerX - 60 + i * 120, centerY + 30, key)
        .setInteractive()
        .setScale(0.75)
        .setDepth(1)
        .setData('key', key);

      sprite.on('pointerdown', () => {
        this.selectedPlayer = key;
        this.characterSprites.forEach(s => s.setTint(0xffffff));
        sprite.setTint(0x00ff00); // highlight selected
      });

      if (i === 0) sprite.setTint(0x00ff00); // default selected
      return sprite;
    });

    // Start Button
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
    this.characterSprites.forEach(s => s.destroy());

    // Create player sprite here with selectedPlayer
    this.player = this.add.sprite(this.lanes[this.currentLane], 460, this.selectedPlayer)
      .setFrame(1)
      .setScale(1)
      .setDepth(2);


    // Show player and score
    this.player.setVisible(true);
    this.scoreText.setVisible(true);
    this.scoreBackground.setVisible(true);

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
    if (!this.gameStarted || this.isFrozen) return; // 🚫 prevent movement if frozen
  
    let newLane = this.currentLane + dir;
    if (newLane >= 0 && newLane < this.lanes.length) {
      this.currentLane = newLane;
      this.player.x = this.lanes[this.currentLane];
  
      // Flip character based on direction
      this.player.setFlipX(dir < 0);
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
  
    const passwordSet = [
      { text: weak, strength: 'weak' },
      { text: medium, strength: 'medium' },
      { text: strong, strength: 'strong' }
    ];
    Phaser.Utils.Array.Shuffle(passwordSet);
  
    this.activeTweens = []; // 🟩 Store tweens for pausing/resuming
  
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
  
      // 🟩 Tween for falling animation
      const tween = this.tweens.add({
        targets: container,
        y: 600,
        duration: 8000,
        ease: 'Linear',
        onComplete: () => {
          container.destroy();
          if (i === 2) {
            this.wordsPassed++;
            if (this.wordsPassed >= this.totalWords) {
              this.endGame();
            }
          }
        }
      });
  
      this.activeTweens.push(tween); // 🟩 Store tween reference
    }
  
    this.collisionHandled = false; // reset kolize flagy
  }
  

  freezeOnWrongAnswer() {
    this.isFrozen = true;
    this.player.setFrame(this.wrongFrame);
  
    // ✅ Pause falling tweens
    this.activeTweens.forEach(tween => tween.pause());
  
    this.time.delayedCall(2000, () => {
      this.isFrozen = false;
      this.player.setFrame(this.originalFrame);
  
      // ✅ Resume falling tweens
      this.activeTweens.forEach(tween => tween.resume());
  
      // ❗ Disable password interactions for 4 more seconds
      this.passwordsFrozenUntil = this.time.now + 4000;
    });
  }
  
  

  update() {
    if (this.gameStarted) {
      this.bg.tilePositionY -= 0.5;
    }

    if (this.gameStarted && !this.isFrozen && this.time.now > this.passwordsFrozenUntil) {
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
              this.freezeOnWrongAnswer(); // <-- freeze when incorrect
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

    // Calculate final scaled score
    let finalPoints;
    if (this.score >= 5) {
      finalPoints = 3;
    } else if (this.score >= 3) {
      finalPoints = 2;
    } else if (this.score === 2) {
      finalPoints = 1;
    } else {
      finalPoints = 0;
    }

    const endMessage = `🎉 Konec hry!\nTvé herní skóre: ${this.score}/${this.totalWords}.\nZískané body: ${finalPoints}/3.`;

    this.endBackground = this.add.rectangle(300, 280, 480, 140, 0x000000, 0.7)
      .setOrigin(0.5)
      .setDepth(1);

    this.add.text(300, 280, endMessage, {
      fontSize: '24px',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: 460 }
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
