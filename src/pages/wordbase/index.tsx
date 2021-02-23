import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import { WordbaseMenu } from './menu';
import { Wordbase } from './game';
import api from '../../lib/api';
import { useAuth } from '../../lib/hooks';
import { Info, Save } from './save';
import { fetchGame } from './data';
import './fonts.css';

let lastId;
export default () => {
    const auth = useAuth();
    const [infoList, setList]: [Info[], any] = useState([])
    const [closed, setClosed] = useState(true)
    const [info, setInfo] = useState(undefined)
    const [save, setSave] = useState(undefined)

    useEffect(() => {
        auth.user && api.post('profile/checkin/wordbase')
        _open(window.location.hash.slice(1))
    }, []);

    const open = (id, update?) => {
        window.history.replaceState(null, 'Wordbase', '/wordbase' + (id ? `#${id}` : ''))
        if (update) {
            let toUpdate = infoList.find(info => info.id === update.id)
            if (toUpdate) Object.assign(toUpdate, update)
        }
        _open(id);
    }
    const _open = id => {
        if (id) fetchGame(id).then(({info, save}) => {
            console.log(info, save)
            if (info && save) {
                setSave(save)
                setInfo(info)
                setClosed(false)
            }
        }).catch(err => console.log(err))
        else setClosed(true)
    }

    return <Style className={closed ? 'closed' : ''}>
        <WordbaseMenu {...{ open, infoList, setList }} />
        <div className='divider'></div>
        {info ? <Wordbase {...{ open, info, setInfo, save, setSave }} /> : ''}
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