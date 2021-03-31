import React, { useState, useEffect, Fragment } from 'react';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import api from '../../lib/api';
import { useE, useEventListener, useF, useInterval } from '../../lib/hooks';
import { dist, end } from './util';
import { isValidWord } from './dict';
import { IPos, Pos, Player, ITile, Tile, Board } from './board';
import { Info, Save } from './save';
import { fetchInfo, fetchGame, localInfo, updateGame, rematchGame } from './data';
import { auth, openLogin } from '../../lib/auth';
import { useNotifyFilter } from '../../lib/notify';
import { GameProgress } from './progress';
import { theme, globals } from './common';
import { Chat } from '../../components/Chat'

let tilePx = 50;
const playerClass = ['p1', 'p2'];
let startTile: ITile;
let lastTouch: IPos;
const TileElem = ({tile, word, handle}) => {
  const [selected, setSelected] = useState(false);
  const [active, setActive] = useState(false);
  const [flip, setFlip] = useState(false);
  const [swapped, setSwapped] = useState(false);

  useEffect(() => {
    setSelected(Tile.has(word, tile));
    setActive(Tile.eq(end(word), tile));
  }, [word]);
  useEffect(() => {
    setSwapped(false);
    setFlip(false);
    if (tile.swap) {
      setTimeout(() => {
        tile.swap.new = false;
        setFlip(true);
        setTimeout(() => {
          setSwapped(true);
        }, globals.flipMs/2);
      }, tile.swap.ms);
    }
  }, [tile.swap]);

  const touchFunc = (e, func: (_: Pos) => any) => {
    e.preventDefault();
    let touch = e.touches[0];
    let refRect = (touch.target as Element).getBoundingClientRect();
    let row = tile.row + (touch.clientY - refRect.y)/refRect.height;
    let col = tile.col + (touch.clientX - refRect.x)/refRect.width;
    if (dist(.5, .5, row % 1, col % 1) <= .45) {
      let pos = { row: Math.floor(row), col: Math.floor(col) };
      Pos.eq(lastTouch, pos) || func(pos);
      lastTouch = pos;
    }
  }

  const visual = (tile.swap && (tile.swap.new ? true : !swapped)) ? tile.swap.from : tile;
  // const visual = tile.swap ? tile.swap.from : tile;
  return (<div
    onPointerDown={() => {
      startTile = tile;
      handle.select(tile)
    }}
    onPointerUp={() => {
      if (!Tile.eq(startTile, tile)) {
        handle.unselect();
      }
    }}
    onTouchEnd={() => handle.unselect()}
    className={[
      'tile',
      playerClass[visual.owner] || '',
      visual.isBomb ? 'bomb' : '',
      selected ? 'selected' : '',
      active ? 'active' : '',
      flip ? 'flip' : '',
      ].join(' ')}>

    {tile.letter}

    <div
      className='hover-target'
      onPointerOver={() => handle.hover(tile)}
      onTouchMove={e => touchFunc(e, handle.hover)}
      onScroll={e => e.preventDefault()}></div>
  </div>)
}


const Row = ({row, word, handle}) => {
  return (<div className='board-row' style={{height: `${tilePx}px`}}>
    {(row as ITile[]).map((tile, i) => <TileElem key={i} tile={tile} word={word} handle={handle}/>)}
  </div>)
}

