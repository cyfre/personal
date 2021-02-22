import React, { useState, useEffect, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { useRouteMatch, useHistory } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/hooks';

const UserEntry = ({user}) => {
  let history = useHistory();
  return (<div className='entry' onClick={() => history.push(`/u/${user}`)}>
    {user}
  </div>)
}
const UserList = ({users}) => <Fragment>
  {users ? users.map(u => <UserEntry user={u} key={u} />) : ''}
</Fragment>

const PathEntry = ({path}) => {
  let history = useHistory();
  return (<div className='entry' onClick={() => history.push(path)}>
    {path}
  </div>)
}
const PathList = ({paths}) => <Fragment>
  {paths ? paths.map(p => <PathEntry path={p} key={p} />) : ''}
</Fragment>

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  let auth = useAuth();
  let history = useHistory();
  let user = useRouteMatch('/u/:user')?.params.user || (() => {
    history.replace(`/u/${auth.user}`);
    return auth.user;
  })();
  let [loaded, setLoaded] = useState(false);
  let [profile, setProfile] = useState(undefined);
  let [info, setInfo]: [{ [key: string]: any }, any] = useState({});
  let searchRef = useRef();
  let [similar, setSimilar] = useState([])

  useEffect(() => {
    handle.load();
    // document.title = `/u/${user || auth.user || ''}`
  }, [user, auth.user])
  const handle = {
    load: () => api.get(`/profile/${user}`).then(handle.parse),
    follow: () => api.post(`/profile/${user}/follow`, {}).then(handle.parse),
    unfollow: () => api.post(`/profile/${user}/unfollow`, {}).then(handle.parse),
    parse: data => {
      console.log(data);
      setLoaded(true);
      setProfile(data.profile)
      if (data.profile) {
        let { friends, follows, followers } = data.profile;
        info = {};
        if (auth.user) {
          info.isUser = user === auth.user;
          let friendSet = new Set(friends);
          let followerSet = new Set(followers);
          if (info.isUser) {
            info.requests = followers.filter(f => !friendSet.has(f));
          } else {
            info.isFriend = friendSet.has(auth.user);
            info.canFollow = !followerSet.has(auth.user);
            info.canUnfollow = followerSet.has(auth.user);
          }
        }
        setInfo(info);
      } else if (data.similar) {
        setSimilar(data.similar)
      }
    },
    search: () => {
      let current = searchRef.current;
      if (current) {
        let search = (current as HTMLInputElement).value
        search && history.push(`/u/${search}`)
      }
    },
  }

  return <Style>
    <div className='search'>
      <input ref={searchRef} type='text' placeholder='find a user'
        autoCorrect='off' autoCapitalize='off'
        onKeyDown={e => e.key === 'Enter' && handle.search()}/>
      <span className='submit' onClick={handle.search}>[ <span>go</span> ]</span>
    </div>
    {profile ?
    <div className='profile'>
      <div>
        <div className='label'>user</div>
        {profile.user}
        {info.canFollow ?
        <div className='follow button' onClick={handle.follow}>follow</div> : ''}
        {info.canUnfollow ?
        <div className='follow button' onClick={handle.unfollow}>unfollow</div> : ''}
        {info.isFriend ? <div className='lil-badge'>
friend!</div> : ''}
      </div>
      {profile.recents ? <div>
        <div className='label'>recents</div>
        <PathList paths={profile.recents} />
      </div> : ''}
      {profile.bio ? <div className='bio'>{profile.bio}</div> : ''}
      <div>
        <div className='label'>friends</div>
        <UserList users={profile.friends} />
      </div>
      {info.isUser
      ? <div>
        <div className='label'>requests</div>
        <UserList users={info.requests} />
      </div>
      : ''}
    </div>
    : loaded
    ? <div className='profile'>
      <div>
        <div className='label'>user</div>
        '{user}' does not exist
      </div>
      <div>
        <div className='label'>similar</div>
        <UserList users={similar} />
      </div>
    </div>
    : ''}
  </Style>
}

const Style = styled.div`
  height: 100%; width: 100%;
  background: white;
  color: black;
  .search {
    padding: .3rem .3rem;
    // padding-top: .1rem;
    background: black;
    // background: #a2ddff;
    display: flex;
    input {
      width: 8rem;
      font-size: .8rem;
      background: white;
      border: white;
      color: black;
      padding: 0 .3rem;
      border-radius: .3rem;
      min-width: 42%;
    }
    .submit {
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: white;
      // border: 2px solid white;
      padding: 0 .3rem;
      border-radius: .3rem;
      margin-left: .3rem;
      white-space: pre;
      font-size: .9rem;
      &:hover span { text-decoration: underline; }
    }
  }
  .profile {
    padding: 1rem;
    .label { display: block; }
    .lil-badge { display: inline-block; }
    .label, .lil-badge {
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

    .button {
      cursor: pointer;
      display: inline-block;
      width: fit-content;
      font-size: .8rem;
      border: 2px solid black;
      padding: 0 .3rem;
      border-radius: .3rem;
      &.follow {
        margin: 0 .5rem;
      }
    }
    .entry {
      cursor: pointer;
      :hover { text-decoration: underline; }
    }
  }
`