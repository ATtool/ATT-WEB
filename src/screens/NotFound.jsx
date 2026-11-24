import React from 'react';
import Page from '../components/Page.jsx';
import { Link } from '../router.jsx';
import Icon from '../components/Icon.jsx';
import MixedText from '../components/MixedText.jsx';

export default function NotFound() {
  return (
    <Page title="Page not found" backFallback="/">
      <div className="state notfound">
        <span className="notfound-code">404</span>
        <MixedText as="h2" size={22}>இந்தப் பக்கம் கிடைக்கவில்லை</MixedText>
        <p>The page you are looking for may have moved, or it is not saved offline yet.</p>
        <Link to="/" className="btn btn-primary">
          <Icon name="home" size={17} /> Go to Home
        </Link>
      </div>
    </Page>
  );
}
