import React, { useState } from "react"
import styled from 'styled-components';
import { io } from "socket.io-client"
import api from "../lib/api"
import { useE, useF, useAuth } from "../lib/hooks"

const ENDPOINT = window.origin.replace(':3000', ':5000')
console.log('ENDPOINT', ENDPOINT)

let socket
let socketTriggers = []
export function addSocketTrigger(callback) {
  socketTriggers.push(callback);
}
export function removeSocketTrigger(callback) {
  let index = socketTriggers.indexOf(callback);
  if (index > -1) socketTriggers.splice(index, 1);
}
export function getSocket() {
  return socket;
}
export function setSocket(value) {
  socket = value
  socketTriggers.forEach(trigger => trigger(value))
}

export const useIo = () => {
  const auth = useAuth()

  const handle = {
    login: (local?) => {
      local = local || socket
      if (local) {
        local.emit('login', auth)
      }
    },
  }
  useE(() => {
    let local = io(ENDPOINT, {
      transports: ['websocket']
    })
    local.on('connect', () => handle.login(local))
    local.on('login:done', () => {
      setSocket(local)
      local.emit('init')
    })
    return () => {
      local.disconnect();
    }
  })
  useF(auth.user, handle.login)
}

export const useUserSocket = () => {
  const [local, setLocal] = useState(socket);
  useE(() => {
      let callback = socket => setLocal(socket)
      addSocketTrigger(callback);
      return () => removeSocketTrigger(callback);
  });
  return local;
}
