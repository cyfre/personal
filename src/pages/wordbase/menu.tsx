import React, { Fragment, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useHistory, Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth, useE, useF } from '../../lib/hooks';
import { openLogin } from '../../lib/auth';
import { useTimeout, useInterval } from '../../lib/hooks';
import { Player } from './board';
import { Info, Save } from './save';
import { theme } from './common';
import { localInfo } from './data';
import { Loader } from '../../components/Contents';
import { GameProgress } from './progress';
import { copy } from '../../lib/copy';

const GameItem = ({info, isEdit, outer}) => {
  const auth = useAuth();
  const inviteRef = useRef();
  const [copied, setCopied] = useState(false);

  let isP1 = info.p1 === auth.user;
  let oppo = isP1 ? info.p2 : info.p1 || 'invite';
  let isTurn = info.turn%2 === (isP1 ? 0 : 1);
  let resigned = info.lastWord === '.resign'

  useF(copied, () => {
    if (copied) setTimeout(() => setCopied(false), 2000);
  })

  return (
  <div className='game-entry'>
    {info.p1
    ? <div className='main' onClick={() => outer.open(info.id)}>
      <GameProgress info={info} />

      {<div className={'info' + (isTurn ? ' dark':'')}>
        <span>
          {isEdit || !info.lastWord
          ? (!info.lastWord ? '' : resigned
            ? `resigned`
            : `${info.lastWord.toUpperCase()}`)
          : resigned
          ? `${isP1 && info.status === Player.p1 ? `they resigned` : 'you resigned'}`
          : `${isTurn ? `they played ` : 'you played '} ${info.lastWord.toUpperCase()}`}
        </span>
      </div>}
    </div>
    : <div className='main' onPointerDown={() => {
      copy(`${window.location.origin}/wordbase#${info.id}`)
      setCopied(true)
    }}>

      <div className='info dark'>
        <span ref={inviteRef}>
          {copied ? 'copied!' : `invite  ${window.location.host}/wordbase#${info.id}`}
        </span>
      </div>
    </div>}
    {<div className={'options' + (isEdit ?' open':' closed')}>
      {info.status === Player.none
      ? <span onClick={() => {
        api.post(`/wordbase/g/${info.id}/resign`).then(() => outer.load());
      }}>resign</span>
      : <span onClick={() => {
        api.post(`/wordbase/g/${info.id}/rematch`).then(() => outer.load());
      }}>rematch</span>}
      <span onClick={() => {
        api.post(`/wordbase/g/${info.id}/delete`).then(() => outer.load());
      }}>delete</span>
    </div>}
  </div>
  )
}
const GameSection = ({name, games, isEdit, outer}: {
  name: string, games: Info[], isEdit?: boolean, outer
}) => {
  return !games.length ?<Fragment></Fragment>:<Fragment>
    <div className='top'>
      <span>{name}</span>

      <div className='controls'>
        <Link className='button' to='/notify'>/notify</Link>
        <span className='button' onClick={() => outer.setEdit(!isEdit)}>
          {isEdit ? 'close' : 'edit'}
        </span>
      </div>
    </div>

    <div className='section'>
      {games.map((info, i) =>
        <GameItem {...{
          key: i,
          info,
          isEdit,
          outer,
        }} />)}
    </div>
  </Fragment>
}

