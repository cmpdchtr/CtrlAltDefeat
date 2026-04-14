import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import clsx from 'clsx';
import { Monitor, HelpCircle, Users } from 'lucide-react';
import { RetroAvatar } from './RetroAvatar';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

// Use Vite's environment flags to dynamically switch URLs
const socketUrl = import.meta.env.DEV 
  ? `${window.location.protocol}//${window.location.hostname}:8000` 
  : undefined;

const socket = io(socketUrl);

function Host() {
  const { t } = useTranslation();
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
      const shuffleInput = document.getElementById('shuffle-q')?.checked ?? true;
      const fileInput = document.getElementById('q-file');
      
      const emitStart = (questionsObj) => {
        socket.emit('start_game', { 
          code: room.code, 
          settings: {
            timer: parseInt(timerInput, 10),
            fastMode: fastModeInput,
            shuffle: shuffleInput,
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
            alert("Error reading JSON. Server will use default questions.");
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
        <LanguageSwitcher />
        <div className="window shadow-2xl" style={{ width: '320px' }}>
          <div className="title-bar">
            <div className="title-bar-text">{t('host.errorTitle')}</div>
            <div className="title-bar-controls">
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body">
            <div className="flex items-center mb-4 mt-2">
              <img src="https://win98icons.alexmeub.com/icons/png/msg_error-0.png" alt="error" className="mr-4 w-8 h-8" />
              <p>{t('host.errorMobile')}</p>
            </div>
            <div className="flex justify-center mt-4 mb-2">
              <button onClick={() => window.location.href = '/'} style={{ width: '80px' }}>{t('player.ok')}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) return <div className="text-white p-5">{t('host.loadingXP')}</div>;

  // Automatically construct the correct URL based on the current origin
  const joinUrl = room ? `${window.location.origin}/?code=${room.code}` : window.location.origin;

  return (
    <div className="w-full h-full relative font-tahoma text-black">
      <LanguageSwitcher />
      <div className="desktop">
        
        {room.state === 'lobby' && (
          <div className="window absolute left-[calc(50%-440px)] top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-xl" style={{ width: '400px' }}>
            <div className="title-bar">
              <div className="title-bar-text">{t('host.roomCodeExe')}</div>
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

              <p className="font-bold text-black font-tahoma text-xl mb-2" style={{ textShadow: '1px 1px 0px rgba(255,255,255,0.8)' }}>{t('host.scanToJoin')}</p>
            </div>
          </div>
        )}

        {room.state === 'lobby' && (
          <div className="window absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-xl" style={{ width: '400px' }}>
            <div className="title-bar">
              <div className="title-bar-text">{t('host.serverMonitorExe')}</div>
              <div className="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close"></button>
              </div>
            </div>
            <div className="window-body">
              <div className="mb-4">
                <fieldset>
                  <legend>{t('host.gameSettings')}</legend>
                  <div className="field-row mb-2">
                    <label htmlFor="timer-setting">{t('host.secondsPerQ')}</label>
                    <input id="timer-setting" type="number" defaultValue={15} min={5} max={60} style={{ width: '60px' }} />
                  </div>
                  <div className="field-row mb-2">
                    <label htmlFor="q-file">{t('host.customJson')}</label>
                    <input id="q-file" type="file" accept=".json" />
                  </div>
                  <div className="field-row mb-2">
                    <input id="shuffle-q" type="checkbox" defaultChecked />
                    <label htmlFor="shuffle-q">{t('host.shuffleQ')}</label>
                  </div>
                  <div className="field-row">
                    <input id="fast-mode" type="checkbox" />
                    <label htmlFor="fast-mode">{t('host.fastRevealMode')}</label>
                  </div>
                </fieldset>
              </div>

              <div className="flex justify-between items-center mt-6 p-2 border-t border-gray-300">
                <div className="flex items-center text-gray-600 space-x-2">
                  <Monitor size={16} /> <span>{t('host.statusReady')}</span>
                </div>
                <button onClick={startGame} disabled={Object.keys(room.players).length === 0} style={{ width: '120px', height: '30px' }} className="font-bold">
                  {t('host.startGame')}
                </button>
              </div>
            </div>
          </div>
        )}

        {room.state === 'lobby' && (
          <div className="window absolute left-[calc(50%+430px)] top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-xl" style={{ width: '340px', height: '450px' }}>
            <div className="title-bar">
              <div className="title-bar-text">{t('host.connectedPlayersExe')}</div>
              <div className="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close"></button>
              </div>
            </div>
            <div className="window-body bg-white h-[calc(100%-35px)] overflow-y-auto p-0 border border-gray-400 inset">
              <div className="flex flex-col m-0 p-0 text-sm">
                <div className="flex bg-gray-200 border-b border-gray-400 p-1 font-bold text-gray-700">
                  <div className="w-10"></div>
                  <div className="flex-grow">{t('host.username')}</div>
                  <div className="w-16 text-center">{t('host.action')}</div>
                </div>
                {Object.entries(room.players).map(([sid, p], i) => (
                  <div key={sid} className="flex items-center border-b border-gray-200 p-1 hover:bg-blue-100 transition-colors" style={{ height: '40px', overflow: 'hidden' }}>
                    <div className="flex justify-center items-center" style={{ width: '40px', flexShrink: 0 }}>
                      {p.avatar !== undefined && p.avatar !== null ? (
                        <div style={{ width: '32px', height: '32px', flexShrink: 0 }}><RetroAvatar id={p.avatar} /></div>
                      ) : (
                        <img src="https://win98icons.alexmeub.com/icons/png/msagent-4.png" alt="User" style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                      )}
                    </div>
                    <div className="flex-grow truncate px-2 font-bold text-black" title={p.name}>
                      {p.name}
                    </div>
                    <div className="w-16 flex justify-center">
                      <button 
                        onClick={() => socket.emit('kick_player', { code: room.code, player_sid: sid })}
                        className="py-0 px-2 text-xs h-6 bg-red-100 font-bold"
                        title={"Kick " + p.name}
                      >
                        {t('host.kick')}
                      </button>
                    </div>
                  </div>
                ))}
                {Object.keys(room.players).length === 0 && (
                  <p className="p-4 text-gray-500 text-center mt-10">{t('host.noPlayers')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {['question', 'reveal', 'end'].includes(room.state) && (
          <div className="window absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ width: '80%', height: '80%', maxWidth: '800px', zIndex: 100 }}>
            <div className="title-bar">
              <div className="title-bar-text">{t('host.quizExe')}</div>
              <div className="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close"></button>
              </div>
            </div>
            <div className="window-body bg-white h-full relative flex flex-col p-6">
              
              {room.state === 'end' ? (
                <div className="text-center h-full flex flex-col justify-start items-center overflow-hidden">
                  <h1 className="text-3xl font-bold mt-4 mb-4 text-blue-800">{t('host.gameOverTitle')}</h1>
                  <div className="w-full max-w-[90%] overflow-y-auto border-2 border-gray-400 inset bg-white bg-opacity-90" style={{ maxHeight: '60vh' }}>
                    <table className="interactive w-full">
                      <thead className="bg-[#ece9d8] sticky top-0 border-b-2 border-gray-400 z-10">
                        <tr>
                          <th className="p-2 text-left w-1/2">{t('host.player')}</th>
                          <th className="p-2 text-center">{t('host.score')}</th>
                          <th className="p-2 text-center">{t('host.status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(room.players).sort((a,b)=>b.score - a.score).map((p, i) => (
                          <tr key={i} className="hover:bg-blue-100 h-10">
                            <td className="flex items-center text-left py-2 px-3 border-b border-gray-200">
                              {p.avatar !== undefined && p.avatar !== null ? (
                                 <div style={{ width: '28px', height: '28px', marginRight: '12px', flexShrink: 0 }}><RetroAvatar id={p.avatar} /></div>
                              ) : null}
                              <span className="font-bold truncate">{p.name}</span>
                            </td>
                            <td className="text-center font-mono text-lg border-b border-gray-200">{p.score}</td>
                            <td className={`text-center font-bold border-b border-gray-200 ${p.status==='alive' ? 'text-green-600' : 'text-red-600'}`}>
                              {p.status.toUpperCase()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={() => window.location.reload()} className="mt-6 font-bold py-2 px-6">{t('host.restartServer')}</button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <fieldset>
                      <legend>{t('host.timer')}</legend>
                      <div className="flex items-center w-full mt-1">
                        <span className="w-8 font-bold text-sm tracking-widest">{timer}s</span>
                        <div className="flex-grow flex border border-gray-400 bg-[#f0f0f0] h-[22px] p-[2px] gap-[2px] rounded-[3px] shadow-inner" style={{boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1)'}}>
                          {Array.from({ length: 30 }).map((_, i) => {
                            const isActive = (i / 30) < (timer / (room.default_timer || 15));
                            const isLow = timer <= 5;
                            return (
                              <div 
                                key={i} 
                                className={clsx(
                                  "flex-1 h-full rounded-[1px]", 
                                  isActive 
                                    ? (isLow 
                                        ? "bg-gradient-to-b from-[#ff8e8e] via-[#e52222] to-[#b30000]" 
                                        : "bg-gradient-to-b from-[#adffad] via-[#24d924] to-[#00a800]") 
                                    : "bg-transparent"
                                )}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </fieldset>
                  </div>

                  <h2 className="text-2xl font-bold my-6 text-center">{room.questions[room.current_q].question}</h2>
                  
                  <div className="grid grid-cols-2 gap-4 flex-grow">
                    {room.questions[room.current_q]?.type === undefined || room.questions[room.current_q]?.type === 'multiple_choice' || room.questions[room.current_q]?.type === 'image_options' ? (
                      room.questions[room.current_q].options.map((opt, i) => {
                        let btnClass = "text-xl h-full p-4 ";
                        if (room.state === 'reveal') {
                          if (i === room.questions[room.current_q].correct) btnClass += " !bg-green-500 !text-white";
                          else btnClass += " !bg-red-500 !text-white opacity-50";
                        }
                        return (
                          <div key={i} className={clsx("flex items-center justify-center border-2 border-gray-400 font-bold", btnClass)}>
                            {String.fromCharCode(65 + i)}: {room.questions[room.current_q].type === 'image_options' ? (
                               <img src={opt} alt="Option" style={{maxHeight:'120px', marginLeft:'10px'}} />
                            ) : opt}
                          </div>
                        );
                      })
                    ) : room.questions[room.current_q]?.type === 'text' ? (
                      <div className="col-span-2 flex flex-col items-center justify-center text-4xl">
                        {room.state === 'reveal' ? (
                           <div className="p-8 bg-green-200 border-4 border-green-600 rounded-xl text-green-900 shadow-lg">
                             <span className="font-bold uppercase tracking-wider block mb-2 text-sm text-green-700">{t('host.correctAnswerIs')}</span>
                             {Array.isArray(room.questions[room.current_q].correct) ? room.questions[room.current_q].correct.join(' OR ') : room.questions[room.current_q].correct}
                           </div>
                        ) : (
                           <div className="animate-pulse text-gray-500 text-2xl font-mono tracking-widest border-b-4 border-gray-300 pb-2">_ _ _ _ _ _ _ _ _ _</div>
                        )}
                      </div>
                    ) : room.questions[room.current_q]?.type === 'percentage' ? (
                      <div className="col-span-2 flex flex-col items-center justify-center p-8 bg-gray-100 border-2 border-gray-400 rounded-xl shadow-inner">
                        {room.state === 'reveal' ? (
                           <div className="text-6xl font-black text-blue-600 drop-shadow-md">
                             {room.questions[room.current_q].correct}%
                           </div>
                        ) : (
                           <div className="w-full max-w-xl h-8 bg-gray-300 rounded-full overflow-hidden border-2 border-gray-400 shadow-inner mt-4 relative">
                             <div className="absolute inset-0 bg-blue-500 opacity-20 animate-pulse w-1/2"></div>
                           </div>
                        )}
                        <p className="mt-4 text-gray-600 font-bold tracking-wide uppercase text-sm">{t('host.percentageQuestion')}</p>
                      </div>
                    ) : room.questions[room.current_q]?.type === 'image_zone' ? (
                      <div className="col-span-2 flex justify-center items-center relative min-h-[300px]">
                         <img src={room.questions[room.current_q].imageUrl} alt="Zone" style={{maxHeight: '400px', maxWidth: '100%', objectFit: 'contain', border: '4px solid #333', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                         {room.state === 'reveal' && (
                            <div style={{
                              position: 'absolute', 
                              left: `${room.questions[room.current_q].correct.x}%`, 
                              top: `${room.questions[room.current_q].correct.y}%`, 
                              width: `${room.questions[room.current_q].correct.radius * 2}%`, 
                              height: `${room.questions[room.current_q].correct.radius * 2}%`, 
                              border: '4px dashed #ff0000', 
                              borderRadius: '50%', 
                              transform: 'translate(-50%, -50%)',
                              boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                            }}></div>
                         )}
                      </div>
                    ) : null}
                  </div>

                  {room.state === 'reveal' && (
                    <div className="mt-4 p-2 border border-blue-400 bg-blue-100 flex items-start">
                      <HelpCircle className="mr-2 text-blue-600 flex-shrink-0" />
                      <p className="text-sm text-blue-800">
                        {(!room.questions[room.current_q].type || room.questions[room.current_q].type === 'multiple_choice' || room.questions[room.current_q].type === 'image_options') ? (
                          <>{t('host.correctAnswerOpt', { letter: String.fromCharCode(65 + room.questions[room.current_q].correct) })}</>
                        ) : room.questions[room.current_q].type === 'text' ? (
                          <>{t('host.correctAnswerIs')} <strong>{Array.isArray(room.questions[room.current_q].correct) ? room.questions[room.current_q].correct.join(' OR ') : room.questions[room.current_q].correct}</strong></>
                        ) : room.questions[room.current_q].type === 'percentage' ? (
                          <>{t('host.exactPercentage')} <strong>{room.questions[room.current_q].correct}%</strong></>
                        ) : room.questions[room.current_q].type === 'image_zone' ? (
                          <>{t('host.correctZone')}</>
                        ) : ''}
                      </p>
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
          {t('host.start')}
        </button>
        <div className="flex-grow flex items-center px-2">
          {room.state !== 'lobby' && (
            <div className="px-3 py-1 bg-blue-700 bg-opacity-50 text-white rounded border border-blue-400 shadow-inner flex items-center text-xs ml-2 cursor-default">
              <Monitor size={14} className="mr-2"/> {t('host.quizExe')}
            </div>
          )}
        </div>
        <div className="system-tray flex items-center">
          <span className="mr-2">{t('host.server')}</span>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          <div className="ml-2 border-l border-gray-400 h-full pl-2">
             <LanguageSwitcher inTaskbar={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Host;
