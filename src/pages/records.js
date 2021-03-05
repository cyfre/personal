import React, { useState, useRef, Fragment } from 'react';
import api from '../lib/api';
import { randAlphanum } from '../lib/util';
import { useRouteMatch, useHistory, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useE, useF, useAuth } from '../lib/hooks';
import { InfoStyles, InfoBody, InfoSection, InfoUser, InfoLine, InfoLabel } from '../components/Info'

const ScoreEntry = ({entry, handle}) => {
  return (
    <InfoLine className={
      (entry.openApp ? 'record entry link' : 'record')
      + (entry.isMember ? ' member' : '')
      } onClick={entry.openApp}>
      <span className='app'>
        {entry.label}
      </span>
      {entry.isGroup ? '' : <Fragment>
        {entry.openApp ?
        <span className='user'>
          {entry.user}
        </span>
        :
        <Link className='user entry link' to={`/u/${entry.user}`}>
          {entry.user}
        </Link>
        }
        <span className='score'>
          {entry.score}
        </span>
      </Fragment>}
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
    entries = record?.scores.map((s, i) => ({
      label: `${i+1}${i<1?'st' :i<2?'nd' :i<3?'rd' :'th'}`,
      user: s.user,
      score: s.score
    }))
  } else {
    let counts = {}
    records.forEach(r => {
      let page = r.app.split('+')[0]
      counts[page] = (counts[page] || 0) + 1
    })
    entries = []
    let grouped = {}
    records.forEach(r => {
      let page = r.app.split('+')[0]
      let label = r.app.replace(/\+/g, ' ')
      if (counts[page] > 1) {
        label = label.replace(`${page}`, ' ').trim()
        if (!grouped[page]) {
          grouped[page] = true
          if (label) {
            entries.push({
              label: page,
              isGroup: true,
            })
          }
        }
      }
      entries.push({
        label: label || page,
        user: r.scores[0].user,
        score: r.scores[0].score,
        openApp: () => {
          handle.setApp(r.app)
          window.getSelection().removeAllRanges()
        },
        isMember: counts[page] > 1 && label,
      })
    })
    // entries = records.map(r => ({
    //   app: r.app,
    //   label: r.app.replace(/\+/g, ' '),
    //   user: r.scores[0].user,
    //   score: r.scores[0].score,
    //   openApp: () => {
    //     handle.setApp(r.app)
    //     window.getSelection().removeAllRanges()
    //   },
    // }))
  }
  return <Fragment>
    {entries
    ? entries.map((entry, i) => <ScoreEntry key={i} {...{ entry, handle }} />)
    : `no records for '${app.replace(/\+/g, ' ')}'`}
  </Fragment>
}

export default () => {
  let auth = useAuth()
  let [records, setRecords] = useState(undefined)
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
    app ? app.replace(/\+/g, ' ') : '',
    app ? { text: 'view all', func: () => setApp('') } : ''
  ];
  return (
  <Style>
    <InfoBody className={app ? 'app' : ''}>
      {records ? <Fragment>
        <InfoSection labels={[
          'global',
          ...appBadges
        ]}>
          <ScoreList records={records.global} {...{ app, handle }} />
        </InfoSection>
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
    height: 100%;
    > * {
      min-height: 42%;
    }
    *, .entry.link {
      color: white;
      color: #67e3ff; // blue
      color: #74f77f; // green 67ff74 99ff99
      // text-shadow: 0 0 1px #67ff74, 0 0 1px #67ff74;
      // font-weight: bold;
    }
    &.app *, &.app .entry.link {
      color: #ffffffe0;
      // color: #67e3ff; // blue 67e3ff 99d9ff
    }
    &.app .record:nth-of-type(3) * {
      color: #ff6767; // red ff6767 ff9999
      color: #74f77f;
    }
    &.app .record:nth-of-type(4) * {
      color: #ffd767; // yellow ffd767 fe9
    }
    &.app .record:nth-of-type(5) * {
      color: #67ceff; // blue
      // color: #74f77f; // green
      color: #ff6767;
    }
    // &.app .record:nth-of-type(6) * {
    //   color: #67e3ff; // blue
    // }
    // &.app .record:nth-of-type(7) * {
    //   color: #67e3ff; // blue
    // }
    .label {
      border: 2px solid white;
      opacity: .95;
      color: black;
      background: white;
    }
    .button {
      opacity: .95;
      border-color: white;
      color: white;
    }
  }
  .record {
    white-space: pre;
    // width: 100%;
    width: fit-content;
    display: flex;
    > * {
      display: inline-block;
    }
    &.member .app {
      padding-left: 1rem;
    }
    .app {
      min-width: 8rem;
    }
    .user {
      min-width: 7rem;
    }
    // .app, .user {
    //   min-width: 9rem;
    // }
  }
`