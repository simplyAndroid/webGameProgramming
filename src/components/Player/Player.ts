import 'phaser'
import {Images, Atlases} from '../../assets'
import GameManager from '../../globals/GameManager'
import GameAdapter from '../../globals/GameAdapter'
import { PLAYER_INVULNERABILITY_COOLDOWN, PLAYER_HEALTH } from '../../globals/constants'
import CooldownCircle from './CooldownCircle'
import Zap from './Zap'
import PlayerWeaponTypes from '../../globals/WeaponTypes'
import PlayerBehemothBullet from './bullets/PlayerBehemothBullet'
import { setTimeout } from 'timers';

enum Direction { Up, Down, Left, Right, UpRight, UpLeft, DownLeft, DownRight, None }

export default class Player extends Phaser.Sprite {
  readonly TOP_SPEED: number = 500 ///////chnage to 1000, then game will be easy than now

  private regularWeapon: Phaser.Weapon
  private scatterer: Phaser.Weapon
  private scatterAngles: number[] = [15, 7.5, 0, 352.5, 345]
  private behemothLauncher: Phaser.Weapon
  private timer: Phaser.Timer
  private weaponTimer: Phaser.Timer
  private invulnerable: boolean = false
  private invulnerableTween: Phaser.Tween
  private commonBulletGroup: Phaser.Group

  private moveUpKey: Phaser.Key
  private moveDownKey: Phaser.Key
  private moveLeftKey: Phaser.Key
  private moveRightKey: Phaser.Key
  private shootKeys: Phaser.Key[]
  private dodgeKeys: Phaser.Key[]
  private currentMovingDirection: Direction
  private activeWeapon: PlayerWeaponTypes

  private gameAdapter: GameAdapter = new GameAdapter()
  private cooldownCircle: CooldownCircle

  private currentCooldownStartTimeStamp: number
  public dodgeDistance: number = 125
  public diagonalDodgeDistance: number 
  public dodgeCooldownMS: number = 2800
  public dodgeReady: boolean = true

  private preloadMonkeySprite: Phaser.Sprite = null
  private isGrounded = false

  private animStatus = 0 // 0: idle, 1: run, 2: jump  
  constructor(game: Phaser.Game) {
    
    //super(game, 100, game.world.centerY, Images.ImageMonkeyIdleIdle1.getName())
    super(game, 100, game.world.centerY)    
    this.preloadMonkeySprite = this.game.add.sprite(0, 0, Atlases.AtlasesMonkeysheet.getName(), Atlases.AtlasesMonkeysheet.Frames.IdleIdle1)
    this.preloadMonkeySprite.anchor.y = 1.0
    this.addChild(this.preloadMonkeySprite)
    /*this.preloadMonkeySprite.animations.add('idle',[ 0, 1, 2], 10, true)
    this.preloadMonkeySprite.animations.add('jump',[3, 4, 5,6, 7, 8, 9],20, true)
    */
    this.preloadMonkeySprite.animations.add('run',[10, 11, 12, 13, 14, 15, 16], 20, true)

    this.initAnimations()
    game.stage.addChild(this)    
    
    this.commonBulletGroup = new Phaser.Group(game)
    
    const { keyboard } = game.input
    this.moveUpKey = keyboard.addKey(Phaser.Keyboard.W)
    this.moveDownKey = keyboard.addKey(Phaser.Keyboard.S)
    this.moveLeftKey = keyboard.addKey(Phaser.Keyboard.A)
    this.moveRightKey = keyboard.addKey(Phaser.Keyboard.D)
    this.shootKeys = [keyboard.addKey(Phaser.Keyboard.SPACEBAR), keyboard.addKey(Phaser.Keyboard.J)]
    this.dodgeKeys = [keyboard.addKey(Phaser.Keyboard.ALT), keyboard.addKey(Phaser.Keyboard.K)]
    this.activeWeapon = PlayerWeaponTypes.RegularWeapon

    this.diagonalDodgeDistance = this.dodgeDistance * Math.sin(Math.PI / 4)
    this.health = PLAYER_HEALTH
    this.timer = game.time.create(false)
    this.weaponTimer = this.game.time.create(true)

    game.physics.enable(this, Phaser.Physics.ARCADE)
    this.body.collideWorldBounds = true
    this.anchor.setTo(-0.4, 1.2)
 
    this.body.bounce.y = 1;
    this.body.gravity.y = 3000;

    this.body.hitPlatform = false;
    this.body.jumptimeStart = -1
    this.body.jumpType = 0;  
    this.body.drag.setTo(250,0);

    const offsetX: number = 25
    const offsetY: number = -30

    this.regularWeapon = game.add.weapon(-1, Images.SpritesheetsCanonbullet2.getName(), null, this.commonBulletGroup)
    this.regularWeapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS
    this.regularWeapon.bulletSpeed = 500
    this.regularWeapon.fireRate = 1//40
    this.regularWeapon.fireAngle = 0
    this.regularWeapon.trackSprite(this, offsetX, offsetY, false)

    this.scatterer = game.add.weapon(-1, Images.SpritesheetsCanonbullet2.getName(), null, this.commonBulletGroup)
    this.scatterer.multiFire = true
    this.scatterer.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS
    this.scatterer.bulletSpeed = 1500
    this.scatterer.fireRate = 130
    this.scatterer.fireAngle = 0
    this.scatterer.trackSprite(this, offsetX, 0, false)

    this.behemothLauncher = new Phaser.Weapon(game, game.plugins)
    this.behemothLauncher.bulletClass = PlayerBehemothBullet
    this.behemothLauncher.createBullets(-1, null, null, this.commonBulletGroup)
    this.behemothLauncher.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS
    this.behemothLauncher.bulletSpeed = 0
    this.behemothLauncher.fireRate = 1000
    this.behemothLauncher.fireAngle = 0
    this.behemothLauncher.trackSprite(this, offsetX, 0, false)

    this.events.onKilled.add(() => {
      this.gameAdapter.gameOver(this.game)
      GameManager.Instance.buryInGraveyard(this)
      ///GameManager.Instance.buryInGraveyard(this.cooldownCircle)
      this.timer.add(GameManager.Instance.RESTART_KEY_DELAY, () => {
        GameManager.Instance.setRestartReady(true)
      })
    })
    this.timer.start(0)
    game.add.existing(this)
  }

