import React, { useEffect, useState, Fragment, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Link, Switch, Redirect, useRouteMatch, useParams } from 'react-router-dom';
import { ErrorBoundary } from 'lib/error';

const Loading = () => <p id="fallback" className="centering">loading</p>;
const NoMatch = () => <p id="fallback" className="centering">🐙<br/>there's nothing to see here</p>;

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