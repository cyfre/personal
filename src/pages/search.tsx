import React, { useState, useEffect, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { Link, useHistory } from 'react-router-dom';
import { InfoStyles, InfoBody, InfoSection, InfoAutoSearch, InfoBadges } from '../components/Info'
import { useF } from '../lib/hooks'

const _projects = {
    search: 'search through all pages',
    terrain: ['terrain generation', 'procedurally generated landscape'],
    nonogram: ['nonogram solver', 'created to solve puzzles from the app <a href="https://apps.apple.com/us/app/picture-cross/id977150768">Picture Cross</a>, aka <a href="https://en.wikipedia.org/wiki/Nonogram">nonograms</a>'],
    snakes: 'one- or two-player co-op game of snake!',
    wordbase: 'clone of Wordbase (discontinued word game)',
    snackman: "it's kinda like Pac-Man!",
    befruited: 'bejeweled but with fruit!',
    graffiti: ['graffiti wall', 'open to all (be nice)'],
    'turt-smurts': 'wise turtle, 50/50 mix of user content and <a href="api.quotable.io">api.quotable.io/random</a>',
    'turt-smurts-2D': 'wise turtle, 50/50 mix of user content and <a href="api.quotable.io">api.quotable.io/random</a>',
    insult: "idk sometimes it's funny",
    floating: 'shifting Delaunay triangulation',
    models: 'simple 3D trees & things created in Blender',
    domains: 'list of domains for this site',
    u: ['user profile', ''],
    notify: 'manage page notifications',
    reset: 'change password',
    home: 'landing page',
    about: 'bio and contact',
    projects: 'highlighted project list',
    speckle: 'colorful points follow your cursor',
    // ly: 'link shortener & aggregator',
    cloud: `phasing color cube`, // reminiscent of '<a href="https://www.youtube.com/watch?v=10Jg_25ytU0">Lusine - Just A Cloud</a>'
    live: 'live chat',
    chat: 'message friends',
    records: 'personal & global game scoreboards',
    tally: 'simple habit tracker',
    slime: 'automata behavior visualization',
    coffee: 'buy me a coffee :-)',
}
// ''.split(' ').forEach(p => {
//     if (!_projects[p]) _projects[p] = '' });
const searchProjects = Object.keys(_projects).sort();
searchProjects.forEach(key => {
    if (typeof _projects[key] === 'string') {
        _projects[key] = ['', _projects[key]] }})
export const projects = _projects;

const tags = {
    visual: 'cloud floating models terrain graffiti slime speckle',
    game: 'befruited snackman snakes wordbase',
    utility: 'notify reset search',
    tool: 'tally',
    me: 'about coffee domains home projects',
    'w/ others': 'chat graffiti live records speckle turt-smurts turt-smurts-2D u wordbase',
}
const projectTags = {}
Object.keys(tags).forEach(key => {
    tags[key] = new Set(tags[key].split(' '))
    tags[key].forEach(project => {
        projectTags[project] = (projectTags[project] ?? []).concat(key)
    })
})

const SearchEntry = ({page, regex, tabbed, setTerm}) => {
    let entryRef = useRef()
    let p = projects[page];
    // let reg = RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')

    let highlight = html => !regex ? html : html.split('<a')
        .map((text, i) => {
            if (i > 0) {
                let split = text.split('>')
                split[1] = split[1].replace(regex, `<span class="highlight">$1</span>`)
                return split.join('>')
            } else {
                return text.replace(regex, `<span class="highlight">$1</span>`)
            }
        }).join('<a')

    useF(tabbed, () => {
        if (tabbed) {
            (entryRef.current as HTMLElement).scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest"
            })
        }
    })
    return (
    <div className={tabbed ? 'entry tabbed' : 'entry'} ref={entryRef}>
        <Link className='title' to={`/${page}`} dangerouslySetInnerHTML={{__html:
            '/' + highlight(p[0] ? `${page}: ${p[0]}` : page)}}/>
        {/* <InfoBadges labels={(projectTags[page] ?? []).map(tag => ({ text: tag, func: () => setTerm(tag) }))} /> */}
        <div className='desc' dangerouslySetInnerHTML={{__html:
            highlight(projects[page][1]) }}></div>
    </div>
    )
}
const SearchList = ({results, regex, tab, setTerm}) => <Fragment>
    {results.map((p, i) =>
        <SearchEntry page={p} regex={regex} key={i} tabbed={i === tab ? true : false} setTerm={setTerm} />)}
