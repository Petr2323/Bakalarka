class DragDropScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DragDropScene' });

    // 1. Správná HTTP URL adresa
    const SUPABASE_URL = 'https://fejkfjyoqrnqryqrlljy.supabase.co';

    // 2. Anonymní API klíč
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlamtmanlvcXJucXJ5cXJsbGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODI2MzMsImV4cCI6MjA5Nzg1ODYzM30.nVWNax8d5R3gVVSDfj8pyIpoaN4m9JWiIoRM8MkRF0E';

    // Inicializace klienta
    this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Prázdné pole, které se naplní z databáze
    this.scenarios = [];
    // Sledování použitých scénářů pro zamezení duplicit
    this.usedScenarios = [];
  }

  async create() {
    // Načtení celkového skóre z paměti
    this.score = parseInt(localStorage.getItem('playerScore')) || 0;

    // Pokud v paměti není uloženo aktuální kolo této hry, nastavíme 1
    if (!localStorage.getItem('dragDropRound')) {
      localStorage.setItem('dragDropRound', 1);
    }

    // Vykreslíme úvodní menu (vycentrováno na 900x600)
    this.showStartMenu();
  }

  showStartMenu() {
    // Změna šířky na 900 podle nového plátna
    this.overlay = this.add.rectangle(450, 300, 900, 600, 0x000000, 0.7);

    const instructions = "Vítejte ve hře Sestav správné řešení!\n\nPřetáhni akce na správná čísla ve správném pořadí.\n\nPři kliknutí na přetaženou akci se akce vrátí zpátky na začátek.";

    this.guideText = this.add.text(450, 250, instructions, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#f5f5f5',
      backgroundColor: 'rgba(40, 40, 60, 0.9)',
      padding: { x: 30, y: 20 },
      align: 'center',
      wordWrap: { width: 700 },
      stroke: '#222244',
      strokeThickness: 3,
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5);

    this.startButton = this.add.text(450, 420, 'Začít hru', {
      fontSize: '30px',
      fontFamily: 'Arial',
      backgroundColor: '#1a73e8',
      color: '#ffffff',
      padding: { x: 30, y: 15 },
      fontStyle: 'bold',
      stroke: '#0c47a1',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#063a7c', blur: 3, fill: true }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.startButton.on('pointerdown', async () => {
      this.startButton.destroy();
      this.guideText.setText('Načítám scénáře z databáze...');

      try {
        const { data: dbScenarios, error } = await this.supabase
          .from('DragDropScenarios')
          .select('title, actions');

        if (error) throw error;

        this.scenarios = dbScenarios;

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

    // Ošetření duplicity scénářů
    const remainingScenarios = this.scenarios.filter(s => !this.usedScenarios.includes(s));

    if (remainingScenarios.length === 0) {
      this.usedScenarios = [];
      this.currentScenario = Phaser.Utils.Array.GetRandom(this.scenarios);
    } else {
      this.currentScenario = Phaser.Utils.Array.GetRandom(remainingScenarios);
    }

    this.usedScenarios.push(this.currentScenario);

    this.correctOrder = [...this.currentScenario.actions];
    this.actionCount = this.correctOrder.length;

    const scrambledActions = Phaser.Utils.Array.Shuffle([...this.correctOrder]);

    // Vycentrování titulku scénáře na střed (450)
    this.titleText = this.add.text(450, 45, this.currentScenario.title, {
      fontSize: '22px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 2, align: 'center', wordWrap: { width: 800 }
    }).setOrigin(0.5);

    const actionStyle = {
      fontSize: '15px', fill: '#eee', backgroundColor: '#223366', padding: { x: 12, y: 8 },
      fontStyle: 'bold', stroke: '#000', strokeThickness: 2,
    };

    const numberStyle = {
      fontSize: '22px', fill: '#ffffff', backgroundColor: '#664422', padding: { x: 14, y: 10 },
      fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
    };

    this.dropZones = [];
    this.dropAssignments = Array(this.actionCount).fill(null);
    this.numberLabels = [];

    // Upravené X pozice pro šířku plátna 900px
    const numberX = 50;
    const zoneX = 270; 
    const startY = 130;
    const numberSpacing = 65;
    const zoneWidth = 360;
    const zoneHeight = 48;

    for (let i = 0; i < this.actionCount; i++) {
      const y = startY + i * numberSpacing;
      const zone = this.add.zone(zoneX, y, zoneWidth, zoneHeight).setRectangleDropZone(zoneWidth, zoneHeight);
      const numberLabel = this.add.text(numberX, y, (i + 1).toString(), numberStyle).setOrigin(0.5);

      this.dropZones.push(zone);
      this.numberLabels.push(numberLabel);
    }

    // Pravý sloupec s neshuffled texty upraven na X = 690, aby se vešel do 900px okna
    const rightX = 690;
    const actionsStartY = 130;
    const actionSpacing = 75;

    scrambledActions.forEach((action, i) => {
      const x = rightX;
      const y = actionsStartY + i * actionSpacing;
      const actionText = this.add.text(x, y, action, actionStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      // Omezení šířky textu na pravé straně, aby nepřetékal
      actionText.setWordWrapWidth(360);

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
      const labelRightEdge = numberLabel.x + numberLabel.displayWidth / 2;
      const minGap = 15;

      gameObject.setWordWrapWidth(340); // wrap uzpůsobený velikosti zóny
      gameObject.x = labelRightEdge + gameObject.displayWidth / 2 + minGap;
      gameObject.y = numberLabel.y;
    });

    this.input.on('pointerdown', (pointer, gameObject) => {
      if (gameObject instanceof Phaser.GameObjects.Text && this.actionTexts.includes(gameObject)) {
        if (!this.submitted) {
          this.returnToOriginal(gameObject);
        }
      }
    });

    if (this.submitButton) this.submitButton.destroy();
    this.submitButton = this.add.text(450, 540, "✅ Submit Answer", {
      fontSize: '22px', backgroundColor: '#008800', color: '#fff', padding: { x: 20, y: 12 },
      fontStyle: 'bold', stroke: '#004400', strokeThickness: 3,
    }).setInteractive({ useHandCursor: true }).setOrigin(0.5);

    this.submitButton.on('pointerdown', () => {
      if (!this.submitted) {
        this.checkAnswer();
      }
    });

    if (this.scoreText) this.scoreText.setText(`Celkové skóre: ${this.score}`);
    else {
      this.scoreText = this.add.text(30, 20, `Celkové skóre: ${this.score}`, {
        fontSize: '18px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 2,
      });
    }
  }

  returnToOriginal(action) {
    const pos = this.originalPositions.get(action);
    if(pos) {
        action.x = pos.x;
        action.y = pos.y;
    }
    // Vrátíme původní wrap, pokud se text zmenšil pro dropzónu
    action.setWordWrapWidth(360);

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
    const feedbackY = 320;

    if (incomplete) {
      const message = "⛔ Vyplň všechny odpovědi!";
      const boxHeight = 140;

      this.feedbackBox = this.add.rectangle(sceneWidth / 2, feedbackY, 700, boxHeight, 0x000000, 0.9)
        .setOrigin(0.5).setStrokeStyle(2, 0xffffff).setDepth(10);

      this.feedbackText = this.add.text(sceneWidth / 2, feedbackY - 20, message, {
        fontSize: '20px', color: '#ffffff', fontStyle: 'bold', align: 'center', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(11);

      this.nextGameButton = this.add.text(sceneWidth / 2, feedbackY + 30, "Zavřít", {
        fontSize: '20px', backgroundColor: '#990000', color: '#fff', fontStyle: 'bold', padding: { x: 20, y: 10 }, stroke: '#330000', strokeThickness: 3,
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

    // Aktualizace skóre
    this.score += points;
    localStorage.setItem('playerScore', this.score);
    this.scoreText.setText(`Celkové skóre: ${this.score}`);

    // Načtení aktuálního kola Drag & Drop hry
    let currentRound = parseInt(localStorage.getItem('dragDropRound')) || 1;

    const correctList = this.correctOrder.map((act, idx) => `${idx + 1}. ${act}`).join('\n');
    
    // Změna textu tlačítka na základě aktuálního kola
    let nextButtonText = currentRound < 2 ? "Další kolo" : "Přejít na kvíz";
    const fullMessage = `Kolo ${currentRound}/2\n${message}\n\nSprávné pořadí:\n${correctList}`;

    const lineCount = fullMessage.split('\n').length;
    const lineHeight = 24;
    const boxHeight = lineCount * lineHeight + 90;

    this.feedbackBox = this.add.rectangle(sceneWidth / 2, feedbackY, 820, boxHeight, 0x000000, 0.9)
      .setOrigin(0.5).setStrokeStyle(2, 0xffffff).setDepth(10);

    this.feedbackText = this.add.text(sceneWidth / 2, feedbackY - 30, fullMessage, {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: 780 }, lineSpacing: 5, stroke: '#000', strokeThickness: 2, padding: { x: 10, y: 10 }
    }).setOrigin(0.5).setDepth(11);

    this.nextGameButton = this.add.text(sceneWidth / 2, feedbackY + boxHeight / 2 - 35, nextButtonText, {
      fontSize: '20px', backgroundColor: '#005500', color: '#fff', fontStyle: 'bold', padding: { x: 20, y: 10 }, stroke: '#003300', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });

    this.nextGameButton.on('pointerdown', () => {
      if (currentRound < 2) {
        // Postup do 2. kola
        localStorage.setItem('dragDropRound', currentRound + 1);
        this.restartGame();
      } else {
        // Konec 2. kola -> smazat round counter hry a jít na kvíz
        localStorage.removeItem('dragDropRound');
        window.location.href = 'quizFight.html';
      }
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

// Konfigurační blok upraven pro 900x600 podle HTML containeru
const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 600,
  backgroundColor: '#1a1a2e',
  scene: [DragDropScene]
};

const game = new Phaser.Game(config);