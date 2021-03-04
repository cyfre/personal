import React from 'react';
import styled from 'styled-components';
import { InfoStyles, InfoBody, InfoOutLinks } from '../components/Info'

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
    let domains = [
        'freshman.dev',
        // 'localhost:3000',
        { text: 'cyfr.dev', label: '-> freshman.dev'},
        'cyfre.dev',
        'cyrusfreshman.com',
        'cfreshman.io',
        '00010110.page',
    ]
    return <InfoStyles>
        <InfoBody>
            <InfoOutLinks {...{
                labels: ['why do I have so many domains?'],
                entries: domains.map((d: any) =>
                    ({ text: d.text || d || d, data: `https://${d.text || d}/domains` })),
                entryLabels: domains.map((d: any) => window.location.origin.includes(d)
                    ? ['here now!']
                    : d.label ? [d.label] : []),
            }} />
        </InfoBody>
    </InfoStyles>
}
