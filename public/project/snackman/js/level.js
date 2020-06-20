import Arc from '/lib/arcm.js';
import { CONSTANTS } from './main.js';
import { Player } from './player.js';
import { Ghost } from './ghost.js';

let bluePoint = [200, 400, 800, 1600];
let fruitPoint = [100, 200, 400, 700, 1100, 1600, 2200, 3000, 4000, 5500, 7500, 10000];
let charSpeed = [
    [[.8, .9, 1], [.9, .95, 1]],
    [[.75, .85, .95], [.5, .55, .6]]
];
let modeTime = [
    [7, 20, 7, 20, 5, 20, 5, -1],
    [7, 20, 7, 20, 5, 120, 5, -1],
    [5, 20, 5, 20, 5, 120, 0, -1],
];
let exitCount = [
    [0, 0, 30, 60],
    [0, 0, 0, 50],
    [0, 0, 0, 0]
];
let exitTime = [5, 4, 3];
let afterCount = [0, 7, 17, 32];

let keyToDir = {
    'w': 0,
    'd': 1,
    's': 2,
    'a': 3,
    'ArrowUp': 0,
    'ArrowRight': 1,
    'ArrowDown': 2,
    'ArrowLeft': 3,
}

export class Level {
    constructor(highscore) {
        this.highscore = highscore;
        this.constructMap()

        this.finishTime = 0;

        this.lives = 2;
        this.score = 0;
        this.level = 0;
        this.nextLevel();
    }

    constructMap() {
        this.map = Array.matrix(CONSTANTS.ROWS, CONSTANTS.COLS);
        let cv = document.createElement('canvas');
        cv.width = 116;
        cv.height = 84;
        let ctx = cv.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(...Arc.sprites['map'], 0, 0, 116, 84);
        let imageData = ctx.getImageData(0, 0, 116, 84)
        for (let col = 0; col < CONSTANTS.COLS; col++) {
            for (let row = 0; row < CONSTANTS.ROWS; row++) {
                if (imageData.data[(row*CONSTANTS.COLS*4 + col)*16 + 2] !== imageData.data[2]
                        || imageData.data[((row*4 + 3)*CONSTANTS.COLS*4 + (col*4)+3)*4 + 2] !== imageData.data[2]) {
                    this.map[row][col] = 1;
                } else {
                    this.map[row][col] = 0;
                }
            }
        }
    }

    nextLevel() {
        this.counter = 0;
        if (this.level < 12) {
            this.level++;
            this.lives++;
        }
        this.mode = this.modeCount = 0;
        this.blue = false;
        this.blueCount = this.blueTime = this.blueEat = 0;
        this.startTime = 100;
        this.dots = 0;
        this.dotTot = 197;
        this.out = 0;
        this.eatTime = 0;
        this.levelDeath = false;
        this.fruits = 0;
        this.fruit = false;
        this.fruitTime = 0;
        this.scoreTime = 0;

        if (this.level === 1) this.difficulty = 0;
        else if (this.level > 1 && this.level < 5) this.difficulty = 1;
        else this.difficulty = 2;

        this.regen();
        this.modeSwitch(false);
        this.setSpeed(0);
    }

    regen() {
        this.player = new Player(14, 16, this);
        this.ghosts = [
            new Ghost(14, 9, 0, this),
            new Ghost(14, 12, 1, this),
            new Ghost(13, 11, 2, this),
            new Ghost(15, 11, 3, this)];

        for (let i = 1; i < 28; i++)
        for (let j = 2; j < 20; j++)
            if (this.map[j][i] === 0) this.map[j][i] = 2;

        for (let i = 12; i < 17; i++)
        for (let j = 2; j < 5; j++)
            if (this.map[j][i] !== 1) this.map[j][i] = 0;

        for (let i = 10; i < 19; i++)
        for (let j = 8; j < 16; j++)
            if (this.map[j][i] !== 1) this.map[j][i] = 0;

        for (let i = 12; i < 17; i++)
        for (let j = 17; j < 20; j++)
            if (this.map[j][i] !== 1) this.map[j][i] = 0;

        this.map[10][14] = 1;
        this.map[16][14] = 0;
        this.map[4][2] = 3;
        this.map[4][26] = 3;
        this.map[14][2] = 3;
        this.map[14][26] = 3;
    }

