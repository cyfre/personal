import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import styled from 'styled-components';
import { useInput, useEventListener, useAnimate } from '../../lib/hooks';
import { dist, end } from './util';
import { isValidWord } from './dict';
import { Player, Tile, Board } from './board';
import { Info } from './save';

const orange = '#ffa500';
const blue = '#4bdbff';
const WordbaseMenuDiv = styled.div`
    background: #fbfbfb88;
    height: 100%;
    width: 100%;
    margin: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
`

const GameItem = ({gameInfo, selectGame}) => {
    return (
        <div onPointerDown={() => selectGame(gameInfo.id)}>
            {gameInfo.id}
        </div>
    )
}

export const WordbaseMenu = ({gameList, selectGame}: {gameList: Info[], selectGame: any}) => {
    return (
        <WordbaseMenuDiv>
            <div className='upper'>
                <div className='new-game-local'></div>
                <div className='new-game-invite'></div>
            </div>
            <div className='game-list'>
                <div className='section your-turn'>
                </div>
                <div className='section their-turn'>
                </div>
                <div className='section ended'>
                </div>
            </div>
            {gameList.map((gameId, i) =>
                <div key={i} onPointerDown={() => selectGame(gameId)}>
                    {gameId}
                </div>)}
        </WordbaseMenuDiv>
    )
}