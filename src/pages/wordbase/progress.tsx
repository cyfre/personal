import React from 'react';
import styled from 'styled-components';
import { Player } from './board';
import { theme } from './game';

const Style = styled.div`
&.game-progress {
    width: 100%;
    color: white;

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
`

export const GameProgress = ({info}) => {
    const isTurn = info.status === Player.none
        ? [0, (info.turn + 1)%2, info.turn%2]
        : [1, 0, 0];
    const progressGradient = `${theme.orange} ${info.progress[0]}%, #2d2d2d ${info.progress[0]}% ${info.progress[1]}%, ${theme.blue} ${info.progress[1]}%`
    return (
    <Style className='game-progress' style={{
        background: `linear-gradient(90deg, ${progressGradient})`}}>

        <div className='player-name p2'>{info.p2 + (isTurn[2] ? ' <' : '')}</div>
        <div className='game-status'>{(() => {
            switch (info.status) {
                case Player.none: return '';
                case Player.p1: return 'blue wins!';
                case Player.p2: return 'orange wins!';
            }
        })()}</div>
        <div className='player-name p1'>{(isTurn[1] ? '> ' : '') + (info.p1 || 'invite')}</div>
    </Style>
    )
}