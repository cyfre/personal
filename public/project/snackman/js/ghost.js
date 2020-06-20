import Arc from '/lib/arcm.js';
import { Character } from './character.js';

export class Ghost extends Character {
    constructor(x, y, type, level) {
        super(x, y, level);
        this.type = type;
        if (type === 0) this.face = 3;
        else if (type === 1) this.face = 0;
        else this.face = 2;
        this.tryFace = this.face;

        this.tarX = this.x;
        this.tarY = this.y;
    }

    targetBox() {
        this.tarX = 14;
        this.tarY = 9;
    }
    targetCorner() {
        switch (this.type) {
            case 0: this.tarX = 28; this.tarY = 0; break;
            case 1: this.tarX = 0; this.tarY = 0; break;
            case 2: this.tarX = 28; this.tarY = 20; break;
            case 3: this.tarX = 0; this.tarY = 20; break;
            default:
        }
    }
    targetPlayer(player, red) {
        let { tileX: pX, tileY: pY, face: pFace } = player;
        // behavior from https://gameinternals.com/understanding-pac-man-ghost-behavior
        this.tarX = pX;
        this.tarY = pY;
        switch (this.type) {
            case 0: // red targets player
                break;
            case 1: // pink targets 3 spaces ahead
                switch (pFace) {
                    case 0:
                        this.tarY -= 3;
                        break;
                    case 1:
                        this.tarX += 3;
                        break;
                    case 2:
                        this.tarY += 3;
                        break;
                    case 3:
                        this.tarX -= 3;
                        break;
                    default:
                }
                break;
            case 2: // cyan is complicated, uses red's position
                switch (pFace) {
                    case 0:
                        this.tarY -= 2;
                        break;
                    case 1:
                        this.tarX += 2;
                        break;
                    case 2:
                        this.tarY += 2;
                        break;
                    case 3:
                        this.tarX -= 2;
                        break;
                    default:
                }
                this.tarX = (this.tarX-red.tileX)*2 + red.tileX;
                this.tarY = (this.tarY-red.tileY)*2 + red.tileY;
                break;
            case 3:
                if (dist(this.tileX, this.tileY, pX, pY) < 6) {
                    this.tarX = 0;
                    this.tarY = 20;
                }
                break;
            default:
        }
    }

