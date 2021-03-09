import React, { useState, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { useRouteMatch, useHistory } from 'react-router-dom';
import api from '../lib/api';
import { useF, useAuth } from '../lib/hooks';
import { useUserSocket } from '../lib/io';
import { InfoStyles, InfoBody, InfoLinks, InfoSearch, InfoSection, InfoLine, InfoLoginBlock } from '../components/Info'

const UserList = ({labels, users}) => {
  return <InfoLinks {...{
    entries: users.map(u => ({ text: u, data: `/u/${u}` })),
    labels,
  }}/>
}

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  let auth = useAuth();
  let history = useHistory();
  let user = useRouteMatch('/:page/:user')?.params.user || (() => {
    auth.user && history.replace(`/u/${auth.user}`);
    return auth.user;
  })();
  let [loaded, setLoaded] = useState(false);
  let [profile, setProfile] = useState(undefined);
  let [info, setInfo]: [{ [key: string]: any }, any] = useState({});
  let searchRef = useRef();
  let [similar, setSimilar] = useState([])

  let [unread, setUnread] = useState({})
  let socket = useUserSocket('', {
    'chat:unread': unread => {
      setUnread(unread)
    }
  })

  useF(user, auth.user, () => {
    user && handle.load();
  })
  const handle = {
    load: () => {
      api.get(`/profile/${user}`).then(handle.parse)
    },
    follow: () => api.post(`/profile/${user}/follow`, {}).then(handle.parse),
    unfollow: () => api.post(`/profile/${user}/unfollow`, {}).then(handle.parse),
    parse: data => {
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

  const showChat = !!profile?.friends.length
  const unreadCount = showChat && unread && Object.keys(unread).length
  return <InfoStyles>
    <InfoSearch {...{searchRef, placeholder: 'find a user', search: handle.search}}/>
    {profile ?
    <InfoBody>
      <InfoSection label='user'>
        <InfoLine labels={[
          info.canFollow ? { text: 'follow', func: handle.follow } : '',
          info.canUnfollow ? { text: 'unfollow', func: handle.unfollow } : '',
          info.isFriend ? 'friend!' : ''
        ]}>
          {profile.user}
        </InfoLine>
      </InfoSection>
      {profile.recents ? <InfoLinks labels={['recents']} entries={profile.recents} /> : ''}
      {profile.bio ? <div className='bio'>{profile.bio}</div> : ''}
      <UserList labels={[
        'friends',
        showChat ? { text: 'chat', func: () => history.push('/chat') } : '',
        unreadCount ? { text: unreadCount, func: () => history.push('/chat') } : '',
        // showChat && unread ? `${unread}` : ''
        ]} users={profile.friends} />
      {info.isUser
      ? <UserList labels={['requests']} users={info.requests} />
      : ''}
    </InfoBody>
    : loaded
    ? <InfoBody>
      <InfoSection label='user'>
        <InfoLine>{`'${user}' does not exist`}</InfoLine>
      </InfoSection>
      <UserList labels={['similar']} users={similar} />
    </InfoBody>
    : user ? '' : <InfoBody><InfoLoginBlock to='view your profile' /></InfoBody>}
  </InfoStyles>
}
