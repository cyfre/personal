import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Route } from 'react-router-dom';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useTitle, useTimeout, useInterval, useEventListener, useF, useE } from '../lib/hooks';

import { ErrorBoundary } from './ErrorBoundary';

// https://projects.lukehaas.me/css-loaders/
const Loader = styled.div`
    margin: 60px auto;
    font-size: 10px;
    position: relative;
    text-indent: -9999em;
    border-top: 1.1em solid rgba(255, 255, 255, 0.2);
    border-right: 1.1em solid rgba(255, 255, 255, 0.2);
    border-bottom: 1.1em solid rgba(255, 255, 255, 0.2);
    border-left: 1.1em solid #ffffff;
    transform: translateZ(0);
    animation: load8 2s infinite linear;
    &, &::after {
        border-radius: 50%;
        width: 10em;
        height: 10em;
    }

    @-webkit-keyframes load8 {
        0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
        }
        100% {
            -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
        }
    }
    @keyframes load8 {
        0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
        }
        100% {
            -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
        }
    }
`

const Fallback = styled.div`
    width: 100%;
    height: 100%;
    color: var(--light);
    text-shadow: none;
    text-transform: lowercase;
    &.loading {
        background: #131125;
    }

    position: relative;
    & > * {
        opacity: .6;
    }
    // &::before {
    //     opacity: .25;
    //     background: var(--light);

    //     content: "";
    //     position: absolute;
    //     top: 0;
    //     left: 0;
    //     height: 100%;
    //     width: 100%;
    //     z-index: -1;
    // }
`

const IFrameDiv = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    &.loading {
        background: #131125;
    }
    & iframe {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
    }
`

const Loading = ({ ms }) => {
    const [show, setShow] = useState(false);
    useTimeout(() => setShow(true), ms || 500);
    return (
        <Fallback className="centering seamless loading">
            {show ? <Loader /> : ''}
        </Fallback>);
}
const Missing = () =>
    <Fallback className="centering seamless"><p>🐙<br/>nothing to see here</p></Fallback>;

const Page = () => {
    let { id } = useParams();
    let location = useLocation();
    useTitle(location.pathname);
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
    let [src, setSrc] = useState();
    let [loaded, setLoaded] = useState(false);
    let history = useHistory();
    let ifr = useRef();

    const handle = {
        hash: (hash) => setSrc(`/raw/${name}/index.html${hash}`),
        load: () => setLoaded(true),
    };

    // focus & set src to start
    useF(() => {
        ifr.current.focus();
        handle.hash(window.location.hash);
    });

    // send hash updates down
    useEventListener(window, 'hashchange', () => handle.hash(window.location.hash));

    // bring hash & title updates up
    useInterval(() => {
        let loc = window.location
        let ifrLoc = ifr.current.contentWindow.window.location
        if (ifrLoc.hostname && !ifrLoc.pathname.startsWith('/raw')) {
            if (ifrLoc.origin === loc.origin) {
                let newEnd = ifrLoc.href.replace(ifrLoc.origin, '')
                history.replace(newEnd)
            } else {
                window.location.assign(ifrLoc.href)
            }
        } else {
            document.title = ifr.current.contentWindow.window.document.title;
            if (window.location.hash !== ifrLoc.hash) {
                history.replace(ifrLoc.hash);
            }
        }
    }, 500);
    useE(loaded, () => {
        let icon = ifr.current.contentWindow.window.document.querySelector('head link[rel=icon]');
        if (icon) {
            document.querySelector('head [rel=icon]').href = icon.href
        }
        return () => {
            document.querySelector('head [rel=icon]').href = '/profile.jpeg'
        }
    })

    return (
        <IFrameDiv className={loaded ? '' : 'loading'}>
            {loaded ? '' : <Loading />}
            <iframe id="embedded" ref={ifr}
                title={name} src={src}
                frameBorder="0"
                onLoad={handle.load} />
        </IFrameDiv>
    )
}

const embedded = 'terrain nonogram snakes snackman befruited insult aoc scores submerse'.split(' ')
const EmbeddedRoute = ({name, implicit}) => (
    <Route
        key={name + implicit}
        path={`${implicit ? '/' : '/projects/'}${name}`}
        component={() => <Embedded name={name} />} />
)

export {
    Loader,
    Loading,
    Missing,
    Page,
    Embedded,
    EmbeddedRoute,
    embedded
}