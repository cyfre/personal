import React, { useState, useEffect, useRef, Fragment } from 'react';
import api from '../lib/api';
import { useRouteMatch, useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useE, useF, useInput, useEventListener, useAnimate, useAuth } from '../lib/hooks';
import { auth } from '../lib/auth';


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
  let auth = useAuth()
  let history = useHistory()
  let isView = history.location.hash === '#view'
  let match = useRouteMatch('/ly/:hash')
  let [error, setError] = useState('')
  let [ly, setLy] = useState({
    hash: match?.params.hash || '',
    links: []
  })
  let [lys, setLys] = useState(undefined)
  let [edit, setEdit] = useState(false);

  useE(auth.user, () => {
    ly.hash && handle.load();
    handle.loadAll();
  })
  useE(ly, () => {
    window.history.replaceState(null, '/ly',
      (ly.hash ? `/ly/${ly.hash}` : '/ly')
      + (isView ? '#view' : ''))
  })
  const handle = {
    setLy,
    setEdit,
    loadAll: () => {
      if (auth.user) {
        api.get('/ly').then(data => {
          setError('')
          console.log('lys', data)
          setLys(data.list)
        }).catch(e => setError(e.error))
      } else {
        setLys([])
      }
    },
    load: () => {
      ly.hash && api.get(`/ly/${ly.hash}`).then(data => {
        console.log('ly load', data)
        setError('')
        if (data.ly) {
          if (data.ly.links.length === 1 && !isView) {
            // window.history.replaceState(null, '',
            //   'https://' + data.ly.links[0].replace('https://', ''))
            history.replace(`/ly/${ly.hash}#view`)
            window.location.replace(
              'https://' + data.ly.links[0].replace('https://', ''))
          } else {
            setLy(data.ly);
          }
        } else {
          // setError(`${ly.hash} does not exist`)
          setEdit(true)
        }
      }).catch(e => setError(e.error))
    },
    save: () => {
      console.log(ly.hash)
      api.post(`/ly/${ly.hash}`, ly).then(data => {
        console.log('ly save', data)
        setError('')
        if (data.ly) {
          // setLy(data.ly);
          // setEdit(false);
          history.push(`/ly/${data.ly.hash}#view`)
        } else {
          // setError(`${ly.hash} does not exist`)
          setEdit(true)
        }
      }).catch(e => {
        console.log(e.error)
        setError(e.error)
        setEdit(true)
      })
    },
    new: () => {
      setEdit(true)
      setLy({
        hash: randAlphanum(7),
        links: []
      })
    },
    delete: () => {
      api.delete(`/ly/${ly.hash}`).then(data => {
        handle.setLy({ hash: '' })
        handle.loadAll()
      })
    }
  };

  return (
    <Style>
      <div className='body'>
        {!error ? ''
        : <div className='error' style={{color: 'red', minHeight: '0'}}>{error}</div>}
        {edit
          ? <LinkEdit handle={handle} ly={ly} />
          : ly.hash
          ? <LinkView handle={handle} ly={ly} />
          : <LinkMenu handle={handle} lys={lys} />}
      </div>
    </Style>
  );
}

const LinkMenu = ({handle, lys}) => {
  let auth = useAuth()
  let history = useHistory()

  return auth.user && lys
  ? <Fragment>
    <div><div className='label inline'>your links</div>
      {/* <div className='label inline'>{auth.user}'s /ly</div> */}
      <div className='button button-badge'
        onPointerDown={e => handle.new()}>
        new</div><br/>
      {lys.length
      ? lys.map((l, i) => <Fragment>
        <div className='entry inline' key={i} onClick={() => {
          // handle.setLy(l)
          history.push(`/ly/${l.hash}#view`)
          // history.push(`/ly/edit/${l.hash}`)
        }}>cyfr.dev/ly/{l.hash}</div>
        <div className='lil-badge inline'>
          {l.links[0] + (l.links.length === 1 ? '' : ` + ${l.links.length - 1}`)}</div>
        <br/>
      </Fragment>)
      : <div>no links</div>}
    </div>
  </Fragment>
  : <div><div className='label'>your links</div>
    {/* <div className='label'>{auth.user || 'user'}'s /ly</div> */}
  {lys ? 'sign in to create & edit links' : ''}
  </div>
}