  /**
   * Return the weapon bullets group
   * @returns {Phaser.Group}
   */
  public getBullets(): Phaser.Group {
    return this.commonBulletGroup
  }

  /**
   * Get invulnerable cooldown state
   * @returns {boolean}
   */
  public getInvulnerability(): boolean {
    return this.invulnerable
  }

  public initAnimations(){
    if(GameManager.Instance.currentLevelNum == 3){
      this.preloadMonkeySprite.animations.add('idle',[10, 11, 12, 13, 14, 15, 16], 20, true)
      this.preloadMonkeySprite.animations.add('jump',[10, 11, 12, 13, 14, 15, 16], 20, true)
      this.preloadMonkeySprite.animations.play('run')
    }
    else{ 
      this.preloadMonkeySprite.animations.add('idle',[ 0, 1, 2], 10, true)
      this.preloadMonkeySprite.animations.add('jump',[3, 4, 5,6, 7, 8, 9],20, true)
      this.preloadMonkeySprite.animations.play('idle')
    }
  }
  public update(): void {
    ///this.cooldownCircle.updatePos(this.body.position)
    ///this.cooldownCircle.setPercentage(this.getDodgeCooldownTimePercent())
    this.setDodgeDirection()

    let { velocity } = this.body
    const { moveUpKey, moveDownKey, moveLeftKey, moveRightKey, shootKeys, regularWeapon } = this

      if (moveUpKey.isDown) {      
        this.body.velocity.y = this.accelerate(velocity.y, false)
      } else if (moveDownKey.isDown) {
        this.body.velocity.y = this.accelerate(velocity.y, true)
      } else {
        this.body.velocity.y = this.deAccelerate(velocity.y)
      }


    if (moveLeftKey.isDown) {
      this.body.velocity.x = this.accelerate(velocity.x, false)
    } else if (moveRightKey.isDown) {
      this.body.velocity.x = this.accelerate(velocity.x, true)
    } else {
      this.body.velocity.x = this.deAccelerate(velocity.x)
    }

    if (this.dodgeKeys[0].isDown || this.dodgeKeys[1].isDown) {
      this.tryDodge()
    }

    if (shootKeys[0].isDown || shootKeys[1].isDown) {
      if (GameManager.Instance.currentLevelNum == 3){    
  
          this.handleFire()

      } 
    }

    this.currentMovingDirection = Direction.None
  }
 public setIsGround(flag: boolean): void {
  this.isGrounded = flag
  //console.log(flag)
 }
  private handleFire(): void {
    switch (this.activeWeapon) {
      case PlayerWeaponTypes.RegularWeapon:
        this.regularWeapon.fire()
        break
      case PlayerWeaponTypes.Scatterer:
        for (const angle of this.scatterAngles) {
          this.scatterer.fireAngle = angle
          this.scatterer.fire()
        }
        break
      case PlayerWeaponTypes.Behemoth:
        const bullet = this.behemothLauncher.fire()
        if (bullet && bullet.data.onFired) bullet.data.onFired()
        break
      default:
        this.regularWeapon.fire()
    }
  }

