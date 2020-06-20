import Arc from '/lib/arcm.js'
import { Level } from './level.js'
import sprites from './sprites.js'

const CONSTANTS = {
    TICK_MS: 12,
    ROWS: 21,
    COLS: 29,
    SCALE: 8,
};
CONSTANTS.WIDTH = CONSTANTS.SCALE*CONSTANTS.COLS;
CONSTANTS.HEIGHT = CONSTANTS.SCALE*CONSTANTS.ROWS;

let background = '#070c0d';

const STATE = {
    MENU: 'menu',
    PLAY: 'play',
    PAUSE: 'pause',
    END: 'end'
};

let canvas = document.querySelector('#gameCanvas');
Arc.init(canvas, CONSTANTS.COLS, CONSTANTS.ROWS);

Promise.all([
    Arc.loadSheet('sheet.png', sprites)
]).then(() => {
    Arc.loop();
    new GameState();
});

class GameState {
    constructor() {
        Arc.setUpdate(this.tick.bind(this), CONSTANTS.TICK_MS);

        document.addEventListener('keydown', event => this.handleKey(event.key, true), false);
        document.addEventListener('keyup', event => this.handleKey(event.key, false), false);

        canvas.style.background = background;

        this.board = Arc.add(this.draw.bind(this));
        this.highscore = this.fetchHighscore();

        this.setState(STATE.MENU);
    }

    setState(state) {
        switch (this.state) {
            default:
        }

        this.counter = 0;
        switch (state) {
            case STATE.PLAY:
                this.level = new Level(this.highscore);
                break;
            default:
        }

        this.state = state;
        Arc.setGui(state);
        this.tick();
    }

    tick() {
        this.counter++;

        switch (this.state) {
            case STATE.PLAY:
                this.level.update();
                if (this.level.gameOver) {
                    if (this.level.score > this.highscore) {
                        this.highscore = this.level.score;
                        this.saveHighscore(this.highscore);
                    }
                    this.setState(STATE.END);
                }
                break;
            default:
        }
    }

    fetchHighscore() {
        let snackmanCookie = document.cookie
            .split(';')
            .find(cookie => cookie.startsWith('snackmanHighscore'));
        if (snackmanCookie) {
            return Number(snackmanCookie.split('=')[1]);
        }
        return 0;
    }

    saveHighscore(score) {
        document.cookie = `snackmanHighscore=${score}; max-age=${60*60*24*365*10}`;
    }

    draw(ctx) {
        switch (this.state) {
            case STATE.MENU:
                Arc.drawScaledSprite('title', CONSTANTS.COLS/2, CONSTANTS.ROWS/2 - 3, 1/2, .5, .5);
                if (this.counter%100 < 50) {
                    Arc.drawScaledSprite('pressKey', CONSTANTS.COLS/2, CONSTANTS.ROWS*5/7, 1/8, .5, .5);
                }
                break;
            case STATE.PLAY:
            case STATE.END:
                this.level.draw(ctx)
                break;
            default:
        }
    }

    handleKey(key, isDown) {
        if (this.level && isDown) {
            this.level.press(key);
        }

        if (!isDown) {
            switch (key) {
                case 'Escape':
                    this.setState(STATE.MENU);
                    break;
                default:
                    switch (this.state) {
                        case STATE.MENU:
                            this.setState(STATE.PLAY);
                            break;
                        case STATE.END:
                            this.setState(STATE.MENU);
                            break;
                        default:
                    }
            }
        }
    }
}

export { CONSTANTS }