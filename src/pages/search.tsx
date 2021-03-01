import React, { useState, useEffect, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { Link, useHistory } from 'react-router-dom';
import { InfoStyles, InfoBody, InfoSection, InfoAutoSearch } from '../components/Info'
import { useF } from '../lib/hooks'

const _projects = {
    search: 'search through all pages',
    terrain: ['terrain generation', 'procedurally generated landscape'],
    nonogram: ['nonogram solver', 'created to solve puzzles from the app <a href="https://apps.apple.com/us/app/picture-cross/id977150768">Picture Cross</a>, aka <a href="https://en.wikipedia.org/wiki/Nonogram">nonograms</a>'],
    snakes: 'one- or two-player co-op game of snake!',
    wordbase: 'clone of Wordbase (discontinued word game)',
    snackman: "it's kinda like Pac-Man!",
    befruited: 'bejeweled but with fruit!',
    graffiti: ['graffiti wall', 'open to everyone'],
    turt: ['turt smurts', 'wise turtle, 50/50 mix of user content and <a href="api.quotable.io">api.quotable.io/random</a>'],
    oldturt: ['2d turt smurts', 'wise turtle, 50/50 mix of user content and <a href="api.quotable.io">api.quotable.io/random</a>'],
    insult: "idk sometimes it's funny",
    floating: 'shifting Delaunay triangulation',
    models: 'simple 3d trees & things created in Blender',
    domains: 'list of domains for this site',
    u: 'user profiles',
    notify: 'manage page notifications',
    reset: 'change password',
    home: 'landing page',
    about: 'bio and contact',
    projects: 'highlighted project list',
    pulse: 'colorful points follow your cursor',
    ly: 'link shortener & aggregator',
}
'cloud'.split(' ').forEach(p => {
    if (!_projects[p]) _projects[p] = '' });
const searchProjects = Object.keys(_projects).sort();
searchProjects.forEach(key => {
    if (typeof _projects[key] === 'string') {
        _projects[key] = ['', _projects[key]] }})
export const projects = _projects;

const SearchEntry = ({page, term}) => {
    let p = projects[page];
    let reg = RegExp(`(${term})`, 'gi')

    let highlight = html => !term ? html : html.split('<a')
        .map((text, i) => {
            if (i > 0) {
                let split = text.split('>')
                split[1] = split[1].replace(reg, `<span class="highlight">$1</span>`)
                return split.join('>')
            } else {
                return text.replace(reg, `<span class="highlight">$1</span>`)
            }
        }).join('<a')

    return (<div className='entry'>
        <Link className='title' to={`/${page}`} dangerouslySetInnerHTML={{__html:
            '/' + highlight(p[0] ? `${page}: ${p[0]}` : page)}}/>
        <div className='desc' dangerouslySetInnerHTML={{__html:
            highlight(projects[page][1]) }}></div>
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
    let calcResults = term => {
        return searchProjects
            .filter(p => [p].concat(projects[p]).some(field => field.toLowerCase().includes(term)))
            .sort((a, b) => {
                if (a === term) return -1;
                if (b === term) return 1;
                let aHas = [a, projects[a][0]].some(field => field.toLowerCase().includes(term));
                let bHas = [b, projects[b][0]].some(field => field.toLowerCase().includes(term));
                if (aHas && bHas) return a.localeCompare(b);
                else if (aHas) return -1;
                else if (bHas) return 1;
                else return a.localeCompare(b);
            })
    }
    let [results, setResults] = useState(calcResults(term));

    useF(() => (searchRef.current as HTMLInputElement).focus());
    useF(term, () => {
        setResults(calcResults(term));
        window.history.replaceState(null, '/search',
            term ? `/search/#${term}` : '/search')
    })
    const handle = {
        search: () => {
            let current = searchRef.current;

            if (current) {
                let search = (current as HTMLInputElement).value
                setTerm(search.toLowerCase())
            }
        },
        go: () => {
            history.push(`/${results[0] || (searchRef.current as HTMLInputElement).value || ''}`)
        },
    }

    return <Style>
        <InfoAutoSearch {...{
            searchRef,
            term,
            placeholder: 'find a page',
            search: handle.search,
            go: handle.go,
        }}/>
        <InfoBody>
            <InfoSection label='results'>
                <SearchList term={term} results={results} />
            </InfoSection>
        </InfoBody>
    </Style>
}

const Style = styled(InfoStyles)`
    .body {
        .entry {
            cursor: pointer;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            .title { margin-right: 1rem; color: black; }
            // &:hover .title { text-decoration: underline; }
            .title:hover { text-decoration: underline; }
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