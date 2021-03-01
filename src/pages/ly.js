import React, { useState, useRef, Fragment } from 'react';
import api from '../lib/api';
import { useRouteMatch, useHistory, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useE, useF, useAuth } from '../lib/hooks';
import { InfoStyles, InfoBody, InfoSection, InfoUser, InfoLine } from '../components/Info'


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
  let [hash, setHash] = useState(match?.params.hash || '')
  let [ly, setLy] = useState({
    hash,
    links: []
  })
  let [lys, setLys] = useState(undefined)
  let [edit, setEdit] = useState(false);

  useF(auth.user, () => {
    ly.hash && handle.load();
    handle.loadAll();
  })
  useF(ly, () => {
    let newEnd = `/ly${ly.hash || ''}${isView ? '#view' : ''}`
    window.history.replaceState(null, '/ly', newEnd)
  })
  useF(edit, () => edit && setHash(ly.hash))
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
            history.replace(`/ly/${ly.hash}#view`)
            window.location.replace(
              'https://' + data.ly.links[0].replace('https://', ''))
          } else {
            setLy(data.ly);
          }
        } else {
          // setError(`/ly/${ly.hash} does not exist`)
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
        links: [],
      })
    },
    delete: () => {
      api.delete(`/ly/${ly.hash}`).then(data => {
        handle.setLy({ hash: '' })
        handle.loadAll()
      })
    },
    cancel: () => {
      setEdit(false)
      setLy({
        hash,
        links: [],
      })
      setTimeout(() => handle.load())
    }
  };

  return (
    <Style>
      <InfoBody>
        {!error ? ''
        : <div className='error' style={{color: 'red', minHeight: '0'}}>{error}</div>}
        {edit
          ? <LinkEdit handle={handle} ly={ly} />
          : ly.hash
          ? <LinkView handle={handle} ly={ly} />
          : <LinkMenu handle={handle} lys={lys} />}
      </InfoBody>
    </Style>
  );
}

const LinkMenu = ({handle, lys}) => {
  let auth = useAuth()

  return auth.user && lys
  ? <Fragment>
    <InfoSection labels={['your links', { text: 'new', func: handle.new }]} >
      {lys.length
      ? lys.map((l, i) =>
        <InfoLine key={i} labels={[
            l.links[0] + (l.links.length === 1 ? '' : ` + ${l.links.length - 1}`)
          ]}>
          <Link className='entry link' to={`/ly/${l.hash}#view`}>
            {window.location.host}/ly/{l.hash}
          </Link>
        </InfoLine>)
      : <div>no links</div>}
    </InfoSection>
  </Fragment>
  : <InfoSection label='your links'>
    {lys ? 'sign in to create & edit links' : ''}
  </InfoSection>
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
    <InfoSection className='edit-container' labels={[
      'link',
      { text: 'cancel', func: () => handle.cancel() },
      { text: 'save', func: () => handle.save(ly) }
    ]} >
      <input ref={hashInput}
          className='input' type='text' spellCheck='false'
          onKeyDown={e => setTimeout(() =>
            handle.setLy({...ly, hash: hashInput.current.value}), 0)} />
    </InfoSection>

    <InfoSection label='author'>
      {ly.user || auth.user}
    </InfoSection>

    <InfoSection className='edit-container' label='links'>
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
    </InfoSection>
  </Fragment>
}

const LinkView = ({handle, ly}) => {
  let auth = useAuth()
  let history = useHistory()
  let [copied, setCopied] = useState(false)
  let [confirm, setConfirm] = useState(false)

  let isUser = auth.user === ly.user;
  return <Fragment>
    <InfoSection labels={[
      'link',
      isUser ? { text: 'edit', func: () => handle.setEdit(true) } : '',
      (isUser && !confirm) ? { text: 'delete', func: () => setConfirm(true) } : '',
      (isUser && confirm) ? { text: 'cancel', func: () => setConfirm(false) } : '',
      (isUser && confirm) ? { text: 'really delete', func: handle.delete } : '',
    ]}>
      <div className={copied ? '' : 'entry link'} onClick={() => {
        navigator.clipboard.writeText(`${window.location.origin}/ly/${ly.hash}`);
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
        }}>
        {copied ? 'copied!' : `${window.location.host}/ly/${ly.hash}`}</div>
    </InfoSection>

    <InfoUser labels={['author']} user={ly.user || auth.user} />

    <InfoSection label='links'>
      {ly.links.map((link, i) =>
      <div className='entry' key={i}>
        <a href={'https://' + link.replace('https://', '')}>
          {link}
        </a>
      </div>)}
    </InfoSection>
  </Fragment>
}


const Style = styled(InfoStyles)`
`