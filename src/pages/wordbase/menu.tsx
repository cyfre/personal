import React, { Fragment, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/hooks';
import { openLogin } from '../../lib/auth';
import { useTimeout, useInterval } from '../../lib/hooks';
import { Player } from './board';
import { Info, Save } from './save';
import { theme } from './common';
import { localInfo } from './data';
import { Loader } from '../../components/Contents';
import { GameProgress } from './progress';

const GameItem = ({info, open, reload, edit}) => {
  const auth = useAuth();
  const inviteRef = useRef();
  // const [optionsOpen, setOptionsOpen] = useState(edit);
  const [copied, setCopied] = useState(false);

  let isP1 = info.p1 === auth.user;
  let oppo = isP1 ? info.p2 : info.p1 || 'invite';
  let isTurn = info.turn%2 === (isP1 ? 0 : 1);
  let resigned = info.lastWord === '.resign'

  useEffect(() => {
    if (copied) setTimeout(() => setCopied(false), 2000);
  }, [copied])

  return (
    <div className='game-entry'>
      {info.p1
      ? <div className='main' onClick={() => open(info.id)}>
        <GameProgress info={info} />

        {<div className={'info' + (isTurn ? ' dark':'')}>
          <span>
            {edit || !info.lastWord
            ? (!info.lastWord ? '' : resigned
              ? `resigned`
              : `${info.lastWord.toUpperCase()}`)
            : resigned
            ? `${isTurn ? `they resigned` : 'you resigned'}`
            : `${isTurn ? `they played ` : 'you played '} ${info.lastWord.toUpperCase()}`}
            {/* {!edit && info.lastWord ? `${isTurn ? `they played ` : 'sent '} ${info.lastWord.toUpperCase()}` : ''} */}
            {/* {!edit && info.lastWord ? info.lastWord.toUpperCase() : ''} */}
          </span>
        </div>}
        {/* {`vs ${oppo}`}
        {info.lastWord ? ` – ${isTurn ? `they played ` : ' you played '} ${info.lastWord}` : ''}
        {` (${info.id})`} */}

        {/* {`${info.p1 || 'invite'} vs ${info.p2} (${info.id})`} */}
      </div>
      : <div className='main' onClick={() => {
          navigator.clipboard.writeText(`${window.location.origin}/wordbase#${info.id}`);
          setCopied(true);
        }}>

        <div className='info dark'>
          <span ref={inviteRef}>
            {copied ? 'copied!' : `invite  /wordbase#${info.id}`}
          </span>
        </div>
      </div>}
      {(edit || true)
      ? <div className={'options' + (edit ?' open':' closed')}>
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
      : <div className='options closed'></div>}
    </div>
  )
}
const GameSection = ({name, games, open, reload, isEdit, setEdit}:
  {name: string, games: Info[], open: any, reload: any, isEdit?: boolean, setEdit?: any}) => {

  const history = useHistory();
  return games.length ? (<Fragment>
    <div className='top'>
      <span>{name}</span>
      <div className='controls'>
        <div className='button'
          onClick={() => history.push('/notify')}>
            /notify</div>
        {!setEdit ?'':
        <span className='button'
          onClick={() => setEdit(!isEdit)}>{isEdit ? 'close' : 'edit'}</span>}
      </div>
    </div>
    <div className='section'>
      {games.map((info, i) =>
        <GameItem {...{
          key: i,
          info,
          open,
          reload,
          edit: isEdit
        }} />)}
    </div>
  </Fragment>) : <Fragment></Fragment>
}

export const WordbaseMenu = ({open, infoList, setList}) => {
  const auth = useAuth();
  const [loaded, setLoaded] = useState(!!(auth.user && infoList));
  // const [gameList, setGameList]: [Info[], any] = useState([]);
  const [isEdit, setEdit] = useState(false);
  const [isNew, setNew] = useState(false);
  const [friends, setFriends] = useState([]);
  const [isFriend, setFriend] = useState(false);

  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (copied) setTimeout(() => setCopied(false), 3000);
  }, [copied])

  const handle = {
    local: () => open(localInfo.id),
    load: () => {
      auth.user && api.get('/wordbase/games').then(data => {
        // console.log('games', data);
        setList(data.infoList?.length ? data.infoList.sort((a, b) =>
          (b.lastUpdate || 0) - (a.lastUpdate || 0)) : []);
        setLoaded(true);
      }).catch(err => {
        console.log('games err', err.error)
        setList([]);
      });
      auth.user && api.get(`/profile/${auth.user}`).then(({profile}) => {
        // console.log('profile', profile);
        setFriends(profile.friends);
      }).catch(err => {
        console.log('profile err', err.error)
        setFriends([]);
      });
    },
    invite: (path): Promise<{info: Info}> => {
      setNew(false);
      setFriend(false);
      return new Promise((resolve, reject) => {
        api.post(path, { state: Save.new().serialize() })
        .then(data => {
          console.log('data', data);
          resolve(data)
          handle.load();
        })
        .catch(err => {
          console.log('err', err.error)
          reject(err.error)
        });
      })
    },
    open: () => handle.invite('/wordbase/i/open'),
    private: () => {
      setCopied(true)
      handle.invite('/wordbase/i/private')
      .then(data => {
        navigator.clipboard.writeText(`${window.location.origin}/wordbase#${data.info.id}`);
      })
    },
    friend: user => handle.invite(`/wordbase/i/friend/${user}`)
      .then(data => open(data.info.id)),
    random: () => {
      api.post('/wordbase/i/accept')
        .then(({info}) => open(info.id))
        .catch(() => handle.open())
        .finally(() => handle.load());
    },
    toggleEdit: () => setEdit(!isEdit),
  }
  useEffect(() => {
    setTimeout(() => setLoaded(true), 1000);
  }, []);
  useEffect(() => handle.load(), [auth.user]);
  useInterval(() => { auth.user && handle.load() }, 3000);
  useEffect(() => { if (!isNew) setFriend(false) }, [isNew])

  return (
    <Style className='wordbase-menu'>
      <div className={'upper' + (isNew ? ' new' : '')}>
        <div className='button-row'>
          <div className='button'
            onClick={() => handle.local()}>
              local game</div>
          {/* <div className='button inline'
            onClick={() => setHowTo(!howTo)}>
              how to</div> */}
        </div>
        {auth.user
        ? <Fragment>
          <div className={'button' + (isNew ? ' inverse' : '')}
            onClick={() => setNew(!isNew)}>
            {isNew ? 'cancel' : copied ? 'copied!' : 'online game'}</div>
          {!isNew ? '' :
          <Fragment>
            <div className='button indent' onClick={() => handle.private()}>
              new invite link</div>
            <div className={'button indent' + (isFriend ? ' inverse' : '')}
              onClick={() => setFriend(!isFriend)}>
              {isFriend ? (friends.length ? 'cancel' : 'no friends :\'(') : 'challenge friend'}</div>
            {!isFriend || !friends.length ? '' :
            <div className='friend-list indent'>
              {friends.map(u =>
                <div className='button indent'
                  key={u} onClick={() => handle.friend(u)}>{u}</div>)}
            </div>}
            <div className='button indent' onClick={() => handle.random()}>
              join random</div>
          </Fragment>}
        </Fragment>
        : <div className='button placeholder' onClick={openLogin}>log in for online games</div>}
      </div>
      {auth.user ?
      <div className='game-list'>
        {!loaded ? <Loader/> : <Fragment>
        <GameSection {...{
          name: 'Your Turn', games: infoList.filter(i => {
            let isInvite = !i.p1;
            let canPlay = i.status === Player.none &&
              (!i.p1 || auth.user === (i.turn%2 ? i.p2 : i.p1));
            return !isInvite && canPlay;
          }).reverse(),
          open, reload: handle.load, isEdit, setEdit,
        }}/>
        <GameSection {...{
          name: 'Their Turn', games: infoList.filter(i => {
            let isInvite = !i.p1;
            let isEnded = i.status !== Player.none;
            let canPlay = i.status === Player.none &&
              (!i.p1 || auth.user === (i.turn%2 ? i.p2 : i.p1));
            return isInvite || (!isEnded && !canPlay);
          }),
          open, reload: handle.load, isEdit, setEdit,
        }}/>
        <GameSection {...{
          name: 'Ended', games: infoList.filter(i => {
            let isEnded = i.status !== Player.none;
            return isEnded;
          }),
          open, reload: handle.load, isEdit, setEdit,
        }}/>
        </Fragment>}
      </div> : ''}
    </Style>
  )
}

