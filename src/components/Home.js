import React, { Fragment } from 'react';
import { Route, Link, Switch, useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';

import WikiLink from './WikiLink';

const Home = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  @media (max-width: 30rem) {
    &.darken {
      background-color: rgba(0, 0, 0, .042);
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
  }

  & p > a {
    color: #c0fbcd; // #6e7f90
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
      background-color: rgba(0, 0, 0, .042);
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
  & > img {
    width: 50%;
    border-radius: 50%;
    border: 2px solid var(--light);
    box-shadow: 1px 2px 4px #00000020;
    margin-bottom: .5rem;
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
    display: block;
    color: var(--light);
    text-decoration: underline;
    &:hover {
      color: var(--light);
    }
  }
  & > p {
    font-size: .64rem;
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
      A procedurally generated landscape, see <a href="https://www.redblobgames.com/articles/noise/introduction.html">Red Blob Games</a> for explanation of noise functions
    </Description>
    <Link to="/snakes">snakes</Link>
    <Description>
      A one- or two-player co-op game of snake!
    </Description>
    <Link to="/nonogram">nonogram solver</Link>
    <Description>
      Created to solve puzzles from the app <a href="https://apps.apple.com/us/app/picture-cross/id977150768">Picture Cross</a>, aka <a href="https://en.wikipedia.org/wiki/Nonogram">nonograms</a>
    </Description>
    <Link to="/graffiti">graffiti wall</Link>
    <Description>
      A graffiti wall open to everyone
    </Description>
    <Link to="/cloud">cloud</Link>
    <Description>
      [WIP] to learn react-three-fiber, starting from an <a href="https://github.com/react-spring/react-three-fiber#what-does-it-look-like">example in their docs</a>
    </Description>
    <Link to="/turt">turt smurts</Link>
    <Description>
      A turtle who has some smart things to say, 50/50 mix of user content and <a href="api.quotable.io">api.quotable.io/random</a>
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
    Hi, I'm Cyrus! I've been coding since 2013, I graduated from <a href="https://en.wikipedia.org/wiki/University_of_Massachusetts_Amherst">UMass Amherst</a> in 2019, and after seven months working for <a href="https://en.wikipedia.org/wiki/Amazon_Robotics">Amazon Robotics</a> I'm looking to transition into <a href="https://en.wikipedia.org/wiki/Educational_technology">EdTech</a> or another way I can give back what I've learned.
  </Description>
  <Description>
    I'm passionate about <a href="https://opensource.com/education/13/4/guide-open-source-education">open-source education</a>, rich interactive media (including <a href="https://en.wikipedia.org/wiki/Twilight_Imperium">intense board games</a>), and general outdoorsy things like hiking, camping, and bonfires.
  </Description>
  <Description>
    This site is for experimental projects – all subject to change. And please feel free to reach out!
  </Description>
  </Fragment>
)

const Base = () => (
  <Fragment>
  <Title>
    <img src="/profile.jpeg"/>
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
  let isBase = url === '/'
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
        </Switch>
        <div>
          <WikiLink path={url} />
        </div>
      </Box>

      <div id="after"></div>
    </Home>
  )
}