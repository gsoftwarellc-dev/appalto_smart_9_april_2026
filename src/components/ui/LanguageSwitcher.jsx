import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'it' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLanguage}
            className="flex items-center gap-2 rounded-full border border-[#cbb06a]/45 bg-white/72 px-3 py-1.5 text-sm font-medium text-[#233345] backdrop-blur-sm transition-colors hover:border-[#eb761b]/40 hover:bg-white hover:text-[#111827]"
            aria-label="Switch Language"
        >
            <Globe className="w-4 h-4 text-[#f2c661]" />
            <span className="uppercase tracking-wide">{i18n.language === 'it' ? 'IT' : 'EN'}</span>
        </motion.button>
    );
};

export default LanguageSwitcher;
