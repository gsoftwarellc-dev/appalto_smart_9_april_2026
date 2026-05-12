import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Coins, Globe, LogOut, User, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import BackendApiService from '../../services/backendApi';

const Header = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const [availableCredits, setAvailableCredits] = useState(null);
    const profilePath = user?.role === 'admin' ? '/admin/profile' : user?.role === 'contractor' ? '/contractor/profile' : null;
    const isContractor = user?.role === 'contractor';

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'it' : 'en';
        i18n.changeLanguage(newLang);
    };

    useEffect(() => {
        if (!isContractor) {
            setAvailableCredits(null);
            return undefined;
        }

        let isMounted = true;

        const loadCredits = async () => {
            try {
                const data = await BackendApiService.getBillingOverview();
                if (isMounted) {
                    setAvailableCredits(Number(data?.balance ?? 0));
                }
            } catch (error) {
                console.error('Failed to load contractor credits', error);
                if (isMounted) {
                    setAvailableCredits(null);
                }
            }
        };

        const handleCreditsUpdated = (event) => {
            if (typeof event.detail?.balance === 'number') {
                setAvailableCredits(event.detail.balance);
                return;
            }

            loadCredits();
        };

        loadCredits();
        window.addEventListener('appalto:credits-updated', handleCreditsUpdated);

        return () => {
            isMounted = false;
            window.removeEventListener('appalto:credits-updated', handleCreditsUpdated);
        };
    }, [isContractor]);

    return (
        <header className="bg-white shadow px-4 sm:px-6 py-4 flex justify-between items-center z-20 relative">
            <div className="flex items-center">
                <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onMenuClick}>
                    <Menu className="h-6 w-6" />
                </Button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {isContractor && (
                    <Link
                        to="/contractor/billing"
                        className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 sm:px-3 py-2 text-amber-900 hover:bg-amber-100 transition-colors"
                        title={t('contractor.billing.availableCredit')}
                    >
                        <Coins className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span className="hidden sm:inline text-xs font-medium text-amber-700">
                            {t('contractor.billing.availableCredit')}
                        </span>
                        <span className="text-sm font-bold whitespace-nowrap">
                            {availableCredits == null ? '--' : availableCredits}
                        </span>
                    </Link>
                )}
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
