import Arc from '/lib/modules/arcm.js'
import { Counter, Countdown } from '/lib/modules/counter.js'
import sprites from './sprites.js'

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
    PLAY: 'play',
    END: 'end'
};

setTimeout(() => {
    Arc.init(document.querySelector('#befruitedCanvas'), CNST.WIDTH, CNST.HEIGHT);
    Arc.loadSheet('sheet.png', sprites).then(() => {
        Arc.loop();
        new GameState();
    });
}, 150);

class MatchScore {
    constructor(tile, points) {
        this.tile = tile;
        this.points = points;
        this.counter = new Countdown(80);
        this.counter.start();
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

class Fruit {
    constructor(tile, type) {
        this.tile = tile;
        this.type = type;
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
        if (!this.moving.isDone()) {
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
        Arc.drawScaledSprite(sprite, coord[0]+CNST.GRID_SCALE/2, coord[1]+CNST.GRID_SCALE/2, .5 * percent, .5, .5);
    }
}

class Board {
    constructor() {
        this.active = false;
        this.grid = Array.matrix(CNST.GRID_SIZE, CNST.GRID_SIZE, 0)
        this.fruits = []
        for (let row = 0; row < CNST.GRID_SIZE; row++) {
            for (let col = 0; col < CNST.GRID_SIZE; col++) {
                let fruit = new Fruit(new Arc.V(col, row), randi(CNST.N_TYPES));
                this.fruits.push(fruit);
                this.grid[row][col] = fruit;
            }
        }
        this.moves = [];
        this.matchesForSwap = 0;
        this.undo = false;
        this.gameOver = false;
        this.baseMatchValue = 10;
        this.bonusMeterFill = 0;
        this.bonusMeterTarget = this.baseMatchValue * 50;
        this.bonusTime = new Countdown(250);
        
        this.scores = [];
        do {
            this.tick();
        } while (this.isMovement())
        this.score = 0;
        this.scores = [];
        this.bonusMeterFill = 0;
    }

    get(pos) {
        if (bounded(pos.x, 0, CNST.GRID_SIZE-1) && bounded(pos.y, 0, CNST.GRID_SIZE-1)) {
            return this.grid[pos.y][pos.x];
        } else {
            return null;
        }
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

    addScore(points) {
        this.score += points;
        if (!this.bonusTime.isActive()) {
            this.bonusMeterFill += points;
        }
    }

    click(pos) {
        if (this.isMovement() || this.gameOver || this.bonusTime.isActive()) return;
        if (!this.get(pos)) {
            this.active = false;
        } else if (this.active) {
            if (pos.manhat(this.active) === 1) {
                this.matchesForSwap = 0;
                let dir = this.active.sub(pos);
                this.swap(pos, dir);
                this.undo = { pos, dir };
            }
            this.active = false;
        } else {
            this.active = pos;
        }
    }
    hover(pos) {
        this.hoverPos = pos;
    }

    calculateMatches() {
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
        this.matchesForSwap += matches.length;
        // let removeFruits = new Set();
        matches.forEach(fruits => {
            let matchValue = Math.pow(2, fruits.length - 3) * this.baseMatchValue; // 1, 2, 4
            let points = matchValue * this.matchesForSwap;
            this.addScore(points);
            let pos = new Arc.V(0, 0);
            fruits.forEach(fruit => {
                fruit.hide();
                pos = pos.add(fruit.tile.scale(1/fruits.length));
                // this.set(fruit.tile, false);
                // removeFruits.add(fruit);
            });
            this.scores && this.scores.push(new MatchScore(pos, points));
        });
        // this.fruits = this.fruits.filter(fruit => !removeFruits.has(fruit));
    }
    moveFruits() {
        for (let row = CNST.GRID_SIZE-1; row >= 1; row--) {
            for (let col = 0; col < CNST.GRID_SIZE; col++) {
                let pos = new Arc.V(col, row);
                if (!this.get(pos)) {
                    this.swap(pos, DIR.UP);
                }
            }
        }

        let row = 0;
        for (let col = 0; col < CNST.GRID_SIZE; col++) {
            let pos = new Arc.V(col, row);
            if (!this.get(pos)) {
                let fruit = new Fruit(new Arc.V(col, -1), randi(CNST.N_TYPES));
                this.set(pos, fruit);
                this.fruits.push(fruit);
            }
        }
    }
    isMovement() {
        return this.fruits.some(fruit => fruit.isMoving() || fruit.isHiding());
    }
    checkMoves() {
        let moves = new Set();
        [DIR.RIGHT, DIR.DOWN].forEach(dir => {
            for (let x = 0; x < CNST.GRID_SIZE; x++) {
                for (let y = 0; y < CNST.GRID_SIZE; y++) {
                    for (let t = 0; t < 3; t++) {
                        [DIR.LEFT, DIR.RIGHT, DIR.UP, DIR.DOWN].forEach(move => {
                            let pos = new Arc.V(x, y);
                            let start = this.get(pos);
                            let tiles = [];
                            let moveFruit;
                            for (let i = 0; i < 3; i++) {
                                let tile;
                                if (i === t) {
                                    moveFruit = this.get(pos.add(move));
                                    if (i === 0) {
                                        start = moveFruit;
                                    }
                                    tile = moveFruit;
                                } else {
                                    tile = this.get(pos);
                                }
                                if (!tile || tile.type !== start.type) {
                                    break;
                                }
                                tiles.push(tile);
                                pos = pos.add(dir);
                            }
                            if (new Set(tiles).size >= 3) {
                                moves.add(moveFruit)
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
            let pos = new Arc.V(col, row);
            let fruit = this.get(pos);
            if (fruit && !fruit.isMoving()) {
                fruit.hide();
            }
        }

        for (let row = CNST.GRID_SIZE-1; row >= 1; row--) {
            for (let col = 0; col < CNST.GRID_SIZE; col++) {
                let pos = new Arc.V(col, row);
                if (!this.get(pos)) {
                    this.swap(pos, DIR.UP);
                }
            }
        }
    }

    tick() {
        this.fruits.forEach(fruit => {
            fruit.tick();
            if (fruit.isHidden()) {
                this.set(fruit.tile, false);
            }
        });
        this.fruits = this.fruits.filter(f => !f.isHidden());
        if (this.gameOver) {
            this.gameOverCounter.tick();
            if (this.gameOverCounter.count > 200) {
                if (!this.isMovement()) {
                    this.emptyFruits();
                }
            }
        } else if (this.bonusTime.isActive()) {
            if (this.bonusTime.count % 25 === 0) {
                let fruit;
                do {
                    fruit = this.get(new Arc.V(randi(CNST.GRID_SIZE), randi(CNST.GRID_SIZE)));
                } while (!fruit || fruit.isHiding());
                this.addScore(this.baseMatchValue);
                fruit.hide();
                this.scores.push(new MatchScore(fruit.tile, this.baseMatchValue));
            }
            this.bonusTime.tick();
        } else {
            if (this.isMovement()) {
                this.moves = []
            } else {
                this.moveFruits();
                if (!this.isMovement()) {
                    let matches = this.calculateMatches();
                    if (matches.length > 0) {
                        this.removeMatches(matches);
                        this.undo = false;
                    } else if (this.undo) {
                        this.swap(this.undo.pos, this.undo.dir);
                        this.undo = false;
                    }
                    if (!this.isMovement() && this.moves.length === 0) {
                        this.matchesForSwap = 0;
                        if (this.bonusMeterFill >= this.bonusMeterTarget) {
                            this.bonusMeterFill -= this.bonusMeterTarget;
                            this.baseMatchValue += 5;
                            this.bonusMeterTarget = this.baseMatchValue * 50;
                            this.bonusTime.start();
                        } else {
                            this.moves = this.checkMoves();
                            console.log(this.moves.length);
                            if (this.moves.length === 0) {
                                this.gameOver = true;
                                this.gameOverCounter = new Counter();
                            }
                        }
                    }
                }
            }
            
        }
        this.scores.forEach(score => score.tick());
        this.scores = this.scores.filter(s => !s.isDone());
    }
    isOver() {
        // return this.gameOver && this.gameOverCounter.count > 150;
        return this.gameOver && this.fruits.length === 0;
    }

    draw(ctx) {
        if (this.active) {
            let coord = CNST.GRID2COORD(this.active);
            Arc.drawScaledSprite('active', coord[0], coord[1], 1);
        }
        if (this.hoverPos) {
            let coord = CNST.GRID2COORD(this.hoverPos);
            ctx.save();
            ctx.globalAlpha = .3;
            // Arc.drawScaledSprite('active', coord[0], coord[1], 1);
            ctx.restore();
        }
        this.fruits.forEach(fruit => fruit.draw(ctx));
        this.scores.forEach(score => score.draw(ctx));
        // this.moves && this.moves.forEach(move => {
        //     let coord = CNST.GRID2COORD(move.tile);
        //     Arc.drawScaledSprite('active', coord[0], coord[1], 1);
        // });

        let scoreBoxY = CNST.GRID_HEIGHT + 2*CNST.GRID_FRAME;
        Arc.drawScaledSprite(Arc.sprites.score, CNST.GRID_FRAME + .25, scoreBoxY + 1.25, .5);
        Arc.drawNumber(this.score, CNST.GRID_FRAME + .25 + Arc.sprites.score[3]/2 + 2.5, scoreBoxY + 1.25, 0.5, .5);

        let b_i = (this.bonusTime.isActive()) ? this.bonusTime.modSplit(25, 2) : 0;
        Arc.drawScaledSprite(Arc.sprites.bonus[b_i], CNST.GRID_FRAME + CNST.GRID_WIDTH, scoreBoxY + .75, .5, 1, 0);
        let meterX = [CNST.WIDTH/2, CNST.GRID_FRAME + CNST.GRID_WIDTH - Arc.sprites.bonus[0][3]/2 - .5];
        Arc.drawSprite(Arc.sprites.meterMiddle, meterX[0], scoreBoxY + .75, meterX[1] - meterX[0], 3.5, 0, 0);
        Arc.drawScaledSprite(Arc.sprites.meterEnd, meterX[1], scoreBoxY + .75, .5, 1, 0);
        Arc.drawScaledSprite(Arc.sprites.meterStart, meterX[0], scoreBoxY + .75, .5, 0, 0);
        let meterFillX = (meterX[1] - meterX[0] - 1) * ((this.bonusTime.isActive()) ? 1 : Math.min(this.bonusMeterFill / this.bonusMeterTarget, 1));
        Arc.drawSprite(Arc.sprites.meterFill[b_i], meterX[0] + .5, scoreBoxY + .75, meterFillX, 3.5, 0, 0);

        // Arc.drawScaledSprite(Arc.sprites.bonus[0], CNST.GRID_FRAME )

        if (this.gameOver) {
            this.gameOverCounter.count > 50 && Arc.drawScaledSprite(Arc.sprites.noMoreMoves, CNST.WIDTH / 2, CNST.GRID_FRAME + Math.round(.45*CNST.GRID_SIZE*CNST.GRID_SCALE), 1, .5, 1);
            this.gameOverCounter.count > 200 && Arc.drawScaledSprite(Arc.sprites.gameOver, CNST.WIDTH / 2, CNST.GRID_FRAME + Math.round(.55*CNST.GRID_SIZE*CNST.GRID_SCALE), 1, .5, 0);
        }
    }
}

class GameState {
    constructor() {
        Arc.setUpdate(() => this.tick(), CNST.TICK_MS);

        this.highscore = this.fetchHighscore();
        this.counter = new Counter();

        Arc.add(ctx => this.draw(ctx));

        Arc.setGui(STATE.MENU);
        Arc.addElement(Arc.sprites.title, Arc.width/2, Arc.height*2/5, 1, 1, 0.5, 1)
        Arc.addButton(Arc.sprites.newGame, Arc.width/2, Arc.height*3/5, .75, .75, 0.5, 0).addEventListener('click', () => this.handleButton('newGame'));
        Arc.setGui(STATE.PLAY);
        Arc.gui.addEventListener('click', e => this.handleClick(e));
        Arc.gui.addEventListener('mousemove', e => this.handleHover(e));
        Arc.gui.addEventListener('touchstart', e => this.handleTouch(e, true));
        Arc.gui.addEventListener('touchend', e => this.handleTouch(e, false));

        this.setState(STATE.MENU);
    }

    setState(state) {
        switch (this.state) {
            default:
        }

        this.counter.reset();
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
        this.counter.tick();
        switch (this.state) {
            case STATE.PLAY:
                this.board.tick();
                if (this.board.isOver()) {
                    if (this.board.score > this.highscore) {
                        this.setHighscore(this.board.score);
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
        if (scoreCookie) {
            return Number(scoreCookie.split('=')[1]);
        }
        return 0;
    }
    setHighscore(score) {
        // save cookie for ten years
        document.cookie = `befruitedHighscore=${score}; max-age=${60*60*24*365*10}`;
        this.highscore = score;
    }

    draw(ctx) {
        Arc.drawScaledSprite('frame', 0, 0, 1);
        switch (this.state) {
            case STATE.MENU:
                let scoreBoxY = CNST.GRID_SIZE*CNST.GRID_SCALE + 2*CNST.GRID_FRAME;
                Arc.drawScaledSprite(Arc.sprites.highscore, CNST.GRID_FRAME + .25, scoreBoxY + 1.25, .5);
                Arc.drawNumber(this.highscore, CNST.GRID_FRAME + .25 + Arc.sprites.highscore[3]/2 + 2.5, scoreBoxY + 1.25, .5, .5);
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
        console.log(e, pos)
        if (bounded(pos.x, 0, CNST.GRID_SIZE-1) && bounded(pos.y, 0, CNST.GRID_SIZE-1)) {
            this.board.click(pos);
        }
    }
    handleHover(e) {
        let gX = Math.floor((e.offsetX - CNST.GRID_FRAME) / CNST.GRID_SCALE);
        let gY = Math.floor((e.offsetY - CNST.GRID_FRAME) / CNST.GRID_SCALE);
        let pos = new Arc.V(gX, gY);
        if (bounded(pos.x, 0, CNST.GRID_SIZE-1) && bounded(pos.y, 0, CNST.GRID_SIZE-1)) {
            this.board.hover(pos);
        }
    }
    handleTouch(e, isDown) {
        console.log(e);
        this.isTouch = true;
        let guiRect = e.target.getBoundingClientRect();
        let pos = new Arc.V(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
            .sub(new Arc.V(guiRect.x, guiRect.y))
            .scale(CNST.WIDTH / guiRect.width)
            .apply(x => Math.floor((x - CNST.GRID_FRAME) / CNST.GRID_SCALE));
        console.log(pos);
        if (isDown) {
            if (bounded(pos.x, 0, CNST.GRID_SIZE-1) && bounded(pos.y, 0, CNST.GRID_SIZE-1)) {
                this._pointer = pos;
            } else {
                this._pointer = false;
            }
        } else {
            if (this._pointer && !pos.equals(this._pointer)) {
                let dir = pos.sub(this._pointer).norm().closest([DIR.LEFT, DIR.RIGHT, DIR.UP, DIR.DOWN]);
                // this.board.click(pos);
                this.board.click(this._pointer);
                this.board.click(this._pointer.add(dir));
            }
            this._pointer = false;
        }
    }
}

export { CNST }