import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Globe, LogOut, User, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import NotificationDropdown from '../NotificationDropdown';

const Header = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const profilePath = user?.role === 'admin' ? '/admin/profile' : user?.role === 'contractor' ? '/contractor/profile' : null;

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'it' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center z-20 relative">
            <div className="flex items-center">
                <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onMenuClick}>
                    <Menu className="h-6 w-6" />
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <NotificationDropdown />
                <Button variant="ghost" size="sm" onClick={toggleLanguage} className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="uppercase">{i18n.language}</span>
                </Button>

                {profilePath && (
                    <Link
                        to={profilePath}
                        className="flex items-center gap-3 border-l pl-4 border-gray-200 hover:opacity-90"
                        title={t('sidebar.myProfile')}
                    >
                        <div className="hidden sm:flex flex-col text-right min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate">{user?.company_name || user?.name}</span>
                            <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
                            <User className="h-5 w-5" />
                        </div>
                    </Link>
                )}
                {!profilePath && (
                    <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
                        <div className="hidden sm:flex flex-col text-right min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate">{user?.company_name || user?.name}</span>
                            <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
                            <User className="h-5 w-5" />
                        </div>
                    </div>
                )}

                <Button variant="ghost" size="sm" onClick={logout} title={t('common.logout')}>
                    <LogOut className="h-5 w-5 text-gray-500 hover:text-red-500" />
                </Button>
            </div>
        </header>
    );
};

export default Header;
