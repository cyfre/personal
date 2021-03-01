import React, { useState, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { Link, useHistory } from 'react-router-dom';
import api from '../lib/api'
import { useF, useAuth } from '../lib/hooks'
import { sub, unsub } from '../lib/notify'
import { InfoStyles, InfoBody, InfoSection } from '../components/Info'


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
    <InfoBody>
    {!notify ? '' : !auth.user ? 'log in to manage notifications' : <Fragment>
      <InfoSection label='user'>{auth.user}</InfoSection>
      <InfoSection className='email' labels={[
        'email',
        !notify.email ? '' : notify.verify
        ? `unverified – check email for link`
        : 'verified'
      ]}>
        <div className='text'>{emailEdit
          ? <input ref={emailRef} type='email' placeholder=''
          autoCorrect='off' autoCapitalize='off'
          onKeyDown={e => e.key === 'Enter' && handle.email()}/>
          : <span onClick={handle.email}>{notify.email || '(add email for notifications)'}</span>}
          <div className='edit button'
            onClick={handle.email}>
            {emailEdit ? 'save' : 'edit'}</div>
        </div>
      </InfoSection>
      <InfoSection label='notifications'>
        {notifyProjects.map(page => {
          let enabled = !(notify.unsub || []).includes(page)
          return <NotifyEntry key={page} page={page}
            enabled={enabled} toggle={() =>
              handle.sub(page, !enabled)}/>})}
      </InfoSection>
    </Fragment>}
    </InfoBody>
  </Style>
}

const Style = styled(InfoStyles)`
  .body {
    .entry {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      .title { margin-right: .5rem; color: black; }
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
        // min-width: 71.5%;
        min-width: 17.6rem;
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
      display: flex; align-items: center; justify-content: center;
      margin-left: 1rem;
    }
  }
`