const LinkEdit = ({handle, ly}) => {
  const auth = useAuth()
  const hashInput = useRef();
  const linksInput = useRef();
  useE(ly, () => {
    hashInput.current.value = ly.hash;
    linksInput.current.value = ly.links.join('\n');
  });
  return <Fragment>
    <div className='edit'>
      <div className='label inline'>link</div>
      <div className='button button-badge'
        onPointerDown={e => handle.save(ly)}>
        save</div><br/>
      <input ref={hashInput}
          className='input' type='text' spellCheck='false'
          onKeyDown={e => setTimeout(() =>
            handle.setLy({...ly, hash: hashInput.current.value}), 0)} />
    </div>

    <div><div className='label'>author</div>
    {ly.user || auth.user}
    </div>

    <div className='edit'><div className='label inline'>links</div>
      <textarea ref={linksInput}
        className='input' spellCheck='false'
        rows={Math.max(5, ly.links.length + 1)}
        onKeyDown={e => setTimeout(() => {
          let newLinks = linksInput.current.value
            .replace(/\n{3,}/g, '\n\n')
            .split('\n')
            .map(l => l.trim())
          handle.setLy({ ...ly, links: newLinks})
        }, 0)} />
    </div>
  </Fragment>
}

const LinkView = ({handle, ly}) => {
  let auth = useAuth()
  let history = useHistory()
  let [copied, setCopied] = useState(false)
  let [confirm, setConfirm] = useState(false)
  return <Fragment>
    <div>
      {auth.user !== ly.user
      ? <div className='label'>link</div>
      : <Fragment>
        <div className='label inline'>link</div>
        <div className='button button-badge'
            onPointerDown={e => handle.setEdit(true)}>
          edit</div>
        {confirm
        ? <Fragment>
          <div className='button button-badge'
              onPointerDown={() => setConfirm(false)}>
            cancel</div>
          <div className='button button-badge'
              onPointerDown={handle.delete}>
            really delete</div>
        </Fragment>
        : <div className='button button-badge'
              onPointerDown={() => setConfirm(true)}>
            delete</div>}
        <br/>
      </Fragment>}
      <div className={copied ? '' : 'entry'} onClick={() => {
        navigator.clipboard.writeText(`${window.location.origin}/ly/${ly.hash}`);
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
        }}>
        {copied ? 'copied!' : `cyfr.dev/ly/${ly.hash}`}</div>
    </div>

    <div><div className='label'>author</div>
    <div className='entry' onClick={() => {
      history.push(`/u/${ly.user}`)
    }}>{ly.user}</div>
    </div>

    <div className='edit'><div className='label inline'>links</div>
    {ly.links.map((link, i) =>
      <div className='entry' key={i}>
        <a href={'https://' + link.replace('https://', '')}>
          {link}
        </a>
      </div>)}
    </div>
  </Fragment>
}


const Style = styled.div`
height: 100%; width: 100%;
background: white;
color: black;
.body {
  padding: 1rem;
  .label, .lil-badge, .button-badge {
    display: block;
    &.inline { display: inline-block; }
    width: fit-content;
    font-size: .8rem;
    padding: 0 .3rem;
    border-radius: .3rem;
  }
  .label, .lil-badge {
    opacity: .5;
    background: #00000022;
  }
  .lil-badge {
    margin-left: .5rem;
  }
  > * {
    margin-bottom: .5rem;
    min-height: 3rem;
  }

  .entry {
    cursor: pointer;
    user-select: all;
    :hover { text-decoration: underline; }
    a { color: black; }
    &.inline { display: inline-block; }
  }

  .button {
    display: inline-block;
    margin-left: .5rem;
    // float: right;
  }
}
.button {
  cursor: pointer; user-select: none;
  display: inline-block;
  width: fit-content;
  font-size: .8rem;
  border: 2px solid black;
  padding: 0 .3rem;
  border-radius: .3rem;
}
.edit {
  width: 66%;
  input {
    height: 2.0rem;
    line-height: 1rem;
  }
  input, textarea {
    width: 100%;
    color: black;
    border: 2px solid transparent;
    padding: 0 .5rem;
    border-color: #00000022;
    border-radius: .2rem;
    box-shadow: none;
    margin: .5rem 0;
    -webkit-appearance: none;
  }
}
`