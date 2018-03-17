import {Images} from '../../assets'
import Player from '../../components/Player/Player'
import GameAdapter from '../../globals/GameAdapter'
import GameManager from '../../globals/GameManager'
import getLevelOneEnemyWave from '../enemyWaves/levelOneWaves'
import EnemyFactory from '../../components/Enemy/EnemyFactory'
import PowerUpFactory from '../../components/PowerUp/PowerUpFactory'
import { triggerId } from 'async_hooks';

import {randomYPos, randomXPos} from '../../utils/gamehelpers'
import { Sprite } from 'phaser-ce';

export default class LevelTwo extends Phaser.State {
  readonly FEEDS_CNT = 75
  readonly TIME_LMT = 90
  private intervalFunc = null
  private gameResult = 'ready'//'success', 'failed'
  
  readonly WAVE_DELAY: number = 750
  private player: Player
  private enemiesGroup: Phaser.Group
  private gameAdapter: GameAdapter
  private timer: Phaser.Timer
  private bgBack: any
  private bgMid: any
  private bgFront: Phaser.TileSprite =  null
  private farTilesSpeed: number = 0.1
  private midTilesSpeed: number = 1
  private frontTilesSpeed: number = 3
  private enemyFactory: EnemyFactory
  private powerUpFactory: PowerUpFactory
  private willUpdateWave: boolean
  private restartKey: Phaser.Key
  private currentWaveNumber: number

  private tileBoards: Phaser.Sprite[] = []
  private imgTile: any =[ Images.ImageIsland1, Images.ImageIsland2, Images.ImageIsland3 ]
  private countTick: number = 0

  private feeds: Phaser.Sprite[] = []
  private feed: Phaser.Sprite
  private eatFeed: number = 0
  public counterTime: Phaser.Text

  constructor() {
    super()
    this.gameAdapter = new GameAdapter()
    GameManager.Instance.currentLevelNum = 2
  }

  private checkHardPosition(){
    for(var i =0; i<3; i++){ 
      this.game.physics.arcade.overlap(this.feed, this.tileBoards[i],() =>{
        
        this.feed.position.y = this.game.height/10 
        this.feed.scale.x = -1       
      })
    }
    this.game.physics.arcade.overlap(this.feed, this.bgFront,() =>{
      //console.log('Floor--2')      
      this.feed.position.y = this.game.height/10  
      //this.feed.scale.y = -1      
    })   
  }
  private createFeeds(): void {
    for(var i =0; i<this.FEEDS_CNT; i++){   
      this.feed =  this.game.add.sprite(randomXPos(this.game.width), randomYPos(this.game.height), Images.ImageBanana.getName())
      this.game.physics.arcade.enable(this.feed)
      this.feed.body.collideWorldBounds = true      
      this.feed.body.immovable = true      
      this.checkHardPosition()
      this.feed.body.allowGravity = false
      if(i % 3){
        this.feed.scale.y = -1
      }
      this.feeds[i] = this.feed      
    }
  }
  public resetScore(): void {
    this.eatFeed = 0
    
  }
  public create(): void {
    //console.log('Level One')
    this.resetScore()
    GameManager.Instance.levelStartLogic(this.game)
    this.game.physics.enable(this, Phaser.Physics.ARCADE)
    
    this.game.camera.follow(this.player);

    this.restartKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)
    this.willUpdateWave = false
    //this.enemyFactory = new EnemyFactory(this.game)
    this.game.stage.backgroundColor = '#071924'
    this.timer = this.game.time.create(false)
    this.timer.start()

    const backImg = Images.ImageSky.getName()
    const midImg = Images.ImageClouds.getName()
    const frontImg = Images.ImageIsland1.getName()

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

    // Spawn player
    this.player = new Player(this.game)
    GameManager.Instance.setPlayerInstance(this.player)
    this.powerUpFactory = new PowerUpFactory(this.game, this.player)

    this.bgFront = this.game.add.tileSprite(0,
      this.game.height - this.game.cache.getImage(frontImg).height,
      this.game.width,
      this.game.cache.getImage(frontImg).height,
      frontImg
    )
    this.game.physics.arcade.enable(this.bgFront)   
    this.bgFront.body.collideWorldBounds = true
    this.bgFront.body.immovable = true
    this.bgFront.body.allowGravity = false
    
    const pos = [{x:16,y:330}, {x:254,y:220}, {x:487,y:150}]
    for(var i =0; i<3; i++){   
      this.tileBoards[i] = this.game.add.sprite(pos[i].x, pos[i].y, this.imgTile[0].getName())
      this.game.physics.arcade.enable(this.tileBoards[i])
      this.tileBoards[i].body.collideWorldBounds = true
      this.tileBoards[i].body.allowGravity = false
      this.tileBoards[i].body.immovable = true
     
    }
    

    this.createFeeds()

