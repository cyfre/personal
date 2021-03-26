import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useRouteMatch, useLocation, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { embedded } from './Contents';
import { useAuth, useE, useF, useInterval } from '../lib/hooks';
import { login, signup, logout } from '../lib/auth';
import api from '../lib/api';
import { useUserSocket } from '../lib/io';

const User = () => {
  let auth = useAuth();
  let [dropdown, setDropdown] = useState(false);
  let [error, setError] = useState('');
  let userRef = useRef();
  let passRef = useRef();
  let history = useHistory();
  let [verify, setVerify] = useState(false);
  let verifyRef = useRef();

  let [unread, setUnread] = useState({})
  let socket = useUserSocket('', {
    'chat:unread': unread => {
      setUnread(unread)
    }
  }, socket => socket.emit('chat:unread'))

  const handle = {
    signin: (func) => {
      func(userRef.current.value, passRef.current.value)
        .then(auth => {
          setDropdown(false)
          setVerify(false)
        })
        .catch(e => {
          setError(e.error || 'error')
        })
    },
    signup: () => {
      if (verify) {
        if (verifyRef.current?.value === passRef.current?.value) {
          handle.signin(signup)
        } else {
          setError('passwords mismatch')
        }
      } else {
        setVerify(true)
        setError(false)
      }
    },
    logout: () => {
      setDropdown(false)
      logout()
    },
    nav: path => {
      setDropdown(false);
      path && history.push(path);
    },
    reset: () => {
      setError('check email for link')
      api.post('reset/request', {
        user: userRef.current.value
      })
    },
  }
  useF(auth, () => setDropdown(auth.dropdown))
  useF(dropdown, () => {
    if (!dropdown) {
      setError('')
      setVerify(false)
    }
  })

  const isMe = auth.user === 'cyrus'
  const loggedIn = (
    <div className='dropdown'>
      <Link to={`/u/${auth.user}`} className='item' onClick={() => handle.nav()}>profile</Link>
      <Link to='/search' className='item' onClick={() => handle.nav()}>search</Link>
      {isMe
      ? <Link to='/admin' className='item' onClick={() => handle.nav()}>admin</Link>
      : <Link to='/settings' className='item' onClick={() => handle.nav()}>settings</Link>}
      <div className='item' onClick={() => { handle.logout() }}>logout</div>
    </div>
  )

  const loggedOut = (
    <div className={'dropdown' + (error ? ' error' : '')} title={error || ''}>
      <div className='item'>
        <input ref={userRef} type='text' maxLength='8' placeholder='username'
          autoCorrect='off' autoCapitalize='off'
          onKeyDown={e => e.key === 'Enter' &&
            passRef.current.focus()}/>
      </div>
      <div className='item'>
        <input ref={passRef} type='password' placeholder='password'
          onKeyDown={e => e.key === 'Enter' && handle.signin(login)}/>
      </div>
      {verify ? <div className='item info'>
        <input ref={verifyRef} type='password' placeholder='confirm password'
          onKeyDown={e => e.key === 'Enter' && handle.signup()}/>
      </div> : ''}
      {!error?'': <div className='item info' style={{
          color: 'red'}}>
        {error}</div>}
      {error !== 'incorrect password' ?'': <div className='item'
        onClick={handle.reset}>
        reset password?</div>}
      <div className='item info signin'>
        <span onClick={() => handle.signup()}>sign up</span>
        {' / '}
        <span onClick={() => handle.signin(login)}>log in</span>
      </div>
      {/* {error ? <div className='error-msg'>{error}</div> : ''} */}
    </div>
  )

  let unreadCount = unread && Object.values(unread).length
  return (
    <div className={dropdown ? 'user active' : 'user'}>
      {unreadCount ? <Link className='unread' to='/chat'>{unreadCount} unread</Link> : ''}
      <div className='display'>
        <span onClick={() => setDropdown(!dropdown)}>
          [ <span className='name'>{auth.user ? auth.user : 'log in'}</span> ]
        </span>
        {!dropdown ? '' : ( auth.user ? loggedIn : loggedOut )}
      </div>
    </div>
  )
}

