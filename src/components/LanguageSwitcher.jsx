import React from 'react';
import { useLanguage } from './LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 px-2 text-xs ${language === 'en' ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}
        onClick={() => changeLanguage('en')}
      >
        EN
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 px-2 text-xs ${language === 'no' ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}
        onClick={() => changeLanguage('no')}
      >
        NO
      </Button>
    </div>
  );
}