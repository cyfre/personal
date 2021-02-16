import React, { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';
import { useInput, useEventListener, useAnimate } from '../lib/hooks';

const Ly = styled.div`
    & .link-container {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        margin: 1rem 0;

        & .link {
            background: #131125;
            height: 2rem;
            border-radius: 1rem;
            text-decoration: underline;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: .25rem 0;
            padding: .2rem .5rem;
            font-size: .8rem;

            & a {
                color: rgb(155 228 170);
                text-decoration: none;
                &:hover {
                    color: var(--light);
                    text-decoration: underline;
                }
            }
        }

        & .edit-link {
            & .minus, & .plus {
                display: inline-flex;
                justify-content: center;
                align-items: center;
                width: 1.5rem;
                height: 1.5rem;
                margin-left: .5rem;
                border-radius: 50%;
                border: 2px solid var(--dark);
                color: var(--dark);
            }
        }
    }

    & .button {
        cursor: pointer;
    }
`

const alphanum = 'qwertyuiopasdfghjklzxcvbnm1234567890QWERTYUIOPASDFGHJKLZXCVBNM';
const randi = n => {
    return Math.floor(Math.random() * n);
}
const randAlphanum = n => {
    let str = '';
    for (let i = 0; i < n; i++) {
        str += alphanum[randi(alphanum.length)];
    }
    return str;
}

export default () => {
    let match = useRouteMatch('/ly/:hash');
    let [hash, setHash] = useState(match?.params.hash || randAlphanum(7));
    let [links, setLinks] = useState(['']);
    let [edit, setEdit] = useState(!match?.params.hash);

    const handle = {
        setHash,
        setLinks,
        setEdit,
        load: hash => {
            api.read(`/ly/${hash}`, data => {
                console.log(data);
                window.history.replaceState({}, null, `/ly/${data.hash}`);
                setLinks(data.links);
                setEdit(false);
            });
        },
        save: ({hash, link, links}) => {
            api.create('/ly', {
                hash,
                links: [link, ...links].filter(l => l),
            }, data => {
                console.log(data);
                handle.load(data.hash);
            });
        },
        add: (i) => {
            setLinks(links.slice(0, i+1).concat(['']).concat(links.slice(i+1)));
        },
        edit: (i, link) => {
            let newLinks = links.slice();
            newLinks[i] = link;
            setLinks(newLinks);
        },
        delete: (i) => {
            setLinks(links.slice(0, i).concat(links.slice(i+1)));
        },
        new: () => {
            setLinks([]);
            setHash(randAlphanum(7));
            setEdit(true);
        }
    };
    useEffect(() => {
        match && handle.load(match.params.hash)
    }, []);

    return (
        <Ly>
            <div className='link-container'>
                {edit
                    ? <EditLinks handle={handle} hash={hash} links={links} />
                    : <ViewLinks handle={handle} hash={hash} links={links} />}
            </div>
        </Ly>
    );
}

const EditLinks = ({handle, hash, links}) => {
    const hashInput = useRef();
    useEffect(() => {
        hashInput.current.value = hash;
    }, [hash]);
    return (
        <div>
            <input ref={hashInput}
                className='input' type='text' spellCheck='false'
                onKeyDown={e => setTimeout(() => handle.setHash(hashInput.current.value), 0)} />
            <div className='button save' onPointerDown={e => handle.save({hash, links})}>save</div>
            {links.map((link, i) => <EditLink key={i} i={i} handle={handle} link={link} />)}
        </div>
    )
}
const EditLink = ({i, handle, link}) => {
    const linkInput = useRef();
    useEffect(() => {
        linkInput.current.value = link;
    }, [link]);
    return (
        <div className='edit-link'>
            <input ref={linkInput}
                className='input' type='text' spellCheck='false'
                onKeyDown={e => setTimeout(() => handle.edit(i, linkInput.current.value), 0)} />
            <div className='button minus' onPointerDown={e => handle.delete(i)}>-</div>
            <div className='button plus' onPointerDown={e => handle.add(i)}>+</div>
        </div>
    )
}


const ViewLinks = ({handle, hash, links}) => {
    return (
        <div>
            <div>{hash}</div>
            {links.map((link, i) => <Link key={i} link={link}/>)}
        </div>
    )
}
const Link = ({link}) => {
    return (
        <div className='link'>
            <a href={'https://' + link}>{link}</a>
        </div>
    )
}