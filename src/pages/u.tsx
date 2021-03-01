import React, { useState, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { useRouteMatch, useHistory } from 'react-router-dom';
import api from '../lib/api';
import { useF, useAuth } from '../lib/hooks';
import { InfoStyles, InfoBody, InfoItem, InfoLinks, InfoSearch } from '../components/Info'

const UserList = ({label, users}) => {
  return <InfoLinks {...{
    entries: users.map(u => ({ text: u, data: `/u/${u}` })),
    labels: [label],
  }}/>
}

const PathList = ({label, paths}) => {
  return <InfoLinks {...{
    entries: paths,
    labels: [label],
  }}/>
}

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  let auth = useAuth();
  let history = useHistory();
  let user = useRouteMatch('/:page/:user')?.params.user || (() => {
    history.replace(`/u/${auth.user}`);
    return auth.user;
  })();
  let [loaded, setLoaded] = useState(false);
  let [profile, setProfile] = useState(undefined);
  let [info, setInfo]: [{ [key: string]: any }, any] = useState({});
  let searchRef = useRef();
  let [similar, setSimilar] = useState([])

  useF(user, auth.user, () => {
    handle.load();
  })
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

  return <InfoStyles>
    <InfoSearch {...{searchRef, placeholder: 'find a user', search: handle.search}}/>
    {profile ?
    <InfoBody>
      <InfoItem {...{
        labels: ['user'],
        entry: profile.user,
        entryLabels: [
          info.canFollow ? { text: 'follow', func: handle.follow } : '',
          info.canUnfollow ? { text: 'unfollow', func: handle.unfollow } : '',
          info.isFriend ? 'friend!' : ''
        ].filter(l => l),
      }} />
      {profile.recents ? <PathList label='recents' paths={profile.recents} /> : ''}
      {profile.bio ? <div className='bio'>{profile.bio}</div> : ''}
      <UserList label='friends' users={profile.friends} />
      {info.isUser
      ? <UserList label='requests' users={info.requests} />
      : ''}
    </InfoBody>
    : loaded
    ? <InfoBody>
      <InfoItem labels={['user']} entry={`'${user}' does not exist`} />
      <UserList label='similar' users={similar} />
    </InfoBody>
    : ''}
  </InfoStyles>
}
