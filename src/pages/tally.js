import React, { useState, useRef, Fragment } from 'react';
import api from '../lib/api';
import { randAlphanum } from '../lib/util';
import { useRouteMatch, useHistory, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useE, useF, useAuth, useInterval, useEventListener } from '../lib/hooks';
import { InfoStyles, InfoBody, InfoSection, InfoUser, InfoLine, InfoLink, InfoLabel, InfoLoginBlock } from '../components/Info'

let calendar = []
let now = Date.now()
let dayMs = 1000 * 60 * 60 * 24
for (let i = 0; i < 90; i++) {
  calendar.push(new Date(now - dayMs*i))
}

let months = 'Jan Feb Mar Apr May Jun Jul Sep Oct Nov Dec'.split(' ')
function isLeap(year) {
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
}
let monthDays = `31 ${isLeap(new Date().getFullYear()) ? '29' : '28'} 31 30 31 30 31 31 30 31 30 31`.split(' ').map(Number)

export default () => {
  let auth = useAuth()
  let [term, setTerm] = useState(window.decodeURIComponent(window.location.hash?.slice(1)) || '');
  let [tally, setTally] = useState(undefined)
  let [tallyCalendar, setTallyCalendar] = useState({})
  let [tallyMonth, setTallyMonth] = useState({})
  let [error, setError] = useState('')
  let newTermRef = useRef()
  let [edit, setEdit] = useState(false)
  let [confirm, setConfirm] = useState(false)
  let renameRef = useRef()

  const handle = {
    load: () => {
      auth.user && api.get(`/tally`).then(data => {
        // console.log(data)
        setError('')
        setTally(data.tally)
        if (!term && !tally) {
          setTerm(Object.keys(data.tally.terms)[0] || '')
        }
      }).catch(e => setError(e.error))
    },
    tally: (time) => {
      // console.log(time)
      term && auth.user && api.post(`/tally/${term}/${time}`).then(data => {
        // console.log(data)
        setError('')
        setTally(data.tally)
      }).catch(e => setError(e.error))
    },
    new: () => {
      setTerm(newTermRef.current.value)
    },
    delete: () => {
      term && auth.user && api.delete(`/tally/${term}`).then(data => {
        // console.log(data)
        setError('')
        setTally(data.tally)
        setTerm('')
        setConfirm(false)
      }).catch(e => setError(e.error))
    },
    rename: () => {
      let name = renameRef.current.value
      name && term && auth.user && api.post(`/tally/${term}/rename/${name}`).then(data => {
        // console.log(data)
        setError('')
        setTally(data.tally)
        setTerm(name)
        setEdit(false)
      }).catch(e => setError(e.error))
    },
    generateTallyCalendar: () => {
      tallyCalendar = {}
      tallyMonth = {}
      let currMonth = new Date().getMonth()
      if (term && tally && tally.terms[term]) {
        tally.terms[term].map(entry => {
          let date = new Date(entry.t)
          let dateString = date.toDateString()
          tallyCalendar[dateString] = (tallyCalendar[dateString] || []).concat(entry.t)

          let month = date.getMonth()
          let monthEntry = tallyMonth[month] || {
            count: 0,
            total: month === currMonth ? new Date().getDate() : monthDays[month],
          }
          monthEntry.count += 1
          tallyMonth[month] = monthEntry
        })
      }
      setTallyCalendar(tallyCalendar)
      setTallyMonth(tallyMonth)
    },
  };
  useF(auth.user, () => {
    handle.load();
  })
  useF(term, () => {
    window.history.replaceState(null, '/tally', term ? `/tally#${term}` : '/tally')
  })
  useF(term, tally, () => {
    handle.generateTallyCalendar()
  })
  useEventListener(window, 'focus', handle.generateTallyCalendar)
  useF(edit, () => {
    if (edit) {
      renameRef.current.value = term
    }
  })

  return (
  <Style>
    {auth.user ?
    <InfoBody>
      {!error ? ''
      : <div className='error' style={{color: 'red', minHeight: '0'}}>{error}</div>}
      {term && tally ?
      <Fragment>
        {/* <InfoSection>
          <div className='terms'>
            {Object.keys(tally.terms).map(t =>
              <div className='term' onClick={() => setTerm(t)}>{t}</div>)}
          </div>
        </InfoSection> */}
        <InfoLine><InfoLabel labels={[
          { text: 'menu', func: () => setTerm('') },
          { text: edit ? 'cancel' : 'edit', func: () => { setEdit(!edit); setConfirm(false) } },
          (edit && !confirm) ? { text: 'delete', func: () => setConfirm(true) } : '',
          (confirm) ? { text: 'cancel', func: () => setConfirm(false) } : '',
          (confirm) ? { text: 'really delete', func: handle.delete } : '',
        ]} /></InfoLine>
        <InfoSection>
          {edit ?
          <div className='edit-container'>
            <input ref={renameRef} type='text' placeholder='rename'
            onKeyDown={e => e.key === 'Enter' && handle.rename()}/>
            <span className='button' onClick={handle.rename}>rename</span>
          </div>
          :
          <div className='terms'>
            {Object.keys(tally.terms).concat(tally.terms[term] ? [] : term).map(t =>
              <div key={t} className={t === term ? 'selected term' : 'term'} onClick={() => setTerm(t)}>
                {t}
              </div>)}
            {/* <div className='selected term'>{term}</div>
            {Object.keys(tally.terms).filter(t => t !== term).map(t =>
              <div className='term' onClick={() => setTerm(t)}>{t}</div>)} */}
          </div>
          }
          <div className='calendar'>
            {Array.from({ length: 6 - calendar[0].getDay() }).map((_, i) =>
              <div className='date spacer' key={i}></div>)}
            {calendar.map((date, i) => {
              let dateString = date.toDateString()
              let dateTally = tallyCalendar[dateString]
              let dateMonth = tallyMonth[date.getMonth()] || { count: 0, total: 1 }
              return <div className={dateTally ? 'date tally' : 'date'} key={i}
                onClick={() => handle.tally(dateTally ? dateTally[0] : date.valueOf())}>
                {date.getDate()}
                {date.getDay() === 6 && date.getDate() < 8
                  ? <div className='month'>{months[date.getMonth()]}</div>
                  // ? <div className='month'>{months[date.getMonth()]} {Math.ceil(100 * dateMonth.count / dateMonth.total)}%</div>
                  : ''}
              </div>
            })}
          </div>
          {/* {tally?.terms[term]?.map((obj, i) =>
              <InfoLine key={i}>
                {obj}
              </InfoLine>)} */}
        </InfoSection>
      </Fragment>
      :
      <Fragment>
        <InfoSection label='tallies'>
        {!tally?.terms ? '' : Object.keys(tally.terms).map((term, i) =>
          <InfoLink key={i} onClick={() => setTerm(term)}>
            {term}
          </InfoLink>)}
      </InfoSection>
      {tally ?
      <InfoSection label='new'>
        <div className='edit-container'>
          <input ref={newTermRef} type='text' placeholder='enter name'
            onKeyDown={e => e.key === 'Enter' && handle.new()}/>
          <span className='button' onClick={handle.new}>create</span>
        </div>
      </InfoSection>
      : ''}
      </Fragment>}
    </InfoBody>
    :
    <InfoBody>
      <InfoLoginBlock to='use /tally' />
    </InfoBody>}
  </Style>
  )
}


