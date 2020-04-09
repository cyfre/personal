import React, { Fragment, Suspense, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Link, Switch, useRouteMatch } from 'react-router-dom';
import * as serviceWorker from './serviceWorker';
import './index.css';

// homepage
import Home from 'pages/home';

// static vanilla js projects
import project from 'lib/project';

// dynamic content
import Content from 'pages/content';

const Header = () => {
  let { url } = useRouteMatch();
  let [crumbs, setCrumbs] = useState([]);

  useEffect(() => {
    let total = '';
    let crumbs = [];
    url.split('/').filter(p => p).forEach(part => {
      total += '/' + part;
      crumbs.push(total);
    });
    setCrumbs(crumbs);
  }, [url]);

  return (
    <div id="header">
      <Link to="/">
        <img className="profile" src="/profile.jpeg" alt="I'm sitting on a rock"/>
      </Link>
      <Link to='/'>/ home</Link>
      {crumbs.map(crumb => {
        return <Link to={crumb} key={crumb}>/ {crumb.split('/').pop()}</Link>
      })}
    </div>
  )
}

const Main = () => (
  <div id='main'>
    <Switch>
      <Route exact path="/terrain" component={project('/terrain/terrain.html')} />
      <Route exact path="/nonogram" component={project('/nonogram/nonogram.html')} />
      <Route exact path="/snakes" component={project('/snakes/snakes.html')} />
      <Route path='/:id' component={Content} />
    </Switch>
  </div>
)

const Footer = () => (
  <div id="footer" className="centering">
    <span className="signature">Cyrus Freshman 2020</span>
  </div>
)

const App = () => (
  <Router>
    <Switch>
      <Route exact path='/(|projects|about)' component={Home} />
      <Route path='*' component={() => (
        <Fragment>
          <Header />
          <Main />
          <Footer />
        </Fragment>
      )} />
    </Switch>
  </Router>
);

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
