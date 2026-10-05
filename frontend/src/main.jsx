import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { getLang, translatePage } from './i18n.js';
import './styles/global.css';
import './styles/pages.css';
import './styles/story.css';

function Root() {
  useEffect(() => translatePage(), []);
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={getLang() === 'ru' ? '/' : `/${getLang()}`}>
      <Root />
    </BrowserRouter>
  </StrictMode>,
);