const UpperSection = ({outer, auth}: {
  outer: {open, load}, auth
}) => {
  const [friends, setFriends] = useState([]);
  const [isNew, setNew] = useState(false);
  const [isFriend, setFriend] = useState(false);

  // load friends
  useF(auth.user, () => handle.loadFriends())

  // close friend selection when new game selection closes
  useF(isNew, () => { if (!isNew) setFriend(false) })

  // show 'copied!' for 3s
  const [copied, setCopied]: [boolean | string, any] = useState(false);
  useE(copied, () => {
    if (copied) setTimeout(() => setCopied(false), 5000);
  })

  const handle = {
    loadFriends: () => {
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
      return new Promise((resolve, reject) => {
        api.post(path, { state: Save.new().serialize() })
          .then(data => {
            console.log('data', data);
            resolve(data)
            outer.load();
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
          copy(`${window.location.origin}/wordbase#${data.info.id}`)
          setCopied(`copied #${data.info.id}, send it!`)
        })
    },
    friend: user => handle.invite(`/wordbase/i/friend/${user}`)
      .then(data => outer.open(data.info.id)),
    random: () => {
      setNew(false)
      api.post('/wordbase/i/accept')
        .then(({info}) => outer.open(info.id))
        .catch(() => handle.open().then(data => {
          copy(`${window.location.origin}/wordbase#${data.info.id}`)
          setCopied(`none open, created #${data.info.id}`)
        }))
        .finally(() => outer.load());
    },
  }

  return (
    <div className={'upper' + (isNew ? ' new' : '')}>

      {/* <div className='img-container'>
        <img src="/raw/wordbase/favicon.png" />
      </div> */}

      <div className='button-row'>
        <div className='button' onClick={() => outer.open(localInfo.id)}>
          local game
        </div>
      </div>

      {auth.user ?
      <Fragment>
        <div className={'button' + (isNew ? ' inverse' : '')}
          onClick={() => setNew(!isNew)}>
          {isNew ? 'cancel' : typeof copied === 'string' ? copied : 'online game'}
        </div>
        {!isNew ? '' :
        <Fragment>
          <div className='button indent' onClick={() => handle.private()}>
            new invite link
          </div>
          <div className={'button indent' + (isFriend ? ' inverse' : '')}
            onClick={() => setFriend(!isFriend)}>
            {isFriend
            ? (friends.length ? 'cancel' : 'no friends :\'(')
            : 'challenge friend'}
          </div>
          {!isFriend || !friends.length ? '' :
          <div className='friend-list indent'>
            {friends.map(u =>
              <div className='button indent' key={u} onClick={() => handle.friend(u)}>
                {u}
              </div>)}
          </div>}
          <div className='button indent' onClick={() => handle.random()}>
            join random
          </div>
        </Fragment>}
      </Fragment>
      :
      <div className='button placeholder' onClick={openLogin}>
        log in for online games
      </div>}

    </div>
  )
}

export const WordbaseMenu = ({menuClosed, open, infoList, reload, setList}) => {
  const auth = useAuth();
  const [isEdit, setEdit] = useState(false);

  const handle = {
    open,
    setEdit,
    load: () => {
      auth.user && api.get('/wordbase/games').then(({infoList}) => {
        // console.log('games', data);
        setList(infoList?.length
          ? infoList.sort((a, b) => (b.lastUpdate || 0) - (a.lastUpdate || 0))
          : []);
      }).catch(err => {
        console.log('games err', err.error)
        setList([]);
      });
    },
  }

  // set list to empty after 1s (removes loading spinner)
  useTimeout(() => infoList || setList([]), 1000)

  // reload list when user changes and every 3s if open
  useF(auth.user, reload, handle.load);
  const reloadIfOpen = () => !menuClosed && handle.load()
  useF(menuClosed, reloadIfOpen);
  // useInterval(reloadIfOpen, 3000);

  return (
    <Style className='wordbase-menu'>
      <UpperSection {...{
        outer: handle,
        auth,
      }}/>

      {!auth.user ?'':
      <div className='game-list'>
        {!infoList ?<Loader/>: <Fragment>

        <GameSection {...{
          name: 'Your Turn',
          games: infoList.filter(i => {
            let isInvite = !i.p1;
            let canPlay = i.status === Player.none &&
              (!i.p1 || auth.user === (i.turn%2 ? i.p2 : i.p1));
            return !isInvite && canPlay;
          }).reverse(),
          isEdit, outer: handle,
        }}/>

        <GameSection {...{
          name: 'Their Turn', games: infoList.filter(i => {
            let isInvite = !i.p1;
            let isEnded = i.status !== Player.none;
            let canPlay = i.status === Player.none &&
              (!i.p1 || auth.user === (i.turn%2 ? i.p2 : i.p1));
            return isInvite || (!isEnded && !canPlay);
          }),
          isEdit, outer: handle,
        }}/>

        <GameSection {...{
          name: 'Ended', games: infoList.filter(i => {
            let isEnded = i.status !== Player.none;
            return isEnded;
          }),
          isEdit, outer: handle,
        }}/>

        </Fragment>}
      </div>}
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
      transition: .4s;
      overflow: hidden;
      &.closed { max-width: 0; padding: 0; }
      &.open { max-width: 100%; }
    }
  }
  .img-container {
    position: absolute;
    top: .9rem;
    right: .7rem;
    border-radius: .5rem;
    background: #00000011;
    padding: .1rem .3rem .3rem .1rem;
    height: 5.6rem;
    width: 5.6rem;
    img {
      width: 100%;
      height: 100%;
      image-rendering: pixelated;
      z-index: 1;
    }
  }
`