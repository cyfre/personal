import React, { Fragment, useRef, useState } from "react"
import styled from 'styled-components';
import { useRouteMatch, Link } from 'react-router-dom';
import { io } from "socket.io-client"
import api from "../lib/api"
import { useE, useF, useEventListener, useAuth } from "../lib/hooks"
import { useUserSocket } from "../lib/io"
import { InfoStyles, InfoBody, InfoSection, InfoUser, InfoLine, InfoLabel, InfoEntry, InfoLinks, InfoFuncs, InfoLoginBlock } from '../components/Info'

export const Chat = ({hash, flipped}: {hash, flipped?}) => {
  const auth = useAuth()
  const inputRef = useRef()
  const [chat, setChat] = useState(undefined)
  const [typing, setTyping] = useState(false)
  const [update, setUpdate] = useState(undefined)

  const handle = {
    load: () => {
      auth.user && hash && api.get(`/chat/${hash}`).then(({chat: newChat}) => {
        // console.log(newChat)
        setChat(newChat)
        if (newChat?.messages?.length !== chat?.messages?.length) {
          setTyping(false)
        }
      })
    },
    send: () => {
      let text = (inputRef.current as HTMLInputElement).value
      if (text) {
        (inputRef.current as HTMLInputElement).value = ''
        // let firstMessage = document.querySelector('.chat .messages :first-child')
        // firstMessage?.scrollIntoView({
        //   behavior: "smooth",
        //   block: "end",
        //   inline: "nearest"
        // })
        // api.post(`/chat/${chat.hash}`, { messages: [{ text }] }).then(({chat: newChat}) => setChat(newChat))
        api.post(`/chat/${chat.hash}`, { messages: [{ text }] })
      }
      handle.resize()
    },
    typing: e => {
      chat && auth.user && socket.emit('chat:typing', chat.hash, auth.user, e.target.value)
      handle.resize()
    },
    resize: () => {
      let el = (inputRef.current as HTMLInputElement)
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    },
  }
  useEventListener(window, 'resize', handle.resize)

  const socket = useUserSocket('', {
    'chat:update': (updateHash, messages) => {
      if (hash === updateHash) {
        setUpdate({ messages })
      }
    },
    'chat:typing': (updateHash, other, isTyping) => {
      if (hash === updateHash) {
        setTyping(isTyping)
      }
    },
  })
  useF(update, () => {
    if (update && chat) {
      console.log('UPDATE', chat, update)
      setChat({ ...chat, messages: chat.messages.concat(update.messages) })
      setTyping(false)
    }
  })

  useF(hash, handle.load)
  useEventListener(window, 'focus', () => handle.load())

  return <Style className={`chat body ${flipped ? 'flipped' : ''}`}>
    {auth.user ? <Fragment>
    <InfoSection className='edit-container'>
      <div className='chat-input-container'>
        <textarea className='chat-input' ref={inputRef} spellCheck='false' rows={1}
          onKeyDown={e => {
            if (!e.shiftKey && e.key === 'Enter') {
              e.preventDefault()
              handle.send()
            }
          }}
          onChange={handle.typing}></textarea>
        <span className='button chat-send' onClick={e => handle.send()}>send</span>
      </div>
    </InfoSection>
    <InfoSection className='messages'>
      {chat?.messages.length === 0 ? <div className='default info'>no messages</div> : ''}
      {typing ? <div className={`default left typing`}>...</div> : ''}
      {chat?.messages.slice().reverse().map(({text, meta}, i) => {
        if (text) {
          text = text.replace(
            /(http(s)?:\/\/)?((www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/g,
            '<a href="//$3">$1$3</a>')
        }
        let base = `${meta.user === auth.user ? 'right' : 'left'} ${meta.classes || 'default'}`
        return <Fragment key={i}>
          {text ?
          <div className={base}
            dangerouslySetInnerHTML={{__html: text}}>
          </div> : ''}
          {meta.page ? <Fragment>
            {meta.pageDesc ?
            <Link to={meta.page} className={`${base} page`}>
              {meta.pageDesc}
            </Link>
            : ''}
            <Link to={meta.page} className={`${base} page link`}>
              {meta.pageImg ? <div className='img-cont'><img src={meta.pageImg}/></div> : ''}
              {meta.page}
            </Link>
          </Fragment>
          : ''}
        </Fragment>
      })}
    </InfoSection>
    </Fragment>
    :
    <InfoSection className='messages'>
      <div className='info'>select a friend to chat with</div>
    </InfoSection>}
  </Style>
}


const Style = styled(InfoStyles)`
  &.chat {
    background: none;
    width: 100%;
    max-width: 30rem;
    padding: 0;
    font-size: 1rem;

    display: flex;
    flex-direction: column;
    .edit-container {
      width: 100%;
      margin: 0;
      // max-width: 66%;
      margin-left: auto;

      .chat-input-container {
        position: relative;
      }
      .chat-input {
        font-size: max(16px, 1rem);
        line-height: 1.2rem;
        height: 1.3rem;
        min-height: 1.3rem;
        margin: 0;
        margin-right: .25rem;
        flex-grow: 1;
        resize: none;

        padding: 0.35rem 3.1rem 0.35rem 0.2rem;
        margin-right: 0;
        height: 2rem;
        overflow: hidden;
        // font-family: 'Roboto Mono', monospace;
        padding: 0.3rem 3.4rem 0.5rem 0.2rem
      }
      .chat-send {
        float: none;
        flex-grow: 0;
        display: flex;
        align-items: center;
        justify-content: center;

        position: absolute;
        right: .25rem;
        bottom: .65rem;
        width: 2.5rem;
        height: 1.4rem;
        // font-family: 'Roboto Mono', monospace;

        font-size: 1rem;
        width: 3rem;
        height: 1.5rem;
      }
    }
    .messages {
      display: flex;
      flex-direction: column;
      > * {
        max-width: 90%;
        white-space: pre-wrap;
        margin-bottom: .3rem;
        overflow-wrap: anywhere;
        position: relative;
      }
      > .default {
        font-size: .8rem;
        font-size: 1rem;
        max-width: 90%;
        background: #eeeeee;
        border-radius: .3rem;
        padding: .2rem .4rem;
      }
      a {
        color: inherit;
        text-decoration: underline;
      }
      .info {
        align-self: center;
        color: #00000055;
        background: none;
      }
      .left {
        align-self: flex-start;
      }
      .right {
        align-self: flex-end;
        // background: #00000055;
        background: black;
        color: white;
        // text-align: right;
      }
      .typing {
        background: #f9f9f9;
        font-family: 'Roboto Mono', monospace;
      }
      .page {
        background: none;
        color: black;
        border: .15rem solid black;
        padding: .2rem;
        text-decoration: none;
        &:hover, a:hover, &:hover a {
          text-decoration: underline;
        }
        .img-cont {
          display: inline-block;
          margin-right: .25rem;
          padding: .1rem;
          background: #00000011;
          border-radius: .3rem;
          img {
            // margin-left: -.15rem;
            height: 2rem;
          }
        }
      }
    }
  }
  &.chat.flipped {
    .edit-container {
      margin-left: 0;
      margin-right: auto;
    }
    .messages {
      .left {
        align-self: flex-end;
      }
      .right {
        align-self: flex-start;
      }
    }
  }
`