'use client';

import { useTranslation } from 'react-i18next';
import { Button } from './button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Select
      value={i18n.language || 'en'}
      onValueChange={changeLanguage}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue>
          {i18n.language === 'ar' ? 'العربية' : 'English'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="ar">العربية</SelectItem>
      </SelectContent>
    </Select>
  );
}

