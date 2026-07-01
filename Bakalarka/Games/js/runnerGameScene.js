class RunnerGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RunnerGameScene' });
    
    // 1. Správná HTTP URL adresa Supabase
    const SUPABASE_URL = 'https://fejkfjyoqrnqryqrlljy.supabase.co';

    // 2. Anonymní API klíč
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlamtmanlvcXJucXJ5cXJsbGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODI2MzMsImV4cCI6MjA5Nzg1ODYzM30.nVWNax8d5R3gVVSDfj8pyIpoaN4m9JWiIoRM8MkRF0E';

    // Inicializace Supabase klienta
    this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Pole necháme prázdná, naplní se asynchronně z DB
    this.weakPasswords = [];
    this.mediumPasswords = [];
    this.strongPasswords = [];

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

    this.load.image('bg', 'assets/runnerBG.jpeg');
  }

  loadFallbackPasswords() {
    console.warn('Používám lokální fallback hesla.');
    
    // Slabá hesla (často používaná, předvídatelná)
    this.weakPasswords = [
      '123456', 
      'heslo123', 
      'admin', 
      'qwerty', 
      '111111', 
      'pokus123'
    ];

    // Střední hesla (kombinace písmen a čísel, bez speciálních znaků nebo jen jeden)
    this.mediumPasswords = [
      'P@ssword2024', 
      'MojeHeslo88', 
      'SuperUser99', 
      'CyberGame2026', 
      'Bezpecnost10', 
      'Student2025'
    ];

    // Silná hesla (komplexní, speciální znaky, náhodné řetězce)
    this.strongPasswords = [
      'K9#vL2$mP7!z', 
      'aB3*fR9&jQ4#', 
      'xT7@nB2%yW5!', 
      'vP4&mK9^cL1$', 
      'hG8!sR3#zJ6%', 
      'wQ2*bV5@kN7&'
    ];

    // Inicializace dostupných polí
    this.availableWeakPasswords = [...this.weakPasswords];
    this.availableMediumPasswords = [...this.mediumPasswords];
    this.availableStrongPasswords = [...this.strongPasswords];
  }

  // 👇 Změna na ASYNC kvůli await volání databáze
  async create() {
    this.passwordsFrozenUntil = 0;
    this.originalFrame = 1; // 1 is the default player frame
    this.wrongFrame = 4;    // 4 is a "wrong" frame

    // Add background first, set behind everything
    this.bg = this.add.tileSprite(0, 0, this.sys.game.config.width, this.sys.game.config.height, 'bg')
      .setOrigin(0, 0)
      .setDepth(0);

    // Staré rozlišení (bylo pro 900px širokou hru):
// this.lanes = [135, 305, 475];

// 🔥 Změň tyto hodnoty (aktuálně tam máš 100, 300, 500):
this.lanes = [250, 450, 650];
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

    // Vytvoříme dočasný text pro indikaci načítání z DB
    const loadingText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Načítám hesla z databáze...', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(10);

    try {
      // 1. Stáhneme data
      const { data: dbPasswords, error } = await this.supabase
        .from('Passwords')
        .select('password, strength');

      if (error) throw error;
      if (!dbPasswords || dbPasswords.length === 0) throw new Error('Prázdná DB');

      // Naplnění z DB
      this.weakPasswords = dbPasswords.filter(item => item.strength === 'weak').map(item => item.password);
      this.mediumPasswords = dbPasswords.filter(item => item.strength === 'medium').map(item => item.password);
      this.strongPasswords = dbPasswords.filter(item => item.strength === 'strong').map(item => item.password);

      this.availableWeakPasswords = [...this.weakPasswords];
      this.availableMediumPasswords = [...this.mediumPasswords];
      this.availableStrongPasswords = [...this.strongPasswords];

      loadingText.destroy();
      this.showInstructions();

    } catch (err) {
      console.error('Chyba Supabase, spouštím fallback:', err);
      
      // ✅ Zde voláme náš fallback
      this.loadFallbackPasswords();
      
      // Upravíme text, aby uživatel věděl, co se stalo
      loadingText.setText('Databáze není dostupná,\nnačítám offline režim...');
      
      // Krátká pauza, aby uživatel viděl varování, pak spustíme hru
      this.time.delayedCall(2000, () => {
        loadingText.destroy();
        this.showInstructions();
      });
    }
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
        .setInteractive({ useHandCursor: true })
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
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1);

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

    // Enable controls
    this.enableControls();

    this.gameStarted = true;

    // Spawn the first word after 3 seconds delay
    this.time.delayedCall(3000, () => {
      this.spawnPasswords();
      // Then spawn every 9 seconds
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

    // 🔥 VYCENTROVÁNO: Změna X z 280/300 na 450 (střed 900px široké hry)
    this.endBackground = this.add.rectangle(450, 280, 480, 200, 0x000000, 0.7)
      .setOrigin(0.5)
      .setDepth(1);

    // 🔥 VYCENTROVÁNO: Změna X na 450
    this.add.text(450, 240, endMessage, {
      fontSize: '24px',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: 460 }
    }).setOrigin(0.5).setDepth(2);

    // 🔥 VYCENTROVÁNO: Změna X na 450
    this.nextGameButton = this.add.text(450, 350, "Další hra", {
      fontSize: '28px',
      backgroundColor: '#007700',
      padding: { x: 20, y: 10 },
      fill: '#fff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true });

    this.nextGameButton.on('pointerover', () => this.nextGameButton.setStyle({ backgroundColor: '#00aa00' }));
    this.nextGameButton.on('pointerout', () => this.nextGameButton.setStyle({ backgroundColor: '#007700' }));

    this.nextGameButton.on('pointerdown', () => {
      if (localStorage.getItem('playerScore') !== null) {
        let current = parseInt(localStorage.getItem('playerScore'));
        localStorage.setItem('playerScore', current + finalPoints);
        console.log("Current points:", current + finalPoints);
      } else {
        console.log("No points stored yet.");
        localStorage.setItem('playerScore', finalPoints);
      }

      window.location.href = 'dragDrop.html';
    });
  }
}

// Spouštěcí konfigurace přesunuta do samostatného skriptu v HTML, 
// zde ponecháno pouze pro případ přímého spuštění.