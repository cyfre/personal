import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useRouteMatch, useLocation, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { embedded } from './Contents';
import { useAuth } from '../lib/hooks';
import { login, signup, logout } from '../lib/auth';

const User = () => {
  let auth = useAuth();
  let [dropdown, setDropdown] = useState(false);
  let [error, setError] = useState('');
  let userRef = useRef();
  let passRef = useRef();
  let history = useHistory();
  let [verify, setVerify] = useState(false);
  let verifyRef = useRef();

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
      }
    },
    logout: () => {
      setDropdown(false)
      logout()
    },
    nav: path => {
      setDropdown(false);
      history.push(path);
    }
  }
  useEffect(() => {
    setDropdown(auth.dropdown);
  }, [auth]);
  useEffect(() => {
    dropdown || setError('');
  }, [dropdown])

  const loggedIn = (
    <div className='dropdown'>
      <div className='item' onClick={() => handle.nav(`/u/${auth.user}`)}>profile</div>
      <div className='item' onClick={() => handle.nav('/search')}>search</div>
      <div className='item' onClick={() => handle.nav('/notify')}>notify</div>
      {/* <div className='item'>friends</div> */}
      <div className='item' onClick={() => { handle.logout() }}>logout</div>
    </div>
  )

  const loggedOut = (
    <div className={'dropdown' + (error ? ' error' : '')} title={error}>
      <div className='item'>
        <input ref={userRef} type='text' maxLength='8' placeholder='username'
          autoCorrect='off' autoCapitalize='off' />
      </div>
      <div className='item'>
        <input ref={passRef} type='password' placeholder='password'
          onKeyDown={e => e.key === 'Enter' && handle.signin(login)}/>
      </div>
      {verify ? <div className='item'>
        <input ref={verifyRef} type='password' placeholder='verify'
          onKeyDown={e => e.key === 'Enter' && handle.signup()}/>
      </div> : ''}
      <div className='item signin'>
        <span onClick={() => handle.signup()}>sign up</span>
        {' / '}
        <span onClick={() => handle.signin(login)}>log in</span>
      </div>
      {error ? <div className='error-msg'>{error}</div> : ''}
    </div>
  )

  return (
    <div className={dropdown ? 'user active' : 'user'}>
      <div className='display' onClick={() => setDropdown(!dropdown)}>
        [ <span>{auth.user ? auth.user : 'log in'}</span> ]
      </div>
      {!dropdown ? '' : ( auth.user ? loggedIn : loggedOut )}
    </div>
  )
}

export const Header = () => {
  let { url } = useRouteMatch();
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

  const isEmbeddedProject = useMemo(() => {
    let project = url.split('/').filter(p => p && p !== 'projects')[0];
    return embedded.includes(project);
  }, [url]);

  return (
    <Style id="header">
      <div>
        <Link to="/projects">
          <img className="profile" src="/profile.jpeg" alt="profile"/>
        </Link>
        {/* {isImplicitProject && <Link to='/projects'>/projects</Link>} */}
        {crumbs.map(crumb => <Link to={crumb} key={crumb}>/{crumb.split('/').pop()}</Link>)}
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

    .display {
      opacity: .8;
      &:hover span { text-decoration: underline; }
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
        input {
          border-color: black;
        }
        &:not(.signin):hover { text-decoration: underline; }
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
          background: #ffdbdb;
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