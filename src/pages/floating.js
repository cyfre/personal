import React, { useEffect } from 'react';
import * as THREE from 'three';
import Delaunator from 'delaunator';
const V3 = THREE.Vector3;

var SCALE = 256;
var WIDTH = SCALE,
    HEIGHT = SCALE,
    frustumSize = SCALE;
var camera, scene, renderer;

var points;
var delaunay;
var mesh;

class Point {
    constructor(position, velocity) {
        this.position = position;
        this.velocity = velocity;
    }

    update() {
        this.position.add(this.velocity);
        if (this.position.length() > SCALE/2) {
            this.velocity.reflect(this.position.clone().normalize().negate())
        }
    }
}

function init() {
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#canvas'),
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    let bounds = document.querySelector('#canvasContainer').getBoundingClientRect();
    renderer.setSize(bounds.width, bounds.height);

    camera = new THREE.OrthographicCamera(-WIDTH/2, WIDTH/2, HEIGHT/2, -HEIGHT/2, 1, 1000)
    camera.position.z = 500
    scene = new THREE.Scene();

    points = [];
    // for (var i = 0; i < 12; i++) {
    //     let angle = 2*Math.PI * (i/12 + 1/24);
    //     let x = SCALE/2 * Math.cos(angle);
    //     let y = SCALE/2 * Math.sin(angle);
    //     points.push(new Point(new V3(x, y, 0), new V2(0, 0)));
    // }
    for (var i = 0; i < 32; i++) {
        var x = THREE.MathUtils.randFloatSpread(SCALE);
        var y = THREE.MathUtils.randFloatSpread(SCALE);
        if (x*x + y*y > Math.pow(SCALE/2, 2)) {
            i--;
            continue;
        }
        points.push(new Point(new V3(x, y, 0), new V3(
            THREE.MathUtils.randFloatSpread(SCALE/1000),
            THREE.MathUtils.randFloatSpread(SCALE/1000), 0)))
    }

    delaunay = Delaunator.from(points, p => p.position.x, p => p.position.y);
    let geometry = new THREE.Geometry();
    geometry.vertices.push(...points.map(p => p.position));
    let faces = []
    for (let t = 0; t < delaunay.triangles.length/3; t++) {
        faces.push(new THREE.Face3(
            ...[3*t, 3*t + 1, 3*t + 2].map(e => delaunay.triangles[e]),
            null, new THREE.Color(Math.random(), Math.random(), Math.random())))
    }
    console.log(...points.map(p => p.position), delaunay.triangles, faces);
    geometry.faces.push(...faces);

    mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ wireframe: true, side: THREE.DoubleSide, vertexColors: THREE.VertexColors }))
    scene.add(mesh);

    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();
}

let stop = false
function animate() {
    if (stop) return;
    requestAnimationFrame(animate);

    mesh.geometry.dispose();

    points.forEach(p => p.update())
    let delaunay = Delaunator.from(points, p => p.position.x, p => p.position.y);

    let geometry = new THREE.Geometry();
    geometry.vertices.push(...points.map(p => p.position));
    let faces = []
    for (let t = 0; t < delaunay.triangles.length/3; t++) {
        faces.push(new THREE.Face3(
            ...[3*t, 3*t + 1, 3*t + 2].map(e => delaunay.triangles[e])))
    }
    geometry.faces.push(...faces);
    mesh.geometry = geometry;

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
    useEffect(() => {
        stop = false
        init();
        animate();
        return () => {
            stop = true;
            window.removeEventListener('resize', onWindowResize, false)
        }
    }, []);

    return (
        <div id="canvasContainer" style={{ height: '100%', width: '100%' }}>
            <canvas id="canvas"/>
        </div>
    )
}