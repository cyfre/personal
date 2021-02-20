import React, { useState, useEffect, Fragment } from 'react';
import api from '../../lib/api';
import styled from 'styled-components';
import { useEventListener, useInterval } from '../../lib/hooks';
import { dist, end } from './util';
import { isValidWord } from './dict';
import { IPos, Pos, Player, ITile, Tile, Board } from './board';
import { Info, Save } from './save';
import { fetchGame, localInfo, updateGame, rematchGame } from './data';
import { auth, openLogin } from '../../lib/auth';
import { GameProgress } from './progress';

export const globals = {
    wordCheck: false,
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
            onTouchMove={e => touchFunc(e, handle.hover)}></div>
    </div>)
}


const Row = ({row, word, handle}) => {
    return (<div className='board-row' style={{height: `${tilePx}px`}}>
        {(row as ITile[]).map((tile, i) => <TileElem key={i} tile={tile} word={word} handle={handle}/>)}
    </div>)
}

Object.assign(window, { wordbaseSettings: globals });
export const Wordbase = ({setOpenGame, gameId}) => {
    const [info, setInfo]: [Info, any] = useState(Info.local());
    const [save, setSave]: [Save, any] = useState(Save.empty());
    const [loaded, setLoaded] = useState(false);
    const [selected, setSelected] = useState(false);
    const [word, setWord]: [ITile[], any] = useState([]);

    const isLocal = gameId === localInfo.id;
    const canPlay = info.status === Player.none &&
        (isLocal || !info.p1 || auth.user === (save.p1 ? info.p1 : info.p2));

    useEffect(() => { handle.resize(); }, []);
    useEffect(() => { handle.fetch(); }, [gameId]);
    useInterval(() => {
        console.log(canPlay);
        // canPlay || handle.fetch();
        handle.fetch();
    }, 3000);
    useEffect(() => {
        Object.assign(window, { save });
    }, [save]);

    const handle = {
        fetch: () => {
            fetchGame(gameId).then(data => {
                console.log(data.info.turn);
                if (save.turn < data.save.turn || info.status !== data.info.status) {
                    console.log(data);
                    setInfo(data.info);
                    setSave(data.save);
                    setLoaded(true);
                }
            });
        },
        send: (info: Info, save: Save) => {
            console.log('send', info, save);
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
            if (!canPlay) return;
            if (save.board.get(pos) && selected && word.length > 0) {
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
            }
        },
        clear: () => {
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

            let newSave = save.play(word);
            let newInfo = Info.play(info, newSave);
            console.log('submit', newInfo, newInfo.turn, newInfo.lastWord,
                newSave.history[0].map(t => t.letter).join(''),
                newSave);
            handle.clear();
            handle.send(newInfo, newSave);
        },
        rematch: () => {
            rematchGame(info, (newInfo, newSave) => {
                setOpenGame(newInfo.id)
                setInfo(newInfo);
                setSave(newSave);
            });
        },
        keypress: (e: React.KeyboardEvent) => {
            switch (e.key) {
                case 'Esc': handle.clear(); break;
                case 'Enter': handle.submit(); break;
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
    }
    useEventListener(window, 'keydown', handle.keypress, false);
    useEventListener(window, 'resize', handle.resize, false);

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
                        <div className='control button' onClick={handle.clear}>cancel</div>
                        <div className='control button' onClick={handle.submit}>submit</div>
                    </Fragment>
                    : info.status === Player.none
                    ? <div className='control button left' onClick={() => setOpenGame(false)}>menu</div>
                    : <Fragment>
                        <div className='control button' onClick={() => setOpenGame(false)}>menu</div>
                        <div className='control button' onClick={handle.rematch}>rematch</div>
                    </Fragment>}
                </div>
            </div>

            <div className='board-container'>
                {auth.user || (isLocal && save.board) ? ''
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