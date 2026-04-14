import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ inTaskbar = false }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const getShortLng = (lng) => {
    const code = lng?.split('-')[0]?.toLowerCase();
    if (code === 'uk') return 'UK';
    if (code === 'ru') return 'RU';
    return 'EN';
  };

  if (inTaskbar) {
    return (
      <div className="flex items-center px-1" title="Language">
        <select 
          value={i18n.resolvedLanguage?.split('-')[0] || 'en'} 
          onChange={(e) => changeLanguage(e.target.value)}
          className="font-tahoma text-xs p-0 m-0 border-none bg-transparent outline-none cursor-pointer uppercase text-black"
          style={{ width: '40px', background: 'none' }}
        >
          <option value="en">EN</option>
          <option value="uk">UK</option>
          <option value="ru">RU</option>
        </select>
      </div>
    );
  }

  return (
    <div className="fixed bottom-2 right-2 z-[9999] p-1 bg-gray-200 border-2 border-white border-b-gray-500 border-r-gray-500 shadow-sm flex items-center">
      <div className="w-4 h-4 mr-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 w-full h-full">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      </div>
      <select 
        value={i18n.resolvedLanguage?.split('-')[0] || 'en'} 
        onChange={(e) => changeLanguage(e.target.value)}
        className="font-tahoma text-xs p-0 m-0 border-none outline-none cursor-pointer bg-transparent"
      >
        <option value="en">EN</option>
        <option value="uk">УКР</option>
        <option value="ru">РУС</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