Object.assign(window, { wordbaseSettings: globals });
export const WordbaseGame = ({open, info, save, reload, setInfo, setSave}) => {
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(false);
  const [word, setWord]: [ITile[], any] = useState([]);
  const [error, setError] = useState('')
  const history = useHistory();
  const [overlay, setOverlay] = useState(false);

  const isLocal = info.id === localInfo.id;
  const canPlay = info.status === Player.none &&
    (isLocal || !info.p1 || auth.user === (save.p1 ? info.p1 : info.p2));

  const handle = {
    check: () => {
      fetchInfo(info.id).then(data => {
        if (info.turn < data.info.turn || info.status !== data.info.status) {
          // console.log('fetch board', data);
          handle.fetch()
        }
      });
    },
    fetch: () => {
      fetchGame(info.id).then(data => {
        setLoaded(true);
        if (info.turn < data.info.turn || info.status !== data.info.status) {
          setInfo(data.info);
          setSave(data.save);
        }
      });
    },
    send: (info: Info, save: Save) => {
      updateGame(info, save);
      setInfo(info);
      setSave(save);
    },
    select: (pos: Pos) => {
      if (!canPlay) return;
      let tile: ITile = save.board.get(pos);
      let wordIndex = word.indexOf(word.find(t => Tile.eq(t, tile)));
      if (selected) {
        handle.unselect();
      } else if (wordIndex > -1) {
        setWord(word.slice(0, wordIndex + 1));
        setSelected(true);
      } else if (tile.owner === save.player) {
        setWord([tile]);
        setSelected(true);
      }
    },
    unselect: () => {
      setSelected(false);
      if (word.length === 1) setWord([]);
    },
    hover: (pos: Pos) => {
      let canHover = save.board.get(pos) && selected && word.length > 0;
      if (!canPlay || !canHover) return;

      if (Tile.eq(end(word, 2), pos)) {
        setWord(word.slice(0, word.length - 1));
      } else {
        let curr = word.slice(-1)[0];
        if (Tile.isAdj(curr, pos)) {
          let tile = save.board.get(pos);
          if (!Tile.has(word, tile)) {
            setWord(word.concat(tile));
          }
        }
      }
    },
    clear: () => {
      setWord([]);
      setSelected(false);
    },
    submit: () => {
      let letters = word.map(tile => tile.letter).join('');
      if (!letters) return;
      if (!isValidWord(letters) && globals.wordCheck) {
        console.log(`${letters} not in dict`);
        setError('not a word');
        return;
      }

      let alreadyPlayed = save.history.some(played =>
        played.length === word.length && played.every((t, i) =>
          Tile.eq(t, word[i])));
      if (alreadyPlayed) {
        console.log(`${letters} already played`);
        setError('already played')
        return;
      }

      let newSave = save.play(word);
      let newInfo = Info.play(info, newSave);
      handle.clear();
      handle.send(newInfo, newSave);
    },
    rematch: () => {
      rematchGame(info).then(({info}) => {
        open(info.id)
      });
    },
    keypress: (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': handle.clear(); break;
        case 'Enter': handle.submit(); break;
      }
    },
    resize: () => {
      let board: HTMLElement = document.querySelector('.board');
      let containerRect = board.parentElement.getBoundingClientRect();

      let ratio = Board.ROWS / Board.COLS;
      let width = Math.min(containerRect.width, containerRect.height / ratio);
      board.style.width = width + 'px';
      board.style.height = width * ratio + 'px';
      tilePx = width / Board.COLS;
      setLoaded(true)
    },
  }
  useEventListener(window, 'keydown', handle.keypress, false);
  useEventListener(window, 'resize', handle.resize, false);

  useF(handle.resize)
  useF(info.id, reload, handle.fetch)
  // useInterval(handle.check, 3000)
  useF(word, () => setError(''))

  return (
    <Style className='wordbase-game'>
      <GameProgress info={info} />

      <div className='ui'>
        <div className='preview-container'>
          {word.length ?
          <div className='preview'>{word.map(t => t.letter).join('')}</div>
          :
          <div className={`last ${save.p1 ? 'p2' : 'p1'}`} onClick={() => {
            save.board.do(tile => {
              if (tile.swap) {
                tile.swap = Object.assign({}, tile.swap)
              }
            })
            setSave(save.clone())
          }}>
            {save.history.length ? save.history[0].map(t => t.letter).join('') : ''}
          </div>}
        </div>
        <div className={'control-container'
          + (word.length ? '' : ' spaced')}>
          {info.turn < 0 ? '' : word.length ?
            error ?
            <div className='control button'>{error}</div>
            :
            <Fragment>
              <div className='control button' onClick={handle.clear}>
                cancel</div>
              <div className='control button' onClick={handle.submit}>
                submit</div>
            </Fragment>
          :
          <Fragment>
            <div className='control button'onClick={() => open(false)}>
              menu</div>
            {info.status === Player.none ?'':
            <div className='control button' onClick={handle.rematch}>
            {info.rematch ? 'rematched' : 'rematch'}</div>}
            <div className='control button'
              onClick={() => setOverlay(!overlay)}>
              {overlay?'close':info.turn < 2?'how to':'history'}</div>
          </Fragment>}
        </div>
      </div>

      <div className='board-container'>
        <div className={`overlay ${overlay ? 'on' : 'off'}`}>
          {info.turn < 2 ?
          <div className='info'>
            <p>How to play</p>
            <ul>
            <li>Play a chain of words from your base to the other end!</li>
            <li>{` •  select & drag from a tile you own to start spelling`
            + `\n •  cut off your opponent's tiles to clear them`
            + `\n •  bomb tiles (black) flip adjacent tiles too`}</li>
            <div className='img-container'>
              {/* <img src="/raw/wordbase/example.png" /> */}
              <img src="/raw/wordbase/ex1.png" />
              <img src="/raw/wordbase/ex2.png" />
              <img src="/raw/wordbase/ex3.png" />
            </div>
            </ul>

            <p>Turn order</p>
            <ul>
            <li>Check the progress bar at the top for current turn</li>
            <li>Blue (right) goes first, orange (left) goes second</li>
            <li>{` •  new invite link – challenger goes second`
            + `\n •  challenge friend – challenger goes first`
            + `\n •  rematch – winner goes second`}</li>
            </ul>

            <p>Notifications</p>
            <ul>
            <li>Manage:
              <span style={{
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  marginLeft: '.5rem'}}
                onClick={() => history.push('/notify')}>
                  /notify</span>
            </li>
            <li>Sent in one email thread, and only if app is closed</li>
            </ul>
          </div>
          :
          <div className='history'>
            <div className='word-count'>{`${info.turn} words played`}</div>
            {info.chat ?
            <Chat hash={info.chat} flipped={info.p2 === auth.user}/>
            :
            save.history.slice(1).map((item, i) =>
              <div key={i} className={`last ${(info.turn - i)%2 ? 'p2' : 'p1'}`}>
                {item.map(t => t.letter).join('')}
              </div>
            )}
            {/* <div className='hello'>
              hi {auth.user || ', you'}  :-)</div> */}
          </div>}
        </div>
        {!loaded || auth.user || (isLocal && save.board) ? ''
        : <div className='board-block' onClick={openLogin}><span>log in to play</span></div>}

        <div className={[
          'board',
          save.p1 ? 'p1' : 'p2',
          loaded ? '' : 'loading'].join(' ')}>

          {!loaded ? '' : save.board.rows((row, i) =>
          <Row key={i} row={row} word={word} handle={handle}/>)}
        </div>
      </div>
    </Style>
  );
}

