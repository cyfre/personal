import React from 'react';
import styled from 'styled-components';

const WikiLink = styled.a`
`

export default ({ path }) => {
    let wiki = path.split('/').filter(p => p && ['projects', 'home', 'about'].indexOf(p) < 0).join('/');
    return (
        <WikiLink className="wiki-link" href={`https://github.com/cfreshman/personal/wiki/${wiki}`}>
            [ wiki ]
        </WikiLink>
    )
}