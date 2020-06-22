import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import * as serviceWorker from './serviceWorker';
import './index.css';

import Home from './components/Home';

import Header from './components/Header';
import Main from './components/Main';
import Footer from './components/Footer';

const App = () => (
  <Router>
    <Switch>
      <Route exact path='/(|projects|about)' component={Home} />
      <Route path='*'>
        <Header />
        <Main />
        <Footer />
      </Route>
    </Switch>
  </Router>
);

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
