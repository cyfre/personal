import React, { useState, useRef, Fragment } from 'react';
import api from '../lib/api';
import { randAlphanum, toYearMonthDay } from '../lib/util';
import { useRouteMatch, useHistory, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useE, useF, useAuth, useInterval, useEventListener } from '../lib/hooks';
import { InfoStyles, InfoBody, InfoSection, InfoUser, InfoLine, InfoLink, InfoLabel, InfoLoginBlock } from '../components/Info'

let calendar = []
let today = new Date().getDate()
for (let i = 0; i < 90; i++) {
  let day = new Date()
  day.setDate(today - i)
  calendar.push(day)
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
  let [create, setCreate] = useState(false)
  let [edit, setEdit] = useState(false)
  let [confirm, setConfirm] = useState(false)
  let renameRef = useRef()

  const handle = {
    load: () => {
      auth.user && api.get(`/tally`).then(data => {
        console.log(data)
        setError('')
        setTally(data.tally)
        if (!term && !tally) {
          setTerm(Object.keys(data.tally.terms)[0] || '')
        }
      }).catch(e => setError(e.error))
    },
    tally: (date) => {
      // console.log(time)
      term && auth.user && api.post(`/tally/${term}/${date}`).then(data => {
        // console.log(data)
        setError('')
        setTally(data.tally)
      }).catch(e => setError(e.error))
    },
    new: () => {
      let newTerm = newTermRef.current.value
      setTerm(newTerm)
      setCreate(false)
      api.put(`/tally/${newTerm}`).then(data => {
        setError('')
        setTally(data.tally)
      }).catch(e => setError(e.error))
    },
    delete: () => {
      if (term && auth.user) {
        if (tally.terms[term]) {
          api.delete(`/tally/${term}`).then(data => {
            // console.log(data)
            setError('')
            setTally(data.tally)
            setTerm('')
            setConfirm(false)
            setEdit(false)
          }).catch(e => setError(e.error))
        } else {
          setError('')
          setTerm('')
          setConfirm(false)
          setEdit(false)
        }
      }
    },
    rename: () => {
      let name = renameRef.current.value
      if (name && auth.user) {
        if (term) {
          api.post(`/tally/${term}/rename/${name}`).then(data => {
            // console.log(data)
            setError('')
            setTally(data.tally)
            setTerm(name)
            setEdit(false)
          }).catch(e => setError(e.error))
        } else {
          setTerm(newTermRef.current.value)
        }
      }
    },
    generateTallyCalendar: () => {
      tallyCalendar = {}
      tallyMonth = {}
      let currMonth = new Date().getMonth()
      if (term && tally && tally.terms[term]) {
        tally.terms[term].map(entry => {
          let dateString = entry.d
          // let dateString = entry.t ? toYearMonthDay(new Date(entry.t)) : entry.d
          tallyCalendar[dateString] = (tallyCalendar[dateString] || []).concat(entry.d)

          let month = new Date(entry.d).getMonth()
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
    window.history.replaceState(null, '/tally', term ? `/tally/#${term}` : '/tally')
  })
  useF(term, tally, () => {
    handle.generateTallyCalendar()
  })
  useEventListener(window, 'focus', handle.generateTallyCalendar)
  useF(edit, () => {
    if (edit) {
      renameRef.current.value = term
      renameRef.current.focus()
    }
  })
  useF(create, () => {
    if (create) {
      newTermRef.current.focus()
    }
  })

  return (
  <Style>
    {auth.user ?
    <InfoBody>
      {!error ? ''
      : <div className='error' style={{color: 'red', minHeight: '0'}}>{error}</div>}
      {tally ?
      <Fragment>
        <InfoSection className='content'>
          <div className='calendar'><div className='scroller'>
            {Array.from({ length: 6 - calendar[0].getDay() }).map((_, i) =>
              <div className='date spacer' key={i}></div>)}
            {calendar.map((date, i) => {
              let dateString = toYearMonthDay(date)
              let dateTally = tallyCalendar[dateString]
              let dateMonth = tallyMonth[date.getMonth()] || { count: 0, total: 1 }
              return <div className={dateTally ? 'date tally' : 'date'} key={i}
                onClick={() => handle.tally(dateTally ? dateTally[0] : dateString)}>
                {date.getDate()}
                {date.getDay() === 6 && date.getDate() < 8
                  ? <div className='month'>{months[date.getMonth()]}</div>
                  // ? <div className='month'>{months[date.getMonth()]} {Math.ceil(100 * dateMonth.count / dateMonth.total)}%</div>
                  : ''}
              </div>
            })}
          </div></div>
        </InfoSection>
        <InfoLine>
          <InfoLabel labels={[
            { text: create ? 'cancel' : 'new', func: () => { setCreate(!create) } },
            create || !term ? '' : { text: edit ? 'cancel' : 'edit', func: () => { setEdit(!edit); setConfirm(false) } },
            (edit && !confirm) ? { text: 'delete', func: () => setConfirm(true) } : '',
            (confirm) ? { text: 'cancel', func: () => setConfirm(false) } : '',
            (confirm) ? { text: 'really delete', func: handle.delete } : '',
          ]} />
        </InfoLine>
        <InfoSection>
          {edit ?
          <div className='edit-container'>
            <input ref={renameRef} type='text' placeholder='rename'
            onKeyDown={e => e.key === 'Enter' && handle.rename()}/>
            <span className='button' onClick={handle.rename}>rename</span>
          </div>
          : create ?
          <div className='edit-container'>
            <input ref={newTermRef} type='text' placeholder='enter name'
              onKeyDown={e => e.key === 'Enter' && handle.new()}/>
            <span className='button' onClick={handle.new}>create</span>
          </div>
          :
          <div className='terms'>
            {Object.keys(tally.terms).concat(!term || tally.terms[term] ? [] : term).map(t =>
              <div key={t} className={t === term ? 'selected term' : 'term'} onClick={() => setTerm(t)}>
                {t}
              </div>)}
          </div>
          }
        </InfoSection>
      </Fragment>
      : ''}
    </InfoBody>
    :
    <InfoBody>
      <InfoLoginBlock to='use /tally' />
    </InfoBody>}
  </Style>
  )
}


const Style = styled(InfoStyles)`
  .body {
    display: flex;
    flex-direction: column;
    .content {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      .calendar {
        height: 0;
        flex-grow: 1;
        margin-bottom: .75rem;
        margin-top: 0;
        overflow: scroll;
        flex-direction: column-reverse;
        .scroller {
          max-width: 24.75rem;
          padding-right: 2rem;
          display: flex;
          flex-wrap: wrap-reverse;
          flex-direction: row-reverse;
          .date {
            width: calc(14.28% - .4rem);
            height: calc(3.25rem - .4rem);
          }
        }
      }
    }
    .terms {
      margin-top: .5rem;
      margin-bottom: .5rem;
      min-height: 3rem;
      align-items: flex-start;
    }
    .entry-line {
      // margin-bottom: 0;
    }
  }
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
    // max-width: 21rem;
    display: flex;
    flex-wrap: wrap;
    flex-direction: row-reverse;
    .date {
      width: calc(14.28% - .4rem);
      height: calc(3rem - .4rem);
      border-radius: .2rem;
      padding: 0 .3rem;
      // margin: .2rem;
      margin: .3rem .2rem .1rem .2rem;
      &.spacer {
        // border-color: transparent;
      }
      &:not(.spacer) {
        // border: 2px solid #00000022;
        // border: .12rem solid #00000022;
        // box-shadow: 1px 1px 2px 1px #00000022;
        // box-shadow: 0px 2px 4px 1px #00000022;
        border: .12rem solid transparent;
        background: #0000000d;
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
        color: #000000dd;
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