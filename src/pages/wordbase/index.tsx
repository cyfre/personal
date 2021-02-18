import React, { useState, useEffect } from 'react';
import { WordbaseMenu } from './menu';
import { Wordbase } from './game';
import './fonts.css';

export default () => {
    const [selected, setSelected]: [string, any] = useState(window.location.hash.slice(1));
    const [isMenu, setMenu] = useState(!selected);

    useEffect(() => {
        document.title = "Wordbase";
    }, []);
    useEffect(() => {
        if (isMenu) setSelected(undefined);
    }, [isMenu])
    useEffect(() => {
        window.location.hash = selected || '';
    }, [selected])
    const handle = {
        setMenu,
        selectGame: (id: string) => {
            console.log(id);
            setSelected(id);
            setMenu(false);
        }
    }
    return (
        isMenu
            ? <WordbaseMenu selectGame={handle.selectGame} />
            : <Wordbase setMenu={handle.setMenu} gameId={selected} />
    );
}