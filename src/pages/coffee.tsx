import React, { useState, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { useRouteMatch, Link } from 'react-router-dom';
import api from '../lib/api'
import { useF, useAuth, useEventListener } from '../lib/hooks'
import { InfoStyles, InfoBody, InfoSection, InfoLoginBlock } from '../components/Info'


// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  const coffeeRef = useRef()

  const resize = () => {
    let el = (coffeeRef.current as HTMLElement);
    let rect = el.parentElement.getBoundingClientRect()
    el.style.height = rect.height + 'px';
  }
  useF(resize)
  useEventListener(window, 'resize', resize)

  return <Style>
    <InfoBody>
      <p>buy me a coffee :-) or <Link to='/contact'>/contact</Link> for coffee in person!</p>
      <div className='coffee'>
        <iframe
          ref={coffeeRef}
          src='https://ko-fi.com/cfreshman/?hidefeed=true&widget=true&embed=true'
          title='cfreshman'></iframe>
      </div>
    </InfoBody>
  </Style>
}

const Style = styled(InfoStyles)`
  .body {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-bottom: 0;
    p {
      font-size: .75rem;
    }
    .coffee {
      flex-grow: 1;
      margin-left: -1rem;
      margin-right: -1rem;
      margin-bottom: 0;

      iframe {
        border: none;
        width: 100%;
        height: 100%;
        padding: 1rem;
        background: #f7f7f7;
      }
    }
  }
`