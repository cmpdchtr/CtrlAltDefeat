import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import clsx from 'clsx';
import { Monitor, HelpCircle, Users } from 'lucide-react';
import { RetroAvatar } from './RetroAvatar';

// For local dev use 8000, for Docker/Prod use Nginx proxy
const socketUrl = (window.location.port === '5173' || window.location.port === '5174') 
  ? window.location.protocol + '//' + window.location.hostname + ':8000' 
  : '/';
const socket = io(socketUrl);

function Host() {
  const [room, setRoom] = useState(null);
  const [timer, setTimer] = useState(0);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    if (isMobile) return;
    
    socket.emit('create_room');
    socket.on('room_created', (data) => console.log('Created room', data.code));
    socket.on('room_update', (roomData) => {
      setRoom(roomData);
    });
    socket.on('timer', (data) => setTimer(data.time));

    return () => {
      socket.off('room_created');
      socket.off('room_update');
      socket.off('timer');
    };
  }, []);

  const startGame = () => {
    if (room && Object.keys(room.players).length > 0) {
      const timerInput = document.getElementById('timer-setting')?.value || 15;
      const fastModeInput = document.getElementById('fast-mode')?.checked || false;
      const fileInput = document.getElementById('q-file');
      
      const emitStart = (questionsObj) => {
        socket.emit('start_game', { 
          code: room.code, 
          settings: {
            timer: parseInt(timerInput, 10),
            fastMode: fastModeInput,
            questions: questionsObj
          }
        });
      };

      if (fileInput && fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parsed = JSON.parse(e.target.result);
            emitStart(parsed);
          } catch (err) {
            alert("Помилка читання JSON файлу. Сервер запустить стандартні питання.");
            emitStart(null);
          }
        };
        reader.readAsText(fileInput.files[0]);
      } else {
        emitStart(null);
      }
    }
  };

  if (isMobile) {
    return (
      <div className="w-screen h-screen absolute top-0 left-0 font-tahoma flex items-center justify-center bg-blue-800 z-[9999]">
        <div className="window shadow-2xl" style={{ width: '320px' }}>
          <div className="title-bar">
            <div className="title-bar-text">Error</div>
            <div className="title-bar-controls">
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body">
            <div className="flex items-center mb-4 mt-2">
              <img src="https://win98icons.alexmeub.com/icons/png/msg_error-0.png" alt="error" className="mr-4 w-8 h-8" />
              <p>Cannot create a room from a mobile device. Please join as a player or open this page on a PC.</p>
            </div>
            <div className="flex justify-center mt-4 mb-2">
              <button onClick={() => window.location.href = '/'} style={{ width: '80px' }}>OK</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) return <div className="text-white p-5">Loading Windows XP...</div>;

  // Automatically construct the correct URL based on the current origin (handles both Docker and dev server cases)
  const joinUrl = room ? `${window.location.origin}/?code=${room.code}` : window.location.origin;

  return (
    <div className="w-full h-full relative font-tahoma text-black">
      <div className="desktop">
        
        {room.state === 'lobby' && (
          <div className="window absolute left-[calc(50%-440px)] top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-xl" style={{ width: '400px' }}>
            <div className="title-bar">
              <div className="title-bar-text">Room Code.exe</div>
              <div className="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close"></button>
              </div>
            </div>
            <div className="window-body text-center p-6 bg-[#ece9d8]">
              
              {/* Retro Input Field for Room Code */}
              <div className="bg-white pt-2 pb-4 flex @flex-col items-center justify-center" style={{ marginBottom: '50px', border: '2px solid', borderColor: '#808080 #ffffff #ffffff #808080' }}>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 font-tahoma">Room Code</span>
                <div className="text-[76px] font-mono leading-none tracking-[0.15em] font-bold text-black" style={{ transform: 'translateX(0.075em)' }}>
                  {room.code}
                </div>
              </div>

              {/* Retro Box for QR Code */}
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4" style={{ border: '2px solid', borderColor: '#808080 #ffffff #ffffff #808080' }}>
                  <QRCodeSVG value={joinUrl} size={250} bgColor="#ffffff" fgColor="#000000" />
                </div>
              </div>

              <p className="font-bold text-black font-tahoma text-xl mb-2" style={{ textShadow: '1px 1px 0px rgba(255,255,255,0.8)' }}>Scan to Join</p>
            </div>
          </div>
        )}

        {room.state === 'lobby' && (
          <div className="window absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-xl" style={{ width: '400px' }}>
            <div className="title-bar">
              <div className="title-bar-text">Server Monitor.exe</div>
              <div className="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close"></button>
              </div>
            </div>
            <div className="window-body">
              <div className="mb-4">
                <fieldset>
                  <legend>Game Settings</legend>
                  <div className="field-row mb-2">
                    <label htmlFor="timer-setting">Seconds per Question:</label>
                    <input id="timer-setting" type="number" defaultValue={15} min={5} max={60} style={{ width: '60px' }} />
                  </div>
                  <div className="field-row mb-2">
                    <label htmlFor="q-file">Custom JSON Questions:</label>
                    <input id="q-file" type="file" accept=".json" />
                  </div>
                  <div className="field-row">
                    <input id="fast-mode" type="checkbox" />
                    <label htmlFor="fast-mode">Fast Reveal Mode</label>
                  </div>
                </fieldset>
              </div>

              <div className="flex justify-between items-center mt-6 p-2 border-t border-gray-300">
                <div className="flex items-center text-gray-600 space-x-2">
                  <Monitor size={16} /> <span>Status: Ready</span>
                </div>
                <button onClick={startGame} disabled={Object.keys(room.players).length === 0} style={{ width: '120px', height: '30px' }} className="font-bold">
                  Start Game
                </button>
              </div>
            </div>
          </div>
        )}

        {room.state === 'lobby' && (
          <div className="window absolute left-[calc(50%+420px)] top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-xl" style={{ width: '300px', height: '400px' }}>
            <div className="title-bar">
              <div className="title-bar-text">Connected Players.exe</div>
              <div className="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close"></button>
              </div>
            </div>
            <div className="window-body bg-white h-[calc(100%-35px)] overflow-y-auto p-4 border border-gray-400 inset">
              <div className="desktop-icons grid grid-cols-3 gap-4 auto-rows-max">
                {Object.values(room.players).map((p, i) => (
                  <div key={i} className="desktop-icon text-black text-shadow-none">
                    {p.avatar !== undefined && p.avatar !== null ? (
                      <div className="w-10 h-10 mb-1 mx-auto">
                        <RetroAvatar id={p.avatar} />
                      </div>
                    ) : (
                      <img src="https://win98icons.alexmeub.com/icons/png/msagent-4.png" alt="User" className="mx-auto" />
                    )}
                    <span className="text-black text-center w-full block">{p.name}</span>
                  </div>
                ))}
                {Object.keys(room.players).length === 0 && (
                  <p className="col-span-3 text-gray-500 text-center mt-10">No players connected yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {['question', 'reveal', 'end'].includes(room.state) && (
          <div className="window absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ width: '80%', height: '80%', maxWidth: '800px', zIndex: 100 }}>
            <div className="title-bar">
              <div className="title-bar-text">Quiz.exe</div>
              <div className="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close"></button>
              </div>
            </div>
            <div className="window-body bg-white h-full relative flex flex-col p-6">
              
              {room.state === 'end' ? (
                <div className="text-center h-full flex flex-col justify-center items-center">
                  <h1 className="text-3xl font-bold mb-4 text-blue-800">GAME OVER</h1>
                  <table className="interactive" style={{width:'80%'}}>
                    <thead><tr><th>Player</th><th>Score</th><th>Status</th></tr></thead>
                    <tbody>
                      {Object.values(room.players).sort((a,b)=>b.score - a.score).map((p, i) => (
                        <tr key={i}>
                          <td className="flex items-center">
                            {p.avatar !== undefined && p.avatar !== null ? (
                               <div className="w-5 h-5 mr-3"><RetroAvatar id={p.avatar} /></div>
                            ) : null}
                            <span>{p.name}</span>
                          </td>
                          <td>{p.score}</td>
                          <td className={p.status==='alive' ? 'text-green-600 font-bold' : 'text-red-600'}>{p.status.toUpperCase()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={() => window.location.reload()} className="mt-6">Restart Server</button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <fieldset>
                      <legend>Timer</legend>
                      <div className="flex items-center w-full">
                        <span className="w-8">{timer}s</span>
                        <div className="relative w-full h-4 border border-gray-400 bg-gray-200 ml-2 overflow-hidden shadow-inner">
                          <div className={clsx("h-full", timer > 5 ? "bg-blue-600" : "bg-red-600")} style={{ width: `${(timer / (room.default_timer || 15)) * 100}%`, transition: 'width 1s linear' }}></div>
                        </div>
                      </div>
                    </fieldset>
                  </div>

                  <h2 className="text-2xl font-bold my-6 text-center">{room.questions[room.current_q].question}</h2>
                  
                  <div className="grid grid-cols-2 gap-4 flex-grow">
                    {room.questions[room.current_q].options.map((opt, i) => {
                      let btnClass = "text-xl h-full p-4 ";
                      if (room.state === 'reveal') {
                        if (i === room.questions[room.current_q].correct) btnClass += " !bg-green-500 !text-white";
                        else btnClass += " !bg-red-500 !text-white opacity-50";
                      }
                      return (
                        <button key={i} className={btnClass} disabled>
                          {String.fromCharCode(65 + i)}: {opt}
                        </button>
                      );
                    })}
                  </div>

                  {room.state === 'reveal' && (
                    <div className="mt-4 p-2 border border-blue-400 bg-blue-100 flex items-start">
                      <HelpCircle className="mr-2 text-blue-600 flex-shrink-0" />
                      <p className="text-sm text-blue-800">The correct answer is <strong>{room.questions[room.current_q].options[room.questions[room.current_q].correct]}</strong></p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

      </div>

      <div className="taskbar">
        <button className="start-btn">
          <img src="https://win98icons.alexmeub.com/icons/png/windows_slanted-1.png" alt="windows" />
          start
        </button>
        <div className="flex-grow flex items-center px-2">
          {room.state !== 'lobby' && (
            <div className="px-3 py-1 bg-blue-700 bg-opacity-50 text-white rounded border border-blue-400 shadow-inner flex items-center text-xs ml-2 cursor-default">
              <Monitor size={14} className="mr-2"/> Quiz.exe
            </div>
          )}
        </div>
        <div className="system-tray">
          <span className="mr-2">CtrlAltDefeat Server</span>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

export default Host;
