import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Route } from 'react-router-dom';
import { useParams, useHistory } from 'react-router-dom';
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
    useEffect(() => { document.title = id; }, [id]);

    return (
        <Suspense fallback={<Loading />}>
            <ErrorBoundary fallback={<Missing />}>
                <Page />
            </ErrorBoundary>
        </Suspense>
    )
}

const Embedded = ({ name }) => {
    let [src, setSrc] = useState();
    let history = useHistory();
    let ifr = useRef();

    const handle = {
        hash: (hash) => setSrc(`/project/${name}/index.html${hash}`),
    };

    useEffect(() => {
        // focus & set src
        ifr.current.focus();
        handle.hash(window.location.hash);

        // send hash updates down
        let eventId = window.addEventListener('hashchange', () =>
            handle.hash(window.location.hash));

        // bring hash & title updates up
        let intervalId = setInterval(() => {
            document.title = ifr.current.contentWindow.window.document.title;
            let ifrHash = ifr.current.contentWindow.window.location.hash;
            if (window.location.hash !== ifrHash) {
                history.replace(ifrHash);
            }
        }, 500);

        return () => {
            window.removeEventListener('hashchange', eventId);
            clearInterval(intervalId);
        };
    }, []);

    return (
        <iframe
            id="embedded"
            title={name}
            frameBorder="0"
            src={src}
            ref={ifr} />
    )
}

const embedded = ['terrain', 'nonogram', 'snakes', 'snackman', 'befruited', 'jeanne'];
const EmbeddedRoute = ({name, implicit}) => (
    <Route
        key={name + implicit}
        path={`${implicit ? '/' : '/projects/'}${name}`}
        component={() => <Embedded name={name} />} />
)

export {
    Loading,
    Missing,
    Page,
    Embedded,
    EmbeddedRoute,
    embedded
}