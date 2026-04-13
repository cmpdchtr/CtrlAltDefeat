import React, { useState } from 'react';
import { PlusCircle, Trash2, Image as ImageIcon, Download, Settings } from 'lucide-react';

const Create = () => {
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

  return (
    <div className="h-screen w-screen overflow-hidden bg-blue-800 p-2 font-tahoma flex flex-col box-border">
      <div className="window flex-grow flex flex-col" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div className="title-bar">
          <div className="title-bar-text">Quiz Constructor.exe</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>

        <div className="window-body m-0 p-4 bg-[#ece9d8] flex-grow flex flex-col" style={{ overflowY: 'auto' }}>
          
          <div className="flex gap-2 items-center mb-4 p-2 border-2 border-white border-b-gray-500 border-r-gray-500 bg-gray-200">
            <label className="font-bold whitespace-nowrap">Question Type:</label>
            <select 
              value={currentType} 
              onChange={(e) => setCurrentType(e.target.value)}
              className="flex-grow p-1 border-2 border-gray-500 border-r-white border-b-white bg-white"
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="text">Text Answer</option>
              <option value="image_zone">Image Zone Click</option>
              <option value="image_options">Image Options</option>
              <option value="percentage">Percentage Slider</option>
            </select>
            <button onClick={addQuestion} className="px-4 py-1 flex items-center font-bold">
              <PlusCircle size={14} className="mr-1" /> Add
            </button>
          </div>

          <div className="flex-grow flex flex-col gap-4 mb-4">
            {questions.length === 0 && (
              <div className="flex items-center justify-center h-full text-gray-500 italic">
                No questions added yet. Press 'Add' to start.
              </div>
            )}

            {questions.map((q, idx) => (
              <fieldset key={idx} className="p-3 border border-gray-400 bg-white shadow-sm relative">
                <legend className="px-2 font-bold text-blue-800 bg-white border border-gray-300">
                  Question {idx + 1} ({q.type})
                </legend>
                
                <button 
                  onClick={() => removeQuestion(idx)} 
                  className="absolute top-0 right-2 w-6 h-6 p-0 flex items-center justify-center !text-red-600 font-bold"
                  title="Remove Question"
                >
                  <Trash2 size={14} />
                </button>

                <div className="field-row mb-3">
                  <label style={{ width: '80px' }}>Text:</label>
                  <input 
                    type="text" 
                    value={q.question} 
                    onChange={(e) => updateQuestion(idx, 'question', e.target.value)} 
                    className="flex-grow"
                  />
                </div>

                {(q.type === 'image_zone') && (
                  <div className="field-row mb-3">
                    <label style={{ width: '80px' }}>Image URL:</label>
                    <input 
                      type="text" 
                      value={q.imageUrl || ''} 
                      onChange={(e) => updateQuestion(idx, 'imageUrl', e.target.value)} 
                      className="flex-grow"
                    />
                  </div>
                )}

                {(q.type === 'multiple_choice' || q.type === 'image_options') && (
                  <div className="grid grid-cols-2 gap-2 pl-20">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name={`correct-${idx}`} 
                          checked={q.correct === oIdx}
                          onChange={() => updateQuestion(idx, 'correct', oIdx)}
                        />
                        <input 
                          type="text" 
                          placeholder={q.type === 'image_options' ? 'URL' : `Option ${String.fromCharCode(65 + oIdx)}`} 
                          value={opt} 
                          onChange={(e) => updateOption(idx, oIdx, e.target.value)} 
                          className="flex-grow"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'text' && (
                  <div className="field-row pl-20">
                    <label style={{ width: '60px' }}>Answer:</label>
                    <input 
                      type="text" 
                      value={q.correct} 
                      onChange={(e) => updateQuestion(idx, 'correct', e.target.value)} 
                      className="flex-grow"
                    />
                  </div>
                )}

                {q.type === 'percentage' && (
                  <div className="field-row pl-20 bg-gray-100 p-2 border border-gray-300">
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
                  <div className="flex gap-4 items-center bg-gray-100 p-2 border border-gray-300 mt-2">
                    <div className="field-row">
                      <label style={{ width: 'auto', marginRight: '4px' }}>X %:</label>
                      <input type="number" value={q.correct.x} onChange={e => updateZone(idx, 'x', e.target.value)} style={{ width: '50px' }} />
                    </div>
                    <div className="field-row">
                      <label style={{ width: 'auto', marginRight: '4px' }}>Y %:</label>
                      <input type="number" value={q.correct.y} onChange={e => updateZone(idx, 'y', e.target.value)} style={{ width: '50px' }} />
                    </div>
                    <div className="field-row">
                      <label style={{ width: 'auto', marginRight: '4px' }}>Radius (%):</label>
                      <input type="number" value={q.correct.radius} onChange={e => updateZone(idx, 'radius', e.target.value)} style={{ width: '50px' }} />
                    </div>
                  </div>
                )}
              </fieldset>
            ))}
          </div>

          <div className="border-t-2 border-gray-400 pt-4 mt-auto flex justify-between items-center">
            <span className="text-sm text-gray-600">Total: {questions.length} questions</span>
            <button 
              onClick={exportJSON}
              disabled={questions.length === 0}
              className="py-2 px-6 font-bold flex items-center bg-gray-300"
            >
              <Download size={16} className="mr-2" /> Export JSON
            </button>
          </div>

        </div>
      </div>

      <div className="taskbar mt-2 flex-shrink-0">
        <button className="start-btn">
          <img src="https://win98icons.alexmeub.com/icons/png/windows_slanted-1.png" alt="start" />
          start
        </button>
        <div className="flex-grow flex items-center px-2">
          <div className="px-3 py-1 bg-blue-700 bg-opacity-50 text-white rounded border border-blue-400 shadow-inner flex items-center text-xs cursor-default">
            Quiz Constructor.exe
          </div>
        </div>
        <div className="system-tray">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};

export default Create;