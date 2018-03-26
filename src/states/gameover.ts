import * as Assets from '../assets';
import GameManager from '../globals/GameManager';

export default class Gameover extends Phaser.State {
   private backgroundTemplateSprite: Phaser.TileSprite = null
  private sfxAudiosprite: Phaser.AudioSprite = null
  private startKey: Phaser.Key

  // This is any[] not string[] due to a limitation in TypeScript at the moment;
  // despite string enums working just fine, they are not officially supported so we trick the compiler into letting us do it anyway.
  private sfxLaserSounds: any[] = null

  public create(): void {
    this.game.stage.backgroundColor = '#071924'
    const bgImg = Assets.Images.ImageJungleBackground.getName()
    this.backgroundTemplateSprite = this.game.add.tileSprite(0,
      this.game.height - this.game.cache.getImage(bgImg).height,
      this.game.width,
      this.game.cache.getImage(bgImg).height,
      bgImg
    )

    this.startKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)
    this.sfxAudiosprite = this.game.add.audioSprite(Assets.Audiosprites.AudiospritesSfx.getName())

    // This is an example of how you can lessen the verbosity
    let availableSFX = Assets.Audiosprites.AudiospritesSfx.Sprites
    this.sfxLaserSounds = [
      availableSFX.Laser1
    ];

    const score_txt:string = `Score: ${GameManager.Instance.scoreValue}`
    const finalScore = new Phaser.Text(this.game, this.game.world.centerX, this.game.world.centerY-180, score_txt, { font: '22px Anonymous Pro', fontStyle: 'bold', fill: '#aea', align: 'center' })
    finalScore.anchor.setTo(0.5, 0.5)
    this.game.add.existing(finalScore)

    const gameOverText = new Phaser.Text(this.game, this.game.world.centerX, this.game.world.centerY - 40, 'Game Over', { font: '30px Anonymous Pro', fill: '#aea', align: 'center' })
    gameOverText.anchor.setTo(0.5, 0.5)
    this.game.add.existing(gameOverText)

    this.game.add.button(this.game.world.centerX , this.game.world.centerY + 100, Assets.Images.SpritesheetsTryagain2.getName(), this.goNext, this, 2, 1, 0)

    this.backgroundTemplateSprite.inputEnabled = true;
    this.backgroundTemplateSprite.events.onInputDown.add(() => {
      this.sfxAudiosprite.play(Phaser.ArrayUtils.getRandomItem(this.sfxLaserSounds))
    });
  }

  public update(): void {
    if (this.startKey.isDown) {
      this.goNext()
    }
  }

  private goNext(): void {
    GameManager.Instance.scoreValue = 0 
    //console.log(`Retry ${GameManager.Instance.scoreValue}`) 
    this.game.state.start('title')
  }
}