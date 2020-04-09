import React, { useEffect, useState, Fragment, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Link, Switch, Redirect, useRouteMatch, useParams } from 'react-router-dom';
import { ErrorBoundary } from 'lib/error';

const Loading = () => <p id="loading" className="not-found centering">🐙<br/>Loading</p>;
const NoMatch = () => <p id="loading" className="not-found centering">🐙<br/>Page Not Found</p>;

export default () => {
    let { id } = useParams();
    let Page = React.lazy(() => import('./' + id));

    return (
        <Suspense fallback={<Loading />}>
            <ErrorBoundary fallback={<NoMatch />}>
                <Page />
            </ErrorBoundary>
        </Suspense>
    )
}