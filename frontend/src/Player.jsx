import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import clsx from 'clsx';
import { LogIn, HelpCircle, Monitor, PlusCircle } from 'lucide-react';
import { RetroAvatar } from './RetroAvatar';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const socketUrl = import.meta.env.DEV 
  ? `${window.location.protocol}//${window.location.hostname}:8000` 
  : undefined;

const socket = io(socketUrl);

function Player() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [joined, setJoined] = useState(false);
  const [room, setRoom] = useState(null);
  const [code, setCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || '';
  });
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('alive'); 
  const [avatar, setAvatar] = useState(null);

  const [textAnswer, setTextAnswer] = useState('');
  const [percentAnswer, setPercentAnswer] = useState(50);
  const [multiChoice, setMultiChoice] = useState([]); // Array for multiple selection

  const avatars = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  useEffect(() => {
    socket.on('joined', () => { setJoined(true); setError(''); });
    socket.on('error', (data) => { setError(data.message); });
    socket.on('room_update', (roomData) => {
      setRoom(roomData);
      if (roomData.state === 'end') {
        const alivePlayers = Object.values(roomData.players).filter(p => p.status === 'alive');
        if (alivePlayers.length === 1 && alivePlayers[0].name === name) setStatus('winner');
        else if (alivePlayers.length === 0 && roomData.players[socket.id]?.status === 'alive') setStatus('winner');
      }
      // Reset local multiChoice when question changes
      if (roomData.state === 'question' && roomData.players[socket.id]?.choice === null) {
        setMultiChoice([]);
      }
    });
    socket.on('eliminated', () => { setStatus('dead'); });
    socket.on('kicked', (data) => {
      setStatus('kicked');
      setError(data.message || 'You were kicked.');
      setJoined(false);
      setRoom(null);
    });
    return () => {
      socket.off('joined'); socket.off('error'); socket.off('room_update');
      socket.off('eliminated'); socket.off('kicked');
    };
  }, [name]);

  const setPlayerAvatar = (selectedAvatar) => {
    setAvatar(selectedAvatar);
    if (room && room.state === 'lobby') socket.emit('set_avatar', { code: room.code, avatar: selectedAvatar });
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (code && name) socket.emit('join_room', { code, name, avatar });
  };

  const toggleChoice = (index) => {
    if (room && room.state === 'question' && status === 'alive') {
      if (multiChoice.includes(index)) {
        setMultiChoice(multiChoice.filter(i => i !== index));
      } else {
        setMultiChoice([...multiChoice, index]);
      }
    }
  };

  const submitAnswer = (choice) => {
    if (room && room.state === 'question' && status === 'alive') {
      socket.emit('answer', { code: room.code, choice });
    }
  };

  if (status === 'winner') return <div className="winner">{t('player.winner')}<LanguageSwitcher position="bottom-right" /></div>;
  if (status === 'dead') return (
    <div className="bsod" onClick={() => window.location.reload()}>
      <h1>{t('player.fatalError')}</h1><p>{t('player.fatalErrorDesc1')}</p><p>{t('player.fatalErrorDesc2')}</p><br/>
      <p>{t('player.techInfo')}</p><p>*** STOP: 0x0000000A</p><LanguageSwitcher position="bottom-right" />
    </div>
  );

  if (!joined) return (
    <div className="h-screen w-screen bg-blue-800 flex items-center justify-center p-4 overflow-hidden">
      <LanguageSwitcher position="bottom-right" />
      <div className="window shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500" style={{ width: '100%', maxWidth: '450px' }}>
        <div className="title-bar"><div className="title-bar-text uppercase">{t('player.logOnTitle')}</div></div>
        <div className="window-body m-0 p-8 bg-[#ece9d8]">
          <div className="flex items-center mb-8 bg-white p-4 border-2 inset shadow-inner"><LogIn size={48} className="mr-4 text-blue-700" /><p className="text-lg font-bold leading-tight">{t('player.logOnDesc')}</p></div>
          {error && <div className="bg-red-100 border-2 border-red-500 p-3 mb-6 text-red-700 font-bold text-center animate-shake">{error}</div>}
          <form onSubmit={joinRoom} className="flex flex-col">
            <div className="flex flex-col gap-2 mb-6">
              <label className="font-bold text-xl text-gray-700">{t('player.roomCode')}</label>
              <input 
                type="text" 
                value={code} 
                onChange={e => setCode(e.target.value.toUpperCase())} 
                maxLength={4} 
                required 
                className="uppercase w-full p-4 text-4xl font-mono font-bold text-center tracking-widest border-2 border-gray-400 inset focus:border-blue-500 outline-none shadow-inner"
                placeholder="XXXX"
              />
            </div>
            <div className="flex flex-col gap-2 mb-8">
              <label className="font-bold text-xl text-gray-700">{t('player.userName')}</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                maxLength={15} 
                className="w-full p-4 text-2xl font-bold border-2 border-gray-400 inset focus:border-blue-500 outline-none shadow-inner"
                placeholder={t('player.yourName', 'Ваше ім\'я')}
              />
            </div>
            <div className="flex justify-center mt-6">
              <button type="submit" className="w-full py-4 text-2xl font-bold bg-[#ece9d8] text-black border-2 border-white border-b-gray-600 border-r-gray-600 active:border-t-gray-600 active:border-l-gray-600 active:border-b-white active:border-r-white shadow-md hover:bg-white transition-all cursor-pointer">
                {t('player.ok')}
              </button>
            </div>
          </form>
          <div className="pt-4 border-t border-gray-300 flex flex-col" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => window.open('/host', '_blank')} className="w-full flex items-center justify-center gap-2 py-2" style={{ marginBottom: '10px' }}>
              <Monitor size={16} /> {t('player.hostGame')}
            </button>
            <button type="button" onClick={() => window.open('/create', '_blank')} className="w-full flex items-center justify-center gap-2 py-2">
              <PlusCircle size={16} /> {t('player.createRoom')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!room) return <div className="min-h-screen bg-blue-800 flex items-center justify-center text-white">{t('player.loading')}</div>;
  const myPlayer = room?.players[socket.id];
  const choice = myPlayer?.choice;
  const currentQuestion = room?.questions?.[room?.current_q];
  const qType = currentQuestion?.type || 'multiple_choice';

  return (
    <div className="h-screen w-screen bg-blue-800 p-2 font-tahoma flex flex-col box-border">
      <LanguageSwitcher position="bottom-right" />
      <div className="window flex-grow flex flex-col shadow-2xl">
        <div className="title-bar"><div className="title-bar-text uppercase tracking-wider">{t('player.connection', { code: room?.code, name })}</div></div>
        <div className="window-body m-0 p-6 flex-grow flex flex-col items-center justify-center bg-white relative">
          {room?.state === 'lobby' && (
            <div className="w-full h-full flex flex-col items-center max-w-md mx-auto py-4">
              {avatar === null ? (
                <div className="window w-full bg-[#ece9d8] shadow-lg">
                  <div className="title-bar"><div className="title-bar-text">{t('player.chooseAvatar')}</div></div>
                  <div className="window-body p-6 bg-[#ece9d8]"><fieldset className="p-4 border-2 border-white border-b-gray-400 border-r-gray-400 shadow-inner">
                    <legend className="px-2 text-lg font-bold">{t('player.clickAvatar')}</legend>
                    <div className="grid grid-cols-4 gap-4 mt-2">
                      {avatars.map((a, i) => (<button key={i} onClick={() => setPlayerAvatar(a)} className="aspect-square p-2 bg-gray-200 border-2 border-white border-b-gray-500 border-r-gray-500 active:border-t-gray-500 active:border-l-gray-500 hover:bg-white transition-colors"><RetroAvatar id={a} /></button>))}
                    </div>
                  </fieldset></div>
                </div>
              ) : (<div className="text-center mt-6 animate-in fade-in zoom-in duration-300"><div className="mb-8 mx-auto w-40 h-40 p-4 border-4 border-white border-b-gray-500 border-r-gray-500 bg-gray-100 flex items-center justify-center shadow-xl"><RetroAvatar id={avatar} /></div>
                  <h2 className="text-3xl font-bold mb-4 text-blue-900">{t('player.connected')}</h2><p className="text-xl text-gray-600 italic">{t('player.waitingHost')}</p></div>
              )}
            </div>
          )}

          {room?.state === 'question' && (
            <div className="w-full h-full flex flex-col max-w-md">
              <h2 className="text-center font-bold text-3xl mb-6 text-blue-900 border-b-4 border-blue-100 pb-4">{t('player.selectAnswer')}</h2>
              <div className="flex flex-col gap-4 flex-grow justify-center">
                {(qType === 'multiple_choice' || qType === 'image_options') && (
                  <div className="flex flex-col gap-4 w-full">
                    <div className="grid grid-cols-1 gap-4">
                      {currentQuestion.options.map((opt, i) => (
                        <button 
                          key={i} 
                          className={clsx("mobile-btn !m-0 !py-8", (choice?.includes?.(i) || multiChoice.includes(i)) ? "active" : "")} 
                          onClick={() => toggleChoice(i)} 
                          disabled={choice !== null && choice !== undefined}
                        >
                          {qType === 'image_options' ? <img src={opt} style={{maxHeight:'100px', margin:'0 auto'}} alt="" /> : String.fromCharCode(65 + i)}
                        </button>
                      ))}
                    </div>
                    <button 
                      className="mobile-btn !bg-green-600 !text-white mt-8 !py-6 text-3xl shadow-[0_4px_0_rgb(22,101,52)] active:shadow-none active:translate-y-1 transition-all" 
                      onClick={() => submitAnswer(multiChoice)} 
                      disabled={choice !== null || multiChoice.length === 0}
                    >
                      {t('player.submit')}
                    </button>
                  </div>
                )}
                {qType === 'text' && (<div className="flex flex-col gap-6"><input type="text" value={textAnswer} onChange={e => setTextAnswer(e.target.value)} className="border-4 border-gray-300 p-6 text-3xl w-full font-bold focus:border-blue-500 outline-none" placeholder={t('player.typeAnswer')}/><button className="mobile-btn !bg-blue-600 !text-white !py-6 text-3xl" onClick={() => submitAnswer(textAnswer)} disabled={choice !== null}>{t('player.submit')}</button></div>)}
                {qType === 'percentage' && (<div className="flex flex-col gap-8 items-center w-full"><span className="text-5xl font-black text-blue-800">{percentAnswer}%</span><input type="range" min="0" max="100" value={percentAnswer} onChange={e => setPercentAnswer(parseInt(e.target.value))} className="w-full h-12"/><button className="mobile-btn !bg-blue-600 !text-white !py-6 text-3xl" onClick={() => submitAnswer(percentAnswer)} disabled={choice !== null}>{t('player.submit')}</button></div>)}
                {qType === 'image_zone' && (<div className="flex flex-col items-center gap-6 w-full"><div style={{ position: 'relative', width: '100%', maxWidth: '400px' }} className="shadow-2xl border-4 border-black"><img src={currentQuestion?.imageUrl} alt="" style={{ width:'100%', height:'auto', display:'block' }} onClick={(e) => { const rect = e.target.getBoundingClientRect(); submitAnswer({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 }); }}/></div><p className="text-center text-xl font-bold text-gray-700 animate-pulse">{t('player.tapImage')}</p></div>)}
              </div>
              {choice !== null && choice !== undefined && <div className="text-center mt-6 p-4 bg-green-50 border-2 border-green-500 rounded animate-bounce text-green-700 font-bold text-2xl">{t('player.answerReceived')}</div>}
            </div>
          )}

          {room?.state === 'reveal' && (<div className="text-center"><HelpCircle size={48} className="mx-auto mb-2 text-blue-500" /><h2 className="text-2xl font-bold mb-2">{t('player.timesUp')}</h2><p>{t('player.lookMainScreen')}</p></div>)}
          {room?.state === 'end' && (<div className="text-center"><h2 className="text-2xl font-bold mb-2">{t('player.gameOver')}</h2><p>{t('player.lookMainScreenResults')}</p></div>)}
        </div>
      </div>
    </div>
  );
}

export default Player;
