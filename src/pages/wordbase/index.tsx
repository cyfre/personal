import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import styled from 'styled-components';
import { useInput, useEventListener, useAnimate } from '../../lib/hooks';
import { dist, end } from './util';
import { isValidWord } from './dict';
import { Player, Tile, Board } from './board';
import { Info } from './save';
import './fonts.css';
import { WordbaseMenu } from './menu';
import { Wordbase } from './game';
import { localInfo, localSave } from './data';

export default () => {
    const [isMenu, setMenu] = useState(true);
    const [gameList, setGameList]: [Info[], any] = useState([localInfo]);
    const [selected, setSelected]: [Info, any] = useState(localInfo);

    useEffect(() => {
        document.title = "Wordbase";
    }, []);
    const toggleMenu = () => {
        setMenu(!isMenu);
    }
    const selectGame = (id) => {
        setSelected(gameList.find(item => item.id === id));
        setMenu(false);
    }

    return <Wordbase toggleMenu={toggleMenu} gameInfo={selected} />;
    // return (
    //     isMenu
    //         ? <WordbaseMenu gameList={gameList} selectGame={selectGame} />
    //         : <Wordbase toggleMenu={toggleMenu} gameInfo={selected} />
    // );
}