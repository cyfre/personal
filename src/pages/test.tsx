import React, { useState, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { useRouteMatch } from 'react-router-dom';
import api from '../lib/api'
import { useF, useAuth } from '../lib/hooks'
import { handleAuth, sha256 } from '../lib/auth';
import { InfoStyles, InfoBody, InfoSection, InfoLoginBlock } from '../components/Info'


export default () => {
  let auth = useAuth();
  let userRef = useRef();
  let appRef = useRef();
  let textRef = useRef();

  const handle = {
    send: () => {
      let user = (userRef.current as HTMLInputElement).value
      let app = (appRef.current as HTMLInputElement).value
      let text = (textRef.current as HTMLInputElement).value
      api.post(`notify/msg/${app}`, { user, text })
    },
  }

  useF(() => {
    (userRef.current as HTMLInputElement).value = 'cyrus';
    (appRef.current as HTMLInputElement).value = 'test';
    (textRef.current as HTMLInputElement).value = 'notif';
  })

  return <InfoStyles>
    <InfoBody>
    {auth.user !== 'cyrus' ? `sorry, you aren't cyrus :/` : <Fragment>
      <InfoSection label='send notification' className='edit-container'>
        <input ref={userRef} type='text' placeholder='user' />
        <input ref={appRef} type='text' placeholder='app' />
        <input ref={textRef} type='text' placeholder='text' />
        <span className='button' onClick={handle.send}>send</span>
      </InfoSection>
    </Fragment>}
    </InfoBody>
  </InfoStyles>
}