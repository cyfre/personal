import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import { WordbaseMenu } from './menu';
import { WordbaseGame } from './game';
import api from '../../lib/api';
import { useAuth, useEventListener, useF, useIcon, useManifest } from '../../lib/hooks';
import { useNotifyFilter } from '../../lib/notify'
import { Info, Save } from './save';
import { fetchGame } from './data';
import './fonts.css';
import { useUserSocket } from '../../lib/io';
import { useShrink } from '../../lib/shrink';

export default () => {
    const gameRef = useRef()
    const auth = useAuth();
    const [infoList, setList]: [Info[], any] = useState(undefined)
    const [gameClosed, setGameClosed] = useState(true)
    const [info, setInfo] = useState(undefined)
    const [save, setSave] = useState(undefined)
    const [reload, setReload] = useState(undefined)

    // useShrink(gameRef.current)

    const open = (id: string | false) => {
        window.history.replaceState(null, '/wordbase', '/wordbase' + (id ? `#${id}` : ''))
        if (id) {
            fetchGame(id).then(({info, save}) => {
                if (save) {
                    setSave(save)
                    setInfo(info)
                    setGameClosed(false)
                }
            }).catch(console.log)
        } else setGameClosed(true)
    }

    useF(() => {
        auth.user && api.post('profile/checkin/wordbase')
        open(window.location.hash.slice(1))
    });
    useIcon('/raw/wordbase/favicon.png')
    useManifest({
        name: `/wordbase`,
        display: `standalone`,
        start_url: `${window.origin}/wordbase`,
        icons: [{
            src: `${window.origin}/raw/wordbase/favicon.png`,
            sizes: `32x32`,
            type: `image/png`
        },{
            src: `${window.origin}/raw/wordbase/favicon256.png`,
            sizes: `256x256`,
            type: `image/png`
        }]
    })
    useF(info, () => {
        // update infoList from current info
        if (info && infoList) {
            let toUpdate = infoList.find(i => i.id === info.id)
            if (toUpdate) {
                Object.assign(toUpdate, info)
                setList(infoList.slice())
            } else {
                setList([info].concat(infoList))
            }
        }
    })

    // reload on wordbase:update, focus, and notify:msg
    useUserSocket('', {
        'wordbase:update': newInfo => {
            console.log(newInfo)
            setReload(newInfo)
        }
    })
    useEventListener(window, 'focus', () => {
        setReload(Object.assign({}, info))
    })
    useNotifyFilter((app, text) => {
        let match = text.match(/\/wordbase#(\w+)/)
        if (match) {
            let id = match[1]
            console.log('WORDBASE FILTER', id)
            setReload({ id })
            return true
        }
        return false
    })

    return <Style ref={gameRef} className={gameClosed ? 'closed' : ''}>
        <WordbaseMenu {...{ menuClosed: !gameClosed, open, infoList, reload, setList }} />
        <div className='divider'></div>
        {info ? <WordbaseGame {...{ open, info, save, reload, setInfo, setSave }} /> : ''}
    </Style>
    // return (
    //     info
    //     ? <Wordbase {...{ open, info, setInfo, save, setSave }} />
    //     : <WordbaseMenu {...{ open, infoList, setList }} />
    // );
}

const dividerWidth = '0rem'
const Style = styled.div`
    width: 100%; height: 100%;
    max-width: 77vh;
    margin: auto;
    position: relative;
    > * {
        position: absolute;
        height: 100%;
        top: 0;
        transition: .2s;
    }
    .wordbase-menu {
        width: 100%;
        right: calc(100% + ${dividerWidth});
    }
    &.closed .wordbase-menu {
        right: 0;
    }
    .divider {
        background: black;
        width: ${dividerWidth};
        left: -${dividerWidth};
    }
    &.closed .divider {
        left: 100%;
    }
    .wordbase-game {
        z-index: 300;
        width: 100%;
        left: 0;
    }
    &.closed .wordbase-game {
        left: calc(100% + ${dividerWidth});
    }
`

    // useF(reload, () => {
    //     reload && fetchGame(reload).then(({info, save}) => {
    //         console.log(info, save)
    //         setReload(undefined)
    //         if (info && save) {
    //             let inst = infoList.find(i => i.id === reload)
    //             console.log(infoList, reload, inst)
    //             if (inst) {
    //                 // already in list
    //                 Object.assign(inst, info)
    //                 setList(infoList.slice())
    //             } else {
    //                 // new game
    //                 setList(infoList.concat(info).sort((a, b) =>
    //                     (b.lastUpdate || 0) - (a.lastUpdate || 0)));
    //             }
    //             if (info.id === reload) {
    //                 setSave(save)
    //                 setInfo(info)
    //             }
    //         }
    //     }).catch(err => console.log(err))
    // })