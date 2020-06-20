import Arc from '/lib/arcm.js';
import { Character } from './character.js';

export class Player extends Character {
    constructor(x, y, level) {
        super(x, y, level);
        this.face = 3;
        this.tryFace = this.face;
        this.speed = 1.6 /32;

        this.skip = 0;
        this.isDead = false;
    }

    update() {
        this.anim++;
        if (this.isDead) return;

        this.tileX = Math.round(this.x);
        this.tileY = Math.round(this.y);

        if (this.tryMove(this.tryFace)) this.face = this.tryFace;

        if (this.skip <= 1) {
            if (this.isCentered()) {
                // don't move if blocked by wall
                if (this.tryMove(this.face)) {
                    switch (this.face) {
                        case 0:
                            this.y -= this.speed;
                            break;
                        case 1:
                            this.x += this.speed;
                            break;
                        case 2:
                            this.y += this.speed;
                            break;
                        case 3:
                            this.x -= this.speed;
                            break;
                        default:
                    }
                }
            } else {
                switch (this.face) {
                    case 0:
                        this.y -= this.speed;
                        this.x = this.tileX;
                        break;
                    case 1:
                        this.x += this.speed;
                        this.y = this.tileY;
                        break;
                    case 2:
                        this.y += this.speed;
                        this.x = this.tileX;
                        break;
                    case 3:
                        this.x -= this.speed;
                        this.y = this.tileY;
                        break;
                    default:
                }
            }
        }

        if (this.tileY < 0)
            this.y = 20.49;
        else if (this.tileY >= 21)
            this.y = -.49;
        else if (this.level.map[this.tileY][this.tileX] === 2) {
            this.level.eatPellet(0, this.tileX, this.tileY);
            this.skip = 4;
        } else if (this.level.map[this.tileY][this.tileX] === 3) {
            this.level.eatPellet(1, this.tileX, this.tileY);
            this.skip = 8;
        }

        if (this.skip > 0) this.skip--;
    }

    tryMove(face) {
        if (this.isTunneling(this.tileX, this.tileY, face)) return true;
        if (this.face !== face && this.face % 2 === face % 2) return true;
        if (this.isCentered()) {
            let x = this.tileX,
                y = this.tileY;
            switch (face) {
                case 0:
                    y = this.tileY - 1;
                    break;
                case 1:
                    x = this.tileX + 1;
                    break;
                case 2:
                    y = this.tileY + 1;
                    break;
                case 3:
                    x = this.tileX - 1;
                    break;
                default:
            }
            if (this.level.map[y][x] !== 1) return true;
        }

        return false;
    }

    checkGhost(ghost) {
        return (Math.abs(ghost.x - this.x) < 1/3 && Math.abs(ghost.y - this.y) < 1/3)
    }

    checkFruit() {
        return (this.tileX === 14 && this.tileY === 14);
    }

    kill() {
        this.isDead = true;
        this.anim = 0;
    }

    press(face) {
        this.tryFace = face;
        console.log('press', face)
    }

    draw(ctx) {
        let skin;
        if (this.isDead) {
            if (this.anim < 104) {
                skin = Arc.sprites.pDie[Math.floor(this.anim/15)];
                Arc.drawScaledSprite(skin, this.x+.5, this.y+.5, 1/8, .5, .5);
            }
        } else {
            if (this.anim > 14)
                this.anim = 0;

            if (this.face === 4)
                skin = Arc.sprites.player;
            else
                skin = Arc.sprites[`pMove${this.face}${Math.floor(this.anim/5)}`];

            Arc.drawScaledSprite(skin, this.x+.5, this.y+.5, 1/8, .5, .5);
        }

        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 1/8;
        // ctx.strokeRect(this.tileX+1/16, this.tileY+1/16, 7/8, 7/8);
    }
}