import React, { useState, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { Link, useRouteMatch, useHistory } from 'react-router-dom';
import api from '../lib/api'
import { useE, useF, useAuth } from '../lib/hooks'
import { sub, unsub } from '../lib/notify'

const notifyProjects = 'wordbase'.split(' ')

const NotifyEntry = ({page, enabled, toggle}) => {
  let history = useHistory();

  return (<div className='entry'>
    <Link className='title' to={`/${page}`}>{`/${page}`}</Link>
    <div className='sub button' onClick={toggle}>
      {enabled ? 'unsubscribe' : 'subscribe'}</div>
  </div>)
}

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  let auth = useAuth();
  let [token, setToken] = useState(window.location.hash?.slice(1) || '');
  let [notify, setNotify] = useState(undefined);
  let emailRef = useRef();
  let [emailEdit, setEmailEdit] = useState(false)

  useF(auth.user, () => auth.user && !token && handle.load())
  useF(token, () => {
    if (token) {
      console.log('token', token)
      window.history.replaceState(null, '/notify', '/notify')
      api.post('notify/verify', { token }).then(data => {
        if (data.notify && !data.notify.verify) {
          setNotify(data.notify)
        } else {
          handle.load();
        }
      })
      setToken('');
    }
  })
  useF(notify, console.log)
  useF(emailEdit, () => {
    if (notify && emailRef?.current) {
      (emailRef.current as HTMLInputElement).value = notify.email || ''
    }
  })

  const handle = {
    load: () => {
      api.get('notify').then(({notify}) => setNotify(notify));
    },
    email: () => {
      if (emailEdit) {
        let email = (emailRef.current as HTMLInputElement).value
        api.post('notify/email', { email }).then(res => {
          console.log(res)
          handle.load()
        })
        notify.email = email;
      } else {
        setTimeout(() => {
          (emailRef.current as HTMLInputElement).focus()
        })
      }
      setEmailEdit(!emailEdit)
    },
    sub: (page: string, doSub: boolean) => {
      (doSub ? sub : unsub)(page).then(handle.load)
    },
  }

  return <Style>
    <div className='body'>
    {!notify ? '' : !auth.user ? 'log in to manage notifications' : <Fragment>
      <div><div className='label'>user</div>{auth.user}</div>
      <div className='email'><div className='label inline'>email</div>
        <span className='lil-badge'>{notify.verify ? `unverified – check email for link` : 'verified'}</span>
        <div className='text'>{emailEdit
          ? <input ref={emailRef} type='email' placeholder=''
          autoCorrect='off' autoCapitalize='off'
          onKeyDown={e => e.key === 'Enter' && handle.email()}/>
          : <span onClick={handle.email}>{notify.email || '(add email for notifications)'}</span>}
          <div className='edit button'
            onClick={handle.email}>
            {emailEdit ? 'save' : 'edit'}</div>
        </div>
      </div>
      <div><div className='label'>notifications</div>
        {notifyProjects.map(page => {
          let enabled = !(notify.unsub || []).includes(page)
          return <NotifyEntry key={page} page={page}
            enabled={enabled} toggle={() =>
              handle.sub(page, !enabled)}/>})}
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
    .label.inline, .lil-badge { display: inline-block; }
    .label, .lil-badge {
      width: fit-content;
      font-size: .8rem;
      opacity: .5;
      background: #00000022;
      padding: 0 .3rem;
      border-radius: .3rem;
    }
    .lil-badge {
      margin-left: .5rem;
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
  .email {
    .text {
      display: flex;
      flex-direction: row;
      align-items: center;
      span, input {
        color: black;
        // flex-grow: 1;
        border: 2px solid transparent;
        line-height: 1rem;
        height: 2.0rem;
        display: flex; align-items: center;
      }
      span {
        cursor: pointer;
        padding: 0;
      }
      input {
        min-width: 71.5%;
        padding: 0 .5rem;
        // border-color: black;
        border-color: #00000022;
        border-radius: .2rem;
        // background: #00000011;
        // border-radius: 1rem;
        box-shadow: none;
        -webkit-appearance: none;
      }
    }
    .button {
      // height: 1.5rem;
      display: flex; align-items: center; justify-content: center;
      margin-left: 1rem;
      // float: right;
      // margin-top: .1rem;
    }
  }
`