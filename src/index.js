import React, { Fragment, Suspense, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Link, Switch, Redirect, useRouteMatch } from 'react-router-dom';
import * as serviceWorker from './serviceWorker';
import './index.css';

// static vanilla js projects
import project from 'lib/project';

// dynamic content
import Content from 'pages/content';

const Home = () => {
  return (
    <div id="home">
      <div id="before"></div>

      <div id="box">
        <div id="title">
            <img src="profile.jpeg" alt="I'm sitting on a rock"/>
            <h1>Cyrus Freshman</h1>
            <p>Software Developer</p>
            <p>B.S. in Computer Science</p>
        </div>

        <a href="https://github.com/cfreshman">github.com/cfreshman</a>
        <a href="https://www.linkedin.com/in/cfreshman/">linkedin.com/in/cfreshman</a>
        <Link to="terrain/">terrain generation</Link>
        <Link to="nonogram/">nonogram solver</Link>
        <Link to="snakes/">snakes</Link>
      </div>

      <div id="after"></div>
    </div>
  )
}

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
    console.log(crumbs);
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
    <Suspense fallback={<div id="loading" className="centering">🐙<br/>Loading</div>}>
      <Switch>
        <Route exact path='/' component={Home} />
        <Route path='*' component={() => (
          <Fragment>
            <Header />
            <Main />
            <Footer />
          </Fragment>
        )} />
      </Switch>
    </Suspense>
  </Router>
);

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
