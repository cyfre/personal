import React, { useState } from "react"
import styled from 'styled-components';
import { io } from "socket.io-client"
import api from "../lib/api"
import { useE, useF, useAuth } from "../lib/hooks"
import { useUserSocket } from "../lib/io"
import { InfoStyles, InfoBody, InfoSection, InfoUser, InfoLine, InfoLabel, InfoEntry } from '../components/Info'

export default () => {
  const auth = useAuth()
  const [online, setOnline] = useState([])
  const [lines, setLines] = useState([])
  const [typing, setTyping] = useState([])
  const [update, setUpdate] = useState()

  const handle = {
    typing: e => {
      socket.emit('live:typing', e.target.value)
    }
  }

  const socket = useUserSocket('live', {
    "live:message": ({text, type}) => {
      setUpdate({text, type})
    },
    "live:online": data => {
      setOnline(data)
    },
    "live:typing": data => {
      setTyping(data)
    }
  })
  useF(update, () => {
    if (update) {
      let { text, type } = update
      if (type !== 'online' || lines.length === 0) {
        // res = res.concat(text)
        setLines(lines.concat(text))
      }
    }
  })

  let oNotT = online.slice()
  typing.forEach(u => oNotT.splice(oNotT.indexOf(u), 1))
  return <InfoStyles><InfoBody>
    <InfoSection labels={[
      `${online.length} online${online.length === 1 ? ` (it's just you)` : ':'}`,
      ...(online.length > 1 ? online : []),
      ]}>
      {/* {typing.length ?
      <InfoLabel labels={[
        `${typing.length} typing`,
        ...typing,
        ]}/>
      : ''} */}
      <InfoLine className='edit-container'>
      <input type="text"
        onKeyDown={e => {
          if (e.key === 'Enter') {
            socket.emit('live:message', e.target.value)
            e.target.value = ''
            handle.typing(e)
          }
        }}
        onChange={handle.typing}></input>
      </InfoLine>
    </InfoSection>
    <InfoSection labels={[
      'chat',
      // typing.length ? `... ${typing.join(', ')}` : '',
      // typing.length ? `${typing.length} typing:` : 'chat',
      typing.length ? `...` : '',
      ...typing,
      ]}>
      {lines.slice().reverse().map((line, i) =>
        <div key={i}>{line}</div>
      )}
    </InfoSection>
  </InfoBody></InfoStyles>
}


const Style = styled.div`
color: black;
padding: 1rem;
> * {
  margin-bottom: .5rem;
}
`