  /**
   * Accelerate speed up until top speed, or return the top speed
   * @param {number} velocity
   * @param {boolean} positiveDir - If the direction of the velocity is positive or negative
   * @returns {number} The new velocity
   */
  private accelerate(velocity: number, positiveDir: boolean): number {
    let step = 500
    if(this.isGrounded == false){
      step = 1
    }
    if (this.TOP_SPEED % step !== 0) {
      console.error('Player speed is not a multiple of move step')
    }

    if ((positiveDir && velocity === this.TOP_SPEED) || (!positiveDir && velocity === -this.TOP_SPEED)) {
      return velocity
    }

    if (positiveDir) {
        velocity += step
        return velocity >= this.TOP_SPEED ? this.TOP_SPEED : velocity
    } else {
      velocity -= step
      return velocity <= -this.TOP_SPEED ? -this.TOP_SPEED : velocity
    }
  }

  /**
   * De-accelerate the velocity in a direction
   * @param {number} velocity
   * @returns {number} The new velocity
   */
  private deAccelerate(velocity: number): number {
    const lowestLimit = 2

    if (velocity > 0) {
      velocity -= velocity / 5
      velocity = (velocity <= lowestLimit) ? 0 : velocity
    } else if (velocity < 0) {
      velocity += Math.abs(velocity / 5)
      velocity = (velocity >= -lowestLimit) ? 0 : velocity
    } else {
      return 0;
    }

    return velocity
  }

  private runAnim(type): void {
    if(this.animStatus != 1 && type == 'jump'){
      this.preloadMonkeySprite.animations.stop()
      this.preloadMonkeySprite.animations.play('jump')
      this.animStatus = 1
      //console.log('jump')
    } 
    else if(this.animStatus != 2 && type == 'run'){
      this.preloadMonkeySprite.animations.stop()
      this.preloadMonkeySprite.animations.play('run')
      this.animStatus = 2
      //console.log('run')
    }
    else if(this.animStatus != 0 && type == 'idle'){
      this.preloadMonkeySprite.animations.stop()
      this.preloadMonkeySprite.animations.play('idle')
      this.animStatus = 0
      //console.log('idle')
    }  

  }
  private setDodgeDirection(): void {
    const { moveUpKey, moveDownKey, moveLeftKey, moveRightKey } = this
/////  Up + Left- Right
    if (moveUpKey.isDown) {      
      if (moveLeftKey.isDown){
        this.runAnim('jump')
        if( GameManager.Instance.currentLevelNum < 3){
          this.scale.x = -1
        }
        this.currentMovingDirection = Direction.UpLeft        
      }
      else if (moveRightKey.isDown){
        this.runAnim('jump')
        this.scale.x = 1 
        this.currentMovingDirection = Direction.UpRight
      }
      else{
        this.runAnim('idle')
        this.currentMovingDirection = Direction.Up 
       }
    }
  
//// Down + Left- Right
    else if (moveDownKey.isDown) {
      if (moveLeftKey.isDown){
        if( GameManager.Instance.currentLevelNum < 3){
          this.scale.x = -1
        }
        this.currentMovingDirection = Direction.DownLeft
        if(this.isGrounded){
          this.runAnim('run')
        }
      }
      else if (moveRightKey.isDown){
        this.scale.x = 1
        this.currentMovingDirection = Direction.DownRight
        if(this.isGrounded){
          this.runAnim('run')
        }
      }
      else{
        this.currentMovingDirection = Direction.Down
        if(this.isGrounded){
          this.runAnim('idle')
        }
      }
    }
    
//// Left +Up- Down
    else if (moveLeftKey.isDown) {
      if( GameManager.Instance.currentLevelNum < 3){
        this.scale.x = -1
      }
      if (moveUpKey.isDown){ 
        this.isGrounded = false       
        this.currentMovingDirection = Direction.UpLeft
        this.runAnim('jump')
      }
      else if (moveDownKey.isDown){       
        this.currentMovingDirection = Direction.DownLeft
        this.runAnim('idle')
      }
      else{
        this.runAnim('idle')
        if(this.isGrounded){
          this.runAnim('run')
        }
        this.currentMovingDirection = Direction.Left
      }
    }
  
/// Right + Up-down
    else if (moveRightKey.isDown) {           
      this.scale.x = 1      
      if (moveUpKey.isDown){
        this.isGrounded = false
        this.currentMovingDirection = Direction.UpRight
        this.runAnim('jump')
      }
      else if (moveDownKey.isDown){
        this.currentMovingDirection = Direction.DownRight
        this.runAnim('idle')
      }
      else{
        this.currentMovingDirection = Direction.Right
        this.runAnim('idle')
        if(this.isGrounded){
          this.runAnim('run')
        } 
      }
    }
    else {
      this.runAnim('idle')
    }
    
  }

