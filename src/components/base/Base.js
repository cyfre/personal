import React, { useEffect } from 'react';
import { Route, Link, Switch, useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';
import { Home } from './Home';
import { Projects } from './Projects';
import { About } from './About';

const Style = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: black;
  // background: linear-gradient(15deg,#609e98,#e2d291) fixed;
  @media (max-width: 30.01rem) {
    // background: #131125;
    &.darken {
      // background-color: rgba(0, 0, 0, .042);
    }
  }

  & #before {
    // flex-grow: 4;
    height: 1rem;
  }
  & #after {
    flex-grow: 5;
  }

  & .wiki-link {
    font-size: 0.8rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 0;
    bottom: -1.5rem;
    color: var(--light);
    opacity: .5;
  }

  & p > a, & span > a {
    color: rgb(155 228 170); // #ddffe4; // #c0fbcd; // #6e7f90
    text-decoration: none;
    &:hover {
      color: var(--light);
      text-decoration: underline;
    }
  }
`

const Box = styled.div`
  flex: 0 0 auto;
  color: var(--light);
  width: 20rem;
  max-width: 100%;
  margin: 1rem 0;
  border-radius: 0.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;

  padding: 1rem;
  background: #131125;
  width: calc(100% - 4rem);
  left: -.15rem;
  max-width: 32rem;
  border: none;
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
    left: -0.3rem;
    top: -0.3rem;
    content: "";
    width: calc(100% + 1.2rem);
    height: calc(100% + 1.2rem);
    background: linear-gradient(15deg, rgb(255, 145, 145) 0%, rgb(255, 227, 114) 100%) fixed;
    background: linear-gradient(15deg,#609e98,#e2d291) fixed;
    border-radius: .2rem;
    z-index: -2;
  }
  @media (max-width: 30.01rem) {
  }
  @media (min-width: 30rem) {
  }

  & > * {
    width: 100%;
    flex: 0 0 auto;
  }

  & > a {
    height: 3rem;
    padding: 0.75rem;
    border-top: 2px solid var(--light);
    color: inherit;
    text-decoration: none !important;

    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  & > a:last-of-type {
    border-bottom: 2px solid var(--light);
    margin-bottom: 0.25rem;
  }
  & > a::after {
    content: '>';
    float: right;
  }
  & > a:hover, & > a:active {
    background: var(--light);
    color: var(--dark);
  }
`
const Links = styled.div`
  font-size: 1rem;
  width: 0;

  position: fixed;
  top: 0;
  padding: 1rem;
  font-size: .8rem;

  position: absolute;
  padding: 0;
  top: .5rem;
  font-size: .8rem;
  top: .25rem;
  @media (min-width: 30rem) {
    position: absolute;
    padding: 0;
    top: .5rem;
    font-size: .8rem;
    top: .25rem;
  }
  &.base {
    position: absolute;
    padding: 0;
    // top: 3rem;
    top: .25rem;
    @media (min-width: 30rem) {
      font-size: .8rem;
      top: .25rem;
    }
  }

  & > a {
    display: block;
    color: var(--light);
    &:hover {
      color: var(--light);
    }
  }

  &.left {
    left: .5rem;
    direction: ltr;
  }
  &.right {
    right: .5rem;
    direction: rtl;
  }
`

export const Title = styled.div`
  margin: 0;
  padding: 0.25rem 0 1rem 0;
  text-align: center;
  margin-bottom: 1rem;
  & > .imgDiv {
    width: 42%;
    max-width: 10rem;
    position: relative;
    margin: auto;
    margin-bottom: .5rem;
    &::after {
      content: "";
      display: block;
      padding-bottom: 100%;
    }
    & > img {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      border-radius: 50%;
      // border: 2px solid var(--light);
      box-shadow: 1px 2px 4px #00000020;
    }
  }
  & > h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 400;
  }
  & > p {
    margin: 0;
    font-size: 0.8rem;
  }
`

export const Description = styled.p`
  font-size: .8rem;
`

export const Base = () => {
  let { url } = useRouteMatch();
  let isBase = url === '/';
  useEffect(() => { document.title = 'Cyrus Freshman'; }, []);
  return (
    <Style id='home'>
      <div id='before'></div>

      <Box>
        <Links className={"left " + (isBase ? "base" : "")}>
          <Link to="/">/home</Link>
          <Link to="/about">/about</Link>
          <Link to="/projects">/projects</Link>
        </Links>
        <Links className={"right " + (isBase ? "base" : "")}>
          <a href="https://github.com/cfreshman">github</a>
          <a href="https://twitter.com/freshman_dev">twitter</a>
          <a href="https://www.linkedin.com/in/cfreshman/">linkedin</a>
        </Links>
        <Switch>
          <Route exact path='/' component={Home} />
          <Route exact path='/about' component={About} />
          <Route exact path='/projects' component={Projects} />
        </Switch>
        {/* <div>
          <WikiLink path={url} />
        </div> */}
      </Box>

      <div id="after"></div>
    </Style>
  )
}