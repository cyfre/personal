import React, { useState, useEffect } from "react"
import styled from 'styled-components';
import { io } from "socket.io-client"
import api from "../lib/api"
import { useAuth } from "../lib/hooks"

const ENDPOINT = window.origin.replace(':3000', ':5000')
console.log('ENDPOINT', ENDPOINT)

export default () => {
  const auth = useAuth()
  const [socket, setSocket] = useState(undefined)
  const [online, setOnline] = useState("")
  const [response, setResponse] = useState([])

  useEffect(() => {
    const socket = io(ENDPOINT, {
      transports: ['websocket']
    })
    setSocket(socket)

    let res = []
    socket.on("message", data => {
      res = res.concat(data)
      setResponse(res)
    })
    socket.on("online", data => {
      setOnline(data)
    })
    socket.emit("echo", `${auth.user || 'user'} has joined`)
    return () => {
      socket.emit("echo", `${auth.user || 'user'} has left`)
      socket.disconnect();
    }
  }, [])

  return <Style>
    <p>
      {online} online
    </p>
    <div>
      {response.map((line, i) =>
        <div key={i}>{'>'} {line}</div>
      )}
    </div>
    <br/>
    <input type="text" onKeyDown={e => {
      if (e.key === 'Enter') {
        socket.emit('echo', e.target.value)
        e.target.value = ''
      }
    }}></input>
  </Style>
}


const Style = styled.div`
color: black;
padding: 1rem;
`