    update() {
        if (!this.gameOver && this.finishTime === 0 && this.blueTime === 0) {
            // snackman death animation
            if (this.dieTime > 0) {
                this.player.update();
                this.dieTime--;
                if (this.dieTime === 0) {
                    if (this.lives === 0) {
                        this.gameOver = true;
                    } else
                        this.nextLife();
                }
            // life start animation
            } else if (this.startTime > 0) {
                this.startTime--;
            // regular events
            } else {
                this.counter++;
                // player update
                this.player.update();
                // ghosts update
                this.ghosts.forEach(ghost => {
                    // set targets
                    if (!ghost.blue) {
                        if (this.mode%2 === 0) {
                            ghost.targetCorner();
                        } else {
                            ghost.targetPlayer(this.player, this.ghosts[0])
                        }
                    }
                    ghost.update();
                    // check collision with player
                    if (!ghost.isEaten() && this.player.checkGhost(ghost)) {
                        if (ghost.blue) {
                            ghost.eat();
                            this.eatBlue();
                        } else {
                            this.dead = true;
                            this.player.kill();
                            this.lives--;
                            this.dieTime = 250;
                        }
                    }
                });

                if (this.fruit && this.player.checkFruit()) this.eatFruit();

                if ((this.dotTot === 140 && this.fruits === 0)
                        || (this.dotTot === 60 && this.fruits === 1)) {
                    this.fruit = true;
                    this.fruitTime = 840;
                    this.fruits++;
                } else if (this.fruitTime > 0) {
                    this.fruitTime--;
                    if (this.fruitTime === 0) this.fruit = false;
                }

                if (!this.dead) {
                    if (this.blueCount > 0) {
                        this.blueCount--;
                    } else {
                        if (this.blue) {
                            this.blue = false;
                            this.blueEat = 0;
                            this.modeSwitch(true);
                            this.setSpeed(0);
                        }

                        if (this.modeCount === 84*modeTime[this.difficulty][this.mode]) {
                            this.mode++;
                            this.modeSwitch(false);
                            this.modeCount = 0;
                        } else {
                            this.modeCount++;
                        }
                    }

                    // when to release each ghost
                    if (this.levelDeath) {
                        for (let i = this.out; i < 4; i++)
                            if (afterCount[i] <= this.dots) {
                                this.ghosts[i].exit();
                                this.out++;
                                this.eatTime = 0;
                            }
                    } else {
                        for (let i = this.out; i < 4; i++)
                            if (exitCount[this.difficulty][i] <= this.dots) {
                                this.ghosts[i].exit();
                                this.out++;
                                this.eatTime = 0;
                                break;
                            }
                    }

                    if (this.eatTime === 84*exitTime[this.difficulty]) {
                        if (this.out < 4) {
                            this.ghosts[this.out].exit();
                            this.eatTime = 0;
                            this.out++;
                        }
                    } else {
                        this.eatTime++;
                    }

                    if (this.scoreTime > 0)
                        this.scoreTime--;

                    if (this.dotTot === 0) {
                        this.finishTime = 200;
                        this.player.anim = 0;
                    }
                }
            }
        } else {
            if (this.finishTime > 0) {
                this.finishTime--;
                if (this.finishTime === 0)
                    this.nextLevel();
            }
            if (this.blueTime > 0) {
                this.blueTime--;
            }
        }

        if (this.score > this.highscore) this.highscore = this.score;
    }

    nextLife() {
        this.dead = false;
        this.levelDeath = true;
        this.mode = 0;
        this.modeCount = 0;
        this.blue = false;
        this.blueCount = 0;
        this.blueTime = 0;
        this.startTime = 100;
        this.dots = 0;
        this.out = 0;
        this.eatTime = 0;
        this.fruit = false;
        this.fruitTime = 0;
        this.scoreTime = 0;

        delete this.player;
        delete this.ghosts;
        this.player = new Player(14, 16, this);
        this.ghosts = [
            new Ghost(14, 9, 0, this),
            new Ghost(14, 12, 1, this),
            new Ghost(13, 11, 2, this),
            new Ghost(15, 11, 3, this)];

        this.modeSwitch(false);
        this.setSpeed(false);
    }

    modeSwitch(isBlue) {
        this.ghosts.forEach(ghost => {
            isBlue ? ghost.setBlue(this.blue) : ghost.setMode(this.mode%2 === 0);
        });
    }

