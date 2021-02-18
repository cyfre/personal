import React, { useState, useEffect, Fragment } from 'react';
import api from '../../lib/api';
import styled from 'styled-components';
import { useEventListener, useInterval } from '../../lib/hooks';
import { dist, end } from './util';
import { isValidWord } from './dict';
import { IPos, Pos, Player, ITile, Tile, Board } from './board';
import { Info, Save, Flip } from './save';
import { fetchGame, localInfo, updateGame } from './data';
import { auth, openLogin } from '../../lib/auth';
import { GameProgress } from './progress';

const globals = {
    wordCheck: true,
    flipMs: 700,
};

export const theme = {
    orange: '#ff9900',
    blue: '#4bdbff',
    background: '#fbfbfb88',
}

let tilePx = 50;
const playerClass = ['p1', 'p2'];
let startTile: ITile;
let lastTouch: IPos;
const TileElem = ({tile, word, handle}) => {
    const [selected, setSelected] = useState(false);
    const [active, setActive] = useState(false);

    useEffect(() => {
        setSelected(Tile.has(word, tile));
        setActive(Tile.eq(end(word), tile));
    }, [word]);

    const touchFunc = (e, func) => {
        let touch = e.touches[0];
        let refRect = (touch.target as Element).getBoundingClientRect();
        let row = tile.row + (touch.clientY - refRect.y)/refRect.height;
        let col = tile.col + (touch.clientX - refRect.x)/refRect.width;
        if (dist(.5, .5, row % 1, col % 1) <= .45) {
            let pos = { row: Math.floor(row), col: Math.floor(col) };
            Pos.eq(lastTouch, pos) || func(pos.row, pos.col);
            lastTouch = pos;
        }
    }

    return (<div
        onPointerDown={() => {
            startTile = tile;
            console.log(tile);
            handle.select(tile.row, tile.col)
        }}
        onPointerUp={() => {
            console.log('up', tile);
            if (!Tile.eq(startTile, tile)) {
                handle.unselect();
            }
        }}
        onTouchEnd={() => handle.unselect()}
        className={[
            'tile',
            playerClass[tile.owner] || '',
            tile.isBomb ? 'bomb' : '',
            selected ? 'selected' : '',
            active ? 'active' : '',
            tile.flipped ? 'flip' : '',
            ].join(' ')}>

        {tile.letter}

        <div
            className='hover-target'
            onPointerOver={() => handle.hover(tile.row, tile.col)}
            onTouchMove={e => touchFunc(e, handle.hover)}></div>
    </div>)
}


const Row = ({row, word, handle}) => {
    return (<div className='board-row' style={{height: `${tilePx}px`}}>
        {(row as ITile[]).map((tile, i) => <TileElem key={i} tile={tile} word={word} handle={handle}/>)}
    </div>)
}

