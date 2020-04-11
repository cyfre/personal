import React, { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import ErrorBoundary from './ErrorBoundary';

const Fallback = styled.div`
    width: 100%;
    height: 100%;
    font-size: 1.6rem;
    text-transform: lowercase;
    font-weight: bold;
    opacity: .32;
    text-shadow: 1px 2px 4px #00000020;
`

const Loading = () => <Fallback className="centering">loading</Fallback>;
const Missing = () => <Fallback className="centering">🐙<br/>there's nothing to see here</Fallback>;

const Page = () => {
    let { id } = useParams();
    let Page = React.lazy(() => import('../pages/' + id));

    return (
        <Suspense fallback={<Loading />}>
            <ErrorBoundary fallback={<Missing />}>
                <Page />
            </ErrorBoundary>
        </Suspense>
    )
}

const Embedded = ({ name }) => {
    let src = `/projects/${name}/index.html`;
    return (
        <iframe
            title={name}
            allowFullScreen
            frameBorder="0"
            height="100%"
            width="100%"
            src={src} />
    )
}

export {
    Loading,
    Missing,
    Page,
    Embedded
}