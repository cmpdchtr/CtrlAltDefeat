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
  const [timer, setTimer] = useState(0);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    if (isMobile) return;
    socket.emit('create_room');
    socket.on('room_update', (roomData) => setRoom(roomData));
    socket.on('timer', (data) => setTimer(data.time));
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
          <div className="window absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ width: '85%', height: '85%', maxWidth: '900px', display: 'flex', flexDirection: 'column' }}>
            <div className="title-bar" style={{ flexShrink: 0 }}><div className="title-bar-text">{t('host.quizExe')}</div></div>
            <div className="window-body bg-white flex-grow flex flex-col p-6 overflow-hidden">
              {room.state === 'end' ? (
                <div className="text-center flex flex-col items-center h-full">
                  <h1 className="text-3xl font-bold mt-4 text-blue-800">{t('host.gameOverTitle')}</h1>
                  <div className="flex-grow w-full overflow-y-auto mt-4 border-2">
                    <table className="w-full">
                      <thead className="bg-[#ece9d8] sticky top-0"><tr><th className="p-2">{t('host.player')}</th><th className="p-2">{t('host.score')}</th><th className="p-2">{t('host.status')}</th></tr></thead>
                      <tbody>{Object.values(room.players).sort((a,b)=>b.score-a.score).map((p, i) => (
                        <tr key={i} className="border-b"><td className="p-2 flex items-center">{p.avatar !== null && <div className="w-6 h-6 mr-2"><RetroAvatar id={p.avatar} /></div>}{p.name}</td><td className="p-2 text-center">{p.score}</td><td className={clsx("p-2 text-center font-bold", p.status==='alive'?'text-green-600':'text-red-600')}>{p.status.toUpperCase()}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <button onClick={() => window.location.reload()} className="mt-6 font-bold px-6 py-2 flex-shrink-0">{t('host.restartServer')}</button>
                </div>
              ) : (
                <>
                  <div className="flex-shrink-0">
                    <fieldset><legend>{t('host.timer')}</legend><div className="flex items-center w-full mt-1"><span className="w-8 font-bold">{timer}s</span><div className="flex-grow flex border h-[22px] p-[2px] bg-gray-100">
                      {Array.from({ length: 30 }).map((_, i) => (<div key={i} className={clsx("flex-1 h-full mx-[1px]", (i/30 < timer/(room.default_timer||15)) ? (timer<=5?"bg-red-600":"bg-green-600") : "bg-transparent")} />))}
                    </div></div></fieldset>
                    <h2 className="text-2xl font-bold my-6 text-center">{currentQ.question}</h2>
                  </div>
                  <div className={clsx("grid gap-4 flex-grow overflow-y-auto p-2", (currentQ.options?.length > 4) ? "grid-cols-1" : "grid-cols-2")} style={{ alignContent: 'start' }}>
                    {['multiple_choice', 'image_options'].includes(qType) && currentQ.options.map((opt, i) => {
                      let style = "border-2 p-4 font-bold flex items-center justify-center min-h-[60px] ";
                      const isCorrect = Array.isArray(currentQ.correct) ? currentQ.correct.includes(i) : currentQ.correct === i;
                      if (room.state === 'reveal') style += isCorrect ? "bg-green-500 text-white" : "bg-red-100 opacity-50";
                      return (<div key={i} className={style}>{String.fromCharCode(65+i)}: {qType==='image_options'?<img src={opt} className="max-h-20 ml-2" alt=""/>:opt}</div>);
                    })}
                    {qType === 'text' && <div className="col-span-2 text-center text-3xl">{room.state==='reveal'?<div className="p-4 bg-green-100 border-2 border-green-500">{t('host.correctAnswerIs')} {currentQ.correct}</div>:"_ _ _ _ _"}</div>}
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
