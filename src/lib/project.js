import React from 'react';

export default (src) => () => (
  <iframe
    title={src}
    allowFullScreen
    frameBorder="0"
    height="100%"
    width="100%"
    src={src} />
)