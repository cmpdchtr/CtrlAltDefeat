import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ position = 'top-right' }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const containerStyle = {
    position: 'fixed',
    zIndex: 99999,
    ...(position === 'top-right' ? { top: '10px', right: '10px' } : { bottom: '10px', right: '10px' })
  };

  return (
    <div style={containerStyle}>
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
