import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import clsx from 'clsx';
import { LogIn, HelpCircle } from 'lucide-react';

const socket = io(window.location.protocol + '//' + window.location.hostname + ':8000');

function Player() {
  const [joined, setJoined] = useState(false);
  const [room, setRoom] = useState(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('alive'); // alive, dead, winner

  useEffect(() => {
    socket.on('joined', (data) => {
      setJoined(true);
      setError('');
    });

    socket.on('error', (data) => {
      setError(data.message);
    });

    socket.on('room_update', (roomData) => {
      setRoom(roomData);
      
      // Check winner state
      if (roomData.state === 'end') {
        const alivePlayers = Object.values(roomData.players).filter(p => p.status === 'alive');
        if (alivePlayers.length === 1 && alivePlayers[0].name === name) {
          setStatus('winner');
        } else if (alivePlayers.length === 0 && roomData.players[socket.id]?.status === 'alive') {
           setStatus('winner');
        }
      }
    });

    socket.on('eliminated', () => {
      setStatus('dead');
    });

    return () => {
      socket.off('joined');
      socket.off('error');
      socket.off('room_update');
      socket.off('eliminated');
    };
  }, [name]);

  const joinRoom = (e) => {
    e.preventDefault();
    if (code && name) {
      socket.emit('join_room', { code, name });
    }
  };

  const submitAnswer = (choiceIndex) => {
    if (room && room.state === 'question' && status === 'alive') {
      socket.emit('answer', { code: room.code, choice: choiceIndex });
    }
  };

  if (status === 'winner') {
    return (
      <div className="winner">
        WINNER!
      </div>
    );
  }

  if (status === 'dead') {
    return (
      <div className="bsod" onClick={() => window.location.reload()}>
        <h1>A fatal error has occurred.</h1>
        <p>You have answered incorrectly or run out of time.</p>
        <p>Press anywhere to restart your computer and return to the login screen.</p>
        <br/>
        <p>Technical information:</p>
        <p>*** STOP: 0x0000000A (IRQL_NOT_LESS_OR_EQUAL)</p>
        <p>*** ELIMINATED_FROM_GAME.SYS - Address 0xFFFFFFFF base at 0x00000000</p>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-blue-800 flex items-center justify-center p-4">
        <div className="window" style={{ width: '100%', maxWidth: '350px' }}>
          <div className="title-bar">
            <div className="title-bar-text">Log On to CtrlAltDefeat</div>
            <div className="title-bar-controls">
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body">
            <div className="flex items-center mb-4">
              <LogIn size={32} className="mr-3 text-blue-600" />
              <p>Type a room code and username to log on to the game.</p>
            </div>
            {error && <p className="text-red-600 mb-2 font-bold">{error}</p>}
            <form onSubmit={joinRoom}>
              <div className="field-row">
                <label htmlFor="code" style={{width: '80px'}}>Room Code:</label>
                <input id="code" type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={4} required className="uppercase flex-grow"/>
              </div>
              <div className="field-row mt-2">
                <label htmlFor="name" style={{width: '80px'}}>User name:</label>
                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required maxLength={15} className="flex-grow"/>
              </div>
              <div className="flex justify-end mt-6 gap-2">
                <button type="submit" style={{width: '80px'}}>OK</button>
                <button type="button" onClick={() => {setCode(''); setName('');}} style={{width: '80px'}}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!room) return <div className="min-h-screen bg-blue-800 flex items-center justify-center p-4 text-white">Loading...</div>;
  const myPlayer = room?.players[socket.id];
  const choice = myPlayer?.choice;

  return (
    <div className="min-h-screen bg-blue-800 p-4 font-tahoma flex flex-col">
      <div className="window flex-grow flex flex-col">
        <div className="title-bar">
          <div className="title-bar-text">Connection: {room?.code} - {name}</div>
        </div>
        <div className="window-body flex-grow flex flex-col items-center justify-center p-4 bg-white relative">
          
          {room?.state === 'lobby' && (
            <div className="text-center">
              <div className="mb-4">
                <img src="https://win98icons.alexmeub.com/icons/png/network_internet_pcs_installer-2.png" alt="Loading" className="mx-auto block" />
              </div>
              <h2 className="text-xl font-bold mb-2">Connected!</h2>
              <p>Waiting for the host to start the game. Prepare yourself.</p>
            </div>
          )}

          {room?.state === 'question' && (
            <div className="w-full flex-grow flex flex-col">
              <h2 className="text-center font-bold text-xl mb-4 text-blue-900 border-b-2 border-blue-200 pb-2">Select your answer!</h2>
              <div className="grid grid-cols-1 gap-4 flex-grow">
                {['A', 'B', 'C', 'D'].map((letter, i) => (
                  <button 
                    key={i} 
                    className={clsx(
                      "mobile-btn", 
                      choice === i ? "active !bg-blue-600 !text-white" : ""
                    )}
                    onClick={() => submitAnswer(i)}
                  >
                    {letter}
                  </button>
                ))}
              </div>
              {choice !== null && choice !== undefined && (
                <p className="text-center mt-4 text-green-700 font-bold">Answer received! Waiting for others...</p>
              )}
            </div>
          )}

          {room?.state === 'reveal' && (
            <div className="text-center">
              <HelpCircle size={48} className="mx-auto mb-4 text-blue-500" />
              <h2 className="text-2xl font-bold mb-2">Time's Up!</h2>
              <p>Look at the main screen for the correct answer.</p>
            </div>
          )}

          {room?.state === 'end' && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Game Over</h2>
              <p>Look at the main screen for the final results.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Player;
