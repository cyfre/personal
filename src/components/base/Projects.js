import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Title, Description } from './Base';
import { projects } from '../../pages/search';

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

const showcase = 'search wordbase graffiti terrain nonogram snakes snackman befruited turt-smurts insult slime floating speckle models'.split(' ')

export const Projects = () => (
  <Fragment>
  <Title>
    <h1>Projects</h1>
  </Title>

  <ProjectList>
    {showcase.map(key => <Fragment key={key}>
      <Link to={`/${key}`}>{projects[key][0] || key}</Link>
      <Description dangerouslySetInnerHTML={{__html: projects[key][1] || ''}} />
    </Fragment>)}
  </ProjectList>
  </Fragment>
)