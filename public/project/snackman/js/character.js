export class Character {
    x
    y
    speed
    tileX
    tileY
    face
    anim
    tryFace
    level
    skin

    constructor(tileX, tileY, level) {
        this.x = tileX;
        this.y = tileY;
        this.level = level;

        this.anim = 0;
    }

    isCentered() {
        return Math.abs(this.x - this.tileX) <= this.speed/2 && Math.abs(this.y - this.tileY) <= this.speed/2;
    }

    isTunneling(tileX, tileY, face) {
        if (tileX === 14 && (tileY < 3 || tileY > 18) && face % 2 === 0) console.log('tunnel');
        return tileX === 14 && (tileY < 3 || tileY > 18) && face % 2 === 0
    }

    update() {}
    tryMove(face) {}

    setSpeed(speed) {
        this.speed = speed;
    }

    draw(ctx) {};
}