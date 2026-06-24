class CybersecurityScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CybersecurityScene' });

    // 1. Inicializace Supabase (Doplňte své URL a ANON KEY)
    const SUPABASE_URL = 'https://vase-id-projektu.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJh...vas-dlouhy-anon-klic';
    this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Prázdné pole, které se naplní z databáze
    this.scenarios = [];
    // Sledování použitých scénářů pro zamezení duplicit
    this.usedScenarios = [];
  }

  // 👇 create() je nyní async, abychom mohli počkat na data ze Supabase
  async create() {
    this.score = this.score || 0;

    // Vykreslíme úvodní menu (zatímco na pozadí můžeme stahovat data)
    this.showStartMenu();
  }

  showStartMenu() {
    this.overlay = this.add.rectangle(550, 300, 1100, 600, 0x000000, 0.7);

    const instructions = "Vítejte ve hře Sestav správné řešení!\n\nPřetáhni akce na správná čísla ve správném pořadí. \n\nPři kliknutí na přetaženou akci se akce vrátí zpátky na začátek";

    this.guideText = this.add.text(550, 250, instructions, {
      fontSize: '26px',
      fontFamily: 'Arial',
      color: '#f5f5f5',
      backgroundColor: 'rgba(40, 40, 60, 0.9)',
      padding: { x: 30, y: 20 },
      align: 'center',
      wordWrap: { width: 800 },
      stroke: '#222244',
      strokeThickness: 3,
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true },
      borderRadius: 15
    }).setOrigin(0.5);

    this.startButton = this.add.text(550, 400, 'Začít hru', {
      fontSize: '32px',
      fontFamily: 'Arial',
      backgroundColor: '#1a73e8',
      color: '#ffffff',
      padding: { x: 30, y: 15 },
      borderRadius: 20,
      fontStyle: 'bold',
      stroke: '#0c47a1',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#063a7c', blur: 3, fill: true }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.startButton.on('pointerdown', async () => {
      this.startButton.destroy();
      this.guideText.setText('Načítám scénáře z databáze...');

      try {
        // 2. Stažení dat z vaší Supabase tabulky DragDropScenarios
        const { data: dbScenarios, error } = await this.supabase
          .from('DragDropScenarios')
          .select('title, actions');

        if (error) throw error;

        this.scenarios = dbScenarios;

        // Úklid menu a start
        this.overlay.destroy();
        this.guideText.destroy();
        this.initGame();

      } catch (err) {
        console.error('Chyba při stahování dat ze Supabase:', err);
        this.guideText.setText('Chyba spojení s databází.\nZkontrolujte připojení a obnovte stránku.');
      }
    });
  }

  initGame() {
    this.submitted = false;
    this.actionTexts = [];
    this.originalPositions = new Map();
    this.dropAssignments = [];

    // 3. Ošetření duplicity: Vybereme pouze ty scénáře, které hráč ještě nehrál
    const remainingScenarios = this.scenarios.filter(s => !this.usedScenarios.includes(s));

    // Pokud už odehrál všechny scénáře, vymažeme historii a jedeme odznova
    if (remainingScenarios.length === 0) {
      this.usedScenarios = [];
      this.currentScenario = Phaser.Utils.Array.GetRandom(this.scenarios);
    } else {
      this.currentScenario = Phaser.Utils.Array.GetRandom(remainingScenarios);
    }

    // Uložíme aktuální scénář do pole použitých
    this.usedScenarios.push(this.currentScenario);

    // Načtení správného pořadí (ze JSONB pole ze Supabase)
    this.correctOrder = [...this.currentScenario.actions];
    this.actionCount = this.correctOrder.length;

    const scrambledActions = Phaser.Utils.Array.Shuffle([...this.correctOrder]);

    this.titleText = this.add.text(550, 40, this.currentScenario.title, {
      fontSize: '24px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 2, align: 'center', wordWrap: { width: 800 }
    }).setOrigin(0.5);

    const actionStyle = {
      fontSize: '16px', fill: '#eee', backgroundColor: '#223366', padding: { x: 15, y: 10 }, borderRadius: 8,
      fontStyle: 'bold', stroke: '#000', strokeThickness: 2,
    };

    const numberStyle = {
      fontSize: '24px', fill: '#ffffff', backgroundColor: '#664422', padding: { x: 15, y: 12 }, borderRadius: 10,
      fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
    };

    this.dropZones = [];
    this.dropAssignments = Array(this.actionCount).fill(null);
    this.numberLabels = [];

    const numberX = 60;
    const zoneX = 320;
    const startY = 140;
    const numberSpacing = 60;
    const zoneWidth = 420;
    const zoneHeight = 50;

    for (let i = 0; i < this.actionCount; i++) {
      const y = startY + i * numberSpacing;
      const zone = this.add.zone(zoneX, y, zoneWidth, zoneHeight).setRectangleDropZone(zoneWidth, zoneHeight);
      const numberLabel = this.add.text(numberX, y, (i + 1).toString(), numberStyle).setOrigin(0.5);

      this.dropZones.push(zone);
      this.numberLabels.push(numberLabel);
    }

    const rightX = 750;
    const actionsStartY = 140;
    const actionSpacing = 80;

    scrambledActions.forEach((action, i) => {
      const x = rightX;
      const y = actionsStartY + i * actionSpacing;
      const actionText = this.add.text(x, y, action, actionStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      this.input.setDraggable(actionText);
      this.actionTexts.push(actionText);
      this.originalPositions.set(actionText, { x: actionText.x, y: actionText.y });
    });

    // Drag & Drop Listeners
    this.input.on('dragstart', (pointer, gameObject) => {
      gameObject.setStyle({ backgroundColor: '#334477' });
      this.children.bringToTop(gameObject);
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on('dragend', (pointer, gameObject, dropped) => {
      gameObject.setStyle({ backgroundColor: '#223366' });
      if (!dropped) this.returnToOriginal(gameObject);
    });

    this.input.on('drop', (pointer, gameObject, dropZone) => {
      const zoneIndex = this.dropZones.indexOf(dropZone);
      const numberLabel = this.numberLabels[zoneIndex];

      if (this.dropAssignments[zoneIndex]) {
        this.returnToOriginal(this.dropAssignments[zoneIndex]);
      }

      for (let i = 0; i < this.dropAssignments.length; i++) {
        if (this.dropAssignments[i] === gameObject) {
          this.dropAssignments[i] = null;
        }
      }

      this.dropAssignments[zoneIndex] = gameObject;
      const marginX = 250;
      const labelRightEdge = numberLabel.x + numberLabel.displayWidth / 2;
      const minGap = 20;

      gameObject.setWordWrapWidth(400);
      gameObject.x = labelRightEdge + gameObject.displayWidth / 2 + minGap;
      gameObject.y = numberLabel.y;
    });

    // Kliknutí na usazenou akci ji vrátí zpět
    this.input.on('pointerdown', (pointer, gameObject) => {
      if (gameObject instanceof Phaser.GameObjects.Text && this.actionTexts.includes(gameObject)) {
        if (!this.submitted) {
          this.returnToOriginal(gameObject);
        }
      }
    });

    if (this.submitButton) this.submitButton.destroy();
    this.submitButton = this.add.text(550, 540, "✅ Submit Answer", {
      fontSize: '24px', backgroundColor: '#008800', color: '#fff', padding: { x: 20, y: 12 }, borderRadius: 10,
      fontStyle: 'bold', stroke: '#004400', strokeThickness: 3,
    }).setInteractive({ useHandCursor: true }).setOrigin(0.5);

    this.submitButton.on('pointerdown', () => {
      if (!this.submitted) {
        this.checkAnswer();
      }
    });

    if (this.scoreText) this.scoreText.setText(`Score: ${this.score}`);
    else {
      this.scoreText = this.add.text(50, 30, `Score: ${this.score}`, {
        fontSize: '20px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 2,
      });
    }
  }

  returnToOriginal(action) {
    const pos = this.originalPositions.get(action);
    if(pos) {
        action.x = pos.x;
        action.y = pos.y;
    }
    for (let i = 0; i < this.dropAssignments.length; i++) {
      if (this.dropAssignments[i] === action) {
        this.dropAssignments[i] = null;
      }
    }
  }

  checkAnswer() {
    const userOrder = this.dropAssignments.map(a => a ? a.text : null);

    if (this.feedbackBox) this.feedbackBox.destroy();
    if (this.feedbackText) this.feedbackText.destroy();
    if (this.nextGameButton) this.nextGameButton.destroy();

    const incomplete = userOrder.includes(null);
    const sceneWidth = this.sys.game.config.width;
    const feedbackY = 350;

    if (incomplete) {
      const message = "⛔ Vyplň všechny odpovědi!";
      const boxHeight = 150;

      this.feedbackBox = this.add.rectangle(sceneWidth / 2, feedbackY, 800, boxHeight, 0x000000, 0.9)
        .setOrigin(0.5).setStrokeStyle(2, 0xffffff).setDepth(10);

      this.feedbackText = this.add.text(sceneWidth / 2, feedbackY - 20, message, {
        fontSize: '20px', color: '#ffffff', fontStyle: 'bold', align: 'center', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(11);

      this.nextGameButton = this.add.text(sceneWidth / 2, feedbackY + 30, "Zavřít", {
        fontSize: '22px', backgroundColor: '#990000', color: '#fff', fontStyle: 'bold', padding: { x: 20, y: 10 }, borderRadius: 10, stroke: '#330000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });

      this.nextGameButton.on('pointerdown', () => {
        this.feedbackBox.destroy();
        this.feedbackText.destroy();
        this.nextGameButton.destroy();
      });

      return;
    }

    this.actionTexts.forEach(action => action.disableInteractive());
    this.submitButton.disableInteractive();

    const correctCount = userOrder.reduce((acc, val, i) => val === this.correctOrder[i] ? acc + 1 : acc, 0);
    let message = "";
    let points = 0;

    if (correctCount === this.correctOrder.length) {
      message = "✅ Skvělé! Všechno je správně! Získáváš 2 body.";
      points = 2;
    } else if (correctCount >= 2) {
      message = `👍 Dobrá práce! Máš správně ${correctCount} z ${this.correctOrder.length}. Získáváš 1 bod.`;
      points = 1;
    } else {
      message = `❌ Bohužel. Máš správně ${correctCount} z ${this.correctOrder.length}. Nezískáváš body.`;
      points = 0;
    }

    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);

    const correctList = this.correctOrder.map((act, idx) => `${idx + 1}. ${act}`).join('\n');
    const fullMessage = `${message}\n\nSprávné pořadí:\n${correctList}`;

    const lineCount = fullMessage.split('\n').length;
    const lineHeight = 26;
    const boxHeight = lineCount * lineHeight + 80;

    this.feedbackBox = this.add.rectangle(sceneWidth / 2, feedbackY, 1000, boxHeight, 0x000000, 0.85)
      .setOrigin(0.5).setStrokeStyle(2, 0xffffff).setDepth(10);

    this.feedbackText = this.add.text(sceneWidth / 2, feedbackY - 40, fullMessage, {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: 950 }, lineSpacing: 6, stroke: '#000', strokeThickness: 2, padding: { x: 10, y: 10 }
    }).setOrigin(0.5).setDepth(11);

    this.nextGameButton = this.add.text(sceneWidth / 2, feedbackY + boxHeight / 2 - 30, "Další hra", {
      fontSize: '22px', backgroundColor: '#005500', color: '#fff', fontStyle: 'bold', padding: { x: 20, y: 10 }, borderRadius: 10, stroke: '#003300', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });

    this.nextGameButton.on('pointerdown', () => {
      if (localStorage.getItem('playerScore') !== null) {
        let current = parseInt(localStorage.getItem('playerScore'));
        localStorage.setItem('playerScore', current + points);
      } else {
        localStorage.setItem('playerScore', points);
      }

      // Spustí další kolo hry očištěné od starých assetů
      this.restartGame();
    });

    this.submitted = true;
  }

  restartGame() {
    this.actionTexts.forEach(action => action.destroy());
    this.dropZones.forEach(zone => zone.destroy());
    this.numberLabels.forEach(label => label.destroy());
    if (this.titleText) this.titleText.destroy();
    if (this.feedbackBox) this.feedbackBox.destroy();
    if (this.feedbackText) this.feedbackText.destroy();
    if (this.nextGameButton) this.nextGameButton.destroy();
    if (this.submitButton) this.submitButton.destroy();

    this.actionTexts = [];
    this.dropZones = [];
    this.numberLabels = [];
    this.originalPositions.clear();
    
    this.initGame();
  }
}

const config = {
  type: Phaser.AUTO,
  width: 1100,
  height: 600,
  backgroundColor: '#1a1a2e',
  scene: [CybersecurityScene]
};

const game = new Phaser.Game(config);