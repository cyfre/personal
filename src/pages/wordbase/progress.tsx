import React, { Fragment } from 'react';
import styled from 'styled-components';
import { Player } from './board';
import { theme } from './common';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../lib/hooks';

const Style = styled.div`
&.game-progress {
    width: 100%;
    color: white;

    // border-left: .5rem solid ${theme.orange};
    // border-right: .5rem solid ${theme.blue};

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0 .3rem;
    font-family: 'Ubuntu', sans-serif;
    position: relative;

    .game-status, .player-name {
        white-space: pre;
        // background: #00000088;
        background: #ffffff22;
        padding: 0 .3rem;
        border-radius: .2rem;
        line-height: 1.5rem;
    }
    .game-status {
        // flex-grow: 1;
        // // text-align: center;
        // position: absolute;
        // width: fit-content;
        // margin: auto;
        // left: 0;
    }
    .player-name {
        cursor: pointer;
        z-index: 100;
        :hover { text-decoration: underline; }
        // position: relative;
        &.turn.p1::before {
            // position: absolute;
            content: "> ";
        }
        &.turn.p2::after {
            content: " <";
            // position: absolute;
        }
    }

    position: relative;
    &.done::after {
        content: ""; width: 100%; height: 100%;
        position: absolute; left: 0;
        z-index: 1;
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
`

export const GameProgress = ({info}) => {
    const history = useHistory();
    const auth = useAuth();
    const openUser = user => history.push(`/u/${user}`)

    const isTurn = info.status === Player.none
        ? [0, (info.turn + 1)%2, info.turn%2]
        : [1, 0, 0];

    // const colors = (info.status === Player.none || !auth.user)
    //     ? [theme.orange, theme.blue]
    //     : (auth.user === (info.status === Player.p1 ? info.p1 : info.p2))
    //     ? ['green', 'gray'] : ['red', 'gray']
    const colors = [theme.orange, theme.blue]
    const progressGradient = `${colors[0]} ${info.progress[0]}%, #2d2d2d ${info.progress[0]}% ${info.progress[1]}%, ${colors[1]} ${info.progress[1]}%`
    return (
    <Style className={'game-progress' + (info.status !== Player.none ?' done':'')} style={{
        background: `linear-gradient(90deg, ${progressGradient})`}}>

        {info.turn < 0 ? '' : <Fragment>
        <div className={'player-name p2' + (isTurn[2] ?' turn':'')}
            onClick={() => openUser(info.p2)}>
            {info.p2 + (info.status === Player.p2 ? ' wins!':'')}</div>
        {/* <div className='game-status'>{(() => {
            switch (info.status) {
                case Player.none: return '';
                case Player.p1: return `${info.p1} wins!`;
                case Player.p2: return `${info.p2} wins!`;
            }
        })()}</div> */}
        <div className={'player-name p1' + (isTurn[1] ?' turn':'')} onClick={() => openUser(info.p1)}>
            {(info.p1 || 'invite') + (info.status === Player.p1 ? ' wins!':'')}</div>
        </Fragment>}
    </Style>
    )
}