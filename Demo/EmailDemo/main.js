class EmailScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EmailScene' });
  }

  create() {
    // Create an array to store all toggling borders
    this.togglingBorders = [];

    // 1) BACKGROUND
    this.cameras.main.setBackgroundColor('#f1f3f4'); // Light background

    // 2) TOP NAVIGATION BAR
    const topBarHeight = 50;
    this.add.rectangle(0, 0, this.game.config.width, topBarHeight, 0xffffff)
      .setOrigin(0, 0);

    this.add.text(20, 15, "Seznam Email", {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#202124',
      fontStyle: 'bold'
    });

    this.add.text(this.game.config.width - 120, 15, "⚙  ▼", {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#5f6368'
    });

    // 3) LEFT SIDEBAR
    const sidebarWidth = 220;
    this.add.rectangle(0, topBarHeight, sidebarWidth, this.game.config.height - topBarHeight, 0xeeeeee)
      .setOrigin(0, 0);

    let newMailBtn = this.add.rectangle(20, topBarHeight + 20, sidebarWidth - 40, 40, 0xd93025)
      .setOrigin(0, 0)
      .setInteractive();
    this.add.text(40, topBarHeight + 28, "Nová zpráva", {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    });

    this.add.text(30, topBarHeight + 80, "Doručené", {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#202124',
      fontStyle: 'bold'
    });
    this.add.text(30, topBarHeight + 110, "Odeslané", {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#5f6368'
    });
    this.add.text(30, topBarHeight + 140, "Spam", {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#5f6368'
    });
    this.add.text(30, topBarHeight + 170, "Koš", {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#5f6368'
    });

    // 4) MAIN EMAIL AREA
    let contentX = sidebarWidth + 10;
    let contentY = topBarHeight + 10;
    let contentWidth = this.game.config.width - sidebarWidth - 20;
    let contentHeight = this.game.config.height - topBarHeight - 20;

    this.add.rectangle(
      contentX, contentY,
      contentWidth, contentHeight,
      0xffffff
    ).setOrigin(0, 0)
     .setStrokeStyle(2, 0xcccccc);

    // Email data
    let email = {
      senderName: "Ředitel Zelený",
      senderEmail: "j.zelny@seznam.cz",
      subject: "Objednávka objedů",
      date: "12.1. 2025",
      body: [
          "Vášený žáku,",
          "",
          "Nalezla se chyba v tvém obědu, nebyl zaplacený, zaplať ho pomocí přiloženého odkazu.",
          "https://thumbs.dreamstime.com/b/big-smile-emoticon-26256350.jpg",
          "",
          "S pozdravem,",
          "Ředitel Zelený"
      ]
  };

    // Subject text (clickable)
    let subjectText = this.add.text(contentX + 20, contentY + 20, email.subject, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#202124',
      fontStyle: 'bold'
    });
    this.makeTogglingBorder(subjectText.x, subjectText.y, subjectText.width, subjectText.height);

    // Sender info (clickable)
    let senderFull = `${email.senderName} <${email.senderEmail}>`;
    let senderText = this.add.text(contentX + 20, contentY + 60, senderFull, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#5f6368'
    });
    this.makeTogglingBorder(senderText.x, senderText.y, senderText.width, senderText.height);

    // Date/time (not clickable)
    this.add.text(contentX + 20, contentY + 80, email.date, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#5f6368'
    });

    // Divider line
    this.add.rectangle(
      contentX + 20, contentY + 100,
      contentWidth - 40, 1,
      0xcccccc
    ).setOrigin(0, 0);

    // Email body (clickable)
    let bodyString = email.body.join('\n');
    let bodyText = this.add.text(contentX + 20, contentY + 120, bodyString, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#202124',
      wordWrap: { width: contentWidth - 40 }
    });
    this.makeTogglingBorder(bodyText.x, bodyText.y, bodyText.width, bodyText.height);

    // 5) ACTION BUTTONS

    // Open link
    let replyBtn = this.add.rectangle(contentX + 20, contentY + contentHeight - 50, 100, 30, 0x007bff)
      .setOrigin(0, 0)
      .setInteractive();
    this.add.text(contentX + 30, contentY + contentHeight - 45, "Otevřít přílohu", {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff'
    });
    replyBtn.on('pointerdown', () => window.open('https://thumbs.dreamstime.com/b/big-smile-emoticon-26256350.jpg', '_blank'));

    // "Přeposlat" (Forward) button with error check
    let forwardBtn = this.add.rectangle(contentX + 130, contentY + contentHeight - 50, 100, 30, 0x6c757d)
      .setOrigin(0, 0)
      .setInteractive();
    this.add.text(contentX + 140, contentY + contentHeight - 45, "Vyhodnotit", {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff'
    });
    forwardBtn.on('pointerdown', () => {
      let allGreen = true;
      // Check each border; if not green, change it to blue.
      this.togglingBorders.forEach(border => {
        if (border.strokeColor !== 0x00ff00) {
          allGreen = false;
          border.setStrokeStyle(2, 0x0000ff); // Change to blue
        }
      });
      if (allGreen) {
        alert("Nalezl jsi všechny chyby");
      } else {
        alert("Nenalezl jsi všechny chyby");
      }
    });

    // "Reset" button to clear toggled state (make all borders red again)
    let resetBtn = this.add.rectangle(contentX + 240, contentY + contentHeight - 50, 100, 30, 0x28a745)
      .setOrigin(0, 0)
      .setInteractive();
    this.add.text(contentX + 250, contentY + contentHeight - 45, "Reset", {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff'
    });
    resetBtn.on('pointerdown', () => {
      // Iterate through each border and reset its color to red.
      this.togglingBorders.forEach(border => {
        border.setStrokeStyle(2, 0xff0000);
      });
      // Optionally, you could clear the array if you wanted to remove references:
      // this.togglingBorders = [];
      // However, for future error checking, it's best to keep the references.
    });
  }

  /**
   * Creates a clickable border around text that toggles between red and green.
   * Also saves the border to the togglingBorders array.
   */
  makeTogglingBorder(x, y, width, height) {
    let border = this.add.rectangle(
      x - 5, y - 5,
      width + 10, height + 10,
      0xffffff, 0 // Transparent fill
    )
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xff0000) // Initial red border
      .setInteractive();

    border.on('pointerdown', () => {
      let newColor = (border.strokeColor === 0xff0000) ? 0x00ff00 : 0xff0000;
      border.setStrokeStyle(2, newColor);
    });

    // Save the border for later checking.
    this.togglingBorders.push(border);
  }
}

const config = {
  type: Phaser.AUTO,
  width: 1200,
  height: 600,
  scene: EmailScene
};

const game = new Phaser.Game(config);
