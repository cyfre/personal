import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Route } from 'react-router-dom';
import { useParams, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { useTitle, useTimeout, useInterval, useEventListener } from '../lib/hooks';

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

const Loading = () => {
    const [show, setShow] = useState(false);
    useTimeout(() => setShow(true), 500);
    return (
        <Fallback className="centering seamless loading">
            {show ? <Loader /> : ''}
        </Fallback>);
}
const Missing = () =>
    <Fallback className="centering seamless"><p>🐙<br/>nothing to see here</p></Fallback>;

const Page = () => {
    let { id } = useParams();
    useTitle(id);
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
    useEffect(() => {
        ifr.current.focus();
        handle.hash(window.location.hash);
    }, []);

    // send hash updates down
    useEventListener(window, 'hashchange', () => handle.hash(window.location.hash));

    // bring hash & title updates up
    useInterval(() => {
        document.title = ifr.current.contentWindow.window.document.title;
        let ifrHash = ifr.current.contentWindow.window.location.hash;
        if (window.location.hash !== ifrHash) {
            history.replace(ifrHash);
        }
    }, 500);

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

const embedded = ['terrain', 'nonogram', 'snakes', 'snackman', 'befruited', 'insult', 'aoc'];
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