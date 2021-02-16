import React, { useState, useMemo, useRef } from 'react';
import { Link, useRouteMatch, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { embedded } from './Contents';
import WikiLink from './WikiLink';
import { useAuth } from '../lib/hooks';
import { login, logout } from '../lib/auth';

const Header = styled.div`
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
    text-decoration: underline;
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
      }
    }
  }
`

const User = () => {
  let auth = useAuth();
  let [dropdown, setDropdown] = useState(false);
  let userRef = useRef();
  let passRef = useRef();

  const handle = {
    login: () => {
      login(userRef.current.value, passRef.current.value);
      setDropdown(false);
    },
    logout: () => {
      logout();
      setDropdown(false);
    }
  }

  const loggedIn = (
    <div className='dropdown'>
      <div className='item'>profile</div>
      <div className='item'>friends</div>
      <div className='item' onClick={() => { handle.logout() }}>logout</div>
    </div>
  )

  const loggedOut = (
    <div className='dropdown'>
      <div className='item'>
        <input ref={userRef} type='text' placeholder='username' />
      </div>
      <div className='item'>
        <input ref={passRef} type='password' placeholder='password'
          onKeyDown={e => e.key === 'Enter' && handle.login()}/>
      </div>
      <div className='item' onClick={() => handle.login()}>
        log in / sign up
      </div>
    </div>
  )

  return (
    <div className='user'>
      <div className='display' onClick={() => setDropdown(!dropdown)}>
        {auth.user ? auth.user : 'log in'}
      </div>
      {!dropdown ? '' : ( auth.user ? loggedIn : loggedOut )}
    </div>
  )
}

export default () => {
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
    <Header id="header">
      <div>
        <Link to="/">
          <img className="profile" src="/profile.jpeg" alt="profile"/>
        </Link>
        {isImplicitProject && <Link to='/projects'>/projects</Link>}
        {crumbs.map(crumb => <Link to={crumb} key={crumb}>/{crumb.split('/').pop()}</Link>)}
        {isEmbeddedProject && <a className='raw-link' href={`/raw${crumbs[0]}${location.hash}`}>view raw</a>}
      </div>
      {/* <div>
        {isEmbeddedProject && <a className='raw-link' href={`/raw${crumbs[0]}${location.hash}`}>[ view raw ]</a>}
        <WikiLink path={url} />
      </div> */}
      <User />
    </Header>
  )
}
