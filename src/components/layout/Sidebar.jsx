import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    PlusCircle,
    List,
    FileText,
    CheckSquare,
    Briefcase,
    UserCircle,
    LogOut,
    Bell,
    FolderOpen,
    MessageSquare,
    Users,
    FileCheck,
    CreditCard,
    X
} from 'lucide-react';
import { cn } from '../../utils/cn';

const Sidebar = ({ isOpen, toggle }) => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();

    const adminLinks = [
        { to: '/admin', icon: LayoutDashboard, label: t('sidebar.dashboard'), end: true },
        { to: '/admin/create-tender', icon: PlusCircle, label: t('sidebar.createTender') },
        { to: '/admin/tenders', icon: List, label: t('sidebar.tendersList') },
        { to: '/admin/bids', icon: FileCheck, label: t('sidebar.bidManagement') },
        // { to: '/admin/contractors', icon: Users, label: 'Contractors' }, // Removed: Contractors visible only in offers

        { to: '/admin/notifications', icon: Bell, label: t('sidebar.notifications') },
        { to: '/admin/profile', icon: UserCircle, label: t('sidebar.myProfile') },
    ];

    const contractorLinks = [
        { to: '/contractor', icon: LayoutDashboard, label: t('sidebar.dashboard'), end: true },
        { to: '/contractor/tenders', icon: Briefcase, label: t('sidebar.activeTenders') },
        { to: '/contractor/bids', icon: FileText, label: t('sidebar.myBids') },
        { to: '/contractor/notifications', icon: Bell, label: t('sidebar.notifications') },
        { to: '/contractor/billing', icon: CreditCard, label: t('sidebar.billing') },
        { to: '/contractor/profile', icon: UserCircle, label: t('sidebar.myProfile') },
    ];

    const links = user?.role === 'admin' ? adminLinks : contractorLinks;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
                    onClick={toggle}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="h-[58px] w-[188px] shrink-0 overflow-hidden">
                        <img src="/logo-wide.png" alt="Appalto Smart" className="h-full w-full object-contain object-left" />
                    </div>
                    <button
                        onClick={toggle}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 md:hidden"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            onClick={() => window.innerWidth < 768 && toggle()}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )
                            }
                        >
                            <link.icon className="mr-3 h-5 w-5" />
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={logout}
                        className="flex w-full items-center px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        {t('common.logout')}
                    </button>
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 text-center">
                            &copy; 2026 Appalto Smart
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
