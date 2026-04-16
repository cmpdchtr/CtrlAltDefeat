import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Player from './Player.jsx';
import Host from './Host.jsx';
import Create from './Create.jsx';
import { soundManager } from './SoundManager';

function App() {
  // Normalize double slashes in URL path
  if (window.location.pathname.includes('//')) {
    window.history.replaceState(null, '', window.location.pathname.replace(/\/\/+/g, '/'));
  }

  useEffect(() => {
    const handleInteraction = () => {
      soundManager.init();
      // Remove listener after first interaction
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Player />} />
        <Route path='/host' element={<Host />} />
        <Route path='/create' element={<Create />} />
        <Route path='*' element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
