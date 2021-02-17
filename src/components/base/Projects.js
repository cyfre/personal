import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Title, Description } from './Base';

const ProjectList = styled.div`
  & > a {
    font-size: .75rem;
    // display: block;
    color: var(--light);
    text-decoration: underline;
    width: 40%;
    margin-right: .5rem;
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
    width: 55%;
    display: inline-block;
    margin-top: .1rem;
    vertical-align: top;
    float: left;
    &::after {
      content: '';
      display: block;
    }
  }
`

export const Projects = () => (
  <Fragment>
  <Title>
    <h1>Projects</h1>
  </Title>

  <ProjectList>
    <Link to="/terrain">terrain generation</Link>
    <Description>
      procedurally generated landscape
    </Description>
    <Link to="/nonogram">nonogram solver</Link>
    <Description>
      created to solve puzzles from the app <a href="https://apps.apple.com/us/app/picture-cross/id977150768">Picture Cross</a>, aka <a href="https://en.wikipedia.org/wiki/Nonogram">nonograms</a>
    </Description>
    <Link to="/snakes">snakes</Link>
    <Description>
      one- or two-player co-op game of snake!
    </Description>
    <Link to="/wordbase">wordbase</Link>
    <Description>
      clone of Wordbase (discontinued word game)
    </Description>
    <Link to="/snackman">snackman</Link>
    <Description>
      it's kinda like Pac-Man!
    </Description>
    <Link to="/befruited">befruited</Link>
    <Description>
      bejeweled but with fruit!
    </Description>
    <Link to="/graffiti">graffiti wall</Link>
    <Description>
      graffiti wall open to everyone
    </Description>
    <Link to="/turt">turt smurts</Link>
    <Description>
      wise turtle, 50/50 mix of user content and <a href="api.quotable.io">api.quotable.io/random</a>
    </Description>
    <Link to="/insult">insult</Link>
    <Description>
      idk sometimes it's funny
    </Description>
    <Link to="/floating">floating</Link>
    <Description>
      shifting Delaunay triangulation
    </Description>
    <Link to="/models">models</Link>
    <Description>
      simple 3d trees & things created in Blender
    </Description>

  </ProjectList>
  </Fragment>
)