class RunnerGameScene extends Phaser.Scene {
    constructor() {
      super({ key: 'RunnerGameScene' });
    }
  
    preload() {
      // Load assets for player sprite, backgrounds, etc.
      this.load.image('player', 'assets/player.png'); // example asset path
    }
  
    create() {
      // Define lane x-positions.
      this.lanes = [150, 300, 450];
      this.currentLane = 1; // Start in the center lane.
  
      // Create the player sprite.
      this.player = this.add.sprite(this.lanes[this.currentLane], 500, 'player');
  
      // Set up keyboard input for lane switching.
      this.input.keyboard.on('keydown-LEFT', () => {
        if (this.currentLane > 0) {
          this.currentLane--;
          this.player.x = this.lanes[this.currentLane];
        }
      });
      this.input.keyboard.on('keydown-RIGHT', () => {
        if (this.currentLane < this.lanes.length - 1) {
          this.currentLane++;
          this.player.x = this.lanes[this.currentLane];
        }
      });
  
      // Periodically spawn password objects.
      this.time.addEvent({
        delay: 1000,
        callback: this.spawnPasswords,
        callbackScope: this,
        loop: true
      });
  
      // End the game after 30 seconds.
      this.time.delayedCall(30000, () => {
        this.endGame();
      });
    }
  
    spawnPasswords() {
      // Randomly designate one lane to get the correct password.
      let correctLaneIndex = Phaser.Math.Between(0, 2);
  
      // For each lane, spawn a text object representing a password.
      for (let i = 0; i < 3; i++) {
        let passwordText = (i === correctLaneIndex) ? "Correct" : "Wrong";
        let passObj = this.add.text(this.lanes[i], 0, passwordText, { fontSize: '20px', fill: '#fff' });
  
        // Animate the text to move downward.
        this.tweens.add({
          targets: passObj,
          y: 600,
          duration: 3000,
          onComplete: () => { passObj.destroy(); }
        });
  
        // Here you could add collision detection so that if the player “collects” the password,
        // you check if the lane matches the correct one.
      }
    }
  
    endGame() {
      // Implement logic to determine win/lose based on whether the player successfully ran into the correct password.
      console.log("Runner game over");
      // Transition to a result scene or show feedback.
    }
  }
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#222',
    scene: [RunnerGameScene]
  };
  
  const game = new Phaser.Game(config);
  