    update() {
        this.anim++;

        this.tileX = Math.round(this.x);
        this.tileY = Math.round(this.y);
        this.inBox = bounded(this.tileX, 13, 15) && bounded(this.tileY, 10, 12);

        if (this.isCentered()) {
            if (this.inBox) {
                if (this.eaten) {
                    if (this.tileY > 10) {
                        this.eaten = false;
                        this.speed = this.level.getSpeed(1, this.blue);
                        this.toExit = true;
                    }
                } else if (this.toExit) {
                    if (this.tileX === 13)
                        this.tryFace = 1;
                    else if (this.tileX === 15)
                        this.tryFace = 3;
                    else
                        this.tryFace = 0;
                } else {
                    if ([1, 3].includes(this.face)) this.tryFace = 0;
                    else this.tryFace = (this.face+2) % 4;
                }
            } else {
                if (this.eaten) {
                    this.targetBox();
                    this.speed = 3.5 /32;
                }

                let tryTurn = false;
                switch (this.face) {
                    case 0:
                    case 2:
                        if (this.tryMove(1) || this.tryMove(3)) {
                            tryTurn = true;
                        }
                        break;
                    case 1:
                    case 3:
                        if (this.tryMove(0) || this.tryMove(2)) {
                            tryTurn = true;
                        }
                        break;
                    default:
                }

                // console.log(this.type, 'centered', tryTurn);
                this.tryFace = this.face;
                if (tryTurn) {
                    if (this.blue) {
                        let tryFace;
                        do {
                            tryFace = randi(4);
                        } while (!this.tryMove(tryFace));
                        this.tryFace = tryFace;
                    } else {
                        let shortest = 100;
                        for (let i = 0; i < 4; i++) {
                            let nextX = this.tileX, nextY = this.tileY;
                            if (this.tryMove(i)) {
                                switch (i) {
                                    case 0: nextY -= 1; break;
                                    case 1: nextX += 1; break;
                                    case 2: nextY += 1; break;
                                    case 3: nextX -= 1; break;
                                    default:
                                }

                                let distance = dist(this.tarX, this.tarY, nextX, nextY)
                                if (distance < shortest) {
                                    if (this.tileX === 14 && (i === 0 || i === 2)) {
                                        if (this.tarX === 14 && !this.eaten) {
                                            shortest = distance;
                                            this.tryFace = i;
                                        }
                                    } else {
                                        shortest = distance;
                                        this.tryFace = i;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (this.eaten && this.tileX === 14 && this.tileY === 9)
                this.tryFace = 2;

            if (this.tryMove(this.tryFace)) {
                this.face = this.tryFace;
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

        if (this.tileX === 14) {
            if (this.tileY < 4 || this.tileY > 17) {
                this.speed = this.level.getTunnelSpeed(true);
                if (this.tileY < 0) this.y = 20.49;
                else if (this.tileY >= 21) this.y = -.49;
            } else if (this.tileY === 4 || this.tileY === 17) {
                this.speed = this.level.getTunnelSpeed(false);
            }
        }
    }

    tryMove(tryFace) {
        // allow return into box when eaten
        if (this.eaten && this.tileX === 14 && bounded(this.tileY, 9, 11)) return true;
        // if in box, move up/down
        if (this.inBox) {
            if (this.toExit) return true;
            if (this.tileY === 11) return tryFace === 2;
            if (this.tileY === 12) return tryFace === 0;
            return false;
        } else {
            // don't allow a ghost to reverse direction
            if (this.isOpposite(tryFace)) return false;
            // allow wrap through tunnel
            if (this.isTunneling(this.tileX, this.tileY, tryFace)) return true;
            // don't allow ghosts to go up through center paths (random pacman rule)
            if (this.tileY === 9 && bounded(this.tileX, 13, 15) && tryFace === 0) return false;
            // otherwise, allow direction switch from center of tile obeying walls
            if (this.isCentered()) {
                let x = this.tileX,
                    y = this.tileY;
                switch (tryFace) {
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
    }

    // verify tryFace is opposite to current face
    isOpposite(tryFace) {
        return (tryFace+2) % 4 === this.face;
    }

    setMode(isScatter) {
        this.scatter = isScatter;
        // reverse direction
        if (!this.eaten) this.face = (this.face+2) % 4;
    }

    setBlue(isBlue) {
        this.blue = isBlue;
        if (isBlue && !this.eaten) {
            // reverse direction
            this.face = (this.face+2) % 4;
            this.anim = 0;
        }
    }

    exit() {
        this.toExit = true;
    }

    eat() {
        this.eaten = true;
        this.blue = false;
        this.toExit = false;
    }

    isEaten() {
        return this.eaten;
    }

    draw(ctx) {
        let eyes = Arc.sprites.eyes[this.face];
        let skin;
        if (this.blue) {
            if (this.anim > 300) {
                skin = Arc.sprites.blue[2*Math.floor(this.anim%50/25) + Math.floor(this.anim%20/10)];
            } else {
                skin = Arc.sprites.blue[Math.floor(this.anim%20/10)];
            }
            Arc.drawScaledSprite(skin, this.x+.5, this.y+.5, 1/8, .5, .5);
        } else {
            this.anim %= 20;
            if (!this.eaten) {
                skin = Arc.sprites.ghost[this.type*2 + Math.floor(this.anim/10)]
                Arc.drawScaledSprite(skin, this.x+.5, this.y+.5, 1/8, .5, .5);
            }
            Arc.drawScaledSprite(eyes, this.x+.5, this.y+.5, 1/8, .5, .5);
        }

        switch(this.type) {
            case 0: ctx.strokeStyle = 'red'; break;
            case 1: ctx.strokeStyle = 'pink'; break;
            case 2: ctx.strokeStyle = 'cyan'; break;
            case 3: ctx.strokeStyle = 'orange'; break;
            default:
        }
        ctx.lineWidth = 1/8
        // ctx.strokeRect(this.tarX+1/16, this.tarY+1/16, 7/8, 7/8);
    }
}