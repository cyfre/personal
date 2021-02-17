import React, { Fragment } from 'react';
import { Contact } from './Contact';
import { Title, Description } from './Base';

export const About = () => (
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
  <Description>
    This site is little more than a random assortment of webdev experiments. Feel free to connect through the social links above or send a quick message below!
  </Description>
  <br />
  <Contact />
  </Fragment>
)