export const Header = () => {
  let match = useRouteMatch();
  let [url, setUrl] = useState(match.url)
  let location = useLocation();

  const isImplicitProject = useMemo(() => {
    let subdomain = url.split('/').filter(p => p)[0];
    return subdomain !== 'projects';
  }, [url]);

  const crumbs = useMemo(() => {
    let total = '';
    let crumbs = [];
    url.split('/').filter(p => p).forEach(part => {
      total += '/' + part;
      crumbs.push(total);
    });
    return crumbs;
  }, [url]);
  useInterval(() => {
    if (url !== window.location.pathname) {
      setUrl(window.location.pathname)
    }
  }, 50)

  const isEmbeddedProject = useMemo(() => {
    let project = url.split('/').filter(p => p && p !== 'projects')[0];
    return embedded.includes(project);
  }, [url]);

  return (
    <Style id="header">
      <div className='nav'>
        <Link to="/projects">
          <img className="profile" src="/profile.jpeg" alt="profile"/>
        </Link>
        {/* {isImplicitProject && <Link to='/projects'>/projects</Link>} */}
        {crumbs.map(crumb => <Link to={crumb} key={crumb}>/{crumb.split('/').pop().replace(/\+/g, ' ')}</Link>)}
        {isEmbeddedProject && <a className='raw-link' href={`/raw${crumbs[0]}${location.hash}`}>view raw</a>}
      </div>
      {/* <div>
        {isEmbeddedProject && <a className='raw-link' href={`/raw${crumbs[0]}${location.hash}`}>[ view raw ]</a>}
        <WikiLink path={url} />
      </div> */}
      <User />
    </Style>
  )
}

const Style = styled.div`
  width: 100%;
  height: 2.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  // padding-left: .25rem;
  // padding-top: .25rem;
  // padding-bottom: .25rem;
  position: relative;
  background: #131125;
  border-top-left-radius: .2rem;
  border-top-right-radius: .2rem;

  > div {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
  }

  .nav {
    .profile {
      height: 2rem;
      border-radius: 50%;
      // border: 1px solid var(--light);
      box-shadow: 1px 2px 4px #00000020;
    }
    a, a:hover {
      color: var(--light);
      text-shadow: 1px 2px 4px #00000020;
      // padding-left: .25rem;
      &:first-child { padding: 0 .25rem; }
    }
  }

  // & .wiki-link, & .raw-link {
  //   font-size: 0.8rem;
  //   opacity: .9;
  //   margin-right: .5rem;
  // }

  .raw-link {
    opacity: .5;
    margin-left: .75rem;
    background: #ffffff44;
    padding: 0 .25rem;
    border-radius: .15rem;
    font-size: .7rem;
  }

  .user {
    // text-decoration: underline;
    cursor: pointer;
    user-select: none;
    font-size: 0.9rem;
    color: var(--light);
    margin-right: .5rem;
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .unread {
      color: inherit;
      opacity: .5;
      margin-right: .75rem;
      background: #ffffff44;
      padding: 0 .25rem;
      border-radius: .15rem;
      font-size: .7rem;
    }
    .display {
      opacity: .8;
      &:hover .name { text-decoration: underline; }
      position: relative;
    }
    &.active .display {
      opacity: 1;
    }
    .dropdown {
      position: absolute;
      top: 100%;
      right: -.5rem;
      min-width: calc(100% + 1rem);
      padding: 0 .5rem;
      padding-bottom: .25rem;
      border-bottom-left-radius: .2rem;
      border-bottom-right-radius: .2rem;
      z-index: 10000;
      background: #131125;

      .item {
        padding: .15rem 0;
        display: block;
        color: white;
        input {
          border-color: black;
        }
        &:not(.info):hover { text-decoration: underline; }
        &.signin {
          display: flex;
          justify-content: space-between;
          span:hover { text-decoration: underline; }
        }
      }

      &.error {
        input {
          // border-color: #ff0000dd;
          // border-radius: .2rem;
          // background: #ff0000;
          // background: #ffdbdb;
        }
      }

      .error-msg {
        height: 0;
        line-height: 2rem;
        color: black;
        font-size: .8em;
      }
    }
  }
`