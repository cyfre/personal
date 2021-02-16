import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { embedded, EmbeddedRoute, Page, Missing  } from './Contents';

const Main = styled.div`
    width: 100%;
    background: none;
    color: var(--light);
    height: 0;
    flex-grow: 1;
    // margin: .5rem auto;
    // max-width: calc(100% - 1rem);
    margin-top: 0;
    position: relative;

    & > * {
        // border-radius: 3px;
        border-bottom-left-radius: .2rem;
        border-bottom-right-radius: .2rem;
        overflow: hidden;
        // box-shadow: 1px 2px 6px #00000020;
        &.seamless {
            box-shadow: none;
        }
    }
`

const redirects = [
    ['/projects', ''],
    ['/project', '/raw'],
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
            <Route path='/raw' render={() => window.location.reload()} />
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