</Fragment>

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
    let searchRef = useRef();
    let history = useHistory();
    let [term, setTerm] = useState(decodeURIComponent(window.location.hash?.slice(1)) || '');
    let regex
    try {
        regex = term ? new RegExp(`(${term})`, 'gi') : ''
    } catch (_) {
        regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    }
    let calcResults = term => {
        // let tagged = searchProjects
        //     .filter(p => (projectTags[p] || []).some(field => field === term))
        // return (tagged.length
        //     ? tagged.sort()
        //     : searchProjects
        //         .filter(p => [p].concat(projects[p]).some(field => field.match(regex)))
        //         .sort((a, b) => {
        //             if (a === term) return -1;
        //             if (b === term) return 1;
        //             let aHas = [a, projects[a][0]].some(field => field.match(regex));
        //             let bHas = [b, projects[b][0]].some(field => field.match(regex));
        //             if (aHas && bHas) return a.localeCompare(b);
        //             else if (aHas) return -1;
        //             else if (bHas) return 1;
        //             else return a.localeCompare(b);
        //         }))
        let results = searchProjects
            .filter(p => [p].concat(projects[p]).some(field => field.match(regex)))
            .sort((a, b) => {
                if (a === term) return -1;
                if (b === term) return 1;
                let aHas = [a, projects[a][0]].some(field => field.match(regex));
                let bHas = [b, projects[b][0]].some(field => field.match(regex));
                if (aHas && bHas) return a.localeCompare(b);
                else if (aHas) return -1;
                else if (bHas) return 1;
                else return a.localeCompare(b);
            })
        let tagged = searchProjects
            .filter(p => !results.includes(p) && (projectTags[p] || []).some(field => field === term))
        return results.concat(tagged)
    }
    let [results, setResults] = useState(calcResults(term));
    let [tab, setTab] = useState(0);

    useF(() => (searchRef.current as HTMLInputElement).focus());
    useF(term, () => {
        setResults(calcResults(term));
        window.history.replaceState(null, '/search',
            term ? `/search/#${encodeURIComponent(term)}` : '/search')
    })
    const handle = {
        search: () => {
            let current = searchRef.current;
            if (current) {
                let search = (current as HTMLInputElement).value
                setTerm(search.toLowerCase())
            }
            setTab(0)
        },
        go: () => {
            history.push(`/${results[tab] || (searchRef.current as HTMLInputElement).value || ''}`)
        },
    }

    return <Style>
        <InfoAutoSearch {...{
            searchRef,
            term,
            placeholder: 'find a page',
            search: handle.search,
            go: handle.go,
            tab: (dir) => setTab((tab + dir + results.length) % results.length),
        }}/>
        <InfoBody>
            <InfoSection label='results' className='results'>
                <SearchList {...{ regex, results, tab, setTerm }} />
            </InfoSection>
        </InfoBody>
    </Style>
}

const Style = styled(InfoStyles)`
    .body {
        .entry {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            width: fit-content;
            .title {
                color: black;
                // min-width: 7rem;
            }
        }
        .highlight { background: yellow; }
        .desc {
            font-size: .8rem;
            opacity: .8;
            display: none;
            margin-left: 1rem;
            a { text-decoration: underline; }
        }
        .results {
            &:not(:focus-within) .tabbed .title, .title:hover, .title:focus-visible { text-decoration: underline; }
            &:not(:focus-within) .tabbed .desc, .entry:hover .desc, .entry:focus-within .desc, .entry:first-child .desc { display: inline-block; }
        }
        .badges {
            > * {
                opacity: .25;
                background: #00000022;
                border: none;
            }
        }
    }
`