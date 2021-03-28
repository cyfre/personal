const debug = {
    seed: false,
    fps: false,
};

const WIDTH = 180;
const HEIGHT = 180;

const canvas = document.querySelector('#canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
canvas.style.filter = 'grayscale(30%)';

const ctx = canvas.getContext('2d');
ctx.fillStyle = 'black'
ctx.fillRect(0, 0, WIDTH, HEIGHT)

const CHANNEL = {
    R: 0,
    G: 1,
    B: 2,
}
const img = ctx.getImageData(0, 0, WIDTH, HEIGHT);
function toPix(x, y, chnl=CHANNEL.G) {
    x = Math.round(x)
    y = Math.round(y)
    if (D.wrap) {
        x = (x + WIDTH) % WIDTH
        y = (y + HEIGHT) % HEIGHT
    }
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return -1
    return ((Math.round(y) * (img.width * 4)) + (Math.round(x) * 4)) + chnl
}
function getPix(x, y, chnl) {
    let i = toPix(x, y, chnl)
    if (i === -1) return 0
    return (img.data[i] || 0) / 255
}
function setPix(x, y, val, chnl) {
    let i = toPix(x, y, chnl)
    if (i === -1) return 0
    return img.data[toPix(x, y, chnl)] = Math.round(val * 255)
    // img.data[toPix(x, y, 0)] = Math.round(val * 255)
    // img.data[toPix(x, y, 1)] = Math.round(val * 255)
    // img.data[toPix(x, y, 2)] = Math.round(val * 255)
}

const dirs = {up: 0, down: 0, left: 0, right: 0};
let timer, prevTime;
let paused = false;

function init() {
    aspect = window.innerWidth / window.innerHeight;
    prevTime = performance.now();
    timer = 0;

    window.addEventListener('blur', () => { pause(true) });
    window.addEventListener('focus', () => { pause(false) });
    window.addEventListener('resize', onWindowResize, false);
    onWindowResize()

    canvas.addEventListener('pointerdown', e => { spawnEvent = e });
    canvas.addEventListener('touchmove', e => { spawnEvent = e.touches[0] });
    canvas.addEventListener('pointerup', e => { spawnEvent = false });

    generate();
}

class V {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static polar(mag, angle) {
        return new V(mag * Math.cos(angle), mag * Math.sin(angle))
    }

    // Manhattan distance
    manhat(other) {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }
    dist(other) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
    add(other) {
        return new V(this.x + other.x, this.y + other.y);
    }
    sub(other) {
        return new V(this.x - other.x, this.y - other.y);
    }
    scale(c) {
        if (typeof c === 'number') return new V(c * this.x, c * this.y);
        else return new V(c.x * this.x, c.y * this.y);
    }
    rotate(angle) {
        return V.polar(this.mag(), this.angle() + angle)
    }
    do(func) {
        return new Arc.V(func(this.x), func(this.y));
    }
    angle(other) {
        let diff = (other) ? other.sub(this) : this;
        return Math.atan2(diff.y, diff.x);
    }
    mag() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    norm() {
        let mag = this.mag() || 1;
        return new V(this.x / mag, this.y / mag);
    }
    apply(func) {
        return new V(func(this.x, 0), func(this.y, 1));
    }
    clone() {
        return new V(this.x, this.y);
    }
    closest(points) {
        let min_dist = Infinity;
        let min_point = false;
        points.forEach(p => {
            let dist = this.dist(p);
            if (dist < min_dist) {
                min_dist = dist;
                min_point = p;
            }
        });
        return min_point;
    }
}

let dots = []
const D = { // thick-laned
    speed: 50,
    SA: 60,
    SO: 5,
    RA: 30,
    n: 5000,
    fade: 1.5,
    diffuse: .2,
}
// const D = { // 2-lane, spreads out
//     speed: 50,
//     SA: 60,
//     SO: 5,
//     RA: 15,
//     n: 5000,
//     fade: 1.1,
//     diffuse: .5,
// }
// const D = { // messy, dynamic
//     speed: 100,
//     SA: 60,
//     SO: 5,
//     RA: 10,
//     n: 10000,
//     fade: 1.005,
//     diffuse: .95,
// }
// const D = { // two-laned, messy
//     speed: 50,
//     SA: 60,
//     SO: 5,
//     RA: 10,
//     n: 10000,
//     fade: 1.5,
//     diffuse: .1,
// }
// const D = { // 1-lane, fast
//     speed: 100,
//     SA: 30,
//     SO: 5,
//     RA: 30,
//     n: 10000,
//     fade: 1.5,
//     diffuse: .5,
// }
// const D = { // 1-lane, fast
//     speed: 200,
//     SA: 30,
//     SO: 5,
//     RA: 30,
//     n: 10000,
//     fade: 1.05,
//     diffuse: .5,
// }
// const D = { // sparse, fast
//     speed: 100,
//     SA: 45,
//     SO: 9,
//     RA: 45,
//     n: 1000,
//     fade: 1.5,
//     diffuse: .5,
// }
// const D = { // thick cells
//     speed: 50,
//     SA: 45,
//     SO: 9,
//     RA: 45,
//     n: 10000,
//     fade: 1.5,
//     diffuse: .1,
// }
// const D = { // squiggly cells
//     speed: 100,
//     SA: 30,
//     SO: 5,
//     RA: 15,
//     n: 10000,
//     fade: 1.05,
//     diffuse: .5,
// }
// const D = { // 2-lane cells fill space
//     speed: 42,
//     SA: 60,
//     SO: 7,
//     RA: 10,
//     n: 10000,
//     fade: 1.25,
//     diffuse: .5,
// }
// const D = { // mobile squiggly cells
//     speed: 100,
//     SA: 45,
//     SO: 5,
//     RA: 15,
//     n: 10000,
//     fade: 1.005,
//     diffuse: 1,
// }
class Dot {
    constructor(x, y, vx, vy) {
        this.pos = new V(x, y)
        this.vel = new V(vx ?? rands(1), vy ?? rands(1)).norm().scale(D.speed)
        this.vel = this.vel.norm().scale(D.speed * .015)
        this.acc = new V(0, 0)
        this.chnl = 1 // randi(3)
    }

    update(dt) {
        // slime behavior from https://uwe-repository.worktribe.com/output/980579
        let ang = this.vel.angle()
        let SA = Math.PI * D.SA / 180
        let pFL = this.pos.add(V.polar(D.SO, ang + SA))
        let pF = this.pos.add(V.polar(D.SO, ang))
        let pFR = this.pos.add(V.polar(D.SO, ang - SA))

        let FL = getPix(pFL.x, pFL.y, this.chnl)
        let F = getPix(pF.x, pF.y, this.chnl)
        let FR = getPix(pFR.x, pFR.y, this.chnl)

        let speed = D.speed * .015
        let RA = Math.PI * D.RA / 180
        if (F > FL && F > FR) {
            // stay straight
        } else if (F < FL && F < FR) {
            // rotate right or left
            this.vel = V.polar(speed, ang + (randi(1) ? -1 : 1) * RA)
        } else if (FL < FR) {
            // rotate right
            this.vel = V.polar(speed, ang - RA)
        } else if (FR < FL) {
            // rotate left
            this.vel = V.polar(speed, ang + RA)
        }

        this.pos = this.pos.add(this.vel)

        if (D.wrap) {
            if (this.pos.x < 0) this.pos.x = WIDTH
            if (this.pos.y < 0) this.pos.y = HEIGHT
            if (this.pos.x > WIDTH) this.pos.x = 0
            if (this.pos.y > HEIGHT) this.pos.y = 0
        } else {
            if (this.pos.x < 0 || WIDTH <= this.pos.x) {
                this.vel.x *= -1
                this.pos.x += this.vel.x
            }
            if (this.pos.y < 0 || HEIGHT <= this.pos.y) {
                this.vel.y *= -1
                this.pos.y += this.vel.y
            }
        }
    }

    draw() {
        setPix(this.pos.x, this.pos.y, 1, this.chnl)
    }
}

function generate() {
    dots = []
    for (let i = 0; i < D.n; i++) {
        // let x, y;
        // do {
        //     x = rands(WIDTH/3) + WIDTH/2
        //     y = rands(WIDTH/3) + HEIGHT/2
        // } while (dist(x, y, WIDTH/2, HEIGHT/2) > Math.min(WIDTH/3, HEIGHT/3))
        // dots.push(new Dot(x, y))
        // dots.push(new Dot(rand(WIDTH), rand(HEIGHT)))
        let x, y;
        do {
            x = rands(WIDTH/3) + WIDTH/2
            y = rands(WIDTH/3) + HEIGHT/2
        } while (dist(x, y, WIDTH/2, HEIGHT/2) > Math.min(WIDTH/3, HEIGHT/3))
        if (D.center) {
            dots.push(new Dot(x, y, WIDTH/2 - x, HEIGHT/2 - y))
        } else {
            dots.push(new Dot(x, y))
        }
    }
}

let spawnEvent;
function spawn() {
    if (spawnEvent) {
        let { clientX, clientY } = spawnEvent;
        let rect = canvas.getBoundingClientRect()
        let x = ((clientX - rect.x) / rect.width) * WIDTH
        let y = ((clientY - rect.y) / rect.height) * HEIGHT
        dots.push(new Dot(x, y))
    }
}

function update(dt) {
    for (let chnl = 0; chnl < 3; chnl++) {
        for (let x = 0; x < WIDTH; x++)
        for (let y = 0; y < HEIGHT; y++) {
            let total = 0
            for (let x_off = -1; x_off < 2; x_off++)
            for (let y_off = -1; y_off < 2; y_off++) {
                // if ()
                total += getPix(x + x_off, y + y_off, chnl)
            }
            if (D.diffuse !== undefined) {
                setPix(x, y, lerp(getPix(x, y, chnl), total / (9 * D.fade), D.diffuse), chnl)
            } else {
                setPix(x, y, total / (9 * D.fade), chnl)
            }
        }
    }

    spawn()
    dots.forEach(dot => {
        dot.update(dt)
        dot.draw()
    })

    ctx.putImageData(img, 0, 0)
}

// animation loop: update & render scene
function animate() {
    if (paused) return;

    requestAnimationFrame(animate);
    var elapsedTime = performance.now() - prevTime;
    prevTime += elapsedTime;
    timer += elapsedTime * 0.0001;
    if (debug.fps) console.log(elapsedTime);

    update(elapsedTime / 1000);
}

function onWindowResize() {
    let save = document.createElement('canvas');
    save.width = canvas.width;
    save.height = canvas.height;
    save.getContext('2d').drawImage(canvas, 0, 0);

    let style = window.getComputedStyle(canvas.parentNode);
    let containerWidth = Number(style.width.slice(0, -2));
    let containerHeight = Number(style.height.slice(0, -2));

    let canvasScale = Math.min(containerWidth / WIDTH, containerHeight / HEIGHT);
    canvas.style.width = `${canvasScale * WIDTH}px`;
    canvas.style.height = `${canvasScale * HEIGHT}px`;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(save, 0, 0, canvas.width, canvas.height);
    save.remove();
}

function pause(value) {
    paused = (value !== null) ? value : true;
    if (!paused) {
        prevTime = performance.now();
        requestAnimationFrame(animate);
    }
}


init();
animate();