import React, { useEffect, useState } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';

import WikiLink from './WikiLink';

const Header = styled.div`
  width: 100%;
  height: 2.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding-left: .25rem;
  position: relative;

  & .profile {
    height: 2rem;
    border-radius: 50%;
    border: 1px solid var(--light);
    box-shadow: 1px 2px 4px #00000020;
  }
  & a {
    color: var(--dark);
    padding-left: .25rem;
    text-shadow: 1px 2px 4px #00000020;
  }
  & .wiki-link {
    font-size: 0.8rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0 .5rem;
    position: absolute;
    right: 0;
  }
`

export default () => {
  let { url } = useRouteMatch();
  let [crumbs, setCrumbs] = useState([]);

  let subdomain = url.split('/').filter(p => p)[0];
  let isImplicitProject = ['projects', 'api'].indexOf(subdomain) === -1;

  useEffect(() => {
    // if (isImplicitProject) url = '/projects' + url
    let total = '';
    let crumbs = [];
    url.split('/').filter(p => p).forEach(part => {
      total += '/' + part;
      crumbs.push(total);
    });
    setCrumbs(crumbs);
  }, [url]);

  return (
    <Header id="header">
      <Link to="/">
        <img className="profile" src="/profile.jpeg" alt="I'm sitting on a rock"/>
      </Link>
      {/* <Link to='/'>/ home</Link> */}
      {isImplicitProject && <Link to='/projects'>/ projects</Link>}
      {crumbs.map(crumb => {
        return <Link to={crumb} key={crumb}>/ {crumb.split('/').pop()}</Link>
      })}
      <WikiLink path={url} />
    </Header>
  )
}
