import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../lib/hooks';
import styled from 'styled-components';
import { useTimeout, useInterval } from '../../lib/hooks';
import { Player } from './board';
import { Info, Save } from './save';
import { theme } from './game';
import { localInfo } from './data';
import { Loader } from '../../components/Contents';
import { GameProgress } from './progress';

const Style = styled.div`
    background: ${theme.background};
    height: 100%;
    width: 100%;

    color: black;
    font-family: 'Ubuntu', sans-serif;
    // text-transform: uppercase;
    .button {
        color: white;
        background: black;
        padding: 0 .3rem;
        border-radius: .3rem;
        cursor: pointer;
        user-select: none;
    }
    .upper {
        background: white;
        // height: 8rem;
        display: flex;
        flex-direction: column;
        align-items: start;
        padding: 1rem;
        .button {
            margin-bottom: .75rem;
            &:last-child { margin-bottom: 0 }
            font-size: 1.5rem;
            cursor: pointer;
            &.placeholder {
                opacity: .5;
            }
        }
    }
    .game-list {
        // height: calc(100% - 8rem);
        padding: .5rem 1rem;
        .top {
            text-transform: uppercase;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: .5rem;
            .edit {
                text-transform: lowercase;
                foont-size: 1rem;
            }
        }
    }
    .game-entry {
        height: 2.5rem;
        margin-bottom: .5rem;
        cursor: pointer;
        color: white;
        display: flex;
        .main {
            // background: #2d2d2d;
            background: #00000022;
            height: 100%;
            flex-grow: 9;
            position: relative;
            overflow: hidden;
            .game-progress {
                height: 100%;
                padding: 0 .5rem;
            }
            .info {
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                span {
                    background: #00000088;
                    padding: 0 .3rem;
                    border-radius: .2rem;
                }
            }
        }
        .options {
            // width: 2.5rem;
            padding: 0 .5rem;
            flex-grow: 0;
            background: black;
            display: flex;
            align-items: center;
            justify-content: space-between;
            span {
                min-height: 1.5rem;
                min-width: 1.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                color: black;
                background: white;
                padding: 0 .3rem;
                border-radius: .2rem;
                cursor: pointer;
            }
            transition: .5s;
            overflow: hidden;
            &.closed { width: 0; padding: 0; }
            &.open { width: 42% }
        }
    }
`

const GameItem = ({info, selectGame, reload, edit}) => {
    const auth = useAuth();
    const inviteRef = useRef();
    // const [optionsOpen, setOptionsOpen] = useState(edit);
    const [copied, setCopied] = useState(false);

    let isP1 = info.p1 === auth.user;
    let oppo = isP1 ? info.p2 : info.p1 || 'invite';
    let isTurn = info.turn%2 === (isP1 ? 0 : 1);

    useEffect(() => {
        if (copied) setTimeout(() => setCopied(false), 2000);
    }, [copied])

    return (
        <div className='game-entry'>
            {info.p1
            ? <div className='main' onClick={() => selectGame(info.id)}>
                <GameProgress info={info} />

                {info.status !== Player.none ? '' :
                <div className='info'>
                    <span>
                        {!edit && info.lastWord ? `${isTurn ? `they played ` : 'you played '} ${info.lastWord.toUpperCase()}` : ''}
                    </span>
                </div>}
                {/* {`vs ${oppo}`}
                {info.lastWord ? ` – ${isTurn ? `they played ` : ' you played '} ${info.lastWord}` : ''}
                {` (${info.id})`} */}

                {/* {`${info.p1 || 'invite'} vs ${info.p2} (${info.id})`} */}
            </div>
            : <div className='main'>
                <div className='info'>
                    <span ref={inviteRef} onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/wordbase#${info.id}`);
                        setCopied(true);
                    }}>
                        {copied ? 'copied!' : `freshman.dev/wordbase#${info.id}`}
                    </span>
                </div>
            </div>}
            {edit
            ? <div className='options open'>
                {/* <span onClick={() => setOptionsOpen(false)}>{'>'}</span> */}
                <span onClick={() => {
                    api.post(`/wordbase/games/${info.id}/resign`).then(() => reload());
                }}>{'resign'}</span>
                <span onClick={() => {
                    api.post(`/wordbase/games/${info.id}/delete`).then(() => reload());
                }}>{'delete'}</span>
            </div>
            // : <div className='options closed'
            //     onClick={() => setOptionsOpen(true)}>
            //     <span>{'<'}</span>
            // </div>}
            : <div className='options closed'></div>}
        </div>
    )
}

export const WordbaseMenu = ({selectGame}: {selectGame: any}) => {
    const auth = useAuth();
    const [loaded, setLoaded] = useState(!auth.user);
    const [gameList, setGameList]: [Info[], any] = useState([]);
    const [isEdit, setEdit] = useState(false);

    const handle = {
        local: () => selectGame(localInfo.id),
        invite: () => {
            api.post('/wordbase/new', { state: Save.new().serialize() }).then(data => {
                console.log('data', data);
                handle.load();
            }).catch(err => console.log('err', err.error));
        },
        load: () => {
            api.get('/wordbase/games').then(data => {
                console.log('data', data);
                setGameList(data.infoList?.length ? data.infoList : []);
                setLoaded(true);
            }).catch(err => {
                console.log('err', err.error)
                setGameList([]);
            });
        }
    }
    useEffect(() => {
        setTimeout(() => setLoaded(true), 1000);
    }, []);
    useEffect(() => {
        handle.load();
    }, [auth.user]);
    useInterval(() => {
        handle.load();
    }, 5000);

    return (
        <Style>
            <div className='upper'>
                <div className='button new-local'
                    onClick={() => handle.local()}>
                        local game</div>
                {auth.user
                ? <div className='button new-invite'
                    onClick={() => handle.invite()}>
                        create invite</div>
                : <div className='button new-invite placeholder'>log in to create & view games</div>}
            </div>
            <div className='game-list'>
                <div className='top'>
                    <span>Your Games</span>
                    <span className='button edit'
                        onClick={() => setEdit(!isEdit)}>{isEdit ? 'close' : 'edit'}</span>
                </div>
                {loaded
                ? <div className='section active'>
                    {gameList.map((info, i) =>
                        <GameItem {...{
                            key: i,
                            info,
                            selectGame,
                            reload: handle.load,
                            edit: isEdit
                        }}/>)}
                </div>
                : <Loader />}

                {/* <div className='section your-turn'>
                </div>
                <div className='section their-turn'>
                </div>
                <div className='section ended'>
                </div> */}
            </div>
        </Style>
    )
}