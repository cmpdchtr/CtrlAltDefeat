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
    <div className="create-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#1a1a2e', color: 'white', minHeight: '100vh', borderRadius: '12px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#0f34d1', textShadow: '2px 2px 0px #fff' }}>✨ QUIZ CONSTRUCTOR ✨</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
        <select 
          value={currentType} 
          onChange={(e) => setCurrentType(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #4a4e69', backgroundColor: '#22223b', color: 'white' }}
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="text">Text Answer (Case Insensitive)</option>
          <option value="image_zone">Image Zone Click</option>
          <option value="image_options">Image Options</option>
          <option value="percentage">Percentage (XP Slider)</option>
        </select>
        <button 
          onClick={addQuestion}
          style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: '#4caf50', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <PlusCircle size={18} /> Add Question
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {questions.map((q, idx) => (
          <div key={idx} style={{ backgroundColor: '#16213e', padding: '1.5rem', borderRadius: '12px', border: '1px solid #0f3460' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#e94560' }}>Question {idx + 1} <span style={{ fontSize: '0.8rem', color: '#888' }}>({q.type})</span></h3>
              <button onClick={() => removeQuestion(idx)} style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer' }}><Trash2 /></button>
            </div>
            
            <input 
              type="text" 
              placeholder="Question Text" 
              value={q.question} 
              onChange={(e) => updateQuestion(idx, 'question', e.target.value)} 
              style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '6px', border: '1px solid #4a4e69', backgroundColor: '#1a1a2e', color: 'white' }}
            />

            {(q.type === 'image_zone') && (
              <input 
                type="text" 
                placeholder="Image URL" 
                value={q.imageUrl || ''} 
                onChange={(e) => updateQuestion(idx, 'imageUrl', e.target.value)} 
                style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '6px', border: '1px solid #4a4e69', backgroundColor: '#1a1a2e', color: 'white' }}
              />
            )}

            {(q.type === 'multiple_choice' || q.type === 'image_options') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="radio" 
                      name={`correct-${idx}`} 
                      checked={q.correct === oIdx}
                      onChange={() => updateQuestion(idx, 'correct', oIdx)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <input 
                      type="text" 
                      placeholder={q.type === 'image_options' ? 'Image URL' : `Option ${oIdx + 1}`} 
                      value={opt} 
                      onChange={(e) => updateOption(idx, oIdx, e.target.value)} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #2a2a3e', backgroundColor: '#1a1a2e', color: 'white' }}
                    />
                  </div>
                ))}
              </div>
            )}

            {q.type === 'text' && (
              <div>
                <label>Correct Answer:</label>
                <input 
                  type="text" 
                  value={q.correct} 
                  onChange={(e) => updateQuestion(idx, 'correct', e.target.value)} 
                  placeholder="e.g. John Doe"
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', borderRadius: '4px', border: '1px solid #2a2a3e', backgroundColor: '#1a1a2e', color: 'white' }}
                />
              </div>
            )}

            {q.type === 'percentage' && (
              <div>
                <label>Correct Percentage: {q.correct}%</label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={q.correct} 
                  onChange={(e) => updateQuestion(idx, 'correct', parseInt(e.target.value))} 
                  style={{ width: '100%', marginTop: '0.5rem' }}
                />
              </div>
            )}

            {q.type === 'image_zone' && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label>X (%): <input type="number" value={q.correct.x} onChange={e => updateZone(idx, 'x', e.target.value)} style={{width: '60px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '4px'}} /></label>
                <label>Y (%): <input type="number" value={q.correct.y} onChange={e => updateZone(idx, 'y', e.target.value)} style={{width: '60px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '4px'}} /></label>
                <label>Radius (%): <input type="number" value={q.correct.radius} onChange={e => updateZone(idx, 'radius', e.target.value)} style={{width: '60px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '4px'}} /></label>
                <div style={{ flex: 1 }}></div>
                <small style={{ color: '#aaa' }}>Provide coordinates referencing percentage from top-left (0-100)</small>
              </div>
            )}
          </div>
        ))}
      </div>

      {questions.length > 0 && (
        <button 
          onClick={exportJSON}
          style={{ marginTop: '2rem', width: '100%', padding: '1rem', borderRadius: '8px', backgroundColor: '#0f34d1', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
        >
          <Download /> Export to .json
        </button>
      )}
    </div>
  );
};

export default Create;