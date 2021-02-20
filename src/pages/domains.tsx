import React, { Fragment } from 'react';
import styled from 'styled-components';

const DomainEntry = ({domain}) => {
    console.log(domain, window.location.origin, window.location.origin === domain);
    return (<div className='entry'><a href={`https://${domain}/domains`}>
        {domain}
    </a>{window.location.origin.includes(domain) ? <div className='lil-badge'>here now!</div> : ''}</div>)
}
const DomainList = ({domains}) => <Fragment>
    {domains ? domains.map(d => <DomainEntry domain={d} key={d} />) : ''}
</Fragment>

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
    return <Style>
        <div className='domains'>
            <DomainList domains={[
                'freshman.dev',
                'cyfr.dev',
                'cyrusfreshman.com',
                'cfreshman.io',
                '00010110.page',
            ]}/>
        </div>
    </Style>
}

const Style = styled.div`
    height: 100%; width: 100%;
    background: white;
    color: black;
        padding: 1rem;
        > *::before { display: block; }
        .lil-badge { display: inline-block; margin-left: .5rem; }
        > *::before, .lil-badge {
            width: fit-content;
            font-size: .8rem;
            opacity: .5;
            background: #00000022;
            padding: 0 .3rem;
            border-radius: .3rem;
        }
        > * {
            margin-bottom: .5rem;
            min-height: 3rem;
        }
        .current::before { content: "current" }
        .domains::before { content: "why do I have so many domains ?" }

        .entry {
            cursor: pointer;
            :hover { text-decoration: underline; }
            a { color: black; }
        }
`