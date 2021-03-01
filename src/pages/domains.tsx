import React from 'react';
import styled from 'styled-components';
import { InfoStyles, InfoBody, InfoOutLinks } from '../components/Info'

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
    let domains = [
        'freshman.dev',
        'localhost:3000',
        'cyfr.dev',
        'cyfre.dev',
        'cyrusfreshman.com',
        'cfreshman.io',
        '00010110.page',
    ]
    return <InfoStyles>
        <InfoBody>
            <InfoOutLinks {...{
                labels: ['why do I have so many domains?'],
                entries: domains.map(d => ({ text: d, data: `https://${d}/domains` })),
                entryLabels: domains.map(d => window.location.origin.includes(d)
                    ? ['here now!']
                    : []),
            }} />
        </InfoBody>
    </InfoStyles>
}
