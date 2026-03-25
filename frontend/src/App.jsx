import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Player from './Player.jsx';
import Host from './Host.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Player />} />
        <Route path='/host' element={<Host />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
