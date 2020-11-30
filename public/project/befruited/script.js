import Arc from '/lib/modules/arcm.js'
import { Counter, Countdown } from '/lib/modules/counter.js'
import { bounded, randi, matrix } from '/lib/modules/utils.js'

const CNST = {
    TICK_MS: 12,
    HEIGHT: 80,
    WIDTH: 72,
    GRID_SIZE: 8,
    GRID_SCALE: 8,
    GRID_WIDTH: 64,
    GRID_HEIGHT: 64,
    GRID_FRAME: 4,
    N_TYPES: 7,
};
CNST.GRID2COORD = (pos) => {
    return [CNST.GRID_FRAME + pos.x*CNST.GRID_SCALE, CNST.GRID_FRAME + pos.y*CNST.GRID_SCALE]
}
const DIR = {
    LEFT: new Arc.V(-1, 0),
    RIGHT: new Arc.V(1, 0),
    UP: new Arc.V(0, -1),
    DOWN: new Arc.V(0, 1)
}

const STATE = {
    MENU: 'menu',
    PLAY: 'play'
};

setTimeout(() => {
    Arc.init(document.querySelector('#befruitedCanvas'), CNST.WIDTH, CNST.HEIGHT);
    Arc.loadSheet('sheet.png', [
        ['frame', 0, 0, 72, 80],
        ['title', 77, 13, 42, 16],
        ['newGame', 78, 30, 40, 11],
        ['score', 100, 7, 22, 5],
        ['highscore', 78, 7, 44, 5],
        ['active', 77, 42, 8, 8],
        ['fruit', 77, 51, 12, 12, 9, 14, 0],
        ['', 72, 7, 5, 5, 10, 0, 6],
        ['noMoreMoves', 119, 24, 35, 15],
        ['gameOver', 119, 40, 45, 9],
        ['bonus', 141, 15, 26, 7, 2, 0, -8],
        ['meterStart', 168, 15, 2, 7],
        ['meterMiddle', 170, 15, 1, 7],
        ['meterEnd', 171, 15, 2, 7],
        ['meterFill', 174, 15, 1, 7, 2, 0, -8],
    ]).then(() => {
        Arc.loop();
        new GameState();
    });
}, 150);

class MatchScore {
    constructor(tile, points) {
        this.tile = tile;
        this.points = points;
        this.counter = new Countdown(80).start();
    }

    tick() { this.counter.tick(); }

    isDone() { return this.counter.isDone(); }

    draw(ctx) {
        let coord = CNST.GRID2COORD(this.tile)
        let percent = this.counter.percent();
        ctx.save();
        ctx.globalAlpha = 1 - percent;
        Arc.drawNumber(this.points, coord[0]+CNST.GRID_SCALE/2, coord[1]+CNST.GRID_SCALE/2, .5, .5, .5, percent);
        ctx.restore();
    }
}

class ScoreManager {
    constructor(board) {
        this.board = board;
        this.baseMatchValue = 10;
        this.score = 0;
        this.scores = [];
        this.bonusMeterFill = 0;
        this.BONUS_METER_MULT = 50;
        this.bonusMeterTarget = this.baseMatchValue * this.BONUS_METER_MULT;
        this.bonusTime = new Countdown(250);
        this.active = false;
    }
    setActive(isActive) { this.active = isActive; }

    endCombo() { this.combo = 0; }
    scoreMatch(fruits) {
        if (this.active) {
            this.combo += 1;
            let matchValue = Math.pow(2, fruits.length - 3) * this.baseMatchValue; // 1, 2, 4
            let points = matchValue * this.combo;
            this.score += points;
            if (!this.bonusTime.isActive()) {
                this.bonusMeterFill += points;
            }
            let pos = new Arc.V(0, 0);
            fruits.forEach(fruit => {
                fruit.hide();
                pos = pos.add(fruit.tile.scale(1/fruits.length));
            });
            this.scores.push(new MatchScore(pos, points));
        } else {
            fruits.forEach(fruit => fruit.hide());
        }
    }
    scoreBonus(fruit) {
        this.score += this.baseMatchValue;
        fruit.hide();
        this.scores.push(new MatchScore(fruit.tile, this.baseMatchValue));
    }

