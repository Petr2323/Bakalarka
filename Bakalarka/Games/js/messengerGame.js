// --- NOVÁ ÚVODNÍ SCÉNA ---
class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    create() {
        this.add.rectangle(0, 0, 900, 600, 0x1a1a2e).setOrigin(0);
        this.add.rectangle(50, 50, 800, 500, 0x1a1a2e).setOrigin(0).setStrokeStyle(2, 0x6441a5);

        this.add.text(450, 120, 'Messenger game', {
            fontSize: '40px', color: '#f0e6ff', fontStyle: 'bold', fontFamily: '"Segoe UI Mono", monospace'
        }).setOrigin(0.5);

        const instructionsText = "Tvým úkolem je pomoci kamarádovi v chatu činit správná a bezpečná rozhodnutí na internetu.\n\n" +
            "Čti pozorně jeho zprávy a vyber nejlepší možnou odpověď. Za správná rozhodnutí získáváš body.\n\n" +
            "Kliknutím na tlačítko OK spustíš simulaci chatu.";

        this.add.text(450, 280, instructionsText, {
            fontSize: '20px', color: '#d8caff', fontFamily: '"Segoe UI Mono", monospace', wordWrap: { width: 700 }, align: 'center'
        }).setOrigin(0.5);

        const okBtn = this.add.text(450, 460, 'OK', {
            fontSize: '32px', backgroundColor: '#5a4dcf', color: '#f0e6ff', padding: { x: 40, y: 15 }, fontStyle: 'bold', stroke: '#3a2c8d', strokeThickness: 3, align: 'center', fontFamily: '"Segoe UI Mono", monospace'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        okBtn.on('pointerover', () => okBtn.setStyle({ backgroundColor: '#7a69ff' }));
        okBtn.on('pointerout', () => okBtn.setStyle({ backgroundColor: '#5a4dcf' }));
        okBtn.on('pointerdown', () => this.scene.start('ChatScene'));
    }
}

// --- HLAVNÍ CHAT SCÉNA ---
class ChatScene extends Phaser.Scene {
    constructor() {
        super('ChatScene');
        this.score = 0;
        this.maxScore = 3;
        this.currentNode = 'start';
        this.chatHeight = 0;

        // Inicializace Supabase - doplňte své údaje
        // 1. Správná HTTP URL adresa
        const SUPABASE_URL = 'https://fejkfjyoqrnqryqrlljy.supabase.co';

        // 2. Anonymní API klíč
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlamtmanlvcXJucXJ5cXJsbGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODI2MzMsImV4cCI6MjA5Nzg1ODYzM30.nVWNax8d5R3gVVSDfj8pyIpoaN4m9JWiIoRM8MkRF0E';

        // Inicializace klienta
        this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    async create() {
        this.add.rectangle(20, 20, 840, 410, 0x1a1a2e).setOrigin(0).setStrokeStyle(2, 0x6441a5);
        this.chatContainer = this.add.container(20, 20);
        
        const shape = this.make.graphics();
        shape.fillRect(20, 20, 840, 410);
        this.chatContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, shape));

        this.responseButtons = this.add.container(20, 450);
        this.scrollButtons = this.add.container(860, 337);

