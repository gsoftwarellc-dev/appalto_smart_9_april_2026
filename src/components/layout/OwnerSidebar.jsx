import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    FileText,
    DollarSign,
    Settings,
    Shield,
    Bell,
    LogOut
} from 'lucide-react';
import { cn } from '../../utils/cn';

const OwnerSidebar = ({ isOpen, onClose }) => {
    const { logout } = useAuth();
    const { t } = useTranslation();

    const links = [
        { to: '/owner', icon: LayoutDashboard, label: t('owner.sidebar.dashboard'), end: true },
        { to: '/owner/users', icon: Users, label: t('owner.sidebar.userManagement') },
        { to: '/owner/tenders', icon: FileText, label: t('owner.sidebar.tenders') },
        { to: '/owner/revenue', icon: DollarSign, label: t('owner.sidebar.revenue') },
        { to: '/owner/config', icon: Settings, label: t('owner.sidebar.configuration') },
        { to: '/owner/notifications', icon: Bell, label: t('owner.sidebar.notifications') },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed md:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white shadow-xl flex flex-col transition-transform duration-300 transform",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-8 w-8 text-blue-400" />
                        <span className="font-bold text-lg tracking-wider">{t('sidebar.ownerPanel')}</span>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
                        <LogOut className="h-5 w-5 rotate-180" /> {/* Reusing LogOut icon as a close arrow/icon equivalent if X not imported, or just X */}
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {t('owner.sidebar.platformManagement')}
                    </div>
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            onClick={onClose} // Close on link click on mobile
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )
                            }
                        >
                            <link.icon className="mr-3 h-5 w-5" />
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={logout}
                        className="flex w-full items-center px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        {t('sidebar.logout')}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default OwnerSidebar;
