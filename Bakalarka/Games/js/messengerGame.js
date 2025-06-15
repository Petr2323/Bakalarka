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
        this.add.rectangle(20, 20, 840, 410, 0x1a1a2e).setOrigin(0).setStrokeStyle(2, 0x6441a5);

        // Chat container for messages
        this.chatContainer = this.add.container(20, 20);

        // Mask for chat container so messages don't overflow
        const shape = this.make.graphics();
        shape.fillRect(20, 20, 840, 410);
        this.chatContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, shape));

        // Response buttons container (for player answers)
        this.responseButtons = this.add.container(20, 450);

        // Scroll buttons container (arrow up/down) - placed right side of response buttons
        this.scrollButtons = this.add.container(860, 337);

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


        const allTrees = {
            phishing_tree: {
                start: {
                    friend: "Ahoj! Právě mi přišel e-mail od 'Školní IT podpory', že si mám změnit heslo. Klikl/a bys na ten odkaz?",
                    responses: [
                        { text: "Ne, je to divný 🧐", next: "tree1_correct1", points: 1 },
                        { text: "Jo, zní to důležitě, kliknul bych na něj. 👀", next: "tree1_wrong1" }
                    ]
                },
                tree1_correct1: {
                    friend: "Brácha mi říká, že by na to kliknul 😅",
                    responses: [
                        { text: "Neposlouchej ho, zkontroluj si ten e-mail, jestli je fakt školní, měl by být na stránkách školy. 😞", next: "tree1_correct2", points: 1 },
                        { text: "Když to říká, tak to zkus 🤔", next: "tree1_endBad" }
                    ]
                },
                tree1_correct2: {
                    friend: "Dobře! Vypadá to podezřele. Radši to nebudu otevírat. 📛",
                    responses: [
                        { text: "Jo, vždycky lepší se zeptat, já se vyznám ✅", next: "tree1_end", points: 1 },
                        { text: "Tak ať to otevře brácha, bude to na něj 😈", next: "tree1_endBad" }
                    ]
                },
                tree1_wrong1: {
                    friend: "O ou... počkej! Možná to byl falešný e-mail! 😰",
                    responses: [
                        { text: "Sakra, tak poučení pro příště 😓", next: "tree1_end", points: 1 },
                        { text: "To bude v pohodě, co se může stát? 😅", next: "tree1_endBad" }
                    ]
                },
                tree1_end: {
                    friend: "Díky za pomoc, my champ 🏅",
                    responses: [],
                    end: true
                },
                tree1_endBad: {
                    friend: "Teď už mají moje heslo, nedostanu se na účet. Psal jsem IT učiteli, prý mi zítra účet resetují 😟",
                    responses: [],
                    end: true
                }
            },

            youtube_safe_tree: {
                start: {
                    friend: "Kámo, koukni na tohle video! 📺 https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    responses: [
                        { text: "Ok, podívám se 🎬", next: "tree2_correct1", points: 1 },
                        { text: "Nevím, radši nekliku na odkazy. 😬", next: "tree2_safe" }
                    ]
                },
                tree2_correct1: {
                    friend: "Vím že je to starý, ale pořád dobrý 😂",
                    responses: [
                        { text: "Dostal si mě 🤣", next: "tree2_end", points: 1 },
                        { text: "Máš ještě nějaký vtípek? 🤣", next: "tree2_end", points: 1 }
                    ]
                },
                tree2_safe: {
                    friend: "No tak, podívej se, věř mi, tohle je fakt jen sranda. 😄",
                    responses: [
                        { text: "Tak jo, kliknu teda. 🎬", next: "tree2_end", points: 1 },
                        { text: "I tak nechci riskovat. 🙅", next: "tree2_endBad" }
                    ]
                },
                tree2_end: {
                    friend: "Rickroll, dostal jsem tě 😊",
                    responses: [],
                    end: true
                },
                tree2_endBad: {
                    friend: "Tak už ti nic nepošlu. Uvidíme se zítra 😬",
                    responses: [],
                    end: true
                }
            },

            personal_info_tree: {
                start: {
                    friend: "Hele, do jedný hry chtějí, abych zadal svoje celé jméno, adresu a telefon. Mám to tam dát?",
                    responses: [
                        { text: "Ne! To bych nikdy neudělal/a!", next: "tree3_correct1", points: 1 },
                        { text: "Asi jo, když to chtějí... 🤷", next: "tree3_wrong1" }
                    ]
                },
                tree3_correct1: {
                    friend: "Přesně! To není bezpečné. 👏",
                    responses: [
                        { text: "Vždy chránit osobní údaje. 🔐", next: "tree3_end", points: 1 },
                        { text: "*zadám si svoje údaje, získám si odměnu sám.", next: "tree3_badSolo" }
                    ]
                },
                tree3_wrong1: {
                    friend: "Hmm, to asi nebylo nejlepší rozhodnutí. 😕",
                    responses: [
                        { text: "Máš pravdu, příště si dám pozor. 😞", next: "tree3_end", points: 1 },
                        { text: "To je jedno, co s tím můžou dělat? 🤔", next: "tree3_wrong2" }
                    ]
                },
                tree3_wrong2: {
                    friend: "Přišla mi SMS, že jsem si objednal balík a že ho mám vyzvednout, přijede mi na mojí adresu, ale já si nic neobjednával 🤔",
                    responses: [
                        { text: "Vyzvedni ho, třeba to budou body navíc do herního obchodu 👏", next: "tree3_endBad" },
                        { text: "Napiš na podporu hry, hlavně nic nevyzvedávej 🚨", next: "tree3_end", points: 1 }
                    ],
                    
                },
                tree3_end: {
                    friend: "Díky, už jsem klidnější 👏",
                    responses: [],
                    end: true
                },
                tree3_endBad: {
                    friend: "Nebylo to zdarma, zaplatil jsem při převzetí 200Kč, v krabici byla gumová kachnička😭",
                    responses: [],
                    end: true
                },
                tree3_badSolo: {
                    friend: "SMS: přišel Vám balík s herními předměty, vysvedněte si ho v Alzabox.",
                    responses: [
                        { text: "*jít vyzvednout balík, zaplatit dobírku 200Kč 👏", next: "tree3_endBadSolo" },
                        { text: "*napiš na podporu hry, hlavně nic nevyzvedávej 🚨", next:"tree3_endSolo",points: 1 }
                    ],
                },
                tree3_endSolo: {
                    friend: "*vyhnul/a jsem se podvodu😌",
                    responses: [],
                    end: true
                },
                tree3_endBadSolo: {
                    friend: "*v balíku byla jen gumová kachnička, naletěl jsem 😬",
                    responses: [],
                    end: true
                }
            },

            fake_account_tree: {
                start: {
                    friend: "Někdo mi napsal přes Instagram a tvrdí, že je školní admin. Požádal mě o mé přihlášení do školního systému. Mám mu věřit?",
                    responses: [
                        { text: "To zní divný, napiš na školní podporu nebo učiteli IT. 🚨", next: "tree4_correct1", points: 1 },
                        { text: "Možná, zní to důvěryhodně. 🤨", next: "tree4_wrong1" }
                    ]
                },
                tree4_correct1: {
                    friend: "Prý je to urgentní, mohl se mi tam prý někdo nabourat. 😳",
                    responses: [
                        { text: "Je to vážný, dej mu rychle své údaje 😬", next: "tree4_wrong1"},
                        { text: "Ignoruj ho, napiš e-mail IT učiteli.", next: "tree4_correct2", points: 1 }
                    ]
                },
                tree4_correct2: {
                    friend: "Díky! Ukázalo se, že ten účet byl falešný! 😳",
                    responses: [
                        { text: "Hlavně, že se to vyřešilo🙌", next: "tree4_end", points: 1 }
                    ]
                },
                tree4_wrong1: {
                    friend: "Tak jsem mu je poslal, prý mi tam 'opraví' známky za to, že jsem mu pomohl 🤩",
                    responses: [
                        { text: "Hele, to je hodně divný, rychle si změň heslo a napiš do školy 😓", next: "tree4_end", points: 1 },
                        { text: "Super, kéž by mi taky 'opravil' známky 😊", next: "tree4_endBad" }
                    ]
                },
                tree4_end: {
                    friend: "Díky za pomoc, nevědel jsem, co dělat. Jsi nej 👏",
                    responses: [],
                    end: true
                },
                tree4_endBad: {
                    friend: "Chtěl jsem se před chvilkou přihlásit na školní účet, prý mám špatné heslo. Zítra zajdu za učitelem IT 😬",
                    responses: [],
                    end: true
                }
            },

            clickbait_tree: {
                start: {
                    friend: "Wow! Právě jsem vyhrál nový iPhone! Musím jen kliknout na tenhle odkaz! 📱😲 https://newiphone.cz/getIphone=true",
                    responses: [
                        { text: "To bude podvod, neklikej! ⚠️", next: "tree5_correct1", points: 1 },
                        { text: "Super, pak mi ho ukážeš 🤩", next: "tree5_wrong1" }
                    ]
                },
                tree5_correct1: {
                    friend: "Ale co když ne, já chci nový mobil 😅",
                    responses: [
                        { text: "Tyhle věci jsou vždycky podezřelý, nedělej to 🧐", next: "tree5_correct2", points: 1 },
                        { text: "Tak jo, co se může stát, buď budeš mít mobil nebo ne 😅", next: "tree5_wrong1" }
                    ]
                },
                tree5_correct2: {
                    friend: "Poslední slovo, mám to zkusit nebo ne 😅",
                    responses: [
                        { text: "Nedělej to, je to podvod 😅", next: "tree5_end", points: 1 },
                        { text: "Tak na to klikni, když to tak moc chceš 😅", next: "tree5_wrong1" }
                    ]
                },
                tree5_wrong1: {
                    friend: "O-ou... otevřelo mi to divné stránky. 😰",
                    responses: [
                        { text: "Rychle to zavři a spusť antivirus 🛑", next: "tree5_endMiddle", points: 1 },
                        { text: "To je v pohodě, nic se neděje. Budeš mít mobil 😎", next: "tree5_endBad" }
                    ]
                },
                tree5_end: {
                    friend: "Díky, že jsi mi to rozmluvil/a 😅",
                    responses: [],
                    end: true
                },
                tree5_endMiddle: {
                    friend: "To bylo těsný, snad se nic nestalo😬",
                    responses: [],
                    end: true
                },
                tree5_endBad: {
                    friend: "Super, to je bezva, dostal jsem Trojskýho koně, alespoň že ho antivirus dal do karantény 😰",
                    responses: [],
                    end: true
                }
            }
        };

        const treeKeys = Object.keys(allTrees);
        const selectedKey = Phaser.Math.RND.pick(treeKeys);
        this.dialogueTree = allTrees[selectedKey];

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
        const containerX = 840 - bubbleWidth;
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
