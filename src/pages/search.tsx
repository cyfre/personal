import React, { useState, useEffect, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { useRouteMatch, useHistory } from 'react-router-dom';

const _projects = {
    search: 'search through all pages',
    terrain: ['terrain generation', 'procedurally generated landscape'],
    nonogram: ['nonogram solver', 'created to solve puzzles from the app <a href="https://apps.apple.com/us/app/picture-cross/id977150768">Picture Cross</a>, aka <a href="https://en.wikipedia.org/wiki/Nonogram">nonograms</a>'],
    snakes: ['snakes', 'one- or two-player co-op game of snake!'],
    wordbase: 'clone of Wordbase (discontinued word game)',
    snackman: "it's kinda like Pac-Man!",
    befruited: 'bejeweled but with fruit!',
    graffiti: ['graffiti wall', 'open to everyone'],
    turt: ['turt smurts', 'wise turtle, 50/50 mix of user content and <a href="api.quotable.io">api.quotable.io/random</a>'],
    oldturt: ['2d turt smurts', 'wise turtle, 50/50 mix of user content and <a href="api.quotable.io">api.quotable.io/random</a>'],
    insult: "idk sometimes it's funny",
    floating: 'shifting Delaunay triangulation',
    models: 'simple 3d trees & things created in Blender',
    domains: 'list of domains you can view this site from',
    u: 'user profiles'
}
'home about projects ly tree cloud'.split(' ').forEach(p => { _projects[p] = '' });
const searchProjects = Object.keys(_projects).sort();
searchProjects.forEach(key => {
    if (typeof _projects[key] === 'string') {
        console.log(key)
        _projects[key] = ['', _projects[key]]
    }
})
export const projects = _projects;

const SearchEntry = ({page, term}) => {
    let history = useHistory();
    let p = projects[page];
    let reg = RegExp(`(${term})`, 'gi')

    let content = '/' +
    '<span class="title">' +
    (p[0] ? `${page}: ${p[0]}` : page).replace(reg, `<span class="highlight">${term}</span>`) +
    '</span>' +
    `<div class="desc">${projects[page][1].replace(/<[^>]*>/g, '').replaceAll(reg, `<span class="highlight">$1</span>`)}</div>`;
    return (<div className='entry' onClick={() => history.push(`/${page}`)}
        dangerouslySetInnerHTML={{__html: content}}>
    </div>)
}
const SearchList = ({results, term}) => <Fragment>
    {results.map(p => <SearchEntry page={p} term={term} key={p} />)}
</Fragment>

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
    let searchRef = useRef();
    let history = useHistory();
    let [term, setTerm] = useState(window.location.hash?.slice(1) || '');
    let [results, setResults] = useState(searchProjects);

    const handle = {
        search: () => {
            let current = searchRef.current;
            let path = '/search'
            if (current) {
                let search = (current as HTMLInputElement).value
                setTerm(search.toLowerCase())
                setResults(searchProjects
                    .filter(p => [p].concat(projects[p]).some(field => field.toLowerCase().includes(search)))
                    .sort((a, b) => {
                        if (a === search) return -1;
                        if (b === search) return 1;
                        let aHas = [a, projects[a][0]].some(field => field.toLowerCase().includes(search));
                        let bHas = [b, projects[b][0]].some(field => field.toLowerCase().includes(search));
                        if (aHas && bHas) return a.localeCompare(b);
                        else if (aHas) return -1;
                        else if (bHas) return 1;
                        else return a.localeCompare(b);
                    }));
                if (search) path += `#${search}`
            }
            window.history.replaceState(null, '/search', path)
        },
        go: () => {
            history.push(`/${results[0] || (searchRef.current as HTMLInputElement).value || ''}`)
        },
    }

    return <Style>
        <div className='search'>
            <input ref={searchRef} type='text' placeholder='find a page'
                autoCorrect='off' autoCapitalize='off'
                value={term} onChange={handle.search}
                onKeyDown={e => e.key === 'Enter' && handle.go()}/>
            <span className='submit' onClick={handle.go}>go</span>
        </div>
        <div className='body'>
            <div className='results'>
                <SearchList term={term} results={results} />
            </div>
        </div>
    </Style>
}

const Style = styled.div`
    height: 100%; width: 100%;
    background: white;
    color: black;
    .search {
        padding: .3rem .3rem;
        padding-top: .1rem;
        background: black;
        // background: #a2ddff;
        display: flex;
        input {
            width: 8rem;
            background: white;
            border: white;
            color: black;
            padding: 0 .3rem;
            border-radius: .3rem;
            min-width: 42%;
            font-size: .8rem;
        }
        .submit {
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            color: white;
            border: 2px solid white;
            padding: 0 .3rem;
            border-radius: .3rem;
            margin-left: .3rem;
        }
    }
    .body {
        padding: 1rem;
        > *::before { display: block; margin-bottom: .25rem }
        .lil-badge { display: inline-block; }
        > *::before, .lil-badge {
            width: fit-content;
            font-size: .8rem;
            opacity: .5;
            background: #00000022;
            padding: 0 .3rem;
            border-radius: .3rem;
        }
        > * {
            margin-bottom: .5rem;
            min-height: 3rem;
        }
        .results::before { content: "results" }

        .entry {
            cursor: pointer;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            .title { margin-right: 1rem; }
            :hover { text-decoration: underline; }
        }
        .highlight { background: yellow; }
        .desc {
            font-size: .8rem;
            opacity: .8;
            display: none;
        }
        .entry:hover .desc, .entry:first-child .desc { display: inline-block; }
    }
`