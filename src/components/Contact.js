import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import styled from 'styled-components';
import api from '../lib/api';

const Contact = styled.div`
  display: flex;
  flex-direction: column;
  font-size: .8rem;

  &.sent {
    opacity: .7;
    & > *:focus {
      outline: none;
    }
  }

  & * {
    color: var(--light);
    text-shadow: 1px 2px 4px #00000020;
  }

  & > * {
    border-radius: .2rem;
    margin-top: .5rem;
    &:first-child {
      margin-top: 0;
    }
    &:focus {
      outline-color: #ddffe4;
      outline-offset: 0.16rem;
    }
  }

  & .content, & .contact {
    border: 1px solid var(--light);
    background: rgba(255,255,255,.2);
    padding: .3rem;
    resize: none;

    &::placeholder {
      color: var(--light);
      opacity: .7;
      text-align: center;
    }
  }
  & .content::placeholder {
    padding-top: 2.5rem;
  }

  & .send, & .confirmation {
    align-self: flex-end;
    background: none;
    line-height: normal;
    padding: 0.3rem;
    border: none;
    padding: 0;
    &::before {
      content: "[ ";
    }
    &::after {
      content: " ]";
    }
  }
  & .send:hover {
    text-decoration: underline;
  }
  & .confirmation {
    cursor: default;
  }
`

export default () => {
  const content = useRef();
  const contact = useRef();
  const [sent, setSent] = useState(false);

  const handle = {
    send: e => {
      const msg = {
        content: content.current.value,
        contact: contact.current.value,
      };
      console.log(msg);
      if (msg.content.length) {
        api.create('/msg', msg, data => {
          console.log(data);
        });
        content.current.readOnly = true;
        contact.current.readOnly = true;
        setSent(true);
      }
    },
  }

  return (
    <Contact className={sent ? 'sent' : ''}>
      <textarea ref={content}
        className='content' rows='5'
        placeholder='send me a message  :-)' />
      <input ref={contact}
        className='contact' type='text' spellCheck='false'
        onKeyDown={e => e.key === 'Enter' && handle.send()}
        placeholder='optional contact info' />
      {sent
        ? <div className='confirmation'>sent!</div>
        : <button className='send' onClick={handle.send}>send</button>
      }
    </Contact>
  )
}