const Style = styled.div`
  background: ${theme.background};
  height: 100%; width: 100%;
  margin: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 1.2rem;
  * {
    font-family: 'Ubuntu', sans-serif;
  }

  .button { cursor: pointer; user-select: none; }
  .game-progress {
    height: 2rem;
  }
  .ui {
    // height: 5.2rem;
    // background: white;
    margin: .5rem 0;
  }
  .preview-container, .control-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    user-select: none;

    &.preview-container {
      justify-content: center;
      margin: 0 .5rem .25rem .5rem;
      height: 2.25rem;
    }
    &.control-container {
      justify-content: center;
      height: 1.8rem;
      &.spaced {
        .button:first-child {
          position: absolute;
          left: 0;
        }
        .button:last-child {
          position: absolute;
          right: 0;
         }
       }
    }
    .control {
      background: black;
      color: white;
      font-size: 1.2rem;
      margin: 0 .5rem;
      &.left {
        margin-right: auto;
      }
    }
  }
  .preview, .last, .control {
    padding: 0 .3rem;
    border-radius: .3rem;
    text-transform: uppercase;
  }
  .preview, .last {
    background: white;
    color: black !important;;
    font-size: 2rem;
    line-height: 2.2rem;
  }
  .last {
    cursor: pointer;
    width: fit-content;
    &.p1 { background: ${theme.blue} !important; margin-left: auto; }
    &.p2 { background: ${theme.orange} !important; margin-right: auto; }
  }
  .board-container {
    height: 0;
    flex-grow: 1;
    width: 100%;
    display: flex;
    // align-items: flex-end;
    background: #ffffff88;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    // background: #ffffffbb;

    position: relative;
    .overlay {
      position: absolute;
      width: 100%; height: 100%;
      left: 0; top: 0;
      z-index: 999;
      background: #fffffff8;
      color: black;
      user-select: none;
      padding: 0;
      overflow: scroll;
      > div {
        width: 100%;
        min-height: 100%;
        padding: .5rem;
      }
      .info {
        white-space: pre;
        background: #ffffff;
        p {
          margin-bottom: .5rem;
          text-decoration: underline;
          font-size: 1.2rem;
        }
        ul {
          list-style-type: none;
          padding: 0;
          li {
            font-size: 1rem;
            margin-bottom: .3rem;
            opacity: .7;
          }
        }
        .img-container {
          height: 7rem;
          display: flex;
          align-items: stretch;
          justify-content: center;
        }
        img {
          height: 100%;
          object-fit: scale-down;
          margin: 0 .5rem;
        }
      }

      .word-count {
        // width: fit-content;
        margin: auto;
        text-align: center;
        margin-bottom: .5rem;
        padding: 0 .3rem;
        border-radius: .3rem;
        background: black;
        color: white;
      }
      // .last:last-child { margin-bottom: .5rem; }

      .hello {
        white-space: pre;
        margin-top: 100rem;
        width: 100%; text-align: center;
        padding: 0 .3rem; border-radius: .3rem;
        background: #efefef;
        color: #00000088;
      }

      transition: .5s;
      &.off { height: 0%; }
    }
    .board-block {
      position: absolute;
      width: 100%; height: 100%;
      left: 0; top: 0;
      z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      span {
        background: black;
        color: white;
        font-size: 2rem;
        padding: .3rem 1rem;
        text-transform: uppercase;
        border-radius: .3rem;
        cursor: pointer;
      }
    }
  }
  .board {
    // background: #5a5a5a;
    // background: white;
    background: black;
    display: flex;
    flex-direction: column;
    touch-action: none;
    touch-action: pinch-zoom;
    &.loading {
      display: none;
      .tile::after { animation: none !important; }
    }

    &.p1 .tile, &.p2 .tile { &.selected, &.active { background: white; } }
    &.p2 .tile {
      &.selected { &::after { background: ${theme.orange}88; } }
      &.active { &::after { background: ${theme.orange}bb; } }
    }
    &.p1 .tile {
      &.selected { &::after { background: ${theme.blue}88; } }
      &.active { &::after { background: ${theme.blue}bb; } }
    }
  }
  .board-row {
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    touch-action: none;
    touch-action: pinch-zoom;
    &:first-child, &:last-child {
      position: relative;
      &::after {
        content: ""; width: 100%; height: 100%;
        position: absolute;
        z-index: 100;
        pointer-events: none;
        background: repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 8px,
          #ffffff22 8px,
          #ffffff22 16px
        );
      }
    }
  }
  .tile {
    flex-grow: 1;
    width: 1rem;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: white;
    color: black;
    cursor: pointer;
    text-transform: uppercase;
    padding: 0;
    margin: 0;
    font-weight: bolder;
    font-size: 1.4rem;
    user-select: none;
    touch-action: none;
    touch-action: pinch-zoom;
    background: transparent;
    z-index: 100;
    overflow: visible;
    &.bomb {
      color: white;
      background: white;
    }

    position: relative;
    &::after {
      content: ""; position: absolute; width: 100%; height: 100%;
      z-index: -100;
      background: white;
    }
    &.bomb::after { background: black; }
    // &.bomb.flip::after { background: white; }
    &.p1::after { background: ${theme.blue}; }
    &.p2::after { background: ${theme.orange}; }
    &.flip::after {
      z-index: -99;
      transform-style: flat;
      animation: flip ${globals.flipMs}ms;
      transform: translateZ(-100px);
      @keyframes flip {
        0% { transform: translateZ(-100px) rotateY(-180deg); }
        100% { }
      }
    }

    & .hover-target {
      position: absolute;
      height: 100%;
      width: 100%;
      border-radius: 50%;
    }
  }
`