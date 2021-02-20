import React, { useState, useEffect } from 'react';
import { WordbaseMenu } from './menu';
import { Wordbase } from './game';
import './fonts.css';

export default () => {
    const [gameId, setOpenGame]: [string, any] = useState(window.location.hash.slice(1));

    useEffect(() => {
        document.title = "Wordbase";
    }, []);
    useEffect(() => {
        window.location.hash = gameId || '';
    }, [gameId])

    return (
        gameId
        ? <Wordbase {...{ setOpenGame, gameId }} />
        : <WordbaseMenu {...{ setOpenGame }} />
    );
}