    checkBonusMeter() {
        if (this.bonusMeterFill >= this.bonusMeterTarget) {
            this.bonusMeterFill -= this.bonusMeterTarget;
            this.baseMatchValue += 5;
            this.bonusMeterTarget = this.baseMatchValue * this.BONUS_METER_MULT;
            this.bonusTime.start();
            return true;
        } else {
            return false;
        }
    }
    isBonusTime() {
        return this.bonusTime.isActive();
    }

    tick() {
        this.scores.forEach(score => score.tick());
        this.scores = this.scores.filter(s => !s.isDone());
        if (this.isBonusTime()) {
            if (this.bonusTime.count % 25 === 0) {
                let fruit;
                do {
                    fruit = this.board.get(new Arc.V(randi(CNST.GRID_SIZE), randi(CNST.GRID_SIZE)));
                } while (!fruit || fruit.isHiding());
                this.scoreBonus(fruit);
            }
            this.bonusTime.tick();
        }
    }
    draw(ctx) {
        this.scores.forEach(score => score.draw(ctx));

        let scoreBoxY = CNST.GRID_HEIGHT + 2*CNST.GRID_FRAME;
        Arc.sprites.score.draw(CNST.GRID_FRAME + .25, scoreBoxY + 1.25, .5);
        Arc.drawNumber(this.score, CNST.GRID_FRAME + .25 + Arc.sprites.score.width/2 + 2.5, scoreBoxY + 1.25, 0.5, .5);

        let b_i = (this.isBonusTime()) ? this.bonusTime.modSplit(25, 2) : 0;
        Arc.sprites.bonus[b_i].draw(CNST.GRID_FRAME + CNST.GRID_WIDTH, scoreBoxY + .75, .5, 1, 0);
        let meterX = [CNST.WIDTH/2, CNST.GRID_FRAME + CNST.GRID_WIDTH - Arc.sprites.bonus[0].width/2 - .5];
        Arc.sprites.meterMiddle.drawScaled(meterX[0], scoreBoxY + .75, meterX[1] - meterX[0], 3.5, 0, 0);
        Arc.sprites.meterEnd.draw(meterX[1], scoreBoxY + .75, .5, 1, 0);
        Arc.sprites.meterStart.draw(meterX[0], scoreBoxY + .75, .5, 0, 0);
        let meterFillX = (meterX[1] - meterX[0] - 1) * (this.isBonusTime() ? 1 - this.bonusTime.percent() : Math.min(this.bonusMeterFill / this.bonusMeterTarget, 1));
        Arc.sprites.meterFill[b_i].drawScaled(meterX[0] + .5, scoreBoxY + .75, meterFillX, 3.5, 0, 0);
    }
}

class Fruit {
    constructor(tile) {
        this.tile = tile;
        this.type = randi(CNST.N_TYPES);
        this.moving = new Countdown(10);
        this.hiding = new Countdown(20);
    }

    move(target) {
        this.moves = [this.tile, target]
        this.moving.start();
    }
    isMoving() {
        return this.moving.isActive();
    }

    hide() {
        this.hiding.start();
    }
    isHiding() {
        return this.hiding.isActive();
    }
    isHidden() {
        return this.hiding.isTriggered();
    }

    tick() {
        if (this.moving.isActive()) {
            this.moving.tick();
            let percent = this.moving.percent();
            this.tile = this.moves[0].scale(1 - percent).add(this.moves[1].scale(percent));
        }
        this.hiding.tick();
    }

    draw(ctx) {
        let sprite = Arc.sprites.fruit[this.type]
        let coord = CNST.GRID2COORD(this.tile)
        let percent = (this.hiding.isActive()) ? 1 - this.hiding.percent() : 1;
        sprite.draw(coord[0]+CNST.GRID_SCALE/2, coord[1]+CNST.GRID_SCALE/2, .5 * percent, .5, .5);
    }
}

