import React, { useState, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { useRouteMatch } from 'react-router-dom';
import api from '../lib/api'
import { useF, useAuth } from '../lib/hooks'
import { handleAuth, sha256 } from '../lib/auth';
import { InfoStyles, InfoBody, InfoSection, InfoLoginBlock } from '../components/Info'


// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  let auth = useAuth();
  let [views, setViews] = useState(undefined);

  const handle = {
    load: () => {
      api.get('i/views').then(({ value }) => setViews(value))
    },
  }
  useF(handle.load)

  return <InfoStyles>

    <InfoBody>
    {auth.user !== 'cyrus' ? `you aren't cyrus, sorry :/` : <Fragment>
      <InfoSection label='views'>{views || ''}</InfoSection>
    </Fragment>}
    </InfoBody>
  </InfoStyles>
}