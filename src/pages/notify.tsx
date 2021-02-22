import React, { useState, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { Link, useRouteMatch, useHistory } from 'react-router-dom';
import api from '../lib/api'
import { useE, useAuth } from '../lib/hooks'
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
  let [term, setTerm] = useState(window.location.hash?.slice(1) || '');
  let [notify, setNotify] = useState(undefined);
  let emailRef = useRef();
  let [emailEdit, setEmailEdit] = useState(false)

  useE(() => {
    auth.user && handle.load()
  });
  useE(() => {
    window.history.replaceState(null, '/notify',
      term ? `/notify/#${term}` : '/notify')
  }, term)
  useE(() => {
    console.log(notify)
  }, notify)
  useE(() => {
    if (notify && emailRef?.current) {
      (emailRef.current as HTMLInputElement).value = notify.email || ''
    }
  }, emailEdit)

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
    {!notify ? '' : !auth.user ? 'log in to set notifications' : <Fragment>
      <div className='user'>{auth.user}</div>
      <div className='email'>
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
      <div className='notifications'>
        {notifyProjects.map(page => {
          let enabled = notify.apps.includes(page)
          return <NotifyEntry key={page} page={page}
            enabled={enabled} toggle={() =>
              handle.sub(page, !enabled)}/>})}
      </div>
    </Fragment>}</div>
  </Style>

  return <Style>{!(notify && auth.user) ? 'log in' : <Fragment>
    <div className='body'>
      <div className='user'>{auth.user}</div>
      <div className='email'>
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
      <div className='notifications'>
        {notifyProjects.map(page => {
          let enabled = notify.apps.includes(page)
          return <NotifyEntry key={page} page={page}
            enabled={enabled} toggle={() =>
              handle.sub(page, !enabled)}/>})}
      </div>
    </div>
  </Fragment>}</Style>
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
    > *::before { display: block; margin-bottom: .25rem }
    .lil-badge { display: inline-block; }
    > *::before, .lil-badge {
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
    .user::before { content: "user" }
    .email::before { content: "email" }
    .notifications::before { content: "notifications" }

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
        flex-grow: 1;
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
        padding: 0 .5rem;
        // border-color: black;
        border-color: #00000022;
        border-radius: .2rem;
        // background: #00000011;
        // border-radius: 1rem;
      }
    }
    .button {
      // height: 1.5rem;
      display: flex; align-items: center; justify-content: center;
      margin-left: .5rem;
      float: right;
      // margin-top: .1rem;
    }
  }
`