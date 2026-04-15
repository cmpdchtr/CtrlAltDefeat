import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import clsx from 'clsx';
import { Monitor, HelpCircle, Users } from 'lucide-react';
import { RetroAvatar } from './RetroAvatar';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const socketUrl = import.meta.env.DEV 
  ? `${window.location.protocol}//${window.location.hostname}:8000` 
  : undefined;

const socket = io(socketUrl);

function Host() {
  const { t } = useTranslation();
  const [room, setRoom] = useState(null);
  const [timer, setTimer] = useState({ time: 0, total: 15 });

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    if (isMobile) return;
    socket.emit('create_room');
    socket.on('room_update', (roomData) => setRoom(roomData));
    socket.on('timer', (data) => setTimer({ time: data.time, total: data.total }));
    return () => { socket.off('room_update'); socket.off('timer'); };
  }, []);

  const startGame = () => {
    if (room && Object.keys(room.players).length > 0) {
      const settings = {
        timer: parseInt(document.getElementById('timer-setting')?.value || 15, 10),
        fastMode: document.getElementById('fast-mode')?.checked || false,
        shuffle: document.getElementById('shuffle-q')?.checked ?? true
      };
      const fileInput = document.getElementById('q-file');
      if (fileInput?.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try { socket.emit('start_game', { code: room.code, settings: { ...settings, questions: JSON.parse(e.target.result) } }); }
          catch (err) { alert("Error reading JSON"); }
        };
        reader.readAsText(fileInput.files[0]);
      } else { socket.emit('start_game', { code: room.code, settings }); }
    }
  };

  if (isMobile) return (<div className="w-screen h-screen bg-blue-800 flex items-center justify-center z-[9999]"><LanguageSwitcher position="top-right" /><div className="window" style={{ width: '320px' }}><div className="title-bar"><div className="title-bar-text">{t('host.errorTitle')}</div></div><div className="window-body"><div className="flex items-center mb-4 mt-2"><img src="https://win98icons.alexmeub.com/icons/png/msg_error-0.png" className="mr-4 w-8 h-8" alt="" /><p>{t('host.errorMobile')}</p></div><div className="flex justify-center mt-4"><button onClick={() => window.location.href = '/'}>{t('player.ok')}</button></div></div></div></div>);
  if (!room) return <div className="text-white p-5">{t('host.loadingXP')}</div>;

  const currentQ = room.questions[room.current_q];
  const qType = currentQ?.type || 'multiple_choice';

  return (
    <div className="w-full h-full relative font-tahoma text-black">
      <LanguageSwitcher position="top-right" />
      <div className="desktop">
        {room.state === 'lobby' && (
          <>
            <div className="window absolute left-[calc(50%-440px)] top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-xl" style={{ width: '400px' }}>
              <div className="title-bar"><div className="title-bar-text">{t('host.roomCodeExe')}</div></div>
              <div className="window-body text-center p-6 bg-[#ece9d8]">
                <div className="bg-white pt-2 pb-4 mb-[50px] border-2 border-gray-500">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('player.roomCode')}</span>
                  <div className="text-[76px] font-mono font-bold">{room.code}</div>
                </div>
                <div className="flex justify-center mb-6"><div className="bg-white p-4 border-2 border-gray-500"><QRCodeSVG value={`${window.location.origin}/?code=${room.code}`} size={200} /></div></div>
                <p className="font-bold text-xl">{t('host.scanToJoin')}</p>
              </div>
            </div>
            <div className="window absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-xl" style={{ width: '400px' }}>
              <div className="title-bar"><div className="title-bar-text">{t('host.serverMonitorExe')}</div></div>
              <div className="window-body"><fieldset><legend>{t('host.gameSettings')}</legend>
                <div className="field-row mb-2"><label>{t('host.secondsPerQ')}</label><input id="timer-setting" type="number" defaultValue={15} min={5} style={{ width: '60px' }} /></div>
                <div className="field-row mb-2"><label>{t('host.customJson')}</label><input id="q-file" type="file" accept=".json" /></div>
                <div className="field-row"><input id="shuffle-q" type="checkbox" defaultChecked /><label htmlFor="shuffle-q">{t('host.shuffleQ')}</label></div>
                <div className="field-row"><input id="fast-mode" type="checkbox" /><label htmlFor="fast-mode">{t('host.fastRevealMode')}</label></div>
              </fieldset><div className="flex justify-between items-center mt-6 p-2 border-t border-gray-300"><Monitor size={16} /><span>{t('host.statusReady')}</span><button onClick={startGame} disabled={Object.keys(room.players).length === 0} className="font-bold w-[120px]">{t('host.startGame')}</button></div></div>
            </div>
            <div className="window absolute left-[calc(50%+430px)] top-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-xl" style={{ width: '340px', height: '450px' }}>
              <div className="title-bar"><div className="title-bar-text">{t('host.connectedPlayersExe')}</div></div>
              <div className="window-body bg-white h-[calc(100%-35px)] overflow-y-auto p-0 border inset"><div className="flex bg-gray-200 border-b p-1 font-bold">
                <div className="w-10"></div><div className="flex-grow">{t('host.username')}</div><div className="w-16 text-center">{t('host.action')}</div></div>
                {Object.entries(room.players).map(([sid, p]) => (<div key={sid} className="flex items-center border-b p-1 h-[40px]">
                  <div className="w-[40px] flex justify-center">{p.avatar !== null ? <div className="w-8 h-8"><RetroAvatar id={p.avatar} /></div> : null}</div>
                  <div className="flex-grow truncate px-2 font-bold">{p.name}</div>
                  <div className="w-16 flex justify-center"><button onClick={() => socket.emit('kick_player', { code: room.code, player_sid: sid })} className="px-2 text-xs bg-red-100">{t('host.kick')}</button></div>
                </div>))}
              </div></div>
          </>
        )}

        {['question', 'reveal', 'end'].includes(room.state) && (
          <div className="window absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ width: '95%', height: '90%', maxWidth: '1200px', display: 'flex', flexDirection: 'column' }}>
            <div className="title-bar" style={{ flexShrink: 0 }}><div className="title-bar-text">{t('host.quizExe')}</div></div>
            <div className="window-body bg-white flex-grow flex flex-col p-8 overflow-hidden">
              {room.state === 'end' ? (
                <div className="text-center flex flex-col items-center h-full">
                  <h1 className="text-5xl font-bold mt-4 text-blue-800 uppercase tracking-tight">{t('host.gameOverTitle')}</h1>
                  <div className="flex-grow w-full overflow-y-auto mt-6 border-2 inset shadow-inner bg-gray-50">
                    <table className="w-full text-xl">
                      <thead className="bg-[#ece9d8] sticky top-0 border-b-2"><tr><th className="p-4 text-left">{t('host.player')}</th><th className="p-4">{t('host.score')}</th><th className="p-4">{t('host.status')}</th></tr></thead>
                      <tbody>{Object.values(room.players).sort((a,b)=>b.score-a.score).map((p, i) => (
                        <tr key={i} className="border-b hover:bg-blue-50 transition-colors"><td className="p-4 flex items-center font-bold text-2xl">{p.avatar !== null && <div className="w-10 h-10 mr-4"><RetroAvatar id={p.avatar} /></div>}{p.name}</td><td className="p-4 text-center font-mono text-3xl font-bold text-blue-700">{p.score}</td><td className={clsx("p-4 text-center font-bold text-xl", p.status==='alive'?'text-green-600':'text-red-600')}>{p.status.toUpperCase()}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <button onClick={() => window.location.reload()} className="mt-8 font-bold px-10 py-4 text-2xl flex-shrink-0">{t('host.restartServer')}</button>
                </div>
              ) : (
                <>
                  <div className="flex-shrink-0">
                    <fieldset className="mb-8 p-6 bg-[#ece9d8] border-2 border-white border-b-gray-400 border-r-gray-400 shadow-md">
                      <legend className="text-xl px-2 font-bold text-gray-700 italic">{t('host.timer')}</legend>
                      <div className="w-full mt-2 bg-white border-2 inset p-[2px] h-[36px] flex shadow-inner overflow-hidden">
                        {Array.from({ length: 24 }).map((_, i) => {
                          const isFilled = timer.total > 0 ? (i / 24) < ((timer.total - timer.time) / timer.total) : false;
                          return (
                            <div 
                              key={i} 
                              className={clsx(
                                "w-[14px] h-full mr-[2px] transition-all duration-200",
                                isFilled 
                                  ? (timer.time <= 5 
                                      ? "bg-gradient-to-b from-[#ff8080] via-[#ff0000] to-[#a00000]" 
                                      : "bg-gradient-to-b from-[#b2e8b2] via-[#22cc22] to-[#11aa11]")
                                  : "bg-transparent"
                              )}
                              style={isFilled ? {
                                boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.4), inset -1px -1px 0 rgba(0,0,0,0.2)'
                              } : {}}
                            />
                          );
                        })}
                      </div>
                    </fieldset>
                    <h2 className="text-5xl font-bold my-8 text-center leading-tight text-gray-900 drop-shadow-sm">{currentQ.question}</h2>
                  </div>
                  <div className={clsx("grid gap-6 flex-grow overflow-y-auto p-4 rounded bg-gray-50 border-2 inset shadow-inner", (currentQ.options?.length > 4) ? "grid-cols-1" : "grid-cols-2")} style={{ alignContent: 'start' }}>
                    {['multiple_choice', 'image_options'].includes(qType) && currentQ.options.map((opt, i) => {
                      let style = "border-2 p-6 font-bold flex items-center justify-center min-h-[100px] text-3xl shadow-md transition-all ";
                      const isCorrect = Array.isArray(currentQ.correct) ? currentQ.correct.includes(i) : currentQ.correct === i;
                      if (room.state === 'reveal') {
                        style += isCorrect ? "bg-green-500 text-white scale-105 z-10 border-green-700" : "bg-red-100 opacity-40 grayscale-[0.5]";
                      } else {
                        style += "bg-white hover:border-blue-500 hover:bg-blue-50 cursor-default";
                      }
                      return (
                        <div key={i} className={style}>
                          <span className="mr-4 opacity-50 text-4xl">{String.fromCharCode(65+i)}:</span> 
                          <span className="flex-grow text-center">{qType==='image_options'?<img src={opt} className="max-h-32 mx-auto shadow-sm border" alt=""/>:opt}</span>
                        </div>
                      );
                    })}
                    {qType === 'text' && (
                      <div className="col-span-2 flex flex-col items-center justify-center h-full gap-8">
                        {room.state==='reveal' ? (
                          <div className="p-10 bg-green-100 border-4 border-green-500 rounded shadow-xl text-5xl font-black text-green-800 animate-bounce">
                            {t('host.correctAnswerIs')} <br/> <span className="text-7xl block mt-4 underline decoration-double">{currentQ.correct}</span>
                          </div>
                        ) : (
                          <div className="flex gap-4">
                            {Array.from({length: 8}).map((_, i) => <div key={i} className="w-16 h-20 border-b-8 border-gray-300 animate-pulse" />)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="taskbar"><button className="start-btn"><img src="https://win98icons.alexmeub.com/icons/png/windows_slanted-1.png" alt="" /> {t('host.start')}</button>
        <div className="flex-grow flex items-center px-2">{room.state !== 'lobby' && <div className="px-3 py-1 bg-blue-700 text-white rounded border flex items-center text-xs ml-2"><Monitor size={14} className="mr-2"/> {t('host.quizExe')}</div>}</div>
        <div className="system-tray px-2 flex items-center"><span>{t('host.server')}</span><span className="ml-2 font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
      </div>
    </div>
  );
}

export default Host;
