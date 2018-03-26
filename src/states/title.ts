import * as Assets from '../assets';
import GameManager from '../globals/GameManager'

export default class Title extends Phaser.State {
  private backgroundTemplateSprite: Phaser.TileSprite = null
  private sfxAudiosprite: Phaser.AudioSprite = null
  private startKey: Phaser.Key
  private aboutInfo: string[]

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

    // About text
    this.aboutInfo = [
      '\"TypescriptMonkey\"',
      '  By Valentyn 2018',
      '  Background Art - Free Resource',
      '  Monkey and others - Free Resource',
      '  Developed with Phaser CE'
    ]

    const startY = (this.game.world.height - this.aboutInfo.length * 10) - 20
    for (let i = 0; i < this.aboutInfo.length; i++) {
      const offset: number = i * 10
      this.game.add.text(16, startY + offset, this.aboutInfo[i], { font: '13px Anonymous Pro', fill: '#aea' })
    }

    // Init Game Manager
    GameManager.Instance.initBulletFilters(this.game)

    this.startKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)
    this.sfxAudiosprite = this.game.add.audioSprite(Assets.Audiosprites.AudiospritesSfx.getName())

    // This is an example of how you can lessen the verbosity
    let availableSFX = Assets.Audiosprites.AudiospritesSfx.Sprites
    this.sfxLaserSounds = [
      availableSFX.Laser1,
      availableSFX.Laser2,
      availableSFX.Laser3,
      availableSFX.Laser4,
      availableSFX.Laser5,
      availableSFX.Laser6,
      availableSFX.Laser7,
      availableSFX.Laser8,
      availableSFX.Laser9
    ];

    this.backgroundTemplateSprite.inputEnabled = true;
    this.backgroundTemplateSprite.events.onInputDown.add(() => {
      this.sfxAudiosprite.play(Phaser.ArrayUtils.getRandomItem(this.sfxLaserSounds))
    });

    this.game.add.button(this.game.world.centerX, this.game.world.centerY - 80, Assets.Images.SpritesheetsStartgame2.getName(), this.goNext, this, 2, 1, 0)
    this.game.add.button(this.game.world.centerX, this.game.world.centerY - 0, Assets.Images.SpritesheetsInstruction.getName(), this.goInstruction, this, 2, 1, 0)
    this.game.add.button(this.game.world.centerX, this.game.world.centerY + 80, Assets.Images.SpritesheetsCredit.getName(), this.goCredit, this, 2, 1, 0)
    this.game.camera.flash(0x000000, 1000)
  }

  public update(): void {
    if (this.startKey.isDown) {
      this.goNext()
    }
  }

  private goNext(): void {
    GameManager.Instance.currentLevelNum = 1 
    this.game.state.start('levelone')//('leveltwo')//('levelthree')//('levelone')
    //this.game.state.start('intro')
  }
  private goInstruction(): void {
    
  }
  private goCredit(): void {
    
  }

}
