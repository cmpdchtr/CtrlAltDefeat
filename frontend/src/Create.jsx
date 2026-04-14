import React, { useState } from 'react';
import { PlusCircle, Trash2, Image as ImageIcon, Download, Settings } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Create = () => {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState([]);
  const [currentType, setCurrentType] = useState('multiple_choice');

  const addQuestion = () => {
    let newQ = { type: currentType, question: '', options: [] };
    if (currentType === 'multiple_choice' || currentType === 'image_options') {
      newQ.options = ['', '', '', ''];
      newQ.correct = 0;
    } else if (currentType === 'text') {
      newQ.correct = '';
    } else if (currentType === 'percentage') {
      newQ.correct = 50;
    } else if (currentType === 'image_zone') {
      newQ.imageUrl = '';
      newQ.correct = { x: 50, y: 50, radius: 10 };
    }
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const updateZone = (qIndex, field, value) => {
    const updated = [...questions];
    updated[qIndex].correct[field] = parseFloat(value);
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "questions.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          setQuestions(imported);
        } else {
          alert("Invalid question format. Expected an array.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset input
  };

  const importWayground = async () => {
    const rawUrl = prompt(t('create.waygroundPrompt', 'Вставте посилання на Wayground (API/JSON):'));
    if (!rawUrl) return;
    
    // Normalize URL if it's an admin link to use the apis endpoint
    let url = rawUrl;
    if (url.includes('wayground.com/admin/quiz/') && !url.endsWith('/apis')) {
       url = url.split('?')[0];
       if (!url.endsWith('/')) url += '/';
       url += 'apis';
    }

    const backendUrl = import.meta.env.DEV 
      ? `${window.location.protocol}//${window.location.hostname}:8000` 
      : window.location.origin;

    try {
      let urlToFetch = `${backendUrl}/api/proxy?url=${encodeURIComponent(url)}`;
      let response;
      
      const fetchWithTimeout = async (resource, options = {}) => {
        const { timeout = 5000 } = options;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(resource, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      };

      try {
        console.log("Attempting import via local proxy...");
        response = await fetchWithTimeout(urlToFetch, { timeout: 5000 });
        if (!response.ok) throw new Error(`Local proxy returned ${response.status}`);
      } catch (e) {
        console.warn("Local proxy failed or timed out, trying public fallback (corsproxy.io)...", e.message);
        urlToFetch = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        response = await fetchWithTimeout(urlToFetch, { timeout: 10000 });
      }

      if (!response.ok) {
        throw new Error(`All proxies failed. Last status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const textSnippet = (await response.text()).substring(0, 200);
        console.error("Received non-JSON response:", textSnippet);
        throw new Error(t('create.importErrorNonJson', 'Сервер повернув некоректний формат даних (не JSON). Можливо, доступ обмежено.'));
      }

      const data = await response.json();
      
      if (data.error) {
        console.error("Proxy reported error:", data);
        throw new Error(data.error);
      }

      // Map Wayground format to CtrlAltDefeat format
      // Wayground (Quizizz) structure: data.data.quiz.info.questions
      let wayQuestions = [];
      if (data.data?.quiz?.info?.questions) {
        wayQuestions = data.data.quiz.info.questions;
      } else if (Array.isArray(data)) {
        wayQuestions = data;
      } else if (data.questions && Array.isArray(data.questions)) {
        wayQuestions = data.questions;
      }

      const mapped = wayQuestions.map(q => {
        // Basic extraction based on typical Quizizz/Wayground JSON
        const structure = q.structure || {};
        const qText = structure.query?.text || "Question";
        const qType = structure.kind || "multiple_choice";
        const options = structure.options || [];
        
        let type = "multiple_choice";
        let correct = 0;
        let opts = options.map(o => o.text || "");

        if (qType === 'MSQ' || qType === 'MCQ') {
          type = "multiple_choice";
          const correctIdx = options.findIndex(o => o.isCorrect === true || o.correct === true);
          correct = correctIdx !== -1 ? correctIdx : 0;
        } else if (qType === 'BLANK') {
          type = "text";
          correct = options[0]?.text || "";
        }

        return {
          type,
          question: qText.replace(/<[^>]*>?/gm, ''), // strip html
          options: opts.length > 0 ? opts : ["", "", "", ""],
          correct
        };
      });

      if (mapped.length > 0) {
        setQuestions(prev => [...prev, ...mapped]);
        alert(t('create.importSuccess', 'Успішно імпортовано!'));
      } else {
        alert(t('create.importError', 'Не вдалося знайти питання у файлі.'));
      }
    } catch (err) {
      alert(t('create.importFailed', 'Не вдалося завантажити дані за посиланням. Перевірте консоль для деталей.'));
      console.error("Wayground import error:", err);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-blue-800 font-tahoma flex flex-col box-border relative">
      <LanguageSwitcher />
      <div 
        className="window absolute shadow-xl flex flex-col" 
        style={{ 
          width: '90%', 
          height: '85%', 
          maxWidth: '1000px',
          left: '50%', 
          top: '48%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 10
        }}
      >
        <div className="title-bar flex-shrink-0">
          <div className="title-bar-text">{t('create.quizConstructorExe')}</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>

        <div className="window-body m-0 p-4 bg-[#ece9d8] flex-grow flex flex-col relative" style={{ overflowY: 'auto' }}>

          
          <div className="flex gap-2 items-center mb-4 p-2 border-2 border-white border-b-gray-500 border-r-gray-500 bg-gray-200">
            <label className="font-bold whitespace-nowrap">{t('create.questionType')}</label>
            <select 
              value={currentType} 
              onChange={(e) => setCurrentType(e.target.value)}
              className="flex-grow p-1 border-2 border-gray-500 border-r-white border-b-white bg-white"
            >
              <option value="multiple_choice">{t('create.typeMultiple')}</option>
              <option value="text">{t('create.typeText')}</option>
              <option value="image_zone">{t('create.typeImageZone')}</option>
              <option value="image_options">{t('create.typeImageOptions')}</option>
              <option value="percentage">{t('create.typePercentage')}</option>
            </select>
            <button onClick={addQuestion} className="px-4 py-1 flex items-center font-bold">
              <PlusCircle size={14} className="mr-1" /> {t('create.add')}
            </button>
          </div>

          <div className="flex-grow flex flex-col gap-4 mb-4">
            {questions.length === 0 && (
              <div className="flex items-center justify-center h-full text-gray-500 italic">
                {t('create.noQuestions')}
              </div>
            )}

            {questions.map((q, idx) => (
              <fieldset key={idx} className="p-3 border border-gray-400 bg-white shadow-sm relative">
                <legend className="px-2 font-bold text-blue-800 bg-white border border-gray-300">
                  {t('create.questionN', { num: idx + 1 })} ({t(`create.type${q.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`) || q.type})
                </legend>
                
                <button 
                  onClick={() => removeQuestion(idx)} 
                  className="absolute top-0 right-2 w-6 h-6 p-0 flex items-center justify-center !text-red-600 font-bold"
                  title={t('create.removeQuestion')}
                >
                  <Trash2 size={14} />
                </button>

                <div className="field-row mb-3">
                  <label style={{ width: '80px' }}>{t('create.text')}</label>
                  <input 
                    type="text" 
                    value={q.question} 
                    onChange={(e) => updateQuestion(idx, 'question', e.target.value)} 
                    className="flex-grow"
                  />
                </div>

                {(q.type === 'image_zone') && (
                  <div className="field-row mb-3">
                    <label style={{ width: '80px' }}>{t('create.imageUrl')}</label>
                    <input 
                      type="text" 
                      value={q.imageUrl || ''} 
                      onChange={(e) => updateQuestion(idx, 'imageUrl', e.target.value)} 
                      className="flex-grow"
                    />
                  </div>
                )}

                {(q.type === 'multiple_choice' || q.type === 'image_options') && (
                  <div className="grid grid-cols-2 gap-2 mt-2 px-2 pb-2 bg-gray-100 border border-gray-300">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="field-row">
                        <input 
                          type="radio" 
                          id={`q-${idx}-opt-${oIdx}`}
                          name={`correct-${idx}`} 
                          checked={q.correct === oIdx}
                          onChange={() => updateQuestion(idx, 'correct', oIdx)}
                        />
                        <label htmlFor={`q-${idx}-opt-${oIdx}`} className="ml-1 mr-2">{String.fromCharCode(65 + oIdx)}:</label>
                        <input 
                          type="text" 
                          placeholder={q.type === 'image_options' ? 'Image URL' : t('create.option', { letter: String.fromCharCode(65 + oIdx) })} 
                          value={opt} 
                          onChange={(e) => updateOption(idx, oIdx, e.target.value)} 
                          className="flex-grow"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'text' && (
                  <div className="field-row pl-4 mt-2">
                    <label style={{ width: '120px' }}>{t('create.correctAnswer')}</label>
                    <input 
                      type="text" 
                      value={q.correct} 
                      onChange={(e) => updateQuestion(idx, 'correct', e.target.value)} 
                      className="flex-grow"
                    />
                  </div>
                )}

                {q.type === 'percentage' && (
                  <div className="field-row pl-4 mt-2 bg-gray-100 p-2 border border-gray-300">
                    <label style={{ width: '60px' }}>{q.correct}%</label>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={q.correct} 
                      onChange={(e) => updateQuestion(idx, 'correct', parseInt(e.target.value))} 
                      className="w-48"
                    />
                  </div>
                )}

                {q.type === 'image_zone' && (
                  <div className="flex flex-col gap-2 bg-gray-100 p-2 border border-gray-300 mt-2">
                    <div className="flex gap-4 items-center mb-2">
                      <div className="field-row">
                        <label style={{ width: 'auto', marginRight: '4px' }}>X %:</label>
                        <input type="number" value={q.correct.x} onChange={e => updateZone(idx, 'x', e.target.value)} style={{ width: '60px' }} />
                      </div>
                      <div className="field-row">
                        <label style={{ width: 'auto', marginRight: '4px' }}>Y %:</label>
                        <input type="number" value={q.correct.y} onChange={e => updateZone(idx, 'y', e.target.value)} style={{ width: '60px' }} />
                      </div>
                      <div className="field-row">
                        <label style={{ width: 'auto', marginRight: '4px' }}>{t('create.radius')}</label>
                        <input type="number" value={q.correct.radius} onChange={e => updateZone(idx, 'radius', e.target.value)} style={{ width: '60px' }} />
                      </div>
                    </div>
                    {q.imageUrl && (
                      <div className="border border-gray-500 bg-white p-1 text-center">
                        <p className="text-xs text-gray-600 mb-1">{t('create.clickImage')}</p>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img 
                            src={q.imageUrl} 
                            alt="Zone preview" 
                            style={{ maxWidth: '100%', maxHeight: '400px', cursor: 'crosshair', display: 'block', border: '1px solid black' }}
                            onClick={(e) => {
                              const rect = e.target.getBoundingClientRect();
                              const x = ((e.clientX - rect.left) / rect.width) * 100;
                              const y = ((e.clientY - rect.top) / rect.height) * 100;
                              updateZone(idx, 'x', x.toFixed(2));
                              updateZone(idx, 'y', y.toFixed(2));
                            }}
                          />
                          {q.correct.x !== undefined && q.correct.y !== undefined && (
                            <div style={{
                              position: 'absolute',
                              left: `${q.correct.x}%`,
                              top: `${q.correct.y}%`,
                              width: `${(q.correct.radius || 10) * 2}%`,
                              height: `${(q.correct.radius || 10) * 2}%`,
                              border: '2px dashed red',
                              borderRadius: '50%',
                              transform: 'translate(-50%, -50%)',
                              pointerEvents: 'none',
                              boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                            }} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </fieldset>
            ))}
          </div>

          <div className="border-t-2 border-gray-400 pt-3 mt-4 flex-shrink-0 flex justify-between items-center bg-[#ece9d8] sticky bottom-0 z-10 w-full px-2 pb-2">
            <span className="text-sm font-bold text-gray-800">{t('create.totalQuestions', { count: questions.length })}</span>
            <div className="flex gap-2">
              <button 
                onClick={importWayground}
                className="py-1 px-4 font-bold flex items-center shadow-md border-2 border-white border-b-gray-600 border-r-gray-600 active:border-t-gray-600 active:border-l-gray-600 active:border-b-white active:border-r-white bg-gray-200 cursor-pointer"
              >
                {t('create.wayground', 'Wayground')}
              </button>
              <label className="py-1 px-4 font-bold flex items-center shadow-md border-2 border-white border-b-gray-600 border-r-gray-600 active:border-t-gray-600 active:border-l-gray-600 active:border-b-white active:border-r-white bg-gray-200 cursor-pointer">
                {t('create.importJson')}
                <input type="file" accept=".json" onChange={importJSON} style={{ display: 'none' }} />
              </label>
              <button 
                onClick={exportJSON}
                disabled={questions.length === 0}
                className="py-1 px-4 font-bold flex items-center bg-gray-200 disabled:opacity-50"
              >
                <Download size={16} className="mr-2" /> {t('create.exportJson')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="taskbar mt-auto flex-shrink-0 z-20 w-full fixed bottom-0 left-0">
        <button className="start-btn">
          <img src="https://win98icons.alexmeub.com/icons/png/windows_slanted-1.png" alt="start" />
          {t('host.start')}
        </button>
        <div className="flex-grow flex items-center px-2">
          <div className="px-3 py-1 bg-blue-700 bg-opacity-50 text-white rounded border border-blue-400 shadow-inner flex items-center text-xs cursor-default">
            {t('create.quizConstructorExe')}
          </div>
        </div>
        <div className="system-tray flex items-center">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};

export default Create;