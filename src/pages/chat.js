import React, { Fragment, useRef, useState } from "react"
import styled from 'styled-components';
import { useRouteMatch, Link } from 'react-router-dom';
import { io } from "socket.io-client"
import api from "../lib/api"
import { useE, useF, useEventListener, useAuth } from "../lib/hooks"
import { useUserSocket } from "../lib/io"
import { InfoStyles, InfoBody, InfoSection, InfoUser, InfoLine, InfoLabel, InfoEntry, InfoLinks, InfoFuncs, InfoLoginBlock } from '../components/Info'

export default () => {
  const auth = useAuth()
  const inputRef = useRef()
  const [profile, setProfile] = useState()
  const [other, setOther] = useState(window.location.hash.slice(2) || '')
  const [chatUser, setChatUser] = useState()
  const [unread, setUnread] = useState()
  // const [unreadCount, setUnreadCount] = useState(0)
  const [chats, setChats] = useState({})
  const [typing, setTyping] = useState({})
  const [update, setUpdate] = useState()

  const chat = other ? chats[other] : undefined;

  const handle = {
    updateChat: (other, newChat) => {
      if (other) {
        setChats(Object.assign({}, chats, { [other]: newChat }))
        console.log(chats[other], newChat)
        if (chats[other]?.messages.slice(-1)[0]?.meta.t !== newChat?.messages.slice(-1)[0]?.meta.t) {
          setTimeout(handle.scrollToLatest, 50)
        }
      }
    },
    loadProfile: () => {
      if (auth.user) {
        api.get(`/profile/${auth.user}`).then(({profile}) => {
          setProfile(profile)
          if (other && !profile.friends.includes(other)) {
            setOther(false)
          }
        })
        api.get(`/chat`).then(({chatUser, unread: unreadCount}) => {
          setChatUser(chatUser)
          // setUnreadCount(unreadCount)
        })
      }
    },
    loadChat: other => {
      auth.user && other && api.get(`/chat/u/${other}`).then(({chat: newChat}) => {
        // console.log(newChat)
        handle.updateChat(other, newChat)
        if (newChat?.messages?.length !== chat?.messages?.length) {
          setTyping({ ...typing, [other]: false })
        }
        if (chatUser?.unread && chatUser.unread[newChat.hash]) {
          socket && socket.emit('chat:view', newChat.hash)
        }
      })
    },
    switchChat: other => {
      setOther(other)
      handle.loadChat(other)
    },
    sendChat: () => {
      let text = inputRef.current.value
      if (text) {
        inputRef.current.value = ''
        handle.scrollToLatest()
        api.post(`/chat/u/${other}`, { messages: [{ text }] }).then(({chat: newChat}) => handle.updateChat(other, newChat))
      }
      handle.resize()
      // socket.emit('chat:send', chat.hash, text, meta)
    },
    typing: e => {
      chat && auth.user && socket.emit('chat:typing', chat.hash, auth.user, e.target.value)
      handle.resize()
    },
    resize: () => {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `calc(${inputRef.current.scrollHeight}px + .25rem)`;
    },
    scrollToLatest: () => {
      let latestMessage = document.querySelector('.chat .messages :first-child')
      latestMessage?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest"
      })
    }
  }
  useEventListener(window, 'resize', handle.resize)

  const socket = useUserSocket('', {
    "chat:update": (hash, messages) => {
      setUpdate({ hash, messages })
    },
    "chat:typing": (hash, other, isTyping) => {
      setTyping({ ...typing, [other]: isTyping })
    },
    'chat:unread': unread => {
      setUnread(unread)
    }
  })
  useF(update, () => {
    if (update) {
      let chat = Object.values(chats).find(c => c.hash === update.hash)
      if (chat) {
        if (chat.users.length === 2) {
          let other = chat.users.find(u => u !== auth.user)
          handle.updateChat(other, { ...chat, messages: chat.messages.concat(update.messages) })
          setTyping({ ...typing, [other]: false })
        } else if (update.hash === chat.hash) {
          handle.updateChat(other, { ...chat, messages: chat.messages.concat(update.messages) })
          setTyping({ ...typing, [other]: false })
        }
      }
    }
  })
  useF(unread, () => {
    if (unread) {
      if (chat && unread[chat.hash]) {
        delete unread[chat.hash]
        socket && socket.emit('chat:view', chat.hash)
      }
      setChatUser(Object.assign({}, chatUser, { unread }))
    }
  })

  useF(auth.user, handle.loadProfile)
  useEventListener(window, 'focus', () => other && handle.loadChat(other))
  useF(other, () => {
    if (other && profile && !profile.friends.includes(other)) {
      setOther(false)
    } else {
      window.history.replaceState(null, '/chat', `/chat${other ? `/#/${other}` : ''}`)
      other && handle.switchChat(other)
    }
  })

  let unreadCount = chatUser?.unread && Object.values(chatUser.unread).reduce((acc, val) => acc + val, 0)
  return <Style>
    {auth.user ? <Fragment>
    <InfoBody className='friends'>
      <InfoFuncs className='friends-list' {...{
        labels: [
          'chat',
          // unreadCount || ''
        ],
        entryFunc: user => setOther(user),
        entries: (profile?.friends || []),
        entryLabels: chatUser?.dms && profile?.friends.map(other => {
          let hash = chatUser.dms[other]
          let unread = (chatUser.unread || {})[hash]
          return unread ? [{ dot: 'black' }] : []
        }),
        classes: (profile?.friends || []).map(u => u === other ? 'selected' : ''),
      }}/>
    </InfoBody>
    <InfoBody className='chat'>
      {other ? <Fragment>
      <InfoSection label={other} className='other-label' />
      <InfoSection className='messages'>
        {chat?.messages.length === 0 ? <div className='info'>no messages</div> : ''}
        {typing[other] ? <div className='left typing'>...</div> : ''}
        {chat?.messages.slice().reverse().map(({text, meta}, i) => {
          if (text) {
            text = text.replace(
              /(http(s)?:\/\/)?((www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/g,
              '<a href="//$3">$1$3</a>')
          }
          let side = meta.user === auth.user ? 'right' : 'left'
          return <Fragment key={i}>
            {text ?
            <div className={side}
              dangerouslySetInnerHTML={{__html: text}}>
            </div> : ''}
            {meta.page ? <Fragment>
              {meta.pageDesc ?
              <Link to={meta.page} className={`${side} page`}>
                {meta.pageDesc}
              </Link>
              : ''}
              <Link to={meta.page} className={`${side} page link`}>
                {meta.pageImg ? <div className='img-cont'><img src={meta.pageImg}/></div> : ''}
                {meta.page}
              </Link>
            </Fragment>
            : ''}
          </Fragment>
        })}
      </InfoSection>
      <InfoSection labels={[
        // other,
        ]} className='edit-container'>
        <div className='chat-input-container'>
          <textarea className='chat-input' ref={inputRef} rows="1" spellCheck='false'
            onKeyDown={e => {
              if (!e.shiftKey && e.key === 'Enter') {
                e.preventDefault()
                // socket.emit('live:message', e.target.value)
                handle.sendChat()
              }
            }}
            onChange={handle.typing}></textarea>
          <span className='button chat-send' onClick={e => handle.sendChat()}>send</span>
        </div>
      </InfoSection>
      </Fragment>
      :
      <InfoSection className='messages'>
        <div className='info'>select a friend to chat</div>
      </InfoSection>}
    </InfoBody>
    </Fragment>
    :
    <InfoBody><InfoLoginBlock to='view chat' /></InfoBody>}
  </Style>
}


const Style = styled(InfoStyles)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  background: none;
  .body {
    background: white;
  }
  .body.friends {
    width: 7rem;
    flex-grow: 0;
    border-right: 1px solid #00000022;
    .entry-line {
      position: relative;
      .badges {
        position: absolute;
        left: -1.1rem;
        bottom: .35rem;
      }
    }
    .entry {
      user-select: none !important;
    }
    .friends-list:not(:hover) .selected {
      text-decoration: underline;
    }
  }
  .body.chat {
    width: calc(100% - 7rem);
    max-width: 30rem;
    padding-right: 0;
    > * {
      padding-right: 1rem;
    }

    display: flex;
    flex-direction: column;
    .edit-container {
      width: 100%;
      margin-bottom: 0;
      .chat-input-container {
        // display: flex;
        // padding: .25rem 0;
        // margin-bottom: .25rem;

        position: relative;
      }
      ::after {
        content: "";
        position: absolute;
        bottom: -.75rem;
        display: block;
        width: 100%;
        height: .75rem;
        // background: linear-gradient(0deg, #ffffff00, white)
      }
      .chat-input {
        font-size: .8rem;
        // padding: 0 .2rem;
        // line-height: 1rem;
        // min-height: 1.5rem;
        padding: .2rem .2rem .3rem .2rem;
        line-height: 1.1rem;
        height: 1.6rem;
        // min-height: 1.4rem;
        // margin: .25rem 0;
        margin: 0;
        margin-right: .25rem;
        flex-grow: 1;
        resize: none;

        padding: 0.35rem 3.1rem 0.35rem 0.25rem;
        margin-right: 0;
        height: 2rem;
        overflow: hidden;
        // min-height: 2rem;
      }
      .chat-send {
        float: none;
        flex-grow: 0;
        display: flex;
        align-items: center;
        justify-content: center;

        position: absolute;
        right: .3rem;
        bottom: calc(.5rem + 2px + .05rem);
        width: 2.5rem;
        height: 1.4rem;
      }
    }
    .messages {
      height: 0;
      flex-grow: 1;
      overflow-y: scroll;
      display: flex;
      flex-direction: column-reverse;
      padding-bottom: 1rem;
      &::before {
        content: "";
        height: 0;
        flex-grow: 1;
      }
      &::after {
        content: "";
        min-height: 1rem;
      }
      > * {
        max-width: 90%;
        font-size: .8rem;
        white-space: pre-wrap;
        background: #00000011;
        border-radius: .3rem;
        padding: .2rem .4rem;
        margin-bottom: .3rem;
        overflow-wrap: break-word;
        position: relative;
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
        background: #00000006;
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
    .other-label {
      margin-left: -1rem;
      padding-left: 1rem;
      padding-bottom: 1rem;
      margin-bottom: 0;
      border-bottom: 1px solid #00000022;
    }
  }
`