const Style = styled.div`
  background: ${theme.background};
  height: 100%; width: 100%;
  display: flex; flex-direction: column;
  margin: auto;
  position: relative;

  color: black;
  font-family: 'Ubuntu', sans-serif;
  // text-transform: uppercase;
  .button-row {
    display: flex;
    .button {
      margin-right: .5rem;
    }
  }
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
    position: absolute;
    width: 100%;
    z-index: 200;
    background: white;
    // height: 8rem;
    display: flex;
    flex-direction: column;
    align-items: start;
    padding: 1rem;
    .button {
      width: fit-content;
      white-space: pre;
      margin-bottom: .75rem;
      font-size: 1.5rem;
      cursor: pointer;
      &.placeholder {
        opacity: .5;
      }
    }
    > .button:last-child { margin-bottom: 0; }
    transition: .5s;
    overflow: hidden;
    min-height: 4rem; max-height: 8rem;
    &.new { min-height: 12rem; max-height: 100%; }
    .indent {
      margin-left: 1rem;
      margin-bottom: .75rem;
    }
    .friend-list {
      width: calc(100% - 1rem);
      padding-left: 1rem;
      margin-bottom: .25rem;
      > .button {
        margin: 0;
        margin-bottom: .5rem;
        margin-right: .5rem;
      }
      display: flex;
      flex-wrap: wrap;
    }
  }
  .game-list {
    // height: calc(100% - 8rem);
    margin-top: 7.2rem;
    padding: .5rem 1rem;
    overflow: scroll;
    height: 0;
    flex-grow: 1;
    .top {
      text-transform: uppercase;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: .5rem;
      .controls {
        text-transform: lowercase;
        font-size: 1rem;
        display: none;
        .button {
          margin-left: .5rem;
        }
      }
    }
    .top:first-child .controls { display: flex; }
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
          white-space: pre;
          background: #00000088;
          // background: #00000044;
          // background: #ffffff22;
          padding: 0 .3rem;
          border-radius: .2rem;
          user-select: none;
        }
        &.dark span {
          background: #00000088;
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
        margin-right: .5rem;
        &:last-child { margin-right: 0; }
      }
      transition: .5s;
      overflow: hidden;
      &.closed { max-width: 0; padding: 0; }
      &.open { max-width: 100%; }
    }
  }
`