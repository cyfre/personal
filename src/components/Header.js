import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useRouteMatch, useLocation, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { embedded } from './Contents';
import { useAuth } from '../lib/hooks';
import { login, signup, logout } from '../lib/auth';

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
    padding-left: .25rem;
    text-shadow: 1px 2px 4px #00000020;
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
    font-size: 0.8rem;
    color: var(--light);
    margin-right: .5rem;
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .display {
      opacity: .8;
      &:hover { span { text-decoration: underline; } }
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
      z-index: 100;
      background: #131125;

      .item {
        padding: .15rem 0;
        input {
          border-color: black;
        }
        &:not(.signin):hover { text-decoration: underline; }
        &.signin span:hover {
          text-decoration: underline;
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
    }
  }
`

const User = () => {
  let auth = useAuth();
  let [dropdown, setDropdown] = useState(false);
  let [error, setError] = useState('');
  let userRef = useRef();
  let passRef = useRef();
  let history = useHistory();

  const handle = {
    signin: (func) => {
      func(userRef.current.value, passRef.current.value)
        .then(auth => {})
        .catch(e => setError(e.error || 'error'));
    },
    logout: () => {
      logout();
    },

  }
  useEffect(() => {
    setDropdown(auth.dropdown);
  }, [auth]);
  useEffect(() => {
    setError('');
  }, [dropdown])

  const loggedIn = (
    <div className='dropdown'>
      <div className='item' onClick={() => history.push(`/u/${auth.user}`)}>profile</div>
      {/* <div className='item'>friends</div> */}
      <div className='item' onClick={() => { handle.logout() }}>logout</div>
    </div>
  )

  const loggedOut = (
    <div className={'dropdown' + (error ? ' error' : '')} title={error}>
      <div className='item'>
        <input ref={userRef} type='text' maxlength='8' placeholder='username'
          autoCorrect='off' autoCapitalize='off' />
      </div>
      <div className='item'>
        <input ref={passRef} type='password' placeholder='password'
          onKeyDown={e => e.key === 'Enter' && handle.signin(login)}/>
      </div>
      <div className='item signin'>
        <span onClick={() => handle.signin(login)}>log in</span>
        {' / '}
        <span onClick={() => handle.signin(signup)}>sign up</span>
      </div>
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
