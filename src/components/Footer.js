import React from 'react';
import styled from 'styled-components';

const Footer = styled.div`
    & .signature {
        color: var(--light);
        opacity: .5;
        font-size: 0.5rem;
        padding-bottom: 0.5rem;
    }
`

export default () => (
    <Footer id="footer" className="centering">
        <span className="signature">Cyrus Freshman 2020</span>
    </Footer>
)