    //this.gameAdapter.initHealthBar(this.game)
    //this.gameAdapter.displayControls(this.game)
    //this.gameAdapter.initTimer(this.game, this.timer)    
    this.intervalFunc = setInterval(() => {  
      GameManager.Instance.scoreValue = 500 + this.eatFeed * 10    
      this.initTimer(this.game, this.countTick, this.TIME_LMT)
      this.countTick ++
      if(this.countTick == this.TIME_LMT){
        this.goNext()
        this.countTick = 0
        clearInterval(this.intervalFunc)
      }
    },1000)
    this.enemiesGroup = this.game.add.group()

    // Spawn first wave
    ///this.enemiesGroup.addMultiple(getLevelOneEnemyWave(1, this.enemyFactory))
    this.currentWaveNumber = 1
    console.log(`Wave ${this.currentWaveNumber}`)
  }
  public goNext(): void {
    GameManager.Instance.scoreValue = 500 + this.eatFeed * 10
    this.initTimer(this.game, this.countTick, this.TIME_LMT)
    if(this.gameResult == 'success'){
      if(this.intervalFunc){
        this.countTick = 0
        clearInterval(this.intervalFunc)
      }
      this.game.state.start('win')
    }
    else{
      this.game.state.start('Gameover')
    }    
  }

  /*
  public pushTiles(tile_: Phaser.Sprite): void {
    this.tileBoards.push(tile_)
  }
  */
  public update(): void {
    
    for(var i = 0; i<3;i++){
      this.game.physics.arcade.collide(this.tileBoards[i], this.player, () => {
        this.player.setIsGround(true)
      });
    }
    for(var i = 0; i< this.FEEDS_CNT;i++){
      if(this.feeds[i]){
        this.game.physics.arcade.collide(this.feeds[i], this.player, () => {
          this.feeds[i].destroy()
          this.feeds[i] = null
          
          this.eatFeed ++
          
          if(this.eatFeed == this.FEEDS_CNT){
            this.gameResult = 'success'
            this.goNext()
          }
          else {
            this.gameResult = 'failed'
          }
        });
      }
    }
   
    this.game.physics.arcade.collide(this.bgFront, this.player, () => {
      //console.log('Collision')
      this.player.setIsGround(true)
    });

    GameManager.Instance.clearGraveyard()
    this.checkWavePassed()
    this.gameAdapter.checkCollisions(this.game, this.player, this.enemiesGroup)

    //let bullets = 0
    //this.enemiesGroup.forEach((enemy) => {
    //  bullets += enemy.getWeakBullets().length + enemy.getStrongBullets().length
    //  console.log(enemy.getWeakBullets())
    //}, this)
    //console.log(bullets)

    //if (!this.player.dodgeReady) {
    //  console.log(this.player.getDodgeCooldownTimePercent())
    //}

    GameManager.Instance.updateFiltersTime(this.game.time.totalElapsedSeconds() * 1000)
   /* this.bgBack.tilePosition.x -= this.farTilesSpeed
    this.bgMid.tilePosition.x -= this.midTilesSpeed
    this.bgFront.tilePosition.x -= this.frontTilesSpeed
*/
    if (!this.player.alive) {
      if (GameManager.Instance.getRestartKeyReady() && this.restartKey.isDown) {
        this.game.state.start('leveltwo')
      }
    }
  }
  public initTimer(game: Phaser.Game, v: number, limit_v: number): void {
    
    if(this.counterTime && this.counterTime.alive){
      this.counterTime.destroy()
      //console.log('text destroy')
    }
    const text: string = `Time Left: ${(limit_v-v)} S  Score: ${GameManager.Instance.scoreValue}`
   this.counterTime = new Phaser.Text(game, 20, 20, text, { font: '18px Anonymous Pro', fontStyle: 'bold', fill: '#fff', align: 'left' })
    game.add.existing(this.counterTime)
  }

  private checkWavePassed(): void {
    if (!this.willUpdateWave && this.gameAdapter.enemyGroupDead(this.enemiesGroup)) {
      this.willUpdateWave = true

      this.timer.add(this.WAVE_DELAY, () => {
        //this.updateWave()
      })
    }
  }

  /**
   * Check if current enemies wave is all dead
   * and if so, add the next until none are left
   */
  private updateWave(): void {
    this.willUpdateWave = false // reset state for coming loops
    this.currentWaveNumber = this.currentWaveNumber + 1

    // Make parallax bg move slightly faster for each wave
    this.farTilesSpeed += 0.03
    this.midTilesSpeed += 0.1
    this.frontTilesSpeed += 0.3

    ///const wave = getLevelOneEnemyWave(this.currentWaveNumber, this.enemyFactory)
    /*
    if (wave.length > 0) {
      console.log(`Wave ${this.currentWaveNumber}`)
      this.gameAdapter.displayWaveInfo(this.game, this.currentWaveNumber)
      this.enemiesGroup.addMultiple(wave)

      // Spawn powerUp possibility
      const poll: number = Math.random()
      if (poll <= 0.35) {
        const poll2: number = Math.random()
        const timer = this.game.time.create(true)
        timer.start()

        if (poll2 > 0.5)
          timer.add(750, () => this.powerUpFactory.spawnScatterer())
        else
          timer.add(750, () => this.powerUpFactory.spawnBehemoth())
      }

    } else {
      // No more enemies
      this.goNext()
    }
    */
  }

}
