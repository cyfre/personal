import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { embedded, EmbeddedRoute, Page, Missing  } from './Contents';

const Main = styled.div`
    width: 100%;
    background: var(--dark);
    height: 0;
    flex-grow: 1;
    margin: .5rem auto;
    max-width: calc(100% - 1rem);
    margin-top: 0;
    border-radius: 3px;
    box-shadow: 1px 2px 6px #00000020;

    overflow: hidden;
    position: relative;

    & iframe {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
    }
`

const redirects = [
    ['/projects', ''],
    ['/jeanne', '/insult'],
].map(pair => (
    <Route path={pair[0]} key={pair.join()} render={routeProps =>
        <Redirect to={
            routeProps.location.pathname.replace(...pair) + routeProps.location.hash
        }/>
    }/>
));

export default () => (
    <Main id='main'>
        <Switch>
            {redirects}
            {/* explicit /projects/ */}
            {/* {projects.map(name => EmbeddedRoute({name, implicit: false}))}
            <Route path='/projects/:id' component={Page} /> */}

            {/* implicit projects */}
            {embedded.map(name => EmbeddedRoute({name, implicit: true}))}
            <Route path='/:id' component={Page} />

            <Route path='*' component={Missing} />
        </Switch>
    </Main>
)