        // --- PŮVODNÍ DATA JAKO FALLBACK ---
        const fallbackTrees = { phishing_tree: {
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
                    { text: "Neposlouchej ho, zkontroluj si den e-mail, jestli je fakt školní, měl by být na stránkách školy. 😞", next: "tree1_correct2", points: 1 },
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
                friend: "Díky za pomoc, kámo 🏅",
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
                    { text: "Nevím, radši nekliknu na odkaz. 😬", next: "tree2_safe" }
                ]
            },
            tree2_correct1: {
                friend: "Vím že je to starý, ale pořád dobrý 😂",
                responses: [
                    { text: "RickRolled. Dostal si mě 🤣", next: "tree2_correct2", points: 1 },
                    { text: "RickRolled. Máš ještě nějaký vtípek? 🤣", next: "tree2_correct2", points: 1 }
                ]
            },
            tree2_correct2: {
                friend: "Máš něco pro mě na zasmání?",
                responses: [
                    { text: "*poslat odkaz na stránku s matematickými příklady", next: "tree2_endSad", points: 1},
                    { text: "*poslat srandovní video", next: "tree2_end", points: 1 }
                ]
            },
            tree2_safe: {
                friend: "No tak, podívej se, věř mi, tohle je fakt jen sranda. 😄",
                responses: [
                    { text: "Tak jo, kliknu teda. 🎬", next: "tree2_endRolled", points: 1 },
                    { text: "I tak nechci riskovat. 🙅", next: "tree2_endBad" }
                ]
            },
            tree2_end: {
                friend: "😊",
                responses: [],
                end: true
            },
            tree2_endSad: {
                friend: "Tak jo, vyhrál/a jsi 😊. Tohle jsem nečekal 😄",
                responses: [],
                end: true
            },
            tree2_endRolled: {
                friend: "RickRolled, dostal jsem tě 😊",
                responses: [],
                end: true
            },
            tree2_endBad: {
                friend: "Tak už ti nic nepošlu. Uvidíme se zítra 😟",
                responses: [],
                end: true
            }
        } };

        const loadingText = this.add.text(450, 220, "Načítám scénáře...", { fontSize: '24px', fill: '#ffffff' }).setOrigin(0.5);

        try {
            const { data, error } = await this.supabase
                .from('ChatTrees')
                .select('tree_name, tree_data')
                .limit(1);

            if (error || !data || data.length === 0) throw new Error('DB chyba');
            this.allTrees = data[0].tree_data;
        } catch (err) {
            console.warn('Používám lokální data:', err);
            this.allTrees = fallbackTrees;
        }

        loadingText.destroy();
        this.dialogueTree = this.allTrees[Phaser.Math.RND.pick(Object.keys(this.allTrees))];

        // Tlačítka posunu
        const upBtn = this.add.text(0, 0, '▲', { fontSize: '32px', backgroundColor: '#5a4dcf', color: '#f0e6ff', padding: { x: 10, y: 5 } }).setInteractive({ useHandCursor: true });
        upBtn.on('pointerdown', () => this.scrollChatBy(100));
        this.scrollButtons.add(upBtn);

        const downBtn = this.add.text(0, 50, '▼', { fontSize: '32px', backgroundColor: '#5a4dcf', color: '#f0e6ff', padding: { x: 10, y: 5 } }).setInteractive({ useHandCursor: true });
        downBtn.on('pointerdown', () => this.scrollChatBy(-100));
        this.scrollButtons.add(downBtn);

        this.showNode(this.currentNode);
    }

    addFriendMessage(text) {
        const msgText = this.add.text(20, 0, text, { fontSize: '20px', color: '#d8caff', wordWrap: { width: 500 }, fontFamily: '"Segoe UI Mono", monospace' });
        const padding = 20;
        const bubbleWidth = msgText.width + padding * 2;
        const bubbleHeight = msgText.height + padding;
        const bubble = this.add.graphics().fillStyle(0x3a345e, 1).fillRoundedRect(0, 0, bubbleWidth, bubbleHeight, 15);
        const container = this.add.container(0, this.chatHeight, [bubble, msgText]);
        this.chatContainer.add(container);
        this.chatHeight += bubbleHeight + 15;
        this.adjustScrollAfterNewMessage();
    }

    addPlayerMessage(text) {
        const msgText = this.add.text(0, 0, text, {
            fontSize: '20px',
            color: '#f0e6ff',
            wordWrap: { width: 400 }, // Zmenšeno, aby se zpráva vlezla do okna
            fontFamily: '"Segoe UI Mono", monospace'
        });
    
        const padding = 20;
        const bubbleWidth = msgText.width + padding * 2;
        const bubbleHeight = msgText.height + padding;
    
        const bubble = this.add.graphics();
        bubble.fillStyle(0x6441a5, 1);
        bubble.fillRoundedRect(0, 0, bubbleWidth, bubbleHeight, 15);
        
        // Výpočet pozice zprava (840 je šířka chatovací oblasti)
        const containerX = 840 - bubbleWidth - 20; 
        const container = this.add.container(containerX, this.chatHeight, [bubble, msgText]);
        
        msgText.setPosition(padding, padding / 2);
        this.chatContainer.add(container);
    
        this.chatHeight += bubbleHeight + 15;
        this.adjustScrollAfterNewMessage();
    }

    adjustScrollAfterNewMessage() {
        if (this.chatHeight > 410) this.chatContainer.y = 20 - (this.chatHeight - 410);
    }

    scrollChatBy(deltaY) {
        let newY = this.chatContainer.y + deltaY;
        this.chatContainer.y = Phaser.Math.Clamp(newY, 20 - (this.chatHeight - 410), 20);
    }

    clearResponseButtons() { this.responseButtons.removeAll(true); }

    showResponses(responses) {
        this.clearResponseButtons();
        if (responses.length === 0) {
            this.showEnd();
            return;
        }
    
        let x = 0;
        // Omezíme šířku celého řádku odpovědí, aby se vešly do boxu
        const maxButtonWidth = 800; 
    
        responses.forEach((resp) => {
            const btn = this.add.text(x, 0, resp.text, {
                fontSize: '18px', // Zmenšeno pro lepší čitelnost více tlačítek
                backgroundColor: '#5a4dcf',
                color: '#f0e6ff',
                padding: { x: 15, y: 10 },
                fontStyle: 'bold',
                stroke: '#3a2c8d',
                strokeThickness: 3,
                fontFamily: '"Segoe UI Mono", monospace',
                wordWrap: { width: 350 } // Omezení šířky jednotlivého tlačítka
            }).setInteractive({ useHandCursor: true });
    
            btn.on('pointerdown', () => {
                this.addPlayerMessage(resp.text);
                if (resp.points) this.score += resp.points;
                this.currentNode = resp.next;
                this.time.delayedCall(300, () => this.showNode(this.currentNode));
                this.clearResponseButtons();
            });
    
            this.responseButtons.add(btn);
            
            // Posun pro další tlačítko v kontejneru
            x += btn.width + 20;
        });
        
        // Pokud by tlačítka přesahovala šířku, můžeme kontejner posunout nebo zarovnat
        if (x > maxButtonWidth) {
            this.responseButtons.setScale(0.8); // Případné zmenšení celého bloku
        }
    }

    showNode(nodeKey) {
        const node = this.dialogueTree[nodeKey];
        if (!node) return;
        this.addFriendMessage(node.friend);
        if (node.end) this.showEnd();
        else this.showResponses(node.responses);
    }

    showEnd() {
        this.clearResponseButtons();
        const endText = this.add.text(0, 10, `Vaše skóre: ${this.score}/${this.maxScore}`, { fontSize: '24px', color: '#f0e6ff' });
        const nextGameButton = this.add.text(0, 60, "Další hra", { fontSize: '28px', backgroundColor: '#007700', padding: { x: 20, y: 10 } }).setInteractive({ useHandCursor: true });
        
        nextGameButton.on('pointerdown', () => {
            let current = parseInt(localStorage.getItem('playerScore') || 0);
            localStorage.setItem('playerScore', current + this.score);
            window.location.href = 'linkGame.html';
        });

        this.responseButtons.add(endText);
        this.responseButtons.add(nextGameButton);
    }
}

const config = { type: Phaser.AUTO, width: 900, height: 600, backgroundColor: '#1a1a2e', scene: [TitleScene, ChatScene] };
const game = new Phaser.Game(config);