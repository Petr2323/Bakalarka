class ChatScene extends Phaser.Scene {
    constructor() {
        super('ChatScene');
        this.score = 0;
        this.maxScore = 3;
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

        // Response buttons container (for player answers)
        this.responseButtons = this.add.container(20, 450);

        // Scroll buttons container (arrow up/down) - placed right side of response buttons
        this.scrollButtons = this.add.container(800, 450);

        // Create scroll up button
        // Create scroll up button (arrow up)
        const upBtn = this.add.text(0, 0, '▲', {
            fontSize: '32px',
            backgroundColor: '#5a4dcf',
            color: '#f0e6ff',
            padding: { x: 10, y: 5 },
            fontStyle: 'bold',
            stroke: '#3a2c8d',
            strokeThickness: 3,
            align: 'center',
        }).setInteractive({ useHandCursor: true });

        // Swap direction here:
        upBtn.on('pointerdown', () => this.scrollChatBy(100));  // scroll down to show text below
        upBtn.on('pointerover', () => upBtn.setStyle({ backgroundColor: '#7a69ff' }));
        upBtn.on('pointerout', () => upBtn.setStyle({ backgroundColor: '#5a4dcf' }));

        this.scrollButtons.add(upBtn);

        // Create scroll down button (arrow down)
        const downBtn = this.add.text(0, 50, '▼', {
            fontSize: '32px',
            backgroundColor: '#5a4dcf',
            color: '#f0e6ff',
            padding: { x: 10, y: 5 },
            fontStyle: 'bold',
            stroke: '#3a2c8d',
            strokeThickness: 3,
            align: 'center',
        }).setInteractive({ useHandCursor: true });

        // Swap direction here:
        downBtn.on('pointerdown', () => this.scrollChatBy(-100)); // scroll up to show text above
        downBtn.on('pointerover', () => downBtn.setStyle({ backgroundColor: '#7a69ff' }));
        downBtn.on('pointerout', () => downBtn.setStyle({ backgroundColor: '#5a4dcf' }));

        this.scrollButtons.add(downBtn);


        // Expanded dialogue tree with emojis
        this.dialogueTree = {
            start: {
                friend: "Hey! 👋 How's your day going?",
                responses: [
                    { text: "Pretty good, thanks! 😊", next: "friend_good" },
                    { text: "Not great, honestly 😞", next: "friend_bad" }
                ]
            },
            friend_good: {
                friend: "Glad to hear! 🎉 Want to catch a movie this weekend? 🍿",
                responses: [
                    { text: "Sounds awesome! 👍", next: "movie_yes", points: 1 },
                    { text: "Can't, got work 😔", next: "movie_no" }
                ]
            },
            friend_bad: {
                friend: "Oh no! 😟 Want to talk about it?",
                responses: [
                    { text: "Sure, thanks for asking 💙", next: "talk_yes" },
                    { text: "Not really, maybe later.", next: "talk_no" }
                ]
            },
            movie_yes: {
                friend: "Great! I'll book the tickets 🎟️. Which movie do you prefer?",
                responses: [
                    { text: "Action 🎬", next: "action_movie" },
                    { text: "Comedy 😂", next: "comedy_movie" }
                ]
            },
            movie_no: {
                friend: "No worries! Maybe next time 🙌",
                responses: [],
                end: true
            },
            talk_yes: {
                friend: "I'm here for you. What's bothering you? 💬",
                responses: [
                    { text: "Just stressed about work 🥵", next: "stress_work" },
                    { text: "Personal stuff 😕", next: "stress_personal" }
                ]
            },
            talk_no: {
                friend: "Alright, anytime you want to chat, I'm here 😊",
                responses: [],
                end: true
            },
            action_movie: {
                friend: "Perfect! Action movies are my favorite too! 🎯",
                responses: [
                    { text: "Awesome, can't wait! 😎", next: "end_good" }
                ]
            },
            comedy_movie: {
                friend: "Haha, laughter is the best medicine 😂",
                responses: [
                    { text: "Exactly! Let's do it! 😄", next: "end_good" }
                ]
            },
            stress_work: {
                friend: "That sounds tough. Want to hang out and relax this weekend? ☕",
                responses: [
                    { text: "Yes, that'd be great! 🙏", next: "end_good", points: 1 },
                    { text: "Maybe later, thanks.", next: "end_neutral" }
                ]
            },
            stress_personal: {
                friend: "I'm here whenever you want to talk ❤️",
                responses: [
                    { text: "Thank you, really appreciate it.", next: "end_good" },
                    { text: "I need some time alone.", next: "end_neutral" }
                ]
            },
            end_good: {
                friend: "Looking forward to it! Talk soon! 🤗",
                responses: [],
                end: true
            },
            end_neutral: {
                friend: "No problem, take care of yourself! 🌿",
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
        this.adjustScrollAfterNewMessage();
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
        this.adjustScrollAfterNewMessage();
    }

    // Called when a new message is added, automatically scroll to bottom if needed
    adjustScrollAfterNewMessage() {
        const maxHeight = 410;
        if (this.chatHeight > maxHeight) {
            this.chatContainer.y = 20 - (this.chatHeight - maxHeight);
        } else {
            this.chatContainer.y = 20;
        }
    }

    // Scroll chat container manually by deltaY pixels, clamping inside bounds
    scrollChatBy(deltaY) {
        const maxHeight = 410;
        let newY = this.chatContainer.y + deltaY;

        // Clamp newY so chatContainer never scrolls too far up/down
        const minY = 20 - (this.chatHeight - maxHeight); // max scroll up (negative)
        const maxY = 20; // max scroll down (top)

        if (this.chatHeight <= maxHeight) {
            // No scrolling needed if content fits
            newY = 20;
        } else {
            if (newY < minY) newY = minY;
            if (newY > maxY) newY = maxY;
        }

        this.chatContainer.y = newY;
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
                strokeThickness: 3,
                fontFamily: '"Segoe UI Mono", monospace',
                wordWrap: { width: 400 }
            }).setInteractive({ useHandCursor: true });

            btn.on('pointerdown', () => {
                this.addPlayerMessage(resp.text);
                if (resp.points) this.score += resp.points;
                this.currentNode = resp.next;
                this.time.delayedCall(300, () => this.showNode(this.currentNode));
                this.clearResponseButtons();
            });

            this.responseButtons.add(btn);
            x += btn.width + 20;
        });
    }

    showNode(nodeKey) {
        if (!this.dialogueTree[nodeKey]) {
            console.warn(`Node ${nodeKey} not found.`);
            return;
        }

        const node = this.dialogueTree[nodeKey];

        this.addFriendMessage(node.friend);

        if (node.end) {
            console.log('Node has end=true, calling showEnd()');
            this.showEnd();
        } else {
            this.showResponses(node.responses);
        }
    }

    showEnd() {
        console.log('showEnd() called');
        this.clearResponseButtons();

        // Show final message and score
        const endText = this.add.text(0, 0, `Vaše skóre: ${this.score}/${this.maxScore}`, {
            fontSize: '24px',
            color: '#f0e6ff',
            fontFamily: '"Segoe UI Mono", monospace',
        });

        this.responseButtons.add(endText);
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