class FruitManager {
    constructor(board) {
        this.board = board;
        this.fruits = [];
    }
    spawn(pos) {
        let fruit = new Fruit(pos);
        this.fruits.push(fruit);
        return fruit;
    }
    hasMovement() {
        return this.fruits.some(fruit => fruit.isMoving() || fruit.isHiding());
    }
    isEmpty() {
        return this.fruits.length === 0;
    }
    tick() {
        this.fruits.forEach(fruit => {
            fruit.tick();
            fruit.isHidden() && this.board.set(fruit.tile, false);
        });
        this.fruits = this.fruits.filter(f => !f.isHidden());
    }
    draw(ctx) {
        this.fruits.forEach(fruit => fruit.draw(ctx));
    }
}

class Board {
    constructor() {
        this.grid = matrix(CNST.GRID_SIZE, CNST.GRID_SIZE, 0);
        this.fruitManager = new FruitManager(this);
        this.scoreManager = new ScoreManager(this);
        this.moves = [];
        this.active = false;
        this.undo = false;
        this.gameOver = false;

        // fill board
        for (let row = 0; row < CNST.GRID_SIZE; row++) {
            for (let col = 0; col < CNST.GRID_SIZE; col++) {
                this.grid[row][col] = this.fruitManager.spawn(new Arc.V(col, row));
            }
        }

        // clear any matches
        do {
            this.tick();
        } while (!this.isSettled());
        this.scoreManager.setActive(true);
    }

    get(pos) {
        return (bounded(pos.x, 0, CNST.GRID_SIZE-1) && bounded(pos.y, 0, CNST.GRID_SIZE-1)) ? this.grid[pos.y][pos.x] : false;
    }
    set(pos, fruit) {
        fruit && fruit.move(pos);
        this.grid[pos.y][pos.x] = fruit;
    }

    swap(pos, dir) {
        let a = this.get(pos);
        let b = this.get(pos.add(dir));
        this.set(pos, b);
        this.set(pos.add(dir), a);
    }

    click(pos) {
        let ignoreInput = !this.isSettled() || this.gameOver || this.scoreManager.isBonusTime();
        if (ignoreInput || !this.get(pos)) {
            this.active = false;
        } else if (this.active) {
            if (pos.manhat(this.active) === 1) {
                let dir = this.active.sub(pos);
                this.swap(pos, dir);
                this.undo = { pos, dir };
            }
            this.active = false;
        } else {
            this.active = pos;
        }
    }

    getScore() {
        return this.scoreManager.score;
    }
    isSettled() {
        return !this.fruitManager.hasMovement();
    }
    isGameover() {
        return this.gameOver && this.fruitManager.isEmpty();
    }

