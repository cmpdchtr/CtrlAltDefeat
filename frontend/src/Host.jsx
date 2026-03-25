import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import clsx from 'clsx';
import { Monitor, HelpCircle, Users } from 'lucide-react';

const socket = io(window.location.protocol + '//' + window.location.hostname + ':8000');

function Host() {
  const [room, setRoom] = useState(null);
  const [timer, setTimer] = useState(0);
  const [clippyVisible, setClippyVisible] = useState(false);
  const [clippyMsg, setClippyMsg] = useState("");

  useEffect(() => {
    socket.emit('create_room');
    socket.on('room_created', (data) => console.log('Created room', data.code));
    socket.on('room_update', (roomData) => {
      setRoom(roomData);
      
      // Random clippy triggers
      if (Math.random() > 0.7) {
        showClippy("It looks like you're playing a trivia game. Would you like some help?");
      }
    });
    socket.on('timer', (data) => setTimer(data.time));

    return () => {
      socket.off('room_created');
      socket.off('room_update');
      socket.off('timer');
    };
  }, []);

  const showClippy = (msg) => {
    setClippyMsg(msg);
    setClippyVisible(true);
    setTimeout(() => setClippyVisible(false), 5000);
  };

  const startGame = () => {
    if (room && Object.keys(room.players).length > 0) {
      socket.emit('start_game', { code: room.code });
      showClippy("Starting the game! Good luck everyone!");
    }
  };

  if (!room) return <div className="text-white p-5">Loading Windows XP...</div>;

  const joinUrl = `http://${window.location.hostname}:5173`;

  return (
    <div className="w-full h-full relative font-tahoma text-black">
      <div className="desktop">
        
        {room.state === 'lobby' && (
          <div className="window" style={{ width: '400px', margin: '20px' }}>
            <div className="title-bar">
              <div className="title-bar-text">Server Monitor.exe</div>
              <div className="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close"></button>
              </div>
            </div>
            <div className="window-body">
              <p>Room Code: <strong>{room.code}</strong></p>
              <div className="flex justify-center my-4 bg-white p-2 border border-black inset">
                <QRCodeSVG value={joinUrl} size={200} />
              </div>
              <p>Waiting for players...</p>
              <button onClick={startGame} disabled={Object.keys(room.players).length === 0} style={{ width: '100%' }}>
                Start Game
              </button>
            </div>
          </div>
        )}

        {room.state === 'lobby' && (
          <div className="absolute top-5 right-5 w-64">
            <h3 className="text-white text-shadow font-bold flex items-center mb-2"><Users className="mr-2"/> Connected Players</h3>
            <div className="desktop-icons">
              {Object.values(room.players).map((p, i) => (
                <div key={i} className="desktop-icon">
                  <img src="https://win98icons.alexmeub.com/icons/png/user_computer-0.png" alt="User" />
                  <span>{p.name}</span>
                </div>
              ))}
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
                          <td>{p.name}</td>
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
                          <div className={clsx("h-full", timer > 5 ? "bg-blue-600" : "bg-red-600")} style={{ width: `${(timer / 15) * 100}%`, transition: 'width 1s linear' }}></div>
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
      
      <div className={clsx("clippy", clippyVisible && "visible")}>
        <div className="clippy-bubble">{clippyMsg}</div>
        <img src="https://i.ibb.co/VvzK2Bq/image.png" alt="Clippy" style={{width:'100px'}} />
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
