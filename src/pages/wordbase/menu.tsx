import React, { Fragment, useState, useEffect, useRef } from 'react';
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

const GameItem = ({info, setOpenGame, reload, edit}) => {
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
            ? <div className='main' onClick={() => setOpenGame(info.id)}>
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
                        {copied ? 'copied!' : `invite: /wordbase#${info.id}`}
                    </span>
                </div>
            </div>}
            {edit
            ? <div className='options open'>
                {/* <span onClick={() => setOptionsOpen(false)}>{'>'}</span> */}
                {info.status === Player.none
                ? <span onClick={() => {
                    api.post(`/wordbase/g/${info.id}/resign`).then(() => reload());
                }}>resign</span>
                : <span onClick={() => {
                    api.post(`/wordbase/g/${info.id}/rematch`).then(() => reload());
                }}>rematch</span>}
                <span onClick={() => {
                    api.post(`/wordbase/g/${info.id}/delete`).then(() => reload());
                }}>delete</span>
            </div>
            // : <div className='options closed'
            //     onClick={() => setOptionsOpen(true)}>
            //     <span>{'<'}</span>
            // </div>}
            : <div className='options closed'></div>}
        </div>
    )
}

export const WordbaseMenu = ({setOpenGame}) => {
    const auth = useAuth();
    const [loaded, setLoaded] = useState(!auth.user);
    const [gameList, setGameList]: [Info[], any] = useState([]);
    const [isEdit, setEdit] = useState(false);
    const [isNew, setNew] = useState(false);
    const [friends, setFriends] = useState([]);
    const [isFriend, setFriend] = useState(false);

    const handle = {
        local: () => setOpenGame(localInfo.id),
        load: () => {
            api.get('/wordbase/games').then(data => {
                // console.log('games', data);
                setGameList(data.infoList?.length ? data.infoList : []);
                setLoaded(true);
            }).catch(err => {
                console.log('games err', err.error)
                setGameList([]);
            });
            auth.user && api.get(`/profile/${auth.user}`).then(({profile}) => {
                // console.log('profile', profile);
                setFriends(profile.friends);
            }).catch(err => {
                console.log('profile err', err.error)
                setFriends([]);
            });
        },
        invite: path => {
            setNew(false);
            setFriend(false);
            api.post(path, { state: Save.new().serialize() }).then(data => {
                console.log('data', data);
                handle.load();
            }).catch(err => console.log('err', err.error));
        },
        open: () => handle.invite('/wordbase/i/open'),
        private: () => handle.invite('/wordbase/i/private'),
        friend: user => handle.invite(`/wordbase/i/friend/${user}`),
        random: () => {
            api.post('/wordbase/i/accept')
                .then(({info}) => setOpenGame(info.id))
                .catch(() => handle.open())
                .finally(() => handle.load());
        }
    }
    useEffect(() => {
        setTimeout(() => setLoaded(true), 1000);
    }, []);
    useEffect(() => handle.load(), [auth.user]);
    useInterval(() => { handle.load() }, 3000);
    useEffect(() => { if (!isNew) setFriend(false) }, [isNew])

    return (
        <Style>
            <div className={'upper' + (isNew ? ' new' : '')}>
                <div className='button'
                    onClick={() => handle.local()}>
                        local game</div>
                {auth.user
                ? <Fragment>
                    <div className={'button' + (isNew ? ' inverse' : '')}
                        onClick={() => setNew(!isNew)}>
                        {isNew ? 'cancel' : 'online game'}</div>
                    {!isNew ? '' :
                    <Fragment>
                        <div className='button indent' onClick={() => handle.private()}>
                            new invite link</div>
                        <div className={'button indent' + (isFriend ? ' inverse' : '')}
                            onClick={() => setFriend(!isFriend)}>
                            {isFriend ? 'cancel' : 'challenge friend'}</div>
                        {!isFriend ? '' :
                        <div className='friend-list indent'>
                            {friends.map(u =>
                                <div className='button indent'
                                    key={u} onClick={() => handle.friend(u)}>{u}</div>)}
                        </div>}
                        <div className='button indent' onClick={() => handle.random()}>
                            join random</div>
                    </Fragment>}
                </Fragment>
                : <div className='button placeholder'>log in to create & view games</div>}
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
                            setOpenGame,
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
        &.inverse { color: black; background: white; border: solid 2px black; }
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
            width: fit-content;
            margin-bottom: .75rem;
            &:last-child { margin-bottom: 0 }
            font-size: 1.5rem;
            cursor: pointer;
            &.placeholder {
                opacity: .5;
            }
        }
        transition: .5s;
        overflow: hidden;
        min-height: 4rem; max-height: 8rem;
        &.new { min-height: 12rem; max-height: 100%; }
        .indent {
            margin-left: 2rem;
            margin-bottom: .75rem;
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