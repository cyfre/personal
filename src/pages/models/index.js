import React, { useEffect, useState, Fragment } from 'react';
import { useRouteMatch } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './models.css';

var SCALE = 16;
var camera, scene, renderer, controls, loader;

function init() {
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#canvas'),
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    let bounds = document.querySelector('#canvasContainer').getBoundingClientRect();
    renderer.setSize(bounds.width, bounds.height);

    camera = new THREE.PerspectiveCamera( 70, bounds.width / bounds.height, 1, 1000 );
    camera.position.x = SCALE*2/3;
    camera.position.z = 0;
    camera.position.y = SCALE*1/4;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x000000, 1, 1000 );

    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = SCALE/2;
    controls.maxDistance = SCALE*5;
    controls.maxPolarAngle = Math.PI / 2 - .1;

    scene.add(new THREE.AmbientLight(0xd9b3ff));
    var directionalLight = new THREE.DirectionalLight(0xffffbf, 2);
    directionalLight.position.set(-0.5, 0.5, -0.75);
    directionalLight.position.normalize();
    scene.add(directionalLight);
    var directionalLight = new THREE.DirectionalLight(0x3300ff, 1);
    directionalLight.position.set(0.5, -0.5, -1.5);
    directionalLight.position.normalize();
    scene.add(directionalLight);

    // from https://threejsfundamentals.org/threejs/lessons/threejs-load-gltf.html
    {
        const skyColor = 0xB1E1FF;  // light blue
        const groundColor = 0xB97A20;  // brownish orange
        const intensity = 2.;
        const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        scene.add(light);
    }

    var circle = new THREE.Mesh(
        new THREE.CircleBufferGeometry( SCALE/4, 16 ),
        new THREE.MeshBasicMaterial({
            color: 0x0c0c0c,
            side: THREE.DoubleSide
        }));
    circle.lookAt(0, 1, 0);
    scene.add( circle );

    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();

    loader = new GLTFLoader();
}

let stop = false
function animate() {
    if (stop) return;
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    let bounds = document.querySelector('#canvasContainer').getBoundingClientRect();
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
    renderer.setSize(bounds.width, bounds.height);
}

let modelNames = ['tree', 'palm'];
let model = false;
function loadModel(name) {
    model && scene.remove(model);
    if (name && modelNames.includes(name)) {
        loader.load(
            `/project/models/${name}.glb`,
            (gltf) => {
                model = gltf.scene;
                scene.add(model);
            }
        );
    }
}

export default (props) => {
    let match = useRouteMatch('/models/:initialModel');
    let [ modelName, setModelName ] = useState('');

    useEffect(() => {
        stop = false
        init();
        animate();

        let initialModel = match && match.params.initialModel;
        if (!initialModel || modelNames.includes[initialModel]) {
            initialModel = modelNames[0];
        }
        setModelName(initialModel);
        
        return () => {
            stop = true;
            window.removeEventListener('resize', onWindowResize, false)
        }
    }, []);

    useEffect(() => {
        loadModel(modelName);
        window.history.replaceState({}, null, `/models/${modelName}`);
    }, [modelName]);

    return (
        <Fragment>
            <div id="canvasContainer">
                <canvas id="canvas"/>
            </div>
            <select id="modelList" value={modelName} onChange={e => setModelName(e.target.value)}>
                {modelNames.map(name => <option value={name} key={name}>{name}</option>)}
            </select>
        </Fragment>
    )
}