    setSpeed(isBlue) {
        isBlue = isBlue ? 1 : 0;
        this.player.setSpeed(2*charSpeed[0][isBlue][this.difficulty] /32);
        this.ghosts.forEach(g =>
            g.setSpeed(2*charSpeed[1][isBlue][this.difficulty] /32)
        );
    }
    getSpeed(charType, isBlue) {
        if (isBlue)
            return 2*charSpeed[charType][1][this.difficulty] /32;
        return 2*charSpeed[charType][0][this.difficulty] /32;
    }
    getTunnelSpeed(isInside) {
        if (isInside)
            return charSpeed[0][0][this.difficulty] /32;
        else
            return 2*charSpeed[1][this.blue ? 1 : 0][this.difficulty] /32;
    }

    eatPellet(type, x, y) {
        this.map[y][x] = 0;
        this.dots++;
        this.dotTot--;
        switch (type) {
            case 0:
                this.score += 10;
                break;
            case 1:
                this.score += 50;
                this.blueCount = 500;
                this.blue = true;
                this.setSpeed(1);
                this.modeSwitch(true);
                break;
            default:
        }
    }
    eatBlue() {
        this.blueEat++;
        this.score += bluePoint[this.blueEat-1];
        this.blueTime = 50;
    }
    eatFruit() {
        this.fruit = false;
        this.fruitTime = 0;
        this.score += fruitPoint[this.level-1];
        this.scoreTime = 300;
    }

    press(key) {
        console.log(key);
        if (keyToDir.hasOwnProperty(key)) {
            this.player.press(keyToDir[key]);
        } else switch(key) {
            case '1': if (this.level < 12) this.level++; break;
            case '2': this.lives++; break;
            case '3': this.eatPellet(1, 0, 0);
            default:
        }
    }

    draw(ctx) {
        Arc.drawScaledSprite('map', 0, 0, 1/4);

        for (let i = 0; i < CONSTANTS.ROWS; i++)
        for (let j = 0; j < CONSTANTS.COLS; j++) {
            switch (this.map[i][j]) {
                case 2:
                    Arc.drawScaledSprite(Arc.sprites.dot[0], j+.5, i+.5, 1/16, .5, .5);
                    break;
                case 3:
                    if (this.counter%30 < 15)
                        Arc.drawScaledSprite(Arc.sprites.dot[1], j+.5, i+.5, 1/8, .5, .5);
                    break;
                default:
            }
        }

        if (this.gameOver) {
            Arc.drawScaledSprite(Arc.sprites.gameOver, 11.75, 14.2, 1/8);
        } else if (this.finishTime > 0) {
            this.player.draw(ctx);
        } else {
            if (this.startTime > 0) Arc.drawScaledSprite(Arc.sprites.ready, 12.925, 14.2, 1/8);
            if (this.scoreTime > 0) Arc.drawNumber(fruitPoint[this.level-1], 14.5, 14.5, 1/16, 1/16, 0.5, 0.5);
            if (this.blueTime > 0) {
                Arc.drawNumber(bluePoint[this.blueEat-1], this.player.x+.5, this.player.y+.5, 1/16, 1/16, 0.5, 0.5);
                if (!this.dead) this.ghosts.forEach(ghost => {
                    if (!this.player.checkGhost(ghost)) ghost.draw(ctx)
                });
            } else {
                this.player.draw(ctx);
                if (!this.dead) this.ghosts.forEach(ghost => ghost.draw(ctx));
            }
            if (this.fruit) Arc.drawScaledSprite(Arc.sprites.fruit[this.level-1], 14+1/8, 14+1/8, 1/8);
        }

        for (let i = 0; i < this.level; i++)
            Arc.drawScaledSprite(Arc.sprites.fruit[i], 27+1/6 - i*5/6, 20+1/8, 1/8);

        for (let i = 1; i < this.lives; i++)
            Arc.drawScaledSprite(Arc.sprites.pMove32, 7/6 + i, 20+1/8, 1/8);

        Arc.drawScaledSprite(Arc.sprites.score, 6, 1.5, 1/8, 1, .5);
        Arc.drawNumber(this.score, 6.5, 1.5, 1/8, 1/8, 0, 0.5);

        Arc.drawScaledSprite(Arc.sprites.highscore, 23, 1.5, 1/8, 1, .5);
        Arc.drawNumber(this.highscore, 23.5, 1.5, 1/8, 1/8, 0, 0.5);
    }
}