import {Images} from '../../assets'
import GameAdapter from '../../globals/GameAdapter'

export default class Intro extends Phaser.State {
  private bgBack: any
  private bgMid: any
  private textContent: string[]
  private textEmotions: any
  private characterHead: Phaser.Sprite
  private textObject: any
  private gameAdapter: GameAdapter
  private countdownNumber: number
  private startLevelCounter: any
  private skipKey: Phaser.Key

  private line: string[] = [];
  private wordIndex: number = 0;
  private lineIndex: number = 0;
  readonly WORD_DELAY: number = 150;
  readonly LINE_DELAY: number = 600;

  public create(): void {
    this.gameAdapter = new GameAdapter()
    this.lineIndex = 0
    this.wordIndex = 0
    this.countdownNumber = 3

    this.textContent = [
      'This Web Game was written by Typescript, it is based on Phaser2.',
      'Simple logic, but shows Typescript programming and Phaser usage.',
      '2018.3.15',
      '',
    ]

    this.textEmotions = {
      0: Images.ImagesAva1Normal.getName(),
      1: Images.ImagesAva1Sad.getName(),
      2: Images.ImagesAva1Sad.getName(),
      3: Images.ImagesAva1Normal.getName(),
      4: Images.ImagesAva1Happy.getName(),
      5: Images.ImagesAva1Glasses.getName()
    }
    const backImg = Images.ImageJungleBackground.getName()
    const midImg = Images.ImageJungleBackground.getName()

    this.bgBack = this.game.add.tileSprite(0,
      this.game.height - this.game.cache.getImage(backImg).height,
      this.game.width,
      this.game.cache.getImage(backImg).height,
      backImg
    )

    this.bgMid = this.game.add.tileSprite(0,
      this.game.height - this.game.cache.getImage(midImg).height,
      this.game.width,
      this.game.cache.getImage(midImg).height,
      midImg
    )

    this.game.add.button(this.game.world.width - 150, this.game.world.height - 85, Images.SpritesheetsStartgame1.getName(), this.goNext, this, 2, 1, 0)
    this.skipKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)

    this.textObject = this.game.add.text(140, 32, '', { font: '13px Anonymous Pro', fill: '#58e1cf' })
    this.characterHead = this.game.add.sprite(16, 64, Images.ImagesAva1Normal.getName())
    this.game.add.text(this.characterHead.x, this.characterHead.y + 50, 'Ava', { font: '13px Anonymous Pro', fill: '#aea' })
    this.game.add.text(this.characterHead.x, this.characterHead.y + 60, 'Shop Manager', { font: '13px Anonymous Pro', fill: '#aea' })
    this.game.add.text(this.characterHead.x, this.characterHead.y + 70, 'Lvl 20 Mechanic', { font: '13px Anonymous Pro', fill: '#aea' })
    this.nextLine()
  }

  public update(): void {
    if (this.skipKey.isDown) {
      this.goNext()
    }
  }
  private goNext(): void {
    this.game.state.start('levelone')
  }

  private nextLine() {
    if (this.lineIndex === this.textContent.length) {
      return this.countdownToStart()
    }

    this.line = this.textContent[this.lineIndex].split(' ')
    this.wordIndex = 0
    this.setDisplayCharacter(this.lineIndex)
    this.game.time.events.repeat(this.WORD_DELAY, this.line.length, this.nextWord, this)
    this.lineIndex++
  }

  private nextWord(): void {
    this.textObject.text = this.textObject.text.concat(this.line[this.wordIndex] + ' ')
    this.wordIndex++

    if (this.wordIndex === this.line.length) {
      this.textObject.text = this.textObject.text.concat('\n')
      this.game.time.events.add(this.LINE_DELAY, this.nextLine, this)
    }
  }

  private setDisplayCharacter(lineIdx: number): void {
    this.characterHead.loadTexture(this.textEmotions[lineIdx])//pru
  }

  private countdownToStart(): void {
    this.startLevelCounter = this.game.add.text(this.game.world.centerX, this.game.world.centerY, this.countdownNumber.toString(), { font: '82px Anonymous Pro', fill: '#fff' })

    const tween = this.game.add.tween(this.startLevelCounter).to(
      {alpha: 0}, 1000, Phaser.Easing.Linear.None, true, 0, 0, false
    )
    tween.onComplete.add(() => {
      this.countdownNumber--

      if (this.countdownNumber === 0)
        this.goNext()
      else
        this.countdownToStart()
    })
  }
}