    getMatches() {
        // return straight lines of >= 3 fruit
        let matches = [];
        [DIR.RIGHT, DIR.DOWN].forEach(dir => {
            let used = new Set();
            for (let x = 0; x < CNST.GRID_SIZE; x++) {
                for (let y = 0; y < CNST.GRID_SIZE; y++) {
                    let pos = new Arc.V(x, y);
                    let start = this.get(pos);
                    if (!used.has(start)) {
                        let tiles = [];
                        do {
                            tiles.push(this.get(pos));
                            pos = pos.add(dir);
                        } while (this.get(pos) && this.get(pos).type === start.type);
                        if (tiles.length >= 3) {
                            matches.push(tiles);
                            tiles.forEach(t => used.add(t));
                        }
                    }
                }
            }
        });
        return matches;
    }
    removeMatches(matches) {
        matches.forEach(fruits => this.scoreManager.scoreMatch(fruits));
    }
    dropFruits() {
        // from bottom row to second from top: if tile is empty, swap with above
        for (let row = CNST.GRID_SIZE-1; row >= 1; row--) {
            for (let col = 0; col < CNST.GRID_SIZE; col++) {
                let pos = new Arc.V(col, row);
                if (!this.get(pos)) {
                    this.swap(pos, DIR.UP);
                }
            }
        }
    }
    spawnFruits() {
        // spawn fruit for any empty tiles in top row
        let row = 0;
        for (let col = 0; col < CNST.GRID_SIZE; col++) {
            let pos = new Arc.V(col, row);
            if (!this.get(pos)) {
                this.set(pos, this.fruitManager.spawn(new Arc.V(col, -1)));
            }
        }
    }
    getMoveableFruits() {
        // check each possible move for match of 3
        let moves = new Set();
        [DIR.RIGHT, DIR.DOWN].forEach(matchOrientation => {
            for (let x = 0; x < CNST.GRID_SIZE; x++) {
                for (let y = 0; y < CNST.GRID_SIZE; y++) {
                    for (let t = 0; t < 3; t++) {
                        [DIR.LEFT, DIR.RIGHT, DIR.UP, DIR.DOWN].forEach(moveDir => {
                            let pos = new Arc.V(x, y);
                            let tiles = [];
                            let start, movedFruit;
                            for (let i = 0; i < 3; i++) {
                                let tile = this.get((i === t) ? pos.add(moveDir) : pos);
                                if (i === 0) start = tile;
                                if (i === t) movedFruit = tile;
                                if (!tile || tile.type !== start.type) {
                                    break;
                                }
                                tiles.push(tile);
                                pos = pos.add(matchOrientation);
                            }
                            if (new Set(tiles).size === 3) {
                                moves.add(movedFruit)
                            }
                        });
                    }
                }
            }
        });
        return Array.from(moves);
    }
    emptyFruits() {
        let row = CNST.GRID_SIZE-1;
        for (let col = 0; col < CNST.GRID_SIZE; col++) {
            let fruit = this.get(new Arc.V(col, row));
            fruit && fruit.hide();
        }

        this.dropFruits();
    }

    tick() {
        this.fruitManager.tick();
        this.scoreManager.tick();

        if (this.gameOver) {
            this.gameOver.tick();
            if (this.gameOver.count > 150) {
                this.isSettled() && this.emptyFruits();
            }
        } else if (!this.scoreManager.isBonusTime()) {
            if (!this.isSettled()) {
                this.moves = []
            } else if (this.moves.length === 0) {
                this.dropFruits();
                this.spawnFruits();
                if (this.isSettled()) {
                    let matches = this.getMatches();
                    if (matches.length > 0) {
                        this.removeMatches(matches);
                        this.undo = false;
                    } else if (this.undo) {
                        this.swap(this.undo.pos, this.undo.dir);
                        this.undo = false;
                    } else {
                        this.scoreManager.endCombo();
                        if (!this.scoreManager.checkBonusMeter()) {
                            this.moves = this.getMoveableFruits();
                            if (this.moves.length === 0) {
                                this.gameOver = new Counter();
                            }
                        }
                    }
                }
            }
        }
    }

    draw(ctx) {
        if (this.active) {
            let coord = CNST.GRID2COORD(this.active);
            Arc.sprites.active.draw(coord[0], coord[1], 1);
        }
        this.fruitManager.draw(ctx);
        this.scoreManager.draw(ctx);
        // this.moves && this.moves.forEach(move => {
        //     let coord = CNST.GRID2COORD(move.tile);
        //     Arc.sprites.active.draw(coord[0], coord[1], 1);
        // });

        if (this.gameOver) {
            this.gameOver.count > 75 && Arc.sprites.noMoreMoves.draw(CNST.WIDTH / 2, CNST.GRID_FRAME + Math.round(.45*CNST.GRID_SIZE*CNST.GRID_SCALE), 1, .5, 1);
            this.gameOver.count > 150 && Arc.sprites.gameOver.draw(CNST.WIDTH / 2, CNST.GRID_FRAME + Math.round(.55*CNST.GRID_SIZE*CNST.GRID_SCALE), 1, .5, 0);
        }
    }
}

