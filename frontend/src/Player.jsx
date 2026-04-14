import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import clsx from 'clsx';
import { LogIn, HelpCircle, Monitor, PlusCircle } from 'lucide-react';
import { RetroAvatar } from './RetroAvatar';

// Use Vite's environment flags to dynamically switch URLs
const socketUrl = import.meta.env.DEV 
  ? `${window.location.protocol}//${window.location.hostname}:8000` 
  : undefined;

const socket = io(socketUrl);

function Player() {
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);
  const [room, setRoom] = useState(null);
  const [code, setCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || '';
  });
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('alive'); // alive, dead, winner
  const [avatar, setAvatar] = useState(null);

  const [textAnswer, setTextAnswer] = useState('');
  const [percentAnswer, setPercentAnswer] = useState(50);

  // Use array indices mapping to our custom SVG avatars (0-11)
  const avatars = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

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

    socket.on('kicked', (data) => {
      setStatus('kicked');
      setError(data.message || 'You were kicked.');
      setJoined(false);
      setRoom(null);
    });

    return () => {
      socket.off('joined');
      socket.off('error');
      socket.off('room_update');
      socket.off('eliminated');
      socket.off('kicked');
    };
  }, [name]);

  const setPlayerAvatar = (selectedAvatar) => {
    setAvatar(selectedAvatar);
    if (room && room.state === 'lobby') {
      socket.emit('set_avatar', { code: room.code, avatar: selectedAvatar });
    }
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (code && name) {
      socket.emit('join_room', { code, name, avatar });
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
      <div className="h-screen w-screen overflow-hidden bg-blue-800 flex items-center justify-center p-2 box-border">
        <div className="window" style={{ width: '100%', maxWidth: '350px' }}>
          <div className="title-bar">
            <div className="title-bar-text">Log On to CtrlAltDefeat</div>
            <div className="title-bar-controls">
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body m-0 p-2">
            <div className="flex items-center mb-2">
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
              <div className="flex justify-end mt-6 gap-4">
                <button type="submit" style={{width: '80px'}}>OK</button>
                <button type="button" onClick={() => {setCode(''); setName('');}} style={{width: '80px'}}>Cancel</button>
              </div>
            </form>
            <div className="mt-6 pt-4 border-t border-gray-300 flex flex-col gap-4">
              <button type="button" onClick={() => navigate('/host')} className="w-full flex items-center justify-center gap-2 py-2">
                <Monitor size={16} /> Host a Game
              </button>
              <button type="button" onClick={() => navigate('/create')} className="w-full flex items-center justify-center gap-2 py-2">
                <PlusCircle size={16} /> Create a Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) return <div className="min-h-screen bg-blue-800 flex items-center justify-center p-2 text-white">Loading...</div>;
  const myPlayer = room?.players[socket.id];
  const choice = myPlayer?.choice;
  const currentQuestion = room?.questions?.[room?.current_q];
  const qType = currentQuestion?.type || 'multiple_choice';

  return (
    <div className="h-screen w-screen overflow-hidden bg-blue-800 p-2 font-tahoma flex flex-col box-border">
      <div className="window flex-grow flex flex-col">
        <div className="title-bar">
          <div className="title-bar-text">Connection: {room?.code} - {name}</div>
        </div>
        <div className="window-body m-0 p-2 flex-grow flex flex-col items-center justify-center p-2 bg-white relative">
          
          {room?.state === 'lobby' && (
            <div className="w-full h-full flex flex-col items-center max-w-sm mx-auto">
              {avatar === null ? (
                // Avatar Selection Window
                <div className="window w-full bg-[#ece9d8]">
                  <div className="title-bar">
                    <div className="title-bar-text">Choose an Avatar</div>
                    <div className="title-bar-controls">
                      <button aria-label="Minimize"></button>
                      <button aria-label="Maximize"></button>
                      <button aria-label="Close"></button>
                    </div>
                  </div>
                  <div className="window-body p-4 bg-[#ece9d8]">
                    <fieldset className="p-2 border border-gray-400 bg-[#ece9d8]">
                      <legend className="px-1 text-sm font-tahoma">Click an avatar to represent you:</legend>
                      <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-[260px] mx-auto">
                        {avatars.map((a, i) => (
                           <button 
                             key={i} 
                             onClick={() => setPlayerAvatar(a)}
                             className="w-[52px] h-[52px] p-1 flex items-center justify-center bg-gray-200 border-2 border-white border-b-gray-500 border-r-gray-500 active:border-t-gray-500 active:border-l-gray-500 active:border-b-white active:border-r-white focus:outline-none"
                           >
                             <RetroAvatar id={a} />
                           </button>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                </div>
              ) : (
                // Connected State (Waiting for host)
                <div className="text-center mt-4">
                  <div className="mb-4 mx-auto w-24 h-24 p-2 border-2 border-white border-b-gray-500 border-r-gray-500 bg-gray-200 flex items-center justify-center">
                    <RetroAvatar id={avatar} />
                  </div>
                  <h2 className="text-xl font-bold mb-2 font-tahoma">Connected!</h2>
                  <p className="font-tahoma">Waiting for the host to start the game.</p>
                </div>
              )}
            </div>
          )}

          {room?.state === 'question' && (
            <div className="w-full h-full flex flex-col">
              <h2 className="text-center font-bold text-xl mb-2 text-blue-900 border-b-2 border-blue-200 pb-2">Select your answer!</h2>
              <div className="flex flex-col gap-2 flex-grow justify-center">
                
                {(qType === 'multiple_choice' || qType === 'image_options') && (
                  <div className="flex flex-col gap-2 w-full">
                    {['A', 'B', 'C', 'D'].map((letter, i) => (
                      <button 
                        key={i} 
                        className={clsx("mobile-btn", choice === i ? "active !bg-blue-600 !text-white" : "")}
                        onClick={() => submitAnswer(i)}
                      >
                        {qType === 'image_options' && currentQuestion?.options?.[i] ? (
                           <img src={currentQuestion.options[i]} alt={`Option ${letter}`} style={{maxHeight:'80px', margin:'0 auto'}} />
                        ) : letter}
                      </button>
                    ))}
                  </div>
                )}

                {qType === 'text' && (
                  <div className="flex flex-col gap-4">
                    <input 
                      type="text" 
                      value={textAnswer} 
                      onChange={e => setTextAnswer(e.target.value)} 
                      className="border-2 border-gray-400 p-2 text-lg w-full"
                      placeholder="Type your answer..."
                    />
                    <button 
                      className={clsx("mobile-btn", choice !== undefined && choice !== null ? "active !bg-blue-600 !text-white" : "")}
                      onClick={() => submitAnswer(textAnswer)}
                    >
                      Submit
                    </button>
                  </div>
                )}

                {qType === 'percentage' && (
                  <div className="flex flex-col gap-4 items-center w-full">
                    <span className="text-xl font-bold">{percentAnswer}%</span>
                    <input 
                      type="range" min="0" max="100" 
                      value={percentAnswer} 
                      onChange={e => setPercentAnswer(parseInt(e.target.value))} 
                      className="w-full"
                    />
                    <button 
                      className={clsx("mobile-btn", choice !== undefined && choice !== null ? "active !bg-blue-600 !text-white" : "")}
                      onClick={() => submitAnswer(percentAnswer)}
                    >
                      Submit
                    </button>
                  </div>
                )}

                {qType === 'image_zone' && (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                       <img 
                         src={currentQuestion?.imageUrl} 
                         alt="Click zone"
                         style={{ width:'100%', height:'auto', display:'block', border:'2px solid black', cursor:'crosshair' }}
                         onClick={(e) => {
                           const rect = e.target.getBoundingClientRect();
                           const x = ((e.clientX - rect.left) / rect.width) * 100;
                           const y = ((e.clientY - rect.top) / rect.height) * 100;
                           submitAnswer({ x, y });
                         }}
                       />
                       {choice && choice.x !== undefined && (
                          <div style={{
                            position: 'absolute', 
                            left: `${choice.x}%`, 
                            top: `${choice.y}%`, 
                            width: '10px', height: '10px', backgroundColor: 'red', 
                            borderRadius: '50%', transform: 'translate(-50%, -50%)',
                            border: '2px solid white'
                          }}></div>
                       )}
                    </div>
                    <p className="text-center text-sm">Tap the image to select the correct zone.</p>
                  </div>
                )}

              </div>
              {choice !== null && choice !== undefined && (
                <p className="text-center mt-2 text-green-700 font-bold">Answer received! Waiting for others...</p>
              )}
            </div>
          )}

          {room?.state === 'reveal' && (
            <div className="text-center">
              <HelpCircle size={48} className="mx-auto mb-2 text-blue-500" />
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