  private tryDodge(): void {
    if (!this.dodgeReady) {
      return
    }

    const zapIn = new Zap(this.game, this, 48, [0.0, 0.0, 0.0], [0.6, 0.0, 0.0])
    this.game.add.existing(zapIn)

    switch (this.currentMovingDirection) {
      case Direction.Up:
        this.body.position.y -= this.dodgeDistance
        break
      case Direction.Down:
        this.body.position.y += this.dodgeDistance
        break
      case Direction.Left:
        this.body.position.x -= this.dodgeDistance
        break
      case Direction.Right:
        this.body.position.x += this.dodgeDistance
        break
      case Direction.UpLeft:
        this.body.position.x -= this.diagonalDodgeDistance
        this.body.position.y -= this.diagonalDodgeDistance
        break
      case Direction.UpRight:
        this.body.position.x += this.diagonalDodgeDistance
        this.body.position.y -= this.diagonalDodgeDistance
        break
      case Direction.DownLeft:
        this.body.position.x -= this.diagonalDodgeDistance
        this.body.position.y += this.diagonalDodgeDistance
        break
      case Direction.DownRight:
        this.body.position.x += this.diagonalDodgeDistance
        this.body.position.y += this.diagonalDodgeDistance
        break
      case Direction.None:
      default:
        this.body.position.x += this.dodgeDistance
        break
    }

    this.resetDodgeCooldown()

    const zapOut = new Zap(this.game, this, 48, [0.0, 0.0, 0.0], [0.6, 0.0, 0.0])
    this.game.add.existing(zapOut)

    if (!this.invulnerable) {
      this.makeInvulnerable(200)
    }
  }

  private resetDodgeCooldown(): void {
    this.dodgeReady = false

    this.currentCooldownStartTimeStamp = this.timer.ms
    this.timer.add(this.dodgeCooldownMS, () => {
      this.dodgeReady = true
    })
  }

  public setActiveWeapon(type: PlayerWeaponTypes, duration: number) {
    // Already has a power up
    if (this.weaponTimer) {
      this.weaponTimer.destroy()
    }

    this.activeWeapon = type
    this.weaponTimer = this.game.time.create(true)

    this.weaponTimer.start()
    this.weaponTimer.add(duration, () => {
      this.activeWeapon = PlayerWeaponTypes.RegularWeapon
      this.weaponTimer.destroy()
    })
  }

  public getActualActiveWeapon(): Phaser.Weapon {
    switch (this.activeWeapon) {
      case PlayerWeaponTypes.RegularWeapon:
        return this.regularWeapon
      case PlayerWeaponTypes.Scatterer:
        return this.scatterer
      case PlayerWeaponTypes.Behemoth:
        return this.behemothLauncher
      default:
        return this.regularWeapon
    }
  }

  /**
   * Get percent of dodge cooldown, 100% being ready
   * @returns {number}
   */
  public getDodgeCooldownTimePercent(): number {
    if (this.dodgeReady) {
      return 100
    }

    const cooldownTimeAsc = this.timer.ms - this.currentCooldownStartTimeStamp
    return Math.round(cooldownTimeAsc / this.dodgeCooldownMS * 100)
  }

  /**
   * @override
   * Don't apply damage functionality if invulnerable set
   * @param {number} amount
   * @returns {Phaser.Sprite}
   */
  public damage(amount: number): Phaser.Sprite {
    if (this.invulnerable === true) {
      return null
    }

    this.makeInvulnerable()
    GameManager.Instance.removeHeart()
    return super.damage(amount)
  }

  /**
   * Set invulnerable for some short time
   */
  public makeInvulnerable(cooldown?: number): void {
    this.invulnerable = true

    // Flicker feedback
    this.invulnerableTween = this.game.add.tween(this).to(
      {alpha: 0}, 75, Phaser.Easing.Linear.None, true, 0, 1000, true
    )

    // Remove invulnerability after custom time or standard time
    this.timer.add(cooldown ? cooldown : PLAYER_INVULNERABILITY_COOLDOWN, () => {
      this.invulnerable = false
      if (this.game && this.game.tweens) {
        this.game.tweens.remove(this.invulnerableTween)
      }
      this.alpha = 1
    }, this)
  }
}

