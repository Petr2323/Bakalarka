const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [EmailGameScene, RunnerGameScene, DragDropScene, QuizFightScene],
    // Optionally include physics, input configuration, etc.
  };
  
  const game = new Phaser.Game(config);
  
  // You can also implement a main menu scene that lets players choose which mini game to play.
  