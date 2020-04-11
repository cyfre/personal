import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components';
import api from '../lib/api';

const WIDTH = 256, HEIGHT = 256;
let canvas, ctx, canvasScale, reloadTimeout;
let mouse = [0, 0];

const CLR = {
  natural: '#f2eee3',
  black: '#0f0f0e',
  white: 'white',
  red: '#dd2c41',
  orange: '#f78c2e',
  yellow: '#ffe960',
  green: '#53ed42',
  cyan: '#42edb4',
  blue: '#246df4',
  purple: '#862cf4'
}
const SZ = {
  '.4rem': 1,
  '.7rem': 3,
  '1rem': 8
}

const copyCanvas = () => {
  let copy = document.createElement('canvas');
  copy.width = canvas.width;
  copy.height = canvas.height;
  copy.getContext('2d').drawImage(canvas, 0, 0);
  return copy;
}

const init = () => {
  canvas = document.getElementById('graffiti');
  ctx = canvas.getContext('2d');
  api.read('/graffiti/', data => {
    if (data && data.dataUrl) {
      let image = new Image();
      image.onload = () => ctx.drawImage(image, 0, 0);
      image.src = data.dataUrl;
    }
    sendAndReceive();
  });
  window.addEventListener('resize', resize, false);
  resize();
}

const sendAndReceive = () => {
  setTimeout(() => {
    let dataUrl = canvas.toDataURL();
    api.update('/graffiti/', { dataUrl }, data => {
      canvas = document.getElementById('graffiti');
      if (data && data.dataUrl && canvas) {
        let save = copyCanvas();
        let image = new Image();
        image.onload = () => {
          ctx.drawImage(image, 0, 0);
          ctx.drawImage(save, 0, 0);
          save.remove();
          sendAndReceive();
        }
        image.src = data.dataUrl;
      }
    });
  }, 1000);
}

const resize = () => {
  let save = copyCanvas();
  let style = window.getComputedStyle(canvas.parentNode);
  let containerWidth = Number(style.width.slice(0, -2));
  let containerHeight = Number(style.height.slice(0, -2));

  canvasScale = Math.min(containerWidth / WIDTH, containerHeight / HEIGHT);
  canvas.style.width = `${canvasScale * WIDTH}px`;
  canvas.style.height = `${canvasScale * HEIGHT}px`;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(save, 0, 0, canvas.width, canvas.height);
  save.remove();
}

const drawCircle = (mouse, size, color) => {
  ctx.beginPath();
  ctx.arc(mouse[0] / canvasScale, mouse[1] / canvasScale, SZ[size], 0, 2*Math.PI, true);
  ctx.fillStyle = color;
  ctx.fill();
}

const Graffiti = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: row;
`

const Toolbar = styled.div`
  background: var(--dark-l);
  height: 100%;
  padding: .5rem 0;
  flex-wrap: wrap;
  flex-direction: column;

  &, & .section {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
  }

  & .divider {
    height: .1rem;
    width: 2rem;
    margin: 1rem;
    background: var(--light);
  }
`

const Dot = styled.div`
  border-radius: 50%;
  width: 1.75em;
  height: 1.75em;
  margin: .5rem;
  border: 2px solid var(--dark);
  background-color: var(--dark-l);
  box-shadow: 1px 2px 4px black;

  &.selected {
    border: 2px solid var(--light);
  }
`

const Wall = styled.div`
  flex-grow: 1;
  padding: .5rem;

  & .inner {
    flex-grow: 1;
    display: flex;
    height: 100%;
    justify-content: center;
    align-items: center;
  }

  & canvas {
    image-rendering: pixelated;
    background: #f2eee3;
  }
`

const ColorDot = ({ choice, color, setColor }) => {
  return (
    <Dot
      style={{ backgroundColor: choice }}
      onClick={() => setColor(choice)}
      className={'dot ' + (choice === color && 'selected')} />
  )
}

const SizeDot = ({ choice, size, setSize }) => {
  return (
    <Dot
      style={{ fontSize: choice }}
      onClick={() => setSize(choice)}
      className={'dot ' + (choice === size && 'selected')} />
  )
}

export default () => {
  const [down, setDown] = useState(false);
  const [size, setSize] = useState('.7rem');
  const [color, setColor] = useState(CLR.black);

  useEffect(() => {
    init();
    window.addEventListener('pointerup', e => setDown(false), false);
  }, []);

  const draw = (e, force) => {
    let rect = e.target.getBoundingClientRect();
    mouse = [
      e.clientX - rect.left,
      e.clientY - rect.top
    ];
    (down || force) && drawCircle(mouse, size, color);
  }
  const handle = {
    down: e => {
      setDown(true)
      draw(e, true)
    },
    up: e => setDown(false),
    move: e => draw(e)
  }

  return (
  <Graffiti>
    <Toolbar>
      <div className="section">
        {Object.values(CLR).slice(1).map(choice =>
          <ColorDot key={choice} choice={choice} color={color} setColor={setColor} />)}
      </div>
      <div className="divider" />
      <div className="section">
        {Object.keys(SZ).map(choice =>
          <SizeDot key={choice} choice={choice} size={size} setSize={setSize} />)}
      </div>
    </Toolbar>
    <Wall>
      <div className="inner">
        <canvas id="graffiti"
          onPointerDown={handle.down}
          onPointerUp={handle.up}
          onPointerMove={handle.move}/>
      </div>
    </Wall>
    
  </Graffiti>)
}