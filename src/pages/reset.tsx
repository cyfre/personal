import React, { useState, useRef, Fragment, useEffect } from 'react';
import styled from 'styled-components';
import { Link, useRouteMatch, useHistory } from 'react-router-dom';
import api from '../lib/api'
import { useE, useAuth } from '../lib/hooks'
import { handleAuth, sha256 } from '../lib/auth';


// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  let auth = useAuth();
  let history = useHistory();
  let user = auth.user || useRouteMatch('/reset/:user')?.params.user;
  let token = window.location.hash?.slice(1);
  let passRef = useRef();
  let [sent, setSent] = useState(false);

  useEffect(() => {
    if (auth.user) {
      window.history.replaceState(null, '/reset', `/reset/${auth.user}`)
    }
  }, [user])
  const handle = {
    reset: () => {
      let pass = (passRef.current as HTMLInputElement).value
      if (pass) {
        setSent(true)
        sha256(pass).then(hash => {
          if (auth.user) {
            api.post('reset/user', { pass: hash }).then(handleAuth)
          } else {
            api.post('reset/token', { user, token, pass: hash }).then(handleAuth)
          }
        })
      }
    },
  }

  return <Style>
    <div className='body'>
    {!user ? 'log in to change password' : <Fragment>
      <div><div className='label'>user</div>
        {user}</div>
      <div className='reset'><div className='label'>new password</div>
        <input ref={passRef} type='password' placeholder='password'
          readOnly={sent}
          onKeyDown={e => e.key === 'Enter' && handle.reset()}/>
        {sent?'': <span className='button' onClick={handle.reset}>update</span>}
      </div>
    </Fragment>}</div>
  </Style>
}

const Style = styled.div`
  height: 100%; width: 100%;
  background: white;
  color: black;
  .button {
    cursor: pointer; user-select: none;
    display: inline-block;
    width: fit-content;
    font-size: .8rem;
    border: 2px solid black;
    padding: 0 .3rem;
    border-radius: .3rem;
    &.follow {
      margin: 0 .5rem;
    }
  }
  .body {
    padding: 1rem;
    .label { display: block; }
    .lil-badge { display: inline-block; }
    .label, .lil-badge {
        width: fit-content;
        font-size: .8rem;
        opacity: .5;
        background: #00000022;
        padding: 0 .3rem;
        border-radius: .3rem;
    }
    > * {
        margin-bottom: .5rem;
        min-height: 3rem;
    }

    .entry {
      cursor: pointer;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      .title { margin-right: 1rem; color: black; }
      .title:hover { text-decoration: underline; }
    }
  }
  .reset {
    width: 66%;
    input {
      width: 100%;
      color: black;
      border: 2px solid transparent;
      line-height: 1rem;
      height: 2.0rem;
      padding: 0 .5rem;
      border-color: #00000022;
      border-radius: .2rem;
      box-shadow: none;
      margin: .5rem 0;
    }
    .button {
      display: inline-block;
      margin-left: .5rem;
      float: right;
    }
  }
`