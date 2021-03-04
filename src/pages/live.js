import React, { useState } from "react"
import styled from 'styled-components';
import { io } from "socket.io-client"
import api from "../lib/api"
import { useE, useF, useAuth } from "../lib/hooks"
import { useUserSocket } from "../lib/io"
import { InfoStyles, InfoBody, InfoSection, InfoUser, InfoLine, InfoLabel } from '../components/Info'


export default () => {
  const auth = useAuth()
  const socket = useUserSocket()
  const [online, setOnline] = useState("")
  const [response, setResponse] = useState([])
  const [joined, setJoined] = useState(false)

  useE(socket, () => {
    if (socket) {
      let res = []
      socket.on("live:message", data => {
        res = res.concat(data)
        setResponse(res)
      })
      socket.on("live:online", data => {
        setOnline(data)
      })
      socket.emit("live:join")
      setJoined(true)
      return () => {
        setJoined(false)
        socket.emit("live:leave")
      }
    }
  })
  useE(auth.user, () => {
    if (joined) {
      socket.emit("live:leave")
      setTimeout(() => {
        socket.emit("live:join")
      })
    }
  })

  return <InfoStyles><InfoBody>
    <InfoSection className='edit-container' labels={[
      `${online} online ${online === 1 ? `(it's just you)` : ''}`,
      ]}>
      <input type="text" onKeyDown={e => {
        if (e.key === 'Enter') {
          socket.emit('live:message', e.target.value)
          e.target.value = ''
        }
      }}></input>
    </InfoSection>
    <InfoSection labels={[
      'chat',
      ]}>
      {response.slice().reverse().map((line, i) =>
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