Object.assign(window, { wordbaseSettings: globals });
export const Wordbase = ({setMenu, gameId}) => {
    const [info, setInfo]: [Info, any] = useState(Info.local());
    const [save, setSave]: [Save, any] = useState(Save.empty());
    const [loaded, setLoaded] = useState(false);
    const [selected, setSelected] = useState(false);
    const [word, setWord]: [ITile[], any] = useState([]);
    const [flip, setFlip]: [Flip, any] = useState(undefined);

    useEffect(() => {
        handle.resize();
    }, []);
    useEffect(() => {
        handle.fetch();
    }, [gameId]);
    useInterval(() => {
        console.log(gameId);
        handle.fetch();
    }, 5000);
    useEffect(() => {
        Object.assign(window, { save });
        // console.log(save.history[0]);
    }, [save]);
    useEffect(() => {
        if (flip) {
            let anim = () => {
                if (flip.hasNext()) {
                    setSave(flip.next(globals.flipMs/3, () => anim()));
                } else {
                    setSave(flip.curr());
                    setFlip(undefined);
                    handle.fetch();
                }
            }
            anim();
        }
    }, [flip]);

    const handle = {
        fetch: () => {
            fetchGame(gameId).then(data => {
                console.log(data);
                if (save.turn < data.save.turn) {
                    setInfo(data.info);
                    setSave(data.save);
                    setLoaded(true);
                } else if (save.turn > data.save.turn) {
                    updateGame(info, save);
                }
            });
        },
        update: () => {
            setSave(save.clone());
        },
        select: (row, col) => {
            if (info.status !== Player.none) return;
            if (info.id !== localInfo.id && info.p1 &&
                auth.user !== (save.p1 ? info.p1 : info.p2)) return;
            // console.log(row, col);
            let tile: ITile = save.board.get(row, col);
            if (selected) {
                // console.log('in selected');
                if (word.length > 1 && Tile.eq(end(word), tile)) {
                    // don't cancel the word
                    // console.log('dont cancel');
                } else {
                    setWord([]);
                }
                setSelected(false);
            } else {
                if (tile.owner === save.player) {
                    // console.log('in player');
                    setWord([tile]);
                    setSelected(true);
                } else if (Tile.has(word, tile)) {
                    let index = word.indexOf(word.find(t => Tile.eq(t, tile)));
                    setWord(word.slice(0, index+1));
                    setSelected(true);
                }
            }
            handle.update();
        },
        unselect: () => {
            setSelected(false);
        },
        hover: (row, col) => {
            if (info.status !== Player.none) return;
            if (save.board.get(row, col) && selected && word.length > 0) {
                if (Tile.eq(end(word, 2), {row, col})) {
                    setWord(word.slice(0, word.length - 1));
                } else {
                    let curr = word.slice(-1)[0];
                    if (Tile.isAdj(curr, {row, col})) {
                        let tile = save.board.get(row, col);
                        if (!Tile.has(word, tile)) {
                            setWord(word.concat(tile));
                        }
                    }
                }
                handle.update();
            }
        },
        resize: () => {
            let wordbase: HTMLElement = document.querySelector('.wordbase');
            wordbase.style.width = '100%';
            let board: HTMLElement = document.querySelector('.board');
            let containerRect = board.parentElement.getBoundingClientRect();
            console.log(containerRect);

            let ratio = Board.ROWS / Board.COLS;
            let width = Math.min(containerRect.width, containerRect.height / ratio);
            wordbase.style.width = width + 'px';
            board.style.width = width + 'px';
            board.style.height = width * ratio + 'px';
            tilePx = width / Board.COLS;
            // setTimeout(() => setLoading(false), 100);
        },
        cancel: () => {
            setWord([]);
            setSelected(false);
        },
        submit: () => {
            let letters = word.map(tile => tile.letter).join('');
            if (!isValidWord(letters) && globals.wordCheck) {
                console.log(`${letters} not in dict`);
                return;
            }

            let alreadyPlayed = save.history.some(played =>
                played.length === word.length && played.every((t, i) =>
                    Tile.eq(t, word[i])));
            if (alreadyPlayed) {
                console.log(`${letters} already played`);
                return;
            }

            setWord([]);
            setSelected(false);
            if (globals.flipMs) {
                setFlip(new Flip(save, word));
            } else {
                setSave(save.play(word));
            }
        },
        keypress: (e: React.KeyboardEvent) => {
            switch (e.key) {
                case 'Esc': handle.cancel(); break;
                case 'Enter': handle.submit(); break;
            }
        },
        newGame: () => {
            setSave(Save.new());
            setSelected(false);
            setWord([]);
            info.progress = [0, 100];
        },
    }
    useEventListener(window, 'resize', handle.resize, false);
    useEventListener(window, 'keydown', handle.keypress, false);

    useEffect(() => {
        save && save.board && setInfo(Info.play(info, save));
    }, [save]);

    return (
        <Style className='wordbase'>
            <GameProgress info={info} />

            <div className='ui'>
                <div className='preview-container'>
                    {word.length
                    ? <div className='preview'>{word.map(t => t.letter).join('')}</div>
                    : <div className={`last ${save.p1 ? 'p2' : 'p1'}`}>
                        {save.history.length ? save.history[0].map(t => t.letter).join('') : ''}</div>
                    }
                </div>
                <div className='control-container'>
                    {word.length
                    ? <Fragment>
                        <div className='control button' onClick={handle.cancel}>cancel</div>
                        <div className='control button' onClick={handle.submit}>submit</div>
                    </Fragment>
                    : info.status === Player.none
                    ? <div className='control button left' onClick={() => setMenu(true)}>menu</div>
                    : <Fragment>
                        <div className='control button' onClick={() => setMenu(true)}>menu</div>
                        <div className='control button' onClick={handle.newGame}>new game</div>
                    </Fragment>}
                </div>
            </div>

            <div className='board-container'>
                {!auth.user && (info.id !== localInfo.id || !save.board)
                ? <div className='board-block' onClick={openLogin}><span>log in to play</span></div>
                : ''}

                <div className={[
                    'board',
                    flip ? '' : save.p1 ? 'p1' : 'p2',
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
    height: 100%;
    width: 100%;
    margin: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .button { cursor: pointer; user-select: none; }
    .game-progress {
        height: 1.2rem;
    }
    .ui {
        height: 5rem;
    }
    .preview-container, .control-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        user-select: none;
        &.preview-container {
            justify-content: center;
            margin: .4rem .4rem .3rem .4rem;
            height: 2.15rem;
        }
        &.control-container {
            justify-content: center;
            // margin: 0 25%;
        }

        .preview, .last, .control {
            padding: 0 .3rem;
            border-radius: .3rem;
            font-family: 'Ubuntu', sans-serif;
            text-transform: uppercase;
        }
        .preview, .last {
            background: white;
            color: black;
            font-size: 2rem;
            line-height: 2.2rem;
        }
        .last {
            &.p1 { background: ${theme.blue}; margin-left: auto; }
            &.p2 { background: ${theme.orange}; margin-right: auto; }
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
    .board-container {
        height: 0;
        flex-grow: 1;
        width: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: center;

        position: relative;
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
        &:first-child, &:last-child {
            position: relative;
            &::after {
                content: ""; width: 100%; height: 100%;
                position: absolute;
                z-index: 2;
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
        font-family: 'Ubuntu', sans-serif;
        font-weight: bolder;
        font-size: 1.4rem;
        user-select: none;
        background: transparent;
        z-index: 100;
        overflow: visible;
        &.bomb {
            color: white;
        }

        position: relative;
        &::after {
            content: ""; position: absolute; width: 100%; height: 100%;
            z-index: -100;
            background: white;
        }
        &.bomb::after { background: black; }
        &.p1::after { background: ${theme.blue}; }
        &.p2::after { background: ${theme.orange}; }
        &.flip {
            &::after {
                z-index: -99;
                transform-style: flat;
                animation: flip ${globals.flipMs}ms;
                transform: translateZ(-100px);
                @keyframes flip {
                    0% { transform: translateZ(-100px) rotateY(-180deg); }
                    100% { }
                }
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