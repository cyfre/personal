import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Delaunator from 'delaunator';
import { useAnimate, useEventListener } from '../lib/hooks';
import { pbkdf2 } from 'crypto';
import { Vector2 } from 'three';
const V3 = THREE.Vector3;

var SCALE = 256;
var WIDTH = SCALE,
  HEIGHT = SCALE,
  frustumSize = SCALE;
var camera, scene, renderer;

var points;
var mesh;

class Dot {
  constructor(pos, hue, scale) {
    let r = (n) => Math.random() * n - (n/2)
    this.pos = [pos[0] + r(5), pos[1] + r(5)]
    this.hue = hue + r(.1)
    this.l = .5
    this.scale = scale + r(.1)

    // console.log(pos, hue, scale)

    this.mesh = new THREE.Mesh(
      new THREE.CircleGeometry(5 * this.scale, 32)
        .translate(...this.pos, 0),
      new THREE.MeshBasicMaterial({
        color: `white`
      })
    )
    this.mesh.material.color.setHSL(this.hue, .9, this.l)
    scene.add(this.mesh)
  }
  update() {
    this.scale += .02
    this.hue = (this.hue + .001) % 1
    this.l += .003
    this.mesh.geometry.dispose()
    this.mesh.geometry = new THREE.CircleGeometry(5 * this.scale, 32)
      .translate(...this.pos, 0)
    this.mesh.material.color.setHSL(this.hue, (.9 + .2*this.l), this.l)
    // this.mesh.material.dispose()
    // console.log(this.hue, this.mesh.material.color)
    // this.mesh.material = new THREE.MeshBasicMaterial({
    //   color: `hsl(${this.hue}, 90%, 50%)`
    // })

    return this.scale < .1 || this.l > 1;
  }
  clear() {
    scene.remove(this.mesh)
  }
}

function init() {
  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#canvas'),
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  let bounds = document.querySelector('#canvasContainer').getBoundingClientRect();
  renderer.setSize(bounds.width, bounds.height);

  camera = new THREE.OrthographicCamera(-WIDTH/2, WIDTH/2, HEIGHT/2, -HEIGHT/2, 1, 1000)
  camera.position.z = 500
  scene = new THREE.Scene();

  // points = [];
  // mesh = new THREE.Mesh(
  //   new THREE.CircleGeometry( 5, 32 ),
  //   new THREE.MeshBasicMaterial( { color: 0xffff00 } ))
  // scene.add(mesh);

  onWindowResize();

  return () => {
    renderer.dispose();
    scene.dispose();
    camera = null;
    scene = null;
    renderer = null;
    points = null;
    mesh = null;
  }
}

var p = [undefined];
var t = 0
var dot_timer = 0
var dots = []

let prev_t
function animate(timestamp) {
  if (!prev_t) {
    prev_t = timestamp
    return
  }
  const dt = timestamp - prev_t
  prev_t = timestamp

  dots = dots.filter(d => {
    if (d.update()) {
      d.clear()
      return false
    }
    return true
  })

  t += dt
  dot_timer -= dt

  let doDot = dot_timer < 0
  if (dots.length) {
    let p2 = dots.slice(-1)[0].pos
    let dist = Math.sqrt(
      Math.pow(p2[0] - p[0], 2) +
      Math.pow(p2[1] - p[1], 2))
    if (dist > 5) {
      doDot = true
    }
  } else {
    doDot = true;
  }
  if (p[0] !== undefined && doDot) {
    dots.push(new Dot(p.slice(), (Date.now() / 10000)%1, .1))
    // if (dots.length > 10) {
    //   let toRemove = dots.shift()
    //   toRemove.clear()
    // }
    dot_timer = 1500
    // console.log(dots)
  }

  // mesh?.geometry?.dispose();
  // points.forEach(p => p.update())
  // let g2 = new THREE.CircleGeometry( 5, 32 )
  // g2.translate(p[0], p[1], 0);
  // mesh.geometry = g2;

  renderer.render(scene, camera);
}

function onWindowResize() {
  let bounds = document.querySelector('#canvasContainer').getBoundingClientRect();
  // camera.aspect = bounds.width / bounds.height;
  var aspect = bounds.width / bounds.height;
  if (aspect < 1) {
    camera.left   = - frustumSize / 2;
    camera.right  =   frustumSize / 2;
    camera.top    =   frustumSize / aspect / 2;
    camera.bottom = - frustumSize / aspect / 2;
  } else {
    camera.left   = - aspect * frustumSize / 2;
    camera.right  =   aspect * frustumSize / 2;
    camera.top    =   frustumSize / 2;
    camera.bottom = - frustumSize / 2;
  }
  camera.updateProjectionMatrix();
  renderer.setSize(bounds.width, bounds.height);
}

export default () => {
  const canvasRef = useRef()
  useEffect(() => init(), []);
  useAnimate(animate);
  useEventListener(window, 'resize', onWindowResize, false);

  const handleMove = (x, y) => {
    let rect = canvasRef.current.getBoundingClientRect();
    let mid = [
      rect.width / 2 + rect.left,
      rect.height / 2 + rect.top
    ];
    let pX = x - mid[0]
    let pY = y - mid[1]

    var vec = new THREE.Vector3(); // create once and reuse
    var pos = new THREE.Vector3(); // create once and reuse
    // vec.set(
    //     ( x / window.innerWidth ) * 2 - 1,
    //     - ( y / window.innerHeight ) * 2 + 1,
    //     0.5 );
    vec.set(
      ( (x - rect.left) / rect.width ) * 2 - 1,
      - ( (y - rect.top) / rect.height ) * 2 + 1,
      0.5 );
    vec.unproject( camera );
    vec.sub( camera.position ).normalize();
    var distance = - camera.position.z / vec.z;
    pos.copy( camera.position ).add( vec.multiplyScalar( distance ) );

    console.log(pos)
    p[0] = 1.5 * pos.x
    p[1] = 1.5 * pos.y
    // let unP = new V3(pX, pY, 0).unproject(camera)
    // p[0] = .465 * unP.x;
    // p[1] = -.465 * unP.y;
  }
  const handleClear = () => {
    p[0] = undefined
    p[1] = undefined
  }

  return (
    // <div id="canvasContainer" className="seamless"
    <div id="canvasContainer"
      style={{ height: '100%', width: '100%', background: 'white' }}>
      <canvas id="canvas" ref={canvasRef}
        onPointerMove={e => handleMove(e.clientX, e.clientY)}
        onTouchMove={e => handleMove(
          e.touches[0].clientX, e.touches[0].clientY)}
        onPointerOut={handleClear}
        onTouchEnd={handleClear}/>
    </div>
  )
}