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
  let [counts, setCounts] = useState([]);

  const handle = {
    load: async () => {
      setCounts(await Promise.all(
        'site/views 42'
        .split(' ').map(spacekey => api.get(`/counter/${spacekey}`))))
    },
  }
  useF(handle.load)

  return <InfoStyles>

    <InfoBody>
    {auth.user !== 'cyrus' ? `you aren't cyrus, sorry :/` : <Fragment>
      {counts.map((counter, i) =>
      <InfoSection key={i} label={`${counter.space === 'default' ? '' : counter.space + '/'}${counter.key}`}>
        {counter.value}
      </InfoSection>)}
    </Fragment>}
    </InfoBody>
  </InfoStyles>
}