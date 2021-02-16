import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import styled from 'styled-components';
import { useInput, useEventListener, useAnimate } from '../../lib/hooks';
import { dist, end } from './util';
import { isValidWord } from './dict';
import { Player, Tile, Board } from './board';

const orange = '#ffa500';
const blue = '#4bdbff';
const Wordbase = styled.div`
    background: var(--dark);
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .button {
        cursor: pointer;
    }
    .game-progress {
        width: 100%;
        height: 1rem;
    }
    .preview-container, .cancel-submit-container {
        height: 1rem;
        display: flex;
        flex-direction: row;
        align-items: center;
        &.preview-container {
            justify-content: center;
            margin: .5rem 0;
        }
        &.cancel-submit-container {
            justify-content: space-between;
            margin: .5rem 25%;
        }

        .preview, .cancel, .submit {
            background: gray;
            padding: 0 .3rem;
            border-radius: .3rem;
        }
    }
    .board-container {
        flex-grow: 1;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .board {
        background: white;
        // height: 100%;
        // width: 100%;
        display: flex;
        flex-direction: column;

        &.p0 .tile, &.p1 .tile {
            &.selected::after { opacity: .5; }
            &.active::after { opacity: .75; }
        }
        &.p1 .tile {
            &.selected, &.active { &::after { background: ${orange}; } }
        }
        &.p0 .tile {
            &.selected, &.active { &::after { background: ${blue}; } }
        }
    }
    .board-row {
        flex-grow: 1;
        display: flex;
        flex-direction: row;
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
        font-family: sans-serif;
        font-weight: bolder;
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

export default () => {
    const [board, setBoard]: [Board, any] = useState(Board.new());
    const [turn, setTurn] = useState(0);
    const [selected, setSelected] = useState(false);
    const [word, setWord]: [Tile[], any] = useState([]);
    const [progress, setProgress] = useState([10, 90]);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        Object.assign(window, { board });
    }, [board]);

    const handle = {
        board: () => setBoard(board.clone()),
        select: (row, col) => {
            let player = turn % 2;
            let tile: Tile = board.get(row, col);
            if (selected) {
                if (word.length > 1 && Tile.eq(end(word), tile)) {
                    // don't cancel the word
                } else {
                    setWord([]);
                }
                setSelected(false);
            } else {
                if (tile.owner === player) {
                    setWord([tile]);
                    setSelected(true);
                } else if (Tile.eq(end(word), tile)) {
                    setSelected(true);
                }
            }
            handle.board();
        },
        hover: (row, col) => {
            if (board.get(row, col) && selected && word.length > 0) {
                if (Tile.eq(end(word, 2), {row, col})) {
                    setWord(word.slice(0, word.length - 1));
                } else {
                    let curr = word.slice(-1)[0];
                    if (Tile.isAdj(curr, {row, col})) {
                        let tile = board.get(row, col);
                        if (!Tile.has(word, tile)) {
                            setWord(word.concat(tile));
                        }
                    }
                }
            }
            handle.board();
        },
        resize: () => {
            let wordbase: HTMLElement = document.querySelector('.wordbase');
            let board: HTMLElement = document.querySelector('.board');
            let style = window.getComputedStyle(board.parentNode as Element);
            let containerWidth = Number(style.width.slice(0, -2));
            let containerHeight = Number(style.height.slice(0, -2));

            let ratio = Board.ROWS / Board.COLS;
            let width = Math.min(containerWidth, containerHeight / ratio);
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
                let player: Player = turn % 2;
                let oppo: Player = 1 - player;
                let toFlip = word.slice();
                while (toFlip.length) {
                    let currFlip = toFlip;
                    toFlip = [];
                    currFlip.forEach(tile => {
                        tile.owner = player;
                        if (tile.isBomb) {
                            board.get(tile).isBomb = false;
                            toFlip.push(...board.square(tile));
                        }
                    })
                }
                let otherSafe = board.bfs(oppo);
                console.log('safe', otherSafe);
                board.do(tile => {
                    if (tile.owner === oppo && !Tile.has(otherSafe, tile)) {
                        tile.owner = Player.none;
                    }
                });
                setWord([]);
                setTurn(turn + 1);
                setHistory([letters, ...history]);
                handle.board();
            } else {
                console.log(`${letters} not in dict`);
            }
        },
        keypress: (e: React.KeyboardEvent) => {
            switch (e.key) {
                case 'Esc': handle.cancel(); break;
                case 'Enter': handle.submit(); break;
            }
        }
    }

    useEffect(() => {
        document.title = "Wordbase";
        handle.resize();
    }, []);
    useEffect(() => {
        console.log(history)
    }, [history]);
    useEventListener(window, 'resize', handle.resize, false);
    useEventListener(window, 'keydown', handle.keypress, false);

    useEffect(() => {
        let p0 = 12;
        board.do(tile => {
            if (tile.owner === 0) {
                p0 = Math.min(p0, tile.row);
            }
        });
        let p1 = 0;
        board.do(tile => {
            if (tile.owner === 1) {
                p1 = Math.max(p1, tile.row);
            }
        });
        let total = Math.max(12, p1 + (12 - p0));
        setProgress([p1/total, p0/total].map(x => Math.round(x * 100)));
    }, [board]);

    const progressGradient = `${orange} ${progress[0]}%, transparent ${progress[0]}% ${progress[1]}%, ${blue} ${progress[1]}%`
    return (
        <Wordbase className='wordbase'>
            <div className='game-progress' style={{
                background: `linear-gradient(90deg, ${progressGradient})`
            }}></div>

            <div className='preview-container'>
                <div className='preview'>{word.map(t => t.letter).join('')}</div>
            </div>
            <div className='cancel-submit-container'>
                <div className='cancel button'>
                    <div onClick={handle.cancel}>{'cancel'}</div>
                </div>
                <div className='submit button'>
                    <div onClick={handle.submit}>{'submit'}</div>
                </div>
            </div>

            <div className='board-container'>
                <div className={'board ' + ((turn%2) ? 'p1' : 'p0')}>
                    {board.rows((row, i) =>
                    <Row key={i} row={row} word={word} handle={handle}/>)}
                </div>
            </div>
        </Wordbase>
    );
}