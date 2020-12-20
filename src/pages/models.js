import React, { useEffect, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useAnimate, useEventListener } from '../lib/hooks';
import styled from 'styled-components';

const Models = styled.div`
    height: 100%;
    width: 100%;

    & #canvasContainer {
        height: 100%;
        width: 100%;
    }

    & #canvas {
        /* background: radial-gradient(white, rgb(100, 100, 100)); */
        background: radial-gradient(rgb(40, 40, 40), rgb(10, 10, 10));
        background: radial-gradient(rgb(90, 90, 90), rgb(40, 40, 40));
        background: radial-gradient(rgb(240, 240, 240), rgb(140, 140, 140));
        /* rgb(244, 241, 232) */
    }

    & #modelList {
        position: absolute;
        top: .5rem;
        right: .5rem;
        min-width: 7rem;
    }
`

var SCALE = 16;
var camera, scene, renderer, controls, loader;

function init() {
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#canvas'),
        antialias: true,
        alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    let bounds = document.querySelector('#canvasContainer').getBoundingClientRect();
    renderer.setSize(bounds.width, bounds.height);

    camera = new THREE.PerspectiveCamera( 70, bounds.width / bounds.height, 1, 1000 );
    camera.position.x = SCALE*2/3;
    camera.position.z = -SCALE*2/3;
    camera.position.y = SCALE*1/12;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x000000, 1, 1000 );

    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = SCALE/5;
    controls.maxDistance = SCALE*5;

    // scene.add(new THREE.AmbientLight(0xd9b3ff));
    scene.add(new THREE.AmbientLight(0xffffff, .125));
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 0);
    directionalLight.position.normalize();
    scene.add(directionalLight);
    var directionalLight = new THREE.DirectionalLight(0xad9ede, .5);
    directionalLight.position.set(1, .2, 0);
    directionalLight.position.normalize();
    scene.add(directionalLight);
    var directionalLight = new THREE.DirectionalLight(0x9ecdde, .25);
    directionalLight.position.set(-1, -.5, 0);
    directionalLight.position.normalize();
    scene.add(directionalLight);

    // from https://threejsfundamentals.org/threejs/lessons/threejs-load-gltf.html
    {
        const skyColor = 0xffffff; //0xB1E1FF;  // light blue
        const groundColor = 0xffffff; //0xB97A20;  // brownish orange
        const intensity = .5;
        const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        scene.add(light);
    }

    onWindowResize();

    loader = new GLTFLoader();
}

function animate() {
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    let bounds = document.querySelector('#canvasContainer').getBoundingClientRect();
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
    renderer.setSize(bounds.width, bounds.height);
}

let modelNames = ['tree', 'palm', 'desk', 'octopus', 'turtle'];
let model = false;
function loadModel(name) {
    model && scene.remove(model);
    if (name && modelNames.includes(name)) {
        loader.load(
            `/raw/models/${name}.glb`,
            (gltf) => {
                model = gltf.scene;

                const box = new THREE.Box3().setFromObject( model );
                const center = box.getCenter( new THREE.Vector3() );
                model.position.y += ( model.position.y - center.y );

                console.log(model);
                scene.add(model);
            }
        );
    }
}

export default () => {
    let match = useRouteMatch('/models/:initialModel');
    let [ modelName, setModelName ] = useState('');

    useEffect(() => {
        init();
        let initialModel = match && match.params.initialModel;
        if (!initialModel || modelNames.includes[initialModel]) {
            initialModel = 'octopus';
        }
        setModelName(initialModel);
    }, []);

    useAnimate(animate);
    useEventListener(window, 'resize', onWindowResize, false);

    useEffect(() => {
        loadModel(modelName);
        window.history.replaceState({}, null, `/models/${modelName}`);
    }, [modelName]);

    return (
        <Models>
            <div id="canvasContainer">
                <canvas id="canvas"/>
            </div>
            <select id="modelList" value={modelName} onChange={e => setModelName(e.target.value)}>
                {modelNames.map(name => <option value={name} key={name}>{name}</option>)}
            </select>
        </Models>
    )
}