import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import styled from 'styled-components'
import * as serviceWorker from './serviceWorker'
import './index.css'

import { Base } from './components/base/Base'

import { Header } from './components/Header'
import { Main } from './components/Main'

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

  @media (max-width: 30.01rem) {
    width: calc(100% - 0.6rem);
    height: calc(100% - 0.6rem);
    margin: 0.3rem;
  }
`

const App = () => (
  <Router>
    <Switch>
      <Route exact path='/(|projects|about|contact)' component={Base} />
      <Route path='*'>
        <Style>
          <Header />
          <Main />
        </Style>
      </Route>
    </Switch>
  </Router>
)

ReactDOM.render(<App />, document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
