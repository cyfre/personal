import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Title } from './Base';

export const Home = () => (
  <Fragment>
  <Title>
    <div className="imgDiv">
      <img src="/profile.jpeg" alt="profile"/>
    </div>
    <h1>Cyrus Freshman</h1>
    <p>Software Developer</p>
    <p>B.S. in Computer Science</p>
  </Title>

  <Link to="/wordbase">wordbase (word game)</Link>
  {/* <Link to="/graffiti">graffiti wall</Link> */}
  <Link to="/terrain">terrain generation</Link>
  <Link to="/nonogram">nonogram solver</Link>
  </Fragment>
)