const Style = styled(InfoStyles)`
  .terms {
    display: flex;
    flex-wrap: wrap;
    .term {
      border-radius: .2rem;
      padding: 0 .3rem;
      width: fit-content;
      margin-right: .25rem;
      text-decoration: underline;
      cursor: pointer;
      &.selected {
        background: #0175ff;
        color: white;
        text-decoration: none;
      }
    }
  }
  .calendar {
    margin-top: .5rem;
    max-width: 21rem;
    display: flex;
    flex-wrap: wrap;
    flex-direction: row-reverse;
    .date {
      width: calc(14.28% - .4rem);
      height: calc(3rem - .4rem);
      border-radius: .2rem;
      padding: 0 .3rem;
      margin: .2rem;
      &.spacer {
        // border-color: transparent;
      }
      &:not(.spacer) {
        // border: 2px solid #00000022;
        border: .12rem solid #00000022;
        // box-shadow: 1px 1px 2px 1px #00000022;
        // box-shadow: 0px 2px 4px 1px #00000022;
      }

      cursor: pointer;
      font-size: .8rem;
      color: #000000dd;
      &.tally {
        background: #0175ff;
        color: white;
      }

      position: relative;
      .month {
        position: absolute;
        width: 0;
        right: -.5rem;
        top: 0;
      }
    }
  }
  .edit-container {
    display: flex;
    flex-direction: column;
    input {
      // margin-top: 0;
    }
    .button {
      align-self: flex-end;
    }
  }
`