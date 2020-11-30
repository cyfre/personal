import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useInput, useEventListener, useAnimate } from '../../lib/hooks';
import './turt.css';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let SCALE = 16, DESCALE = 1;
let camera, scene, renderer;
let model;
let tree, trees;
let ground;

function init() {
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#canvas'),
        antialias: true,
        alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    let bounds = document.querySelector('#canvasContainer').getBoundingClientRect();
    renderer.setSize(bounds.width/DESCALE, bounds.height/DESCALE);
    renderer.shadowMap.enabled = true;

    camera = new THREE.PerspectiveCamera( 70, bounds.width / bounds.height, 1, 1000 );
    camera.position.x = 0;
    camera.position.y = SCALE/4;
    camera.position.z = -SCALE*3/2;
    camera.lookAt(0, SCALE/2, 0);

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x000000, 1, 1000 );

    scene.add(new THREE.AmbientLight(0xffffff, .6));
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
    directionalLight.position.set(0.5, 0.5, -0.75);
    directionalLight.position.normalize();
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    var geometry = new THREE.SphereBufferGeometry(SCALE*5, 32, 12);
    // var material = new THREE.MeshToonMaterial({ color: 0x94795d });
    // var material = new THREE.MeshToonMaterial({ color: 0x416b38 });
    var material = new THREE.MeshStandardMaterial({
        color: 0x416b38,
        flatShading: true
    });
    ground = new THREE.Mesh(geometry, material);
    ground.position.y = -SCALE*5 + SCALE/32;
    ground.position.z = SCALE/4;
    ground.rotateX(Math.PI/2);
    ground.receiveShadow = true;
    scene.add(ground);

    var loader = new GLTFLoader();
    loader.load(
        '/project/models/turtle.glb',
        (gltf) => {
            model = gltf.scene;
            model.castShadow = true;
            scene.add(gltf.scene);
        }
    );
    loader.load(
        '/project/models/tree.glb',
        (gltf) => {
            tree = gltf.scene;
            trees = [1,2,3,4,5,6].map(i => tree.clone());
            trees.forEach((t, i) => {
                t.position.x += 1.5*SCALE*(3-i);
                t.position.z += SCALE;
                t.rotateY(Math.PI/2);
                t.scale.setScalar(7);
                scene.add(t);
            });
        }
    );

    onWindowResize();
}

let startTime = Date.now();
let previousTime = startTime;
function animate() {
    let elapsedTime = Date.now() - startTime;
    if (model) {
        let animZ = elapsedTime / 3000 % 2;
        let angleZ = (animZ < 1) ? -5 + 10*animZ : 5 - 10*(animZ - 1);
        model.rotation.z = angleZ * Math.PI/180;

        let animX = elapsedTime / 1500 % 2;
        let angleX = (animX < 1) ? -3 + 6*animX : 3 - 6*(animX - 1);
        model.rotation.x = angleX * Math.PI/180;
    }

    let dt = (Date.now() - previousTime)/1000;
    previousTime = Date.now();

    if (trees) {
        trees.forEach(t => {
            t.position.x -= .35*dt;
            if (t.position.x < -SCALE*4.5) {
                t.position.x = SCALE*4.5;
            }
            t.position.y = Math.min(-Math.abs(t.position.x)/4, -SCALE/8);
        });
    }

    ground.rotateY(.0075*dt);

    renderer.render(scene, camera);
}

function onWindowResize() {
    let bounds = document.querySelector('#canvasContainer').getBoundingClientRect();
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
    renderer.setSize(bounds.width/DESCALE, bounds.height/DESCALE);
}

const CanvasContainer = () => {
    useEffect(() => {
        init();
    }, []);

    useAnimate(animate);
    useEventListener(window, 'resize', onWindowResize, false);

    return (
        <div id="canvasContainerContainer">
            <div id="canvasContainer">
                <canvas id="canvas"/>
            </div>
        </div>
    )
}

const About = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="About">
            <div className="tab centering" onClick={() => setOpen(!open)}>{open ? 'x' : '?'}</div>
            { open &&
                <content>
                    <p>Turt Smurts!</p>

                    <p>
                        Tap the turtle for a little bit of wisdom, <br/>
                        or share your own favorite quotes for others to see
                    </p>
                </content>
            }
        </div>
    )
}

const Wisput = (props) => {
    const {
        value: wisdom,
        bind: bindWisdom,
        reset: resetWisdom
    } = useInput('');
    const {
        value: name,
        bind: bindName
    } = useInput('');
    const [sending, setSending] = useState(false);
    const [open, setOpen] = useState(false);

    const handle = {
        open: () => {
            setOpen(!open);
        },
        submit: (e) => {
            e.preventDefault();
            console.log(`${wisdom} ${name || 'anonymous'}`);
            if (!sending && wisdom) {
                setSending(true);
                api.create('/turt', {
                    content: wisdom,
                    author: name || 'anonymous'
                }, data => {
                    console.log(data);
                    resetWisdom();
                    setSending(false);
                    props.onWisput(data._id);
                });
            }
        }
    }

    return (
        <div className={`Wisput ${open ? "open" : ""}`}>
            <div className="tab centering" onClick={handle.open}>{open ? '-' : '+'}</div>
            <form onSubmit={handle.submit}>
                <div className="inputs">
                    <input type="text" placeholder="What are some wise words?" {...bindWisdom} />
                    <input type="text" placeholder=" - anonymous" {...bindName} />
                </div>
                <input className="button" type="submit" value="Submit" />
            </form>
        </div>
    )
}

export default () => {
    const [wisdom, setWisdom] = useState('Tap me for some wisdom :-)');
    const [author, setAuthor] = useState('Turt Smurts');
    const [visible, setVisible] = useState(true);
    const [responding, setResponding] = useState(false);

    const handle = {
        turtle: () => {
            if (!responding) {
                setResponding(true);
                setVisible(false);
                if (Math.random() > 0.5) {
                    setTimeout(() => {
                        fetch('https://api.quotable.io/random')
                        .then(res => res.json())
                        .then(data => {
                            console.log(data);
                            setWisdom(data.content);
                            setAuthor(data.author);
                            setVisible(true);
                            setResponding(false)
                        });
                    }, 1000);
                } else {
                    setTimeout(() => api.read('/turt/random/', data => {
                        console.log(data);
                        setWisdom(data.content);
                        setAuthor(data.author);
                        setVisible(true);
                        setResponding(false);
                    }), 1000);
                }
            }
        },
        wisput: (id) => {
            setResponding(true);
            setVisible(false);
            setTimeout(() => api.read(`/turt/${id}`, data => {
                console.log(data);
                setWisdom(data.content);
                setAuthor(data.author);
                setVisible(true);
                setResponding(false);
            }), 1000);
        }
    }

    useEffect(() => {
        document.title = "Turt Smurts";
    });

    return (
        <div className="Turt">
            <About />
            <div className={`quote-container ${visible ? "" : " unvisible"}`}>
                <div className="quote">
                    <p className="wisdom">{wisdom}</p>
                    <p className="author">
                        <span className="text">{author}</span>
                    </p>
                </div>
            </div>
            <div className="turtle" onClick={handle.turtle}></div>
            <Wisput onWisput={handle.wisput} />
            <CanvasContainer />
        </div>
    );
}