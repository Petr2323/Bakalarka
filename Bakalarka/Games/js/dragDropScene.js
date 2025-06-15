class CybersecurityScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CybersecurityScene' });

    // Cybersecurity scenarios with 4-5 correct actions in order
    this.scenarios = [
      {
        title: "Někdo se ti naboural do Google účtu",
        actions: [
          "Ihned si změň heslo",
          "Zkontroluj nedávnou aktivitu účtu",
          "Zruš přístup podezřelým aplikacím",
          "Zapni dvoufázové ověření"
        ]
      },
      {
        title: "Počítač ti napadl ransomware",
        actions: [
          "Odpoj počítač od internetu",
          "Vyfoť výkupné nebo varovné hlášky",
          "Zjisti, jestli máš zálohy",
          "Řekni dospělému a kontaktujte odborníky"
        ]
      },
      {
        title: "Dostal(a) jsi podezřelý e-mail",
        actions: [
          "Neklikej na žádné odkazy ani přílohy",
          "Označ ho jako spam nebo phishing",
          "Zablokuj odesílatele",
          "E-mail smaž"
        ]
      },
      {
        title: "Tvůj herní účet má podezřelou aktivitu",
        actions: [
          "Změň si heslo na bezpečném zařízení",
          "Odhlásit se ze všech zařízení",
          "Zkontroluj historii akcí a nákupů",
          "Změň nastavení zabezpečení účtu",
          "Zapni dvoufázové ověření"
        ]
      },
      {
        title: "Na počítači se objevila neznámá aplikace",
        actions: [
          "Neotevírej ji",
          "Zjisti, kdy se nainstalovala",
          "Spusť antivirovou kontrolu",
          "Odinstaluj podezřelé programy",
          "Aktualizuj bezpečnostní software"
        ]
      },
      {
        title: "Ztratil(a) jsi mobil",
        actions: [
          "Zkus ho lokalizovat přes účet (např. Google)",
          "Změň hesla ke službám jako e-mail",
          "Informuj rodiče nebo učitele",
          "Zablokuj SIM kartu přes operátora"
        ]
      },
      {
        title: "Dostal(a) jsi výhružnou zprávu na sociálních sítích",
        actions: [
          "Neodpovídej",
          "Udělej screenshot zprávy",
          "Nahlas uživatele administrátorům",
          "Řekni rodičům nebo učiteli"
        ]
      },
      {
        title: "Přihlásil(a) ses na falešnou stránku",
        actions: [
          "Okamžitě změň heslo",
          "Odhlásit se ze všech zařízení",
          "Zkontroluj, co bylo přístupné",
          "Pouč se, jak vypadá správná adresa webu"
        ]
      },
      {
        title: "Našel(a) jsi USB flash disk ve škole",
        actions: [
          "Nestrkej USB do svého počítače",
          "Nepokoušej se zjistit, co je na něm",
          "Odevzdej ho učiteli nebo správci IT",
          "Vysvětli, proč to může být nebezpečné (např. viry)"
        ]
      },
      {
        title: "Přítel ti poslal neobvyklou zprávu s odkazem",
        actions: [
          "Neklikej na odkaz",
          "Zeptej se přítele, jestli to opravdu poslal",
          "Pokud ne, upozorni ho, že mu mohl být napaden účet",
          "Nahlas to jako spam nebo phishing"
        ]
      }
    ];
  }

  create() {
    this.showStartMenu();
  }

  showStartMenu() {
    this.overlay = this.add.rectangle(550, 300, 1100, 600, 0x000000, 0.7);
    const instructions = "Vítejte ve hře!\n\nDrag akce na správná čísla ve správném pořadí.\n\nKlikněte na 'Začít hru' pro začátek.";

    this.guideText = this.add.text(550, 250, instructions, {
      fontSize: '24px', fill: '#ffffff', align: 'center', wordWrap: { width: 1000 }
    }).setOrigin(0.5);

    this.startButton = this.add.text(550, 400, 'Začít hru', {
      fontSize: '28px', fill: '#fff', backgroundColor: '#0066ff', padding: { x: 20, y: 10 }, borderRadius: 10,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.startButton.on('pointerdown', () => {
      this.overlay.destroy();
      this.guideText.destroy();
      this.startButton.destroy();
      this.initGame();
    });
  }

  initGame() {
    this.submitted = false;
    this.actionTexts = [];
    this.originalPositions = new Map();
    this.dropAssignments = [];
    this.score = this.score || 0;

    this.currentScenario = Phaser.Utils.Array.GetRandom(this.scenarios);
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
    const zoneHeight = 60;
    const marginX = 140;

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
      const totalWidth = numberLabel.width + gameObject.width + marginX;

      // Align the action so it's next to the number, leaving a clear gap
      gameObject.x = numberLabel.x + numberLabel.displayWidth / 2 + gameObject.displayWidth / 2 + marginX;
      gameObject.y = numberLabel.y;

      gameObject.x = numberLabel.x + marginX;
      gameObject.y = numberLabel.y;
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

    const sceneWidth = this.sys.game.config.width;
    /*if (!this.feedbackText) {
      this.feedbackText = this.add.text(sceneWidth / 2, 600 - 40, '', {
        fontSize: '20px', color: '#eee', fontStyle: 'bold', backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: { x: 15, y: 10 }, wordWrap: { width: sceneWidth - 100 }, align: 'center', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5);
    } else {
      this.feedbackText.setText('');
    }*/
  }

  returnToOriginal(action) {
    const pos = this.originalPositions.get(action);
    action.x = pos.x;
    action.y = pos.y;
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
    if (this.restartButton) this.restartButton.destroy();
  
    const incomplete = userOrder.includes(null);
    const isCorrect = !incomplete && userOrder.every((text, i) => text === this.correctOrder[i]);
  
    let message;
    if (incomplete) {
      message = "⛔ Vyplň všechny odpovědi!";
    } else if (isCorrect) {
      message = "✅ Skvělé! Všechno je správně!";
      this.score += 1;
      this.scoreText.setText(`Score: ${this.score}`);
    } else {
      message = "❌ Některé odpovědi nejsou ve správném pořadí.";
    }
  
    const sceneWidth = this.sys.game.config.width;
    const feedbackY = 350; // moved 150 px higher
  
    const correctList = this.correctOrder.map((act, idx) => `${idx + 1}. ${act}`).join('\n');
    const fullMessage = `${message}\n\nSprávné pořadí:\n${correctList}`;
  
    const lineCount = fullMessage.split('\n').length;
    const lineHeight = 26;
    const boxHeight = lineCount * lineHeight + 80; // extra space for button
  
    // Disable interactions on actions and submit button
    this.actionTexts.forEach(action => action.disableInteractive());
    this.submitButton.disableInteractive();
  
    // Feedback background box
    this.feedbackBox = this.add.rectangle(sceneWidth / 2, feedbackY, 1000, boxHeight, 0x000000, 0.7)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0xffffff)
      .setDepth(10);
  
    // Feedback message
    this.feedbackText = this.add.text(sceneWidth / 2, feedbackY - 40, fullMessage, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 950 },
      lineSpacing: 6,
      stroke: '#000',
      strokeThickness: 2,
      padding: { x: 10, y: 10 }
    }).setOrigin(0.5).setDepth(11);
  
    // Restart button inside feedback box, below the text
    this.restartButton = this.add.text(sceneWidth / 2, feedbackY + boxHeight / 2 - 30, "🔄 Restartovat hru", {
      fontSize: '22px',
      backgroundColor: '#005500',
      color: '#fff',
      fontStyle: 'bold',
      padding: { x: 20, y: 10 },
      borderRadius: 10,
      stroke: '#003300',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });
  
    this.restartButton.on('pointerdown', () => {
      // Clear feedback elements
      this.feedbackBox.destroy();
      this.feedbackText.destroy();
      this.restartButton.destroy();
  
      // Reset interactivity
      this.actionTexts.forEach(action => action.setInteractive({ useHandCursor: true }));
      this.submitButton.setInteractive({ useHandCursor: true });
  
      this.submitted = false;
  
      // Restart the game by resetting everything
      this.restartGame();
    });
  
    this.submitted = true;
  }
  




  restartGame() {
    this.actionTexts.forEach(action => action.destroy());
    this.dropZones.forEach(zone => zone.destroy());
    this.numberLabels.forEach(label => label.destroy());
    this.children.removeAll();
    this.actionTexts = [];
    this.dropZones = [];
    this.numberLabels = [];
    this.originalPositions.clear();
    this.input.removeAllListeners();
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
