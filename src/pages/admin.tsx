import React, { useState, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { useRouteMatch, useHistory, Link } from 'react-router-dom';
import api from '../lib/api';
import { useF, useAuth } from '../lib/hooks';
import { RequireMe } from '../lib/auth';
import { InfoStyles, InfoBody, InfoLinks, InfoSearch, InfoSection, InfoLine, InfoLines } from '../components/Info'

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
  let [loaded, setLoaded] = useState(false);
  let [profile, setProfile] = useState(undefined);
  let [info, setInfo]: [{ [key: string]: any }, any] = useState({});
  let searchRef = useRef();

  useF(auth.user, () => {
    handle.load();
    (searchRef.current as HTMLElement)?.focus()
  })
  const handle = {
    load: () => {
      if (auth.user) {
        api.get(`/profile/${auth.user}`).then(handle.parse)
      } else {
        setProfile(undefined)
        setLoaded(true)
      }
    },
    parse: data => {
      setProfile(data.profile)
      if (data.profile) {
        let { friends, follows, followers } = data.profile;
        info = {};
        if (auth.user) {
          info.isUser = true;
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
      }
      setLoaded(true);
    },
    search: () => {
      let current = searchRef.current;
      if (current) {
        let search = (current as HTMLInputElement).value
        search && history.push(`/search#${search}`)
      }
    },
  }

  return RequireMe(<Style>
    <InfoSearch {...{searchRef, placeholder: 'find a page', search: handle.search}}/>
    <InfoBody className='personal'>
    {auth.user && profile ?
    <Fragment>

      <InfoLine>
        welcome {profile.user}
      </InfoLine>
      <InfoLines {...{
        labels: ['personal'],
        lines: [
          ['/profile', 'view friends & accept requests'],
          ['/notify', 'email & notification settings'],
          ['/reset', 'change password'],
        ].map(e => ({
          labels: [e[1]],
          content: <Link to={e[0]}>{e[0]}</Link>,
        }))
      }}/>
      <InfoLines {...{
        labels: ['utilities'],
        lines: [
          ['/ly', 'url shortener'],
          ['/domains', ''],
          ['/tally', 'habit tracker'],
          ['/counts', ''],
        ].map(e => ({
          labels: [e[1]],
          content: <Link to={e[0]}>{e[0]}</Link>,
        }))
      }}/>
      {/* <PathList label='personal' paths={'profile reset notify ly'.split(' ')} /> */}

    </Fragment> : loaded ? 'sign in to view dashboard' : ''}
    </InfoBody>
  </Style>)
}

const Style = styled(InfoStyles)`
  .personal {
    .entry-line {
      a {
        min-width: 5rem;
      }
    }
  }
`