class GameState {
    constructor() {
        this.highscore = this.fetchHighscore();

        Arc.setUpdate(() => this.tick(), CNST.TICK_MS);
        Arc.add(ctx => this.draw(ctx));

        Arc.setGui(STATE.MENU);
        Arc.addElement(Arc.sprites.title, Arc.width/2, Arc.height*2/5, 1, 1, 0.5, 1)
        Arc.addButton(Arc.sprites.newGame, Arc.width/2, Arc.height*3/5, .75, .75, 0.5, 0).addEventListener('click', () => this.handleButton('newGame'));
        Arc.setGui(STATE.PLAY);
        Arc.gui.addEventListener('click', e => this.handleClick(e));
        Arc.gui.addEventListener('touchstart', e => this.handleTouch(e, true));
        Arc.gui.addEventListener('touchend', e => this.handleTouch(e, false));

        this.setState(STATE.MENU);
    }

    setState(state) {
        switch (this.state) {
            default:
        }

        switch (state) {
            case STATE.PLAY:
                this.board = new Board();
                break;
            default:
        }

        this.state = state;
        Arc.setGui(state);
        this.tick();
    }

    tick() {
        switch (this.state) {
            case STATE.PLAY:
                this.board.tick();
                if (this.board.isGameover()) {
                    if (this.board.getScore() > this.highscore) {
                        this.setHighscore(this.board.getScore());
                    }
                    this.setState(STATE.MENU);
                }
                break;
            default:
        }
    }

    fetchHighscore() {
        let scoreCookie = document.cookie
            .split(';')
            .find(cookie => cookie.startsWith('befruitedHighscore'));
        return (scoreCookie) ? Number(scoreCookie.split('=')[1]) : 0;
    }
    setHighscore(score) {
        // save cookie for ten years
        document.cookie = `befruitedHighscore=${score}; max-age=${60*60*24*365*10}`;
        this.highscore = score;
    }

    draw(ctx) {
        Arc.sprites.frame.draw(0, 0, 1);
        switch (this.state) {
            case STATE.MENU:
                let scoreBoxY = CNST.GRID_SIZE*CNST.GRID_SCALE + 2*CNST.GRID_FRAME;
                Arc.sprites.highscore.draw(CNST.GRID_FRAME + .25, scoreBoxY + 1.25, .5);
                Arc.drawNumber(this.highscore, CNST.GRID_FRAME + .25 + Arc.sprites.highscore.width/2 + 2.5, scoreBoxY + 1.25, .5, .5);
                break;
            case STATE.PLAY:
                this.board.draw(ctx);
                break;
            default:
        }
    }

    handleButton(identifier) {
        switch (identifier) {
            case 'newGame':
                this.setState(STATE.PLAY);
        }
    }

    handleClick(e) {
        if (this.isTouch) return;

        let gX = Math.floor((e.offsetX - CNST.GRID_FRAME) / CNST.GRID_SCALE);
        let gY = Math.floor((e.offsetY - CNST.GRID_FRAME) / CNST.GRID_SCALE);
        let pos = new Arc.V(gX, gY);
        if (bounded(pos.x, 0, CNST.GRID_SIZE-1) && bounded(pos.y, 0, CNST.GRID_SIZE-1)) {
            this.board.click(pos);
        }
    }
    handleTouch(e, isDown) {
        this.isTouch = true;

        let guiRect = e.target.getBoundingClientRect();
        let pos = new Arc.V(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
            .sub(new Arc.V(guiRect.x, guiRect.y))
            .scale(CNST.WIDTH / guiRect.width)
            .apply(x => Math.floor((x - CNST.GRID_FRAME) / CNST.GRID_SCALE));
        if (isDown) {
            if (bounded(pos.x, 0, CNST.GRID_SIZE-1) && bounded(pos.y, 0, CNST.GRID_SIZE-1)) {
                this._pointer = pos;
            } else {
                this._pointer = false;
            }
        } else {
            if (this._pointer && !pos.equals(this._pointer)) {
                let dir = pos.sub(this._pointer).norm().closest([DIR.LEFT, DIR.RIGHT, DIR.UP, DIR.DOWN]);
                this.board.click(this._pointer);
                this.board.click(this._pointer.add(dir));
            }
            this._pointer = false;
        }
    }
}

export { CNST }