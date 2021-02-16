import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import styled from 'styled-components';
import { useInput, useEventListener, useAnimate } from '../../lib/hooks';
import { dist, end } from './util';
import { isValidWord } from './dict';
import { Player, Tile, Board } from './board';
import { Info, Save } from './save';
import { fetchInfo, fetchSave } from './data';

const orange = '#ff9900';
const blue = '#4bdbff';
const WordbaseDiv = styled.div`
    background: #fbfbfb88;
    height: 100%;
    width: 100%;
    margin: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .button { cursor: pointer; user-select: none; }
    .game-progress {
        width: 100%;
        height: 1.2rem;

        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0 .3rem;
        font-family: 'Ubuntu', sans-serif;
        position: relative;
        .game-status {
            flex-grow: 1;
            text-align: center;
            position: absolute;
            width: 100%;
            left: 0;
        }
    }
    .ui {
        height: 5rem;
    }
    .preview-container, .control-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        &.preview-container {
            justify-content: center;
            margin: .4rem 0 .3rem 0;
            height: 2.15rem;
        }
        &.control-container {
            justify-content: center;
            margin: 0 25%;
        }

        .preview, .control {
            padding: 0 .3rem;
            border-radius: .3rem;
            font-family: 'Ubuntu', sans-serif;
            text-transform: uppercase;
        }
        .preview {
            background: white;
            color: black;
            font-size: 2rem;
            line-height: 2.2rem;
        }
        .control {
            background: black;
            color: white;
            font-size: 1.2rem;
            margin: 0 .5rem;
        }
    }
    .board-container {
        height: 0;
        flex-grow: 1;
        width: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: center;
    }
    .board {
        background: #5a5a5a;
        display: flex;
        flex-direction: column;

        & .tile { &.selected, &.active { background: white; } }
        &.p1 .tile {
            &.selected { &::after { background: ${orange}88; } }
            &.active { &::after { background: ${orange}bb; } }
        }
        &.p0 .tile {
            &.selected { &::after { background: ${blue}88; } }
            &.active { &::after { background: ${blue}bb; } }
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
        font-size: 1.2rem;
        user-select: none;
        background: transparent;
        z-index: 2;
        &.bomb {
            color: white;
        }
        &::after {
            content: ""; position: absolute; width: 100%; height: 100%; z-index: -1;
            transform-style: preserve-3d;
            transform: rotateY(0deg);
            background: white;
            // backface-visibility: hidden;
        }
        &.p1::after {
            animation: p1-flip 1s;
            @keyframes p1-flip {
                0% { transform: rotateY(180deg); }
                100% { transform: rotateY(0deg); }
            }
            background: ${blue};
        }
        &.p2::after {
            animation: p2-flip 1s;
            @keyframes p2-flip {
                0% { transform: rotateY(-180deg); }
                100% { transform: rotateY(0deg); }
            }
            background: ${orange};
        }
        &.bomb::after {
            background: black;
        }

        position: relative;
        & .hover-target {
            position: absolute;
            height: 100%;
            width: 100%;
            border-radius: 50%;
        }
    }
`

let tilePx = 50;
const playerClass = ['p1', 'p2'];
const TileElem = ({tile, word, handle}) => {
    const [selected, setSelected] = useState(false);
    const [active, setActive] = useState(false);

    useEffect(() => {
        setSelected(Tile.has(word, tile));
        setActive(Tile.eq(end(word), tile));
    }, [word]);

    return (<div
        onPointerDown={() => handle.select(tile.row, tile.col)}
        className={[
            'tile',
            playerClass[tile.owner] || '',
            tile.isBomb ? 'bomb' : '',
            selected ? 'selected' : '',
            active ? 'active' : '',
            ].join(' ')}>

        {tile.letter}

        <div
            className='hover-target'
            onPointerOver={() => handle.hover(tile.row, tile.col)}
            onTouchMove={(e) => {
                let touch = e.touches[0];
                let refRect = (touch.target as Element).getBoundingClientRect();
                let row = tile.row + (touch.clientY - refRect.y)/refRect.height;
                let col = tile.col + (touch.clientX - refRect.x)/refRect.width;
                if (dist(.5, .5, row % 1, col % 1) <= .5) {
                    handle.hover(Math.floor(row), Math.floor(col));
                }
            }}></div>
    </div>)
}


const Row = ({row, word, handle}) => {
    return (<div className='board-row' style={{height: `${tilePx}px`}}>
        {(row as Tile[]).map((tile, i) => <TileElem key={i} tile={tile} word={word} handle={handle}/>)}
    </div>)
}

export const Wordbase = ({toggleMenu, gameInfo}) => {
    const [info, setInfo]: [Info, any] = useState(gameInfo);
    const [save, setSave]: [Save, any] = useState(Save.new());
    const [selected, setSelected] = useState(false);
    const [word, setWord]: [Tile[], any] = useState([]);

    useEffect(() => {
        handle.resize();
        fetchSave(gameInfo.id).then(setSave);
    }, []);
    useEffect(() => {
        Object.assign(window, { save });
    }, [save]);

    const handle = {
        update: () => {
            setSave(save.clone());
        },
        select: (row, col) => {
            if (info.status !== Player.none) return;
            console.log(row, col);
            let player = save.turn % 2;
            let tile: Tile = save.board.get(row, col);
            if (selected) {
                console.log('in selected');
                if (word.length > 1 && Tile.eq(end(word), tile)) {
                    // don't cancel the word
                    console.log('dont cancel');
                } else {
                    setWord([]);
                }
                setSelected(false);
            } else {
                if (tile.owner === player) {
                    console.log('in player');
                    setWord([tile]);
                    setSelected(true);
                } else if (Tile.eq(end(word), tile)) {
                    console.log('in other');
                    setSelected(true);
                }
            }
            handle.update();
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
        },
        cancel: () => {
            setWord([]);
            setSelected(false);
        },
        submit: () => {
            let letters = word.map(tile => tile.letter).join('');
            if (isValidWord(letters)) {
                setWord([]);
                setSelected(false);
                setSave(save.play(word));
            } else {
                console.log(`${letters} not in dict`);
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

    useEffect(() => {
        console.log(save.history)
    }, [save]);
    useEventListener(window, 'resize', handle.resize, false);
    useEventListener(window, 'keydown', handle.keypress, false);

    useEffect(() => {
        setInfo(info.updateProgress(save.board));
    }, [save]);

    const progressGradient = `${orange} ${info.progress[0]}%, #2d2d2d ${info.progress[0]}% ${info.progress[1]}%, ${blue} ${info.progress[1]}%`
    return (
        <WordbaseDiv className='wordbase'>
            <div className='game-progress' style={{
                background: `linear-gradient(90deg, ${progressGradient})`
            }}>
                <div className='player-name p2'>orange</div>
                <div className='game-status'>{(() => {
                    switch (info.status) {
                        case Player.none: return '';
                        case Player.p1: return 'blue wins!';
                        case Player.p2: return 'orange wins!';
                    }
                })()}</div>
                <div className='player-name p1'>blue</div>
            </div>

            <div className='ui'>
                <div className='preview-container'>
                    <div className='preview'>{word.map(t => t.letter).join('')}</div>
                </div>
                {!word.length ? '' :
                <div className='control-container'>
                    <div className='control button'>
                        <div onClick={handle.cancel}>{'cancel'}</div>
                    </div>
                    <div className='control button'>
                        <div onClick={handle.submit}>{'submit'}</div>
                    </div>
                </div>}
                {info.status === Player.none ? '' :
                <div className='control-container'>
                    <div className='control button'>
                        <div onClick={handle.newGame}>{'new game'}</div>
                    </div>
                </div>}
            </div>

            <div className='board-container'>
                <div className={'board ' + ((save.turn%2) ? 'p1' : 'p0')}>
                    {save.board.rows((row, i) =>
                    <Row key={i} row={row} word={word} handle={handle}/>)}
                </div>
            </div>
        </WordbaseDiv>
    );
}