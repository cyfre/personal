import React, { useState, useRef, Fragment } from 'react';
import api from '../lib/api';
import { randAlphanum } from '../lib/util';
import { useRouteMatch, useHistory, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useE, useF, useAuth } from '../lib/hooks';
import { InfoStyles, InfoBody, InfoSection, InfoUser, InfoLine, InfoLabel } from '../components/Info'

const ScoreEntry = ({entry, handle}) => {
  return (
    <InfoLine className='record'>
      <span className='app entry link' onClick={() => {
        handle.setApp(entry.app)
        window.getSelection().removeAllRanges()
      }}>
        {entry.label}
      </span>
      <span className='user'>
        {entry.user}
      </span>
      <span className='score'>
        {entry.score}
      </span>
    </InfoLine>
    // <InfoLine label={first.user}>
    //   <div className='record'>
    //     {`${record.app}: ${first.score}`}
    //   </div>
    // </InfoLine>
  )
}
const ScoreList = ({records, app, handle}) => {
  let entries;
  if (app) {
    let record = records.find(r => r.app === app)
    entries = record.scores.map((s, i) => ({
      app,
      label: `${i+1}${i<1?'st' :i<2?'nd' :i<3?'rd' :'th'}`,
      user: s.user,
      score: s.score
    }))
  } else {
    entries = records.map(r => ({
      app: r.app,
      label: r.app,
      user: r.scores[0].user,
      score: r.scores[0].score
    }))
  }
  return <Fragment>
    {entries.map((entry, i) => <ScoreEntry key={i} {...{ entry, handle }} />)}
  </Fragment>
}

export default () => {
  let auth = useAuth()
  let [isGlobal, setGlobal] = useState(!auth.user)
  let [records, setRecords] = useState(undefined)
  let history = useHistory()
  let match = useRouteMatch('/records/:app')
  let [app, setApp] = useState(match?.params.app)

  const handle = {
    setApp,
    load: () => {
      api.get('scores/').then(data => {
        console.log(data)
        setRecords(data)
      })
    },
  }

  useF(auth.user, handle.load)
  useF(app, () => {
    window.history.replaceState(null, '/records', `/records/${app || ''}`)
  })

  const appBadges = [
    app ? app : '',
    app ? { text: 'back', func: () => setApp('') } : ''
  ];
  return (
  <Style>
    <InfoBody className={app ? 'app' : ''}>
      {records ? <Fragment>
        {records.user ?
        <InfoSection labels={[
          'personal',
          ...appBadges
        ]}>
          <ScoreList records={records.user} {...{ app, handle }} />
        </InfoSection>
        :
        <InfoSection label='personal'>
          sign in to view personal records
        </InfoSection>
        }
        <InfoSection labels={[
          'global',
          ...appBadges
        ]}>
          <ScoreList records={records.global} {...{ app, handle }} />
        </InfoSection>
      </Fragment>
      :
      ''}
    </InfoBody>
  </Style>
  )
}


const Style = styled(InfoStyles)`
  .body {
    background: black;
    > * {
      min-height: 33%;
    }
    *, .entry.link {
      color: white;
      color: #67e3ff; // blue
      color: #74f77f; // green 67ff74 99ff99
      // text-shadow: 0 0 1px #67ff74, 0 0 1px #67ff74;
      // font-weight: bold;
    }
    &.app *, &.app .entry.link {
      // color: white;
      color: #67e3ff; // blue 67e3ff 99d9ff
    }
    &.app .record:nth-of-type(3) * {
      color: #ff6767; // red ff6767 ff9999
    }
    &.app .record:nth-of-type(4) * {
      color: #ffd767; // yellow ffd767 fe9
    }
    &.app .record:nth-of-type(5) * {
      color: #67e3ff; // blue
      color: #74f77f; // green
    }
    .label {
      // margin-top: 0; margin-bottom: 0;
      border: 2px solid white;
      opacity: 1;
      // background: #ffffff33;
      background: black;
      color: white;
      // font-size: 1rem;
      color: black;
      background: white;
    }
    .button {
      border-color: white;
      color: white;
    }
  }
  .record {
    white-space: pre;
    width: 100%;
    display: flex;
    > * {
      display: inline-block;
    }
    .app, .user {
      min-width: 7rem
    }
  }
`