class ChatScene extends Phaser.Scene {
    constructor() {
      super('ChatScene');
      this.score = 0;
      this.currentNode = 'start';
      this.chatHeight = 0;
    }
  
    create() {
      // Background of chat area (for clarity)
      this.add.rectangle(20, 20, 860, 410, 0x1a1a2e).setOrigin(0).setStrokeStyle(2, 0x6441a5);
  
      // Chat container for messages
      this.chatContainer = this.add.container(20, 20);
  
      // Mask for chat container so messages don't overflow
      const shape = this.make.graphics();
      shape.fillRect(20, 20, 860, 410);
      this.chatContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, shape));
  
      // Response buttons container
      this.responseButtons = this.add.container(20, 450);
  
      this.dialogueTree = {
        start: {
          friend: "Hey, how's it going?",
          responses: [
            { text: "Good, you?", next: "friend_good" },
            { text: "Busy now, talk later?", next: "friend_busy" }
          ]
        },
        friend_good: {
          friend: "I'm great! Want to hang out this weekend?",
          responses: [
            { text: "Sure, sounds fun!", next: "friend_happy", points: 1 },
            { text: "Sorry, busy.", next: "friend_sad", points: 0 }
          ]
        },
        friend_busy: {
          friend: "Okay, catch you later!",
          responses: [],
          end: true
        },
        friend_happy: {
          friend: "Awesome! I'll text you the details.",
          responses: [],
          end: true
        },
        friend_sad: {
          friend: "Oh, that's too bad. Maybe next time.",
          responses: [],
          end: true
        }
      };
  
      this.showNode(this.currentNode);
    }
  
    addFriendMessage(text) {
      // Create text first to get height dynamically
      const msgText = this.add.text(20, 0, text, {
        fontSize: '20px',
        color: '#d8caff',
        wordWrap: { width: 500 },
        fontFamily: '"Segoe UI Mono", monospace'
      });
  
      const padding = 20;
      const bubbleWidth = msgText.width + padding * 2;
      const bubbleHeight = msgText.height + padding;
  
      // Bubble background (left)
      const bubble = this.add.graphics();
      bubble.fillStyle(0x3a345e, 1);
      bubble.fillRoundedRect(0, 0, bubbleWidth, bubbleHeight, 15);
      bubble.lineStyle(2, 0x6441a5);
      bubble.strokeRoundedRect(0, 0, bubbleWidth, bubbleHeight, 15);
  
      // Group bubble and text inside a container
      const container = this.add.container(0, this.chatHeight, [bubble, msgText]);
      msgText.setPosition(padding, padding / 2);
  
      this.chatContainer.add(container);
  
      this.chatHeight += bubbleHeight + 15;
      this.scrollChat();
    }
  
    addPlayerMessage(text) {
      const msgText = this.add.text(0, 0, text, {
        fontSize: '20px',
        color: '#f0e6ff',
        wordWrap: { width: 500 },
        fontFamily: '"Segoe UI Mono", monospace'
      });
  
      const padding = 20;
      const bubbleWidth = msgText.width + padding * 2;
      const bubbleHeight = msgText.height + padding;
  
      const bubble = this.add.graphics();
      bubble.fillStyle(0x6441a5, 1);
      bubble.fillRoundedRect(0, 0, bubbleWidth, bubbleHeight, 15);
      bubble.lineStyle(2, 0x3a345e);
      bubble.strokeRoundedRect(0, 0, bubbleWidth, bubbleHeight, 15);
  
      // Align bubble container to right side inside chat width (860)
      const containerX = 860 - bubbleWidth;
      const container = this.add.container(containerX, this.chatHeight, [bubble, msgText]);
      msgText.setPosition(padding, padding / 2);
  
      this.chatContainer.add(container);
  
      this.chatHeight += bubbleHeight + 15;
      this.scrollChat();
    }
  
    scrollChat() {
      const maxHeight = 410;
      if (this.chatHeight > maxHeight) {
        this.chatContainer.y = 20 - (this.chatHeight - maxHeight);
      } else {
        this.chatContainer.y = 20;
      }
    }
  
    clearResponseButtons() {
      this.responseButtons.removeAll(true);
    }
  
    showResponses(responses) {
      this.clearResponseButtons();
  
      if (responses.length === 0) {
        this.showEnd();
        return;
      }
  
      let x = 0;
  
      responses.forEach((resp) => {
        const btn = this.add.text(x, 0, resp.text, {
          fontSize: '24px',
          backgroundColor: '#5a4dcf',
          color: '#f0e6ff',
          padding: { x: 15, y: 10 },
          fontStyle: 'bold',
          stroke: '#3a2c8d',
          strokeThickness: 4,
          wordWrap: { width: 250 },
          align: 'center',
        }).setInteractive({ useHandCursor: true });
  
        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#7a69ff' }));
        btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#5a4dcf' }));
  
        btn.on('pointerdown', () => {
          this.onResponseSelected(resp);
        });
  
        this.responseButtons.add(btn);
  
        x += btn.width + 20;
      });
    }
  
    onResponseSelected(response) {
      this.addPlayerMessage(response.text);
      this.score += response.points || 0;
      this.clearResponseButtons();
  
      this.time.delayedCall(600, () => {
        this.currentNode = response.next;
        this.showNode(this.currentNode);
      });
    }
  
    showNode(nodeId) {
      const node = this.dialogueTree[nodeId];
      if (!node) {
        console.error("No dialogue node with id:", nodeId);
        return;
      }
  
      this.addFriendMessage(node.friend);
      this.showResponses(node.responses);
    }
  
    showEnd() {
      this.clearResponseButtons();
  
      const finalMsg = `Konec konverzace. Tvé skóre: ${this.score}`;
      this.addFriendMessage(finalMsg);
  
      const restartBtn = this.add.text(0, 50, 'Restartovat hru', {
        fontSize: '26px',
        backgroundColor: '#5a4dcf',
        color: '#f0e6ff',
        padding: { x: 20, y: 12 },
        fontStyle: 'bold',
        stroke: '#3a2c8d',
        strokeThickness: 5,
        align: 'center',
      }).setInteractive({ useHandCursor: true });
  
      restartBtn.on('pointerover', () => restartBtn.setStyle({ backgroundColor: '#7a69ff' }));
      restartBtn.on('pointerout', () => restartBtn.setStyle({ backgroundColor: '#5a4dcf' }));
      restartBtn.on('pointerdown', () => this.restartGame());
  
      this.responseButtons.add(restartBtn);
    }
  
    restartGame() {
      this.score = 0;
      this.currentNode = 'start';
      this.chatHeight = 0;
      this.chatContainer.removeAll(true);
      this.clearResponseButtons();
      this.chatContainer.y = 20;
      this.showNode(this.currentNode);
    }
  }
  
  const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    backgroundColor: '#1a1a2e',
    scene: [ChatScene]
  };
  
  const game = new Phaser.Game(config);
  