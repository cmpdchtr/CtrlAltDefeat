import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ inTaskbar = false }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  if (inTaskbar) {
    return (
      <div className="flex items-center px-1" title="Language" style={{ height: '100%' }}>
        <select 
          value={i18n.resolvedLanguage?.split('-')[0] || 'en'} 
          onChange={(e) => changeLanguage(e.target.value)}
          style={{ 
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '11px',
            padding: '0',
            margin: '0',
            border: 'none',
            background: 'transparent',
            outline: 'none',
            cursor: 'pointer',
            textTransform: 'uppercase',
            color: 'black',
            width: '40px'
          }}
        >
          <option value="en">EN</option>
          <option value="uk">UK</option>
          <option value="ru">RU</option>
        </select>
      </div>
    );
  }

  // Floating variant for Player.jsx and mobile
  return (
    <div style={{ position: 'fixed', bottom: '10px', right: '10px', zIndex: 99999 }}>
      <select 
        value={i18n.resolvedLanguage?.split('-')[0] || 'en'} 
        onChange={(e) => changeLanguage(e.target.value)}
        style={{
          fontFamily: 'Tahoma, sans-serif',
          fontSize: '11px',
          backgroundColor: '#ece9d8',
          border: '2px solid',
          borderTopColor: '#ffffff',
          borderLeftColor: '#ffffff',
          borderRightColor: '#808080',
          borderBottomColor: '#808080',
          padding: '2px 4px',
          outline: 'none',
          cursor: 'pointer',
          color: 'black'
        }}
      >
        <option value="en">English (EN)</option>
        <option value="uk">Українська (UK)</option>
        <option value="ru">Русский (RU)</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
