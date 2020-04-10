// adapted from https://threejs.org/examples/webgl_postprocessing_afterimage
import React, { useEffect } from 'react';
import styled from 'styled-components';

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';

var camera, scene, renderer, composer;
var mesh;

var afterimagePass;

function init() {
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('projectCanvas')});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 400;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x000000, 1, 1000 );

    var geometry = new THREE.BoxBufferGeometry( 150, 150, 150, 2, 2, 2 );
    var material = new THREE.MeshNormalMaterial();
    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    // postprocessing

    composer = new EffectComposer( renderer );
    composer.addPass( new RenderPass( scene, camera ) );

    afterimagePass = new AfterimagePass();
    afterimagePass.uniforms["damp"].value = 0.997;
    composer.addPass( afterimagePass );

    window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    composer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    requestAnimationFrame( animate );

    mesh.rotation.x += 0.005;
    mesh.rotation.y += 0.01;

    composer.render();
}

const CanvasContainer = styled.div`
    position: relative;
`

export default () => {
    useEffect(() => {
        init();
        animate();
    }, []);

    return (
        <CanvasContainer>
            <canvas id="projectCanvas"/>
        </CanvasContainer>
    )
}