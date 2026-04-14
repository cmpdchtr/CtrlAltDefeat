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
    <div className="h-screen w-screen bg-blue-800 flex items-center justify-center p-2">
      <LanguageSwitcher position="bottom-right" />
      <div className="window" style={{ width: '100%', maxWidth: '350px' }}>
        <div className="title-bar"><div className="title-bar-text">{t('player.logOnTitle')}</div></div>
        <div className="window-body m-0 p-2">
          <div className="flex items-center mb-2"><LogIn size={32} className="mr-3 text-blue-600" /><p>{t('player.logOnDesc')}</p></div>
          {error && <p className="text-red-600 mb-2 font-bold">{error}</p>}
          <form onSubmit={joinRoom}>
            <div className="field-row"><label style={{width: '80px'}}>{t('player.roomCode')}</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={4} required className="uppercase flex-grow"/>
            </div>
            <div className="field-row mt-2"><label style={{width: '80px'}}>{t('player.userName')}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required maxLength={15} className="flex-grow"/>
            </div>
            <div className="flex justify-end mt-4"><button type="submit" style={{width: '80px', marginRight: '8px'}}>{t('player.ok')}</button></div>
          </form>
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
      <div className="window flex-grow flex flex-col">
        <div className="title-bar"><div className="title-bar-text">{t('player.connection', { code: room?.code, name })}</div></div>
        <div className="window-body m-0 p-2 flex-grow flex flex-col items-center justify-center bg-white relative">
          {room?.state === 'lobby' && (
            <div className="w-full h-full flex flex-col items-center max-w-sm mx-auto">
              {avatar === null ? (
                <div className="window w-full bg-[#ece9d8]">
                  <div className="title-bar"><div className="title-bar-text">{t('player.chooseAvatar')}</div></div>
                  <div className="window-body p-4 bg-[#ece9d8]"><fieldset className="p-2 border border-gray-400">
                    <legend className="px-1 text-sm">{t('player.clickAvatar')}</legend>
                    <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-[260px] mx-auto">
                      {avatars.map((a, i) => (<button key={i} onClick={() => setPlayerAvatar(a)} className="w-[52px] h-[52px] p-1 bg-gray-200 border-2 border-white border-b-gray-500 border-r-gray-500 active:border-t-gray-500 active:border-l-gray-500"><RetroAvatar id={a} /></button>))}
                    </div>
                  </fieldset></div>
                </div>
              ) : (<div className="text-center mt-4"><div className="mb-4 mx-auto w-24 h-24 p-2 border-2 border-white border-b-gray-500 border-r-gray-500 bg-gray-200 flex items-center justify-center"><RetroAvatar id={avatar} /></div>
                  <h2 className="text-xl font-bold mb-2">{t('player.connected')}</h2><p>{t('player.waitingHost')}</p></div>
              )}
            </div>
          )}

          {room?.state === 'question' && (
            <div className="w-full h-full flex flex-col">
              <h2 className="text-center font-bold text-xl mb-2 text-blue-900 border-b-2 border-blue-200 pb-2">{t('player.selectAnswer')}</h2>
              <div className="flex flex-col gap-2 flex-grow justify-center">
                {(qType === 'multiple_choice' || qType === 'image_options') && (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="grid grid-cols-1 gap-2">
                      {currentQuestion.options.map((opt, i) => (
                        <button key={i} className={clsx("mobile-btn", (choice?.includes?.(i) || multiChoice.includes(i)) ? "active !bg-blue-600 !text-white" : "")} onClick={() => toggleChoice(i)} disabled={choice !== null && choice !== undefined}>
                          {qType === 'image_options' ? <img src={opt} style={{maxHeight:'60px', margin:'0 auto'}} alt="" /> : String.fromCharCode(65 + i)}
                        </button>
                      ))}
                    </div>
                    <button className="mobile-btn !bg-green-600 !text-white mt-4 font-bold" onClick={() => submitAnswer(multiChoice)} disabled={choice !== null || multiChoice.length === 0}>
                      {t('player.submit')}
                    </button>
                  </div>
                )}
                {qType === 'text' && (<div className="flex flex-col gap-4"><input type="text" value={textAnswer} onChange={e => setTextAnswer(e.target.value)} className="border-2 border-gray-400 p-2 text-lg w-full" placeholder={t('player.typeAnswer')}/><button className="mobile-btn" onClick={() => submitAnswer(textAnswer)} disabled={choice !== null}>{t('player.submit')}</button></div>)}
                {qType === 'percentage' && (<div className="flex flex-col gap-4 items-center w-full"><span className="text-xl font-bold">{percentAnswer}%</span><input type="range" min="0" max="100" value={percentAnswer} onChange={e => setPercentAnswer(parseInt(e.target.value))} className="w-full"/><button className="mobile-btn" onClick={() => submitAnswer(percentAnswer)} disabled={choice !== null}>{t('player.submit')}</button></div>)}
                {qType === 'image_zone' && (<div className="flex flex-col items-center gap-4 w-full"><div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}><img src={currentQuestion?.imageUrl} alt="" style={{ width:'100%', height:'auto', display:'block', border:'2px solid black' }} onClick={(e) => { const rect = e.target.getBoundingClientRect(); submitAnswer({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 }); }}/></div><p className="text-center text-sm">{t('player.tapImage')}</p></div>)}
              </div>
              {choice !== null && choice !== undefined && <p className="text-center mt-2 text-green-700 font-bold">{t('player.answerReceived')}</p>}
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
