import { useEffect } from 'react'
import { remove } from './util'
import api from './api'
import { useInterval, useTimeout } from './hooks'

export function twitter(handle?) {
    return api.post(`notify/twitter`, { handle })
}

export function sub(page) {
    if ('granted' !== Notification.permission) {
        Notification.requestPermission()
    }
    return api.put(`notify/sub/${page}`)
}
export function unsub(page) {
    return api.delete(`notify/sub/${page}`)
}
export function subbed(page) {
    return api.get(`notify/sub/${page}`)
}

const notifyFilters = []
export function useNotify() {
    useTimeout(() => {
        api.get('notify/msg').then(
            ({msg}: {msg: { [key: string]: string }}) => {
            console.log(msg)
            Object.entries(msg)
                .filter(entry => !notifyFilters.some(f => f(entry)))
                .forEach(entry => {
                    let [app, body] = entry
                    new Notification(`/${app}`, { body })
                })
        })
    }, 3000);
}
export function useNotifyFilter(
    filter: (msgEntry: [string, string]) => boolean) {
    useEffect(() => {
        notifyFilters.push(filter)
        return () => remove(notifyFilters, filter);
    }, [filter])
}