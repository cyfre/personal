import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../lib/api';

const Content = styled.img`
    height: 100%;
    width: 100%;
    object-fit: contain;
    object-position: center;
`

export default () => {
    let [dataUrl, setDataUrl] = useState('');

    useEffect(() => {
        api.read('/cityhall/', data => {
            if (data && data.dataUrl) {
                setDataUrl(data.dataUrl);
            }
        });
    }, []);

    return (
        <Content src={dataUrl} />
    )
}