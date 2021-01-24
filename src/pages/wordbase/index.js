import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import styled from 'styled-components';
import { useInput, useEventListener, useAnimate } from '../../lib/hooks';

const Wordbase = styled.div`
    background: var(--dark);
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    // align-items: flex-end;

    .board-container {
        width: 100%;
        height: 100%;
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
        &.p1 {
            background: #4bdbff;
        }
        &.p2 {
            background: orange;
        }
        &.bomb {
            background: black;
            color: white;
        }
        &.selected {
            background: #4bdbff88;
        }
        &.active {
            background: #4bdbffbb;
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

const hasTile = (arr, tile) => arr.some(t => posEq(t, tile));
const hasEnd = (arr, tile, i) => {
    i = i || 1;
    return arr.length >= i && posEq(arr.slice(-i)[0], tile);
}
const playerClass = ['p1', 'p2'];
const Tile = ({tile, word, handle}) => {
    const [selected, setSelected] = useState(false);
    const [active, setActive] = useState(false);

    useEffect(() => {
        setSelected(hasTile(word, tile));
        setActive(hasEnd(word, tile));
    }, [word]);

    return (<div
        onClick={() => handle.select(tile.row, tile.col)}
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
            onPointerOver={() => handle.hover(tile.row, tile.col)}></div>
    </div>)
}


const Row = ({row, word, handle}) => {
    return (<div className='board-row'>
        {row.map((tile, i) => <Tile key={i} tile={tile} word={word} handle={handle}/>)}
    </div>)
}

const initArr = (length, func) => {
    return Array.from({length}, (_, i) => func(i));
}
const alphaCounts = {
    e: 12,
    t: 9,
    a: 8,
    o: 7,
    i: 7,
    n: 6,
    s: 6,
    r: 6,
    h: 5,
    d: 4,
    l: 3,
    u: 2,
    c: 2,
    m: 2,
    f: 2,
    y: 2,
    w: 2,
    g: 2,
    p: 1,
    b: 1,
    v: 0,
    k: 0,
    x: 0,
    q: 0,
    j: 0,
    z: 0,
}
const alpha = Object.entries(alphaCounts).map(pair =>
    initArr(Math.floor(Math.sqrt(pair[1]))+1, () => pair[0]).join('')).join(''); //'qwertyuiopasdfghjklzxcvbnm';
const randi = (n) => {
    return Math.floor(Math.random() * n);
}

const base = [0, 12];
const isBase = row => base.includes(row);
const genBoard = () => initArr(13, row => initArr(10, col => {
    const inField = !isBase(row);
    return {
        row,
        col,
        letter: alpha[randi(alpha.length)],
        owner: inField ? -1 : (row === 0) ? 1 : 0,
        isBomb: inField ? randi(33) === 0 : false,
    }
}));
const forBoard = (board, func) => board.map(row => row.map(tile => func(tile)));
const posEq = (a, b) => a.row === b.row && a.col === b.col;
const get = (board, row, col) => board[row] ? board[row][col] : false;
const getAdj = (board, row, col) => {
    let adj = [];
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            if (i !== 0 && j !== 0) {
                let tile = get(board, row + i, col + j);
                tile && adj.push(tile);
            }
        }
    }
    return adj;
};
const dist = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x1 - x2, 2), Math.pow(y1 - y2, 2));
const isAdj = (r1, c1, r2, c2) => console.log(dist(r1, c1, r2, c2)) || dist(r1, c1, r2, c2) < 2;

export default () => {
    const [board, setBoard] = useState(genBoard());
    const [turn, setTurn] = useState(0);
    const [selected, setSelected] = useState(false);
    const [word, setWord] = useState([]);

    const handle = {
        board: () => setBoard(board.slice()),
        select: (row, col) => {
            // console.log(row, col, board[row][col]);
            let player = turn % 2;
            let tile = board[row][col];
            if (selected) {
                if (word.length > 1 && hasEnd(word, tile)) {

                } else {
                    setWord([]);
                }
                setSelected(false);
            } else {
                if (tile.owner === player) {
                    setWord([tile]);
                    setSelected(true);
                } else if (hasEnd(word, tile)) {
                    setSelected(true);
                }
            }
            // console.log(tile, player);
            // board[row][col].selected = !board[row][col].selected;
            handle.board();
        },
        hover: (row, col) => {
            // console.log(row, col, selected, word.map(t => t.letter).join(''));
            if (selected && word.length > 0) {
                let prev = word.slice(-2)[0];
                let curr = word.slice(-1)[0];
                // console.log(prev, word.length > 1 && posEq(prev, {row, col}));
                if (hasEnd(word, {row, col}, 2)) {
                    curr.selected = false;
                    setWord(word.slice(0, word.length - 1));
                } else {
                    if (isAdj(curr.row, curr.col, row, col)) {
                        let tile = board[row][col];
                        console.log(tile.row, tile.col, tile.selected);
                        if (!hasTile(word, tile)) {
                            setWord(word.concat(tile));
                        }
                    }
                }
            }
            handle.board();
        },
        resize: () => {
            let board = document.querySelector('.board');
            let style = window.getComputedStyle(board.parentNode);
            let containerWidth = Number(style.width.slice(0, -2));
            let containerHeight = Number(style.height.slice(0, -2));

            let width = Math.min(containerWidth, containerHeight / 1.3);
            board.style.width = width + 'px';
            board.style.height = width * 1.3 + 'px';
        }
    }

    useEffect(() => {
        document.title = "Wordbase";
        handle.resize();
    }, []);
    useEventListener(window, 'resize', handle.resize, false);

    return (
        <Wordbase>
            <div className='board-container'>
                <div className='board'>
                    {board.map((row, i) =>
                    <Row key={i} row={row} word={word} handle={handle}/>)}
                </div>
            </div>
        </Wordbase>
    );
}