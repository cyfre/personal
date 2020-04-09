import React from 'react';

const Bio = (props) => {
  return (
    <div className="bio">
      <img className="profile" />
      <p className="about">about me</p>
      <a href="#">link</a>
      <a href="#">link</a>
    </div>
  )
}

const Aside = (props) => {
  return (
    <div className="aside card">
      <Bio />
    </div>
  )
}

const Content = (props) => {
  return (
    <div className="about"></div>
  )
}

const Widgets = (props) => {
  return (
    <div className="widgets">
      <div className="card">widget</div>
      <div className="card">widget</div>
      <div className="card">widget</div>
    </div>
  )
}

export default () => (
  <div>
    <Aside />
    <Content />
    <Widgets />
  </div>
)