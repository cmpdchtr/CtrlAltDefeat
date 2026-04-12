import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Player from './Player.jsx';
import Host from './Host.jsx';

function App() {
  // Normalize double slashes in URL path
  if (window.location.pathname.includes('//')) {
    window.history.replaceState(null, '', window.location.pathname.replace(/\/\/+/g, '/'));
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Player />} />
        <Route path='/host' element={<Host />} />
        <Route path='*' element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
