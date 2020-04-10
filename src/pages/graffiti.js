import ReactDOM from 'react-dom'
import React, { useRef, useState, useCallback, useDebugValue, useEffect } from 'react'
import { Canvas, useFrame, useThree } from 'react-three-fiber'

const Box = (props) => {
  // This reference will give us direct access to the mesh
  const mesh = useRef()

  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)

  // Rotate mesh every frame, this is outside of React without overhead
  useFrame(() => (mesh.current.rotation.x = mesh.current.rotation.y += 0.01))

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? [1.5, 1.5, 1.5] : [1, 1, 1]}
      onClick={e => setActive(!active)}
      onPointerOver={e => setHover(true)}
      onPointerOut={e => setHover(false)}>
      <boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
      <meshStandardMaterial attach="material" color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}

const Ball = (props) => {
  const mesh = useRef();
  const { size, viewport } = useThree();
  const aspect = size.width / viewport.width;
  const [scale, setScale] = useState(1);

  useEffect(() => {
    mesh.current.position.set(props.mouse.current[0] / aspect, -props.mouse.current[1] / aspect, 0);
  }, []);

  return (
    <mesh
        {...props}
        ref={mesh}
        scale={[1, 1, 1]}>
      <sphereBufferGeometry attach="geometry" args={[.1, 16, 16]} />
      <meshStandardMaterial attach="material" color={'lightblue'} />
    </mesh>
  )
}

const Pointer = ({ mouse, down }) => {
  const mesh = useRef();
  const { size, viewport } = useThree();
  const aspect = size.width / viewport.width;

  useFrame(() => {
    mesh.current.position.set(mouse.current[0] / aspect, -mouse.current[1] / aspect, 0);
  });

  useEffect(() => {
    if (down) {

    }
  }, [down]);

  return (
    <mesh
        ref={mesh}
        scale={[1, 1, 1]}
        onMouseMove={e => console.log("MOVE")}
        onMouseDown={e => console.log("DRAW DOWN")}
        onMouseUp={e => console.log("DRAW UP")}>
      <sphereBufferGeometry attach="geometry" args={[.1, 16, 16]} />
      <meshStandardMaterial attach="material" color='white' />
    </mesh>
  )
}

export default () => {
  let [mouseDown, setMouseDown] = useState(false);
  let mouse = useRef([0, 0]);
  let [balls, setBalls] = useState([]);

  const onMouseMove = useCallback(({ clientX: x, clientY: y }) => (mouse.current = [x - window.innerWidth / 2, y - window.innerHeight / 2]), [])
  const addBall = () => {
    let newBalls = balls.slice();
    newBalls.push(mouse.current);
    setBalls(newBalls);
  }

  return (
    <Canvas 
        onPointerDown={e => setMouseDown(true)}
        onPointerUp={e => setMouseDown(false)}
        onMouseMove={onMouseMove}
        onClick={addBall}
        >
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Box position={[-1.2, 0, 0]} />
      <Box position={[1.2, 0, 0]} />
      <Pointer mouse={mouse} down={mouseDown} addBall={addBall}/>
      {balls.map(ball => (
        <Ball key={ball} mouse={mouse} down={mouseDown} position={[ball[0], ball[1], 0]} />
      ))}
    </Canvas>
  )
}