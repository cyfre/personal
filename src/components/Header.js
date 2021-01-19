import React, { useMemo } from 'react';
import { Link, useRouteMatch, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { embedded } from './Contents';
import WikiLink from './WikiLink';

const Header = styled.div`
  width: 100%;
  height: 2.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  // padding-left: .25rem;
  // padding-top: .25rem;
  // padding-bottom: .25rem;
  position: relative;
  background: #131125;
  border-top-left-radius: .2rem;
  border-top-right-radius: .2rem;

  & > div {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
  }

  & .profile {
    height: 2rem;
    border-radius: 50%;
    // border: 1px solid var(--light);
    box-shadow: 1px 2px 4px #00000020;
  }
  & a, & a:hover {
    color: var(--light);
    padding-left: .25rem;
    text-shadow: 1px 2px 4px #00000020;
  }

  & .wiki-link, & .raw-link {
    font-size: 0.8rem;
    opacity: .9;
    margin-right: .5rem;
  }
`

export default () => {
  let { url } = useRouteMatch();
  let location = useLocation();

  const isImplicitProject = useMemo(() => {
    let subdomain = url.split('/').filter(p => p)[0];
    return subdomain !== 'projects';
  }, [url]);

  const crumbs = useMemo(() => {
    let total = '';
    let crumbs = [];
    url.split('/').filter(p => p).forEach(part => {
      total += '/' + part;
      crumbs.push(total);
    });
    return crumbs;
  }, [url]);

  const isEmbeddedProject = useMemo(() => {
    let project = url.split('/').filter(p => p && p !== 'projects')[0];
    return embedded.includes(project);
  }, [url]);

  return (
    <Header id="header">
      <div>
        <Link to="/">
          <img className="profile" src="/profile.jpeg" alt="profile"/>
        </Link>
        {isImplicitProject && <Link to='/projects'>/projects</Link>}
        {crumbs.map(crumb => <Link to={crumb} key={crumb}>/{crumb.split('/').pop()}</Link>)}
      </div>
      <div>
        {isEmbeddedProject && <a className='raw-link' href={`/raw${crumbs[0]}${location.hash}`}>[ view raw ]</a>}
        <WikiLink path={url} />
      </div>
    </Header>
  )
}
