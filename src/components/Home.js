import React, { Fragment, useEffect } from 'react';
import { Route, Link, Switch, useRouteMatch, Redirect } from 'react-router-dom';
import styled from 'styled-components';
import Contact from './Contact';

import WikiLink from './WikiLink';

const Home = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  @media (max-width: 30rem) {
    &.darken {
      // background-color: rgba(0, 0, 0, .042);
    }
  }

  & #before {
    flex-grow: 4;
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
    color: #ddffe4; // #c0fbcd; // #6e7f90
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

  @media (min-width: 30rem) {
    width: 22rem;
    padding: 1rem;
    border: 2px solid var(--light);
    &.darken {
      // background-color: rgba(0, 0, 0, .042);
    }
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

const Title = styled.div`
  margin: 0;
  padding: 0.25rem 0 1rem 0;
  text-align: center;
  margin-bottom: 1rem;
  & > .imgDiv {
    width: 50%;
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
      border: 2px solid var(--light);
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

const Links = styled.div`
  font-size: 1rem;
  width: 0;

  position: fixed;
  top: 0;
  padding: 1rem;
  @media (min-width: 30rem) {
    position: absolute;
    padding: 0;
    top: .5rem;
    font-size: .8rem;
    // top: .25rem;
  }
  &.base {
    position: absolute;
    padding: 0;
    top: 3rem;
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

const Description = styled.p`
  font-size: .8rem;
`

const ProjectList = styled.div`
  & > a {
    font-size: .8rem;
    // display: block;
    color: var(--light);
    text-decoration: underline;
    width: 40%;
    display: inline-block;
    float: left;
    &:hover {
      color: var(--light);
    }
  }
  & > span, & > p {
    font-size: .6rem;
    margin-bottom: .67rem;
    // margin-right: .5rem;
    // position: relative;
    // left: .5rem;
    width: 60%;
    display: inline-block;
    margin-top: .1rem;
    vertical-align: top;

    &::after {
      content: '';
      display: block;
    }
  }
`

const Projects = () => (
  <Fragment>
  <Title>
    <h1>Projects</h1>
  </Title>

  <ProjectList>
    <Link to="/terrain">terrain generation</Link>
    <Description>
      A procedurally generated landscape
    </Description>
    <Link to="/nonogram">nonogram solver</Link>
    <Description>
      Created to solve puzzles from the app <a href="https://apps.apple.com/us/app/picture-cross/id977150768">Picture Cross</a>, aka <a href="https://en.wikipedia.org/wiki/Nonogram">nonograms</a>
    </Description>
    <Link to="/snakes">snakes</Link>
    <Description>
      A one- or two-player co-op game of snake!
    </Description>
    <Link to="/snackman">snackman</Link>
    <Description>
      It's kinda like Pac-Man!
    </Description>
    <Link to="/befruited">befruited</Link>
    <Description>
      Bejeweled but with fruit!
    </Description>
    <Link to="/graffiti">graffiti wall</Link>
    <Description>
      A graffiti wall open to everyone
    </Description>
    <Link to="/turt">turt smurts</Link>
    <Description>
      A wise turtle, 50/50 mix of user content and <a href="api.quotable.io">api.quotable.io/random</a>
    </Description>
    <Link to="/cloud">cloud</Link>
    <Description>
      A pretty rotating cube
    </Description>
    <Link to="/floating">floating</Link>
    <Description>
      A shifting Delaunay triangulation
    </Description>
    <Link to="/models">models</Link>
    <Description>
      Simple 3d trees & things created in Blender
    </Description>

  </ProjectList>
  </Fragment>
)

const About = () => (
  <Fragment>
  <Title>
    <h1>About</h1>
  </Title>

  <Description>
    Hi, I'm Cyrus! I've been coding since 2013, I graduated from <a href="https://en.wikipedia.org/wiki/University_of_Massachusetts_Amherst">UMass Amherst</a> in 2019, and I'm currently working as a software developer at <a href="https://en.wikipedia.org/wiki/Amazon_Robotics">Amazon Robotics</a> while living in Boston
  </Description>
  <Description>
    I enjoy <a href="https://en.wikipedia.org/wiki/Twilight_Imperium">intense board games</a>, indoor rock climbing, and general outdoorsy things like hiking, camping, and skiing
  </Description>
  <br />
  <Contact />
  </Fragment>
)

const ContactPage = () => (
  <Fragment>
  <Title>
    <h1>Contact</h1>
  </Title>

  <Contact />
  </Fragment>
)

const Base = () => (
  <Fragment>
  <Title>
    <div className="imgDiv">
      <img src="/profile.jpeg" alt="profile"/>
    </div>
    <h1>Cyrus Freshman</h1>
    <p>Software Developer</p>
    <p>B.S. in Computer Science</p>
  </Title>

  <Link to="/terrain">terrain generation</Link>
  <Link to="/nonogram">nonogram solver</Link>
  <Link to="/snakes">snakes</Link>
  </Fragment>
)

export default () => {
  let { url } = useRouteMatch();
  let isBase = url === '/';
  useEffect(() => { document.title = 'Cyrus Freshman'; }, []);
  return (
    <Home id="home" className={isBase ? "" : "darken"}>
      <div id="before"></div>

      <Box className={isBase ? "" : "darken"}>
        <Links className={"left " + (isBase ? "base" : "")}>
          <Link to="/">/home</Link>
          <Link to="/about">/about</Link>
          <Link to="/projects">/projects</Link>
        </Links>
        <Links className={"right " + (isBase ? "base" : "")}>
          <a href="https://github.com/cfreshman">github</a>
          <a href="https://twitter.com/cyrusfreshman">twitter</a>
          <a href="https://www.linkedin.com/in/cfreshman/">linkedin</a>
        </Links>
        <Switch>
          <Route exact path='/' component={Base} />
          <Route exact path='/about' component={About} />
          <Route exact path='/projects' component={Projects} />
          <Route exact path='/contact' component={ContactPage} />
        </Switch>
        <div>
          <WikiLink path={url} />
        </div>
      </Box>

      <div id="after"></div>
    </Home>
  )
}