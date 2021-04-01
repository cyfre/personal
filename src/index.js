import React, { Fragment, useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route, Redirect, Switch, useHistory } from 'react-router-dom'
import styled from 'styled-components'
import * as serviceWorker from './serviceWorker'
import { useF, useInterval, useEventListener } from './lib/hooks'
import { useNotify } from './lib/notify'
import { io } from "socket.io-client"
import './index.css'

import { Base } from './components/base/Base'

import { Header } from './components/Header'
import { Main } from './components/Main'
import { useE } from './lib/hooks'
import { useIo } from './lib/io'
import { getSession, getStored, setSession, setStored } from './lib/store'
import { toYearMonthDay } from './lib/util'
import api from './lib/api'

const Style = styled.div`
  // background: #13112522
  // background: #13112544
  // background: #131125
  background: #ffffff44;
  display: flex;
  flex-direction: column;
  width: calc(100% - 1.2rem);
  height: calc(100% - 1.2rem);
  margin: 0.3rem 0.9rem 0.9rem 0.3rem;
  position: relative;
  border-radius: .2rem;
  z-index: 1;

  &::before {
    position: absolute;
    content: "";
    width: 100%;
    height: 100%;
    background: inherit;
    border-radius: inherit;
    z-index: -1;
  }
  &::after {
    position: absolute;
    top: -0.3rem; left: -0.3rem;
    content: "";
    width: calc(100% + 1.2rem);
    height: calc(100% + 1.2rem);
    background: linear-gradient(15deg,#609e98,#e2d291) fixed;
    z-index: -2;
  }

  &.shrink {
    transition: .5s;
    margin-left: auto;
    margin-right: auto;
    &::after {
      border-radius: .2rem;
    }
  }

  @media (max-width: 30.01rem) {
    width: calc(100% - 0.6rem);
    height: calc(100% - 0.6rem);
    margin-top: 0.3rem;
  }
`

const Util = () => {
  useNotify(useHistory());
  useIo()
  useF(() => {
    let lastVisitKey = 'lastVisit'
    let lastVisit = getSession(lastVisitKey)
    let today = toYearMonthDay(new Date())
    if (lastVisit !== today) {
      setSession(lastVisitKey, today)
      api.post('/counter/site/views')
    }
  })
  return <Fragment></Fragment>
}

const App = () => {
  return (
  <Router>
    <Util />
    <Switch>
      <Redirect exact path='/home' to='/' />
      <Route exact path='/(|projects|about)' component={Base} />
      <Route path='*'>
        <Style id='index'>
          <Header />
          <Main />
        </Style>
      </Route>
    </Switch>
  </Router>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
