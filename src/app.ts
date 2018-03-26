import 'p2'
import 'pixi'
import 'phaser'

import * as WebFontLoader from 'webfontloader'

import Boot from './states/boot'
import Preloader from './states/preloader'
import Title from './states/title'
import LevelOne from './states/levels/levelone'
import LevelTwo from './states/levels/leveltwo'
import LevelThree from './states/levels/levelthree'
import Intro from './states/levels/intro'
import * as Utils from './utils/utils'
import * as Assets from './assets'
import Win from './states/win'
import Gameover from './states/gameover'
//import EnemyBulletTexture from './utils/texrender/enemybullet'
//import GameManager from './globals/GameManager'

class App extends Phaser.Game {
    constructor(config: Phaser.IGameConfig) {
        super (config)

        this.state.add('boot', Boot)
        this.state.add('preloader', Preloader)
        this.state.add('title', Title)
        this.state.add('intro', Intro)
        this.state.add('win', Win)
        this.state.add('Gameover',Gameover)
        this.state.add('levelone', LevelOne)
        this.state.add('leveltwo', LevelTwo)
        this.state.add('levelthree', LevelThree)
        this.state.start('boot')
    }
}

function startApp(): void {
    let gameWidth: number = DEFAULT_GAME_WIDTH
    let gameHeight: number = DEFAULT_GAME_HEIGHT

    if (SCALE_MODE === 'USER_SCALE') {
        let screenMetrics: Utils.ScreenMetrics = Utils.ScreenUtils.calculateScreenMetrics(gameWidth, gameHeight)

        gameWidth = screenMetrics.gameWidth
        gameHeight = screenMetrics.gameHeight
    }

    // There are a few more options you can set if needed, just take a look at Phaser.IGameConfig
    let gameConfig: Phaser.IGameConfig = {
        width: gameWidth,
        height: gameHeight,
        renderer: Phaser.WEBGL,
        parent: '',
        resolution: 1
    };

    let app = new App(gameConfig)
}

window.onload = () => {
    let webFontLoaderOptions: any = null
    let webFontsToLoad: string[] = GOOGLE_WEB_FONTS
    //GameManager.Instance.EnemyBulletTexture = EnemyBulletTexture

    if (webFontsToLoad.length > 0) {
        webFontLoaderOptions = (webFontLoaderOptions || {})

        webFontLoaderOptions.google = {
            families: webFontsToLoad
        };
    }

    if (Object.keys(Assets.CustomWebFonts).length > 0) {
        webFontLoaderOptions = (webFontLoaderOptions || {})

        webFontLoaderOptions.custom = {
            families: [],
            urls: []
        };

        for (let font in Assets.CustomWebFonts) {
            webFontLoaderOptions.custom.families.push(Assets.CustomWebFonts[font].getFamily())
            webFontLoaderOptions.custom.urls.push(Assets.CustomWebFonts[font].getCSS())
        }
    }

    if (webFontLoaderOptions === null) {
        // Just start the game, we don't need any additional fonts
        startApp()
    } else {
        // Load the fonts defined in webFontsToLoad from Google Web Fonts, and/or any Local Fonts then start the game knowing the fonts are available
        webFontLoaderOptions.active = startApp

        WebFontLoader.load(webFontLoaderOptions)
    }
}
