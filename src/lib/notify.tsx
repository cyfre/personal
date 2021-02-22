import { useEffect } from 'react'
import { remove } from './util'
import api from './api'
import { useInterval, useTimeout } from './hooks'
import { auth } from './auth'
import { useHistory } from 'react-router-dom'

export function twitter(handle?) {
    return api.post(`notify/twitter`, { handle })
}

export function sub(page) {
    console.log(Notification.permission)
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
export function useNotify(history) {
    useInterval(() => {
        auth.user && api.get('notify/msg').then(
            ({msg}: {msg: { [key: string]: string[] }}) => {
            console.log(msg)
            Object.entries(msg)
                .filter(entry => !notifyFilters.some(f => f(entry)))
                .forEach(async entry => {
                    if ('default' === Notification.permission) {
                        await Notification.requestPermission()
                    }
                    let [app, list] = entry
                    console.log(entry)
                    list.forEach(text => {
                        let [body, link] = text.split(' – ')
                        console.log(body, link, history)
                        let notif = new Notification(`/${app}`, {
                            body,
                            tag: link
                        })
                        notif.onclick = () => {
                            history.push(link.replace('freshman.dev', ''))
                        }
                    })
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