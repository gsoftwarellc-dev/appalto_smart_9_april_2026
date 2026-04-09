import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import {
    CheckCircle, Briefcase, Users, LayoutDashboard, FileText,
    ArrowRight, Star, Menu, X, Building, TrendingUp, Shield
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionTemplate, useMotionValue } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import ItalyMapSection from '../components/landing/ItalyMapSection';
import headerLogo from '../../logo_transparacny.png';


// Mock Data for Chart
const chartData = [
    { month: 'Jan', tenders: 45, successRate: 65 },
    { month: 'Feb', tenders: 52, successRate: 68 },
    { month: 'Mar', tenders: 48, successRate: 72 },
    { month: 'Apr', tenders: 61, successRate: 75 },
    { month: 'May', tenders: 55, successRate: 78 },
    { month: 'Jun', tenders: 67, successRate: 82 },
    { month: 'Jul', tenders: 72, successRate: 85 },
];

const brandButtonClass = 'bg-gradient-to-r from-[#5f9d37] via-[#b6a330] to-[#eb761b] text-white shadow-[0_12px_35px_rgba(235,118,27,0.24)] hover:shadow-[0_18px_45px_rgba(95,157,55,0.28)]';
const brandOutlineClass = 'border border-[#f2c661]/35 bg-white/5 text-[#fff3d1] hover:border-[#f2c661]/60 hover:bg-[#f2c661]/10 hover:text-white';
const brandHeaderOutlineClass = 'border border-[#c5a252]/45 bg-white/70 text-[#213144] hover:border-[#eb761b]/45 hover:bg-white hover:text-[#111827] shadow-[0_10px_24px_rgba(129,102,33,0.12)]';
const brandTextGradientClass = 'text-transparent bg-clip-text bg-gradient-to-r from-[#8fd15a] via-[#f1cd58] to-[#ef8c28] bg-300% animate-gradient';

const SpotlightCard = ({ children, className = "" }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }) {
        let { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            className={`group relative border border-white/10 bg-[#111827] shadow-lg overflow-hidden rounded-2xl ${className}`}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                          650px circle at ${mouseX}px ${mouseY}px,
                          rgba(59, 130, 246, 0.1),
                          transparent 80%
                        )
                    `,
                }}
            />
            {/* Border Gradient */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                    radial-gradient(
                      600px circle at ${mouseX}px ${mouseY}px,
                      rgba(59, 130, 246, 0.4),
                      transparent 40%
                    )
                  `,
                    zIndex: 0
                }}
            />
            <div className="relative h-full bg-[#111827] rounded-2xl z-10">
                {children}
            </div>
        </div>
    );
};


const LandingPage = () => {
    const { t } = useTranslation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, 150]);
    const heroOpacity = useTransform(scrollY, [0, 500], [1, 0.5]);

    const testimonials = [
        {
            id: 1,
            text: t('landing.testimonials.t1'),
            author: "Marco Rossi",
            role: "Property Developer",
            company: "Rossi Estates"
        },
        {
            id: 2,
            text: t('landing.testimonials.t2'),
            author: "Giuseppe Verdi",
            role: "General Contractor",
            company: "Verdi Costruzioni"
        },
        {
            id: 3,
            text: t('landing.testimonials.t3'),
            author: "Elena Bianchi",
            role: "Project Manager",
            company: "Milano Towers"
        }
    ];

    const contractorFeatureItems = [
        t('landing.features.list.access'),
        t('landing.features.list.compliance'),
        t('landing.features.list.payments'),
        t('landing.features.list.dashboard')
    ];

    const workflowSteps = [
        {
            icon: FileText,
            title: t('landing.how.step1.title'),
            desc: t('landing.how.step1.desc'),
            iconBg: 'from-[#183a72] via-[#204a90] to-[#2d68c6]',
            iconColor: 'text-[#9cc5ff]',
            glow: 'shadow-[0_18px_38px_rgba(45,104,198,0.28)]'
        },
        {
            icon: Users,
            title: t('landing.how.step2.title'),
            desc: t('landing.how.step2.desc'),
            iconBg: 'from-[#221d6c] via-[#3431a1] to-[#4e57d6]',
            iconColor: 'text-[#bdc3ff]',
            glow: 'shadow-[0_18px_38px_rgba(78,87,214,0.24)]'
        },
        {
            icon: LayoutDashboard,
            title: t('landing.how.step3.title'),
            desc: t('landing.how.step3.desc'),
            iconBg: 'from-[#0f5a59] via-[#127879] to-[#17a4a0]',
            iconColor: 'text-[#a9f6f1]',
            glow: 'shadow-[0_18px_38px_rgba(23,164,160,0.22)]'
        }
    ];

    const flowCards = [
        {
            icon: Building,
            title: t('landing.flows.clientTitle'),
            label: t('landing.flows.clientLabel'),
            intro: t('landing.flows.clientIntro'),
            steps: [
                t('landing.flows.clientSteps.create'),
                t('landing.flows.clientSteps.collect'),
                t('landing.flows.clientSteps.view'),
                t('landing.flows.clientSteps.awardAdmin'),
                t('landing.flows.clientSteps.awardTech')
            ],
            benefitsTitle: t('landing.flows.clientBenefitsTitle'),
            benefits: [
                t('landing.flows.clientBenefits.free'),
                t('landing.flows.clientBenefits.noSearch'),
                t('landing.flows.clientBenefits.fromOffice'),
                t('landing.flows.clientBenefits.comparable'),
                t('landing.flows.clientBenefits.tracked')
            ],
            iconWrapClass: 'border-[#2f64cf]/30 bg-[#11234c]',
            iconClass: 'text-[#72a4ff]',
            labelClass: 'text-[#72a4ff]',
            checkClass: 'text-[#72a4ff]',
            benefitClass: 'text-[#72a4ff]'
        },
        {
            icon: Briefcase,
            title: t('landing.flows.contractorTitle'),
            label: t('landing.flows.contractorLabel'),
            intro: t('landing.flows.contractorIntro'),
            steps: [
                t('landing.flows.contractorSteps.signup'),
                t('landing.flows.contractorSteps.browse'),
                t('landing.flows.contractorSteps.credits'),
                t('landing.flows.contractorSteps.offer'),
                t('landing.flows.contractorSteps.win')
            ],
            benefitsTitle: t('landing.flows.contractorBenefitsTitle'),
            benefits: [
                t('landing.flows.contractorBenefits.opportunities'),
                t('landing.flows.contractorBenefits.visibility'),
                t('landing.flows.contractorBenefits.clearDocs'),
                t('landing.flows.contractorBenefits.noSubscription'),
                t('landing.flows.contractorBenefits.payWhenParticipate')
            ],
            iconWrapClass: 'border-[#1f7d62]/30 bg-[#092c27]',
            iconClass: 'text-[#36d6a1]',
            labelClass: 'text-[#36d6a1]',
            checkClass: 'text-[#36d6a1]',
            benefitClass: 'text-[#36d6a1]'
        }
    ];

    const securityPoints = [
        t('landing.security.points.visibility'),
        t('landing.security.points.tracked'),
        t('landing.security.points.archived'),
        t('landing.security.points.fairAccess')
    ];

    const footerColumns = [
        {
            title: t('landing.footer.platform'),
            items: [
                { label: t('landing.footer.owners'), to: '/register' },
                { label: t('landing.footer.contractors'), to: '/register' },
                { label: t('landing.footer.pricing'), to: '/register' }
            ]
        },
        {
            title: t('landing.footer.company'),
            items: [
                { label: t('landing.footer.about'), to: '/' },
                { label: t('landing.footer.careers'), to: '/register' },
                { label: t('landing.footer.contact'), to: '/login' }
            ]
        },
        {
            title: t('landing.footer.legal'),
            items: [
                { label: t('landing.footer.privacy'), to: '/' },
                { label: t('landing.footer.terms'), to: '/' }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#0B1120] font-sans text-white overflow-x-hidden selection:bg-[#f2c661]/30 selection:text-[#fff6dc]">
            {/* Navigation */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed top-0 w-full z-50 border-b border-[#dcc589]/55 bg-[linear-gradient(90deg,rgba(254,249,239,0.95)_0%,rgba(248,238,214,0.93)_48%,rgba(255,248,235,0.94)_100%)] shadow-[0_18px_45px_rgba(12,18,32,0.18)] backdrop-blur-xl"
            >
                <div className="container mx-auto flex min-h-[92px] items-center justify-between px-4 py-3 md:px-8">
                    <Link
                        to="/"
                        className="flex items-center px-2 py-2"
                    >
                        <img
                            src={headerLogo}
                            alt="Appalto Smart"
                            className="h-10 w-auto max-w-[235px] md:h-12 md:max-w-[340px] lg:h-14 lg:max-w-[420px]"
                        />
                    </Link>

                    <div className="hidden md:flex items-center gap-3">
                        <LanguageSwitcher />
                        <Link to="/login">
                            <Button variant="outline" className={`h-11 rounded-full px-5 font-semibold ${brandHeaderOutlineClass}`}>
                                {t('landing.nav.signIn')}
                            </Button>
                        </Link>
                        <Link to="/register">
                            <Button className={`relative overflow-hidden px-6 py-2 rounded-full font-semibold transition-all group ${brandButtonClass}`}>
                                <span className="relative z-10">{t('landing.nav.getStarted')}</span>
                                <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.32)_50%,transparent_80%)] -translate-x-full transition-transform duration-700 group-hover:translate-x-full"></div>
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4 md:hidden">
                        <LanguageSwitcher />
                        <button className="p-2 text-[#213144]" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="absolute w-full overflow-hidden border-t border-[#dcc589]/55 bg-[linear-gradient(180deg,rgba(255,250,241,0.97)_0%,rgba(247,237,212,0.96)_100%)] p-4 shadow-2xl md:hidden"
                        >
                            <div className="flex flex-col gap-4">
                                <Link to="/login" className="w-full">
                                    <Button variant="outline" className={`w-full justify-center rounded-full ${brandHeaderOutlineClass}`}>{t('landing.nav.signIn')}</Button>
                                </Link>
                                <Link to="/register" className="w-full">
                                    <Button className={`w-full justify-center rounded-full ${brandButtonClass}`}>{t('landing.nav.getStarted')}</Button>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden min-h-[95vh] flex items-center">
                {/* ... (background effects remain) ... */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 45, 0],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-gradient-to-br from-[#eb761b]/20 via-[#f2c661]/16 to-transparent rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            x: [0, 50, 0],
                            opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[20%] -left-[10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#5f9d37]/20 via-[#b6a330]/14 to-transparent rounded-full blur-3xl"
                    />
                </div>

                <motion.div
                    style={{ y: heroY, opacity: heroOpacity }}
                    className="absolute inset-0 z-0"
                >
                    <img
                        src="/images/landing/smart-construction-hero.png"
                        alt="Smart Construction Management"
                        className="w-full h-full object-cover scale-105 opacity-40 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120] via-[#0B1120]/90 to-[#0B1120]/40"></div>
                </motion.div>

                <div className="container mx-auto px-4 md:px-8 relative z-10">
                    <div className="max-w-4xl space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#17321b]/55 backdrop-blur-sm border border-[#5f9d37]/35 text-[#d8eeaa] font-medium shadow-[0_10px_30px_rgba(95,157,55,0.14)] transition-shadow cursor-default"
                        >
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f2c661] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#eb761b]"></span>
                            </span>
                            {t('landing.hero.slogan')}
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="text-6xl md:text-8xl font-extrabold tracking-tight text-white leading-[1.1]"
                        >
                            {t('landing.hero.title1')}<br />
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1, duration: 1 }}
                                className={brandTextGradientClass}
                            >
                                {t('landing.hero.title2')}
                            </motion.span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-xl md:text-2xl text-slate-300/85 max-w-2xl leading-relaxed"
                        >
                            {t('landing.hero.desc')}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="flex flex-col sm:flex-row gap-4 pt-4"
                        >
                            <Link to="/register">
                                <Button size="lg" className={`group relative h-16 px-10 text-xl overflow-hidden rounded-full hover:-translate-y-1 transition-all duration-300 ${brandButtonClass}`}>
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                    <span className="relative flex items-center gap-2">
                                        {t('landing.hero.startProject')} <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Button>
                            </Link>
                            <Link to="/register">
                                <Button variant="outline" size="lg" className={`h-16 px-10 text-xl rounded-full border-2 transition-all ${brandOutlineClass}`}>
                                    {t('landing.hero.joinContractor')}
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section >

            {/* Stats Band */}
            <section className="bg-[#0f172a] border-y border-white/5 py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                {/* Glowing accents */}
                <div className="absolute top-0 left-1/4 w-64 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 blur-sm"></div>
                <div className="absolute bottom-0 right-1/4 w-64 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 blur-sm"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
                        {[
                            { value: "€50M+", label: t('landing.stats.projectValue') },
                            { value: "1.2k+", label: t('landing.stats.activeContracts') },
                            { value: "98%", label: t('landing.stats.clientSatisfaction') },
                            { value: "24h", label: t('landing.stats.response') }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-4 hover:bg-white/5 rounded-xl transition-colors cursor-default"
                            >
                                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-200 mb-2">{stat.value}</div>
                                <div className="text-gray-400 font-medium">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Live Italy Map */}
            <ItalyMapSection />

            {/* Contractor Feature Sequence */}
            <section className="relative overflow-hidden bg-[#030c20] py-24">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(95,157,55,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(235,118,27,0.1),transparent_26%)]"></div>
                <div className="container relative z-10 mx-auto space-y-8 px-4 md:px-8">
                    <div className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(135deg,#030b20_0%,#061437_56%,#071128_100%)] shadow-[0_35px_90px_rgba(2,8,23,0.55)]">
                        <div className="grid items-center gap-12 px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[0.92fr_1.08fr] lg:px-12">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="max-w-xl space-y-8"
                            >
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#1b4a95]/45 bg-[#0b1c44]/70 px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#8eb7ff]">
                                    <Briefcase className="h-4 w-4 text-[#f2c661]" />
                                    {t('landing.features.forContractors')}
                                </div>
                                <div className="space-y-5">
                                    <h2 className="text-4xl font-black leading-[1.02] tracking-tight text-white md:text-6xl">
                                        {t('landing.features.title')}
                                    </h2>
                                    <p className="text-lg leading-relaxed text-slate-300/82">
                                        {t('landing.features.desc')}
                                    </p>
                                </div>

                                <ul className="space-y-4">
                                    {contractorFeatureItems.map((item, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex items-start gap-4"
                                        >
                                            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#1d5d3f]/55 bg-[#081d15] shadow-[0_10px_20px_rgba(8,29,21,0.4)]">
                                                <CheckCircle className="h-4 w-4 text-[#69da8a]" />
                                            </div>
                                            <span className="text-base font-medium leading-relaxed text-slate-100/92">{item}</span>
                                        </motion.li>
                                    ))}
                                </ul>

                                <Link to="/register">
                                    <Button
                                        variant="outline"
                                        className="mt-2 h-12 rounded-xl border-[#2959a6]/55 bg-[#07173a]/65 px-6 text-[#9cc0ff] transition-all hover:scale-[1.02] hover:border-[#f2c661]/45 hover:bg-[#0c2451] hover:text-white"
                                    >
                                        {t('landing.features.cta')}
                                    </Button>
                                </Link>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.92, rotate: 4 }}
                                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="relative"
                            >
                                <div className="absolute inset-x-6 -top-4 bottom-6 rounded-[2rem] bg-[linear-gradient(135deg,rgba(36,57,140,0.62),rgba(9,22,60,0.95))] shadow-[0_30px_60px_rgba(6,20,55,0.4)] rotate-[4deg]"></div>
                                <div className="absolute inset-x-10 top-3 bottom-10 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/6 to-transparent"></div>
                                <img
                                    src="/images/landing/contractor-feature.png"
                                    alt="Contractor using Appalto Smart"
                                    className="relative ml-auto w-full max-w-[660px] rounded-[2rem] border border-white/12 object-cover shadow-[0_35px_80px_rgba(1,8,20,0.5)]"
                                />
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                    className="absolute -bottom-6 left-0 max-w-[290px] rounded-2xl border border-white/10 bg-[#16233f]/92 p-4 shadow-[0_24px_50px_rgba(2,8,23,0.45)] backdrop-blur-md md:left-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#1d5d3f]/55 bg-[#0a2018]">
                                            <CheckCircle className="h-5 w-5 text-[#69da8a]" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{t('landing.features.statusLabel')}</p>
                                            <p className="text-lg font-bold leading-none text-white">{t('landing.features.statusTitle')}</p>
                                            <p className="text-sm leading-relaxed text-slate-300/82">{t('landing.features.statusDesc')}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,#07132f_0%,#061025_100%)] shadow-[0_35px_90px_rgba(2,8,23,0.5)]">
                        <div className="px-6 py-12 md:px-10 md:py-14">
                            <div className="mx-auto mb-14 max-w-3xl text-center">
                                <h2 className="text-3xl font-bold text-white md:text-5xl">{t('landing.how.title')}</h2>
                                <p className="mt-4 text-lg text-slate-300/76">{t('landing.how.subtitle')}</p>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-3">
                                {workflowSteps.map((step, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.15 }}
                                        className="group relative h-full overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,20,44,0.92)_0%,rgba(7,16,34,0.98)_100%)] px-8 py-10 text-center shadow-[0_22px_45px_rgba(2,8,23,0.35)]"
                                    >
                                        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent"></div>
                                        <div className={`mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.iconBg} ${step.glow}`}>
                                            <step.icon className={`h-8 w-8 ${step.iconColor}`} />
                                        </div>
                                        <h3 className="text-xl font-bold leading-snug text-white">{step.title}</h3>
                                        <p className="mt-4 text-sm leading-7 text-slate-300/78">{step.desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Flows + Security */}
            <section className="border-t border-white/5 bg-[#020617] py-24">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,#020916_0%,#010613_100%)] shadow-[0_40px_90px_rgba(0,0,0,0.35)]">
                        <div className="grid gap-6 px-6 py-8 md:px-8 lg:grid-cols-2 lg:px-10 lg:py-10">
                            {flowCards.map((card, i) => (
                                <motion.article
                                    key={card.title}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.12 }}
                                    className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,21,43,0.95)_0%,rgba(7,16,31,0.98)_100%)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.28)] md:p-7"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border ${card.iconWrapClass}`}>
                                            <card.icon className={`h-5 w-5 ${card.iconClass}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-xl font-bold leading-snug text-white md:text-[1.65rem]">{card.title}</h3>
                                            <p className={`mt-1 text-xs font-bold uppercase tracking-[0.18em] ${card.labelClass}`}>{card.label}</p>
                                        </div>
                                    </div>

                                    <p className="mt-6 text-[15px] leading-7 text-slate-300/82">
                                        {card.intro}
                                    </p>

                                    <ul className="mt-6 space-y-3.5 text-left">
                                        {card.steps.map((step) => (
                                            <li key={step} className="flex items-start gap-3 text-[14px] leading-6 text-slate-200/92">
                                                <CheckCircle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${card.checkClass}`} />
                                                <span>{step}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-6 border-t border-white/10 pt-5">
                                        <h4 className={`text-sm font-semibold ${card.benefitClass}`}>{card.benefitsTitle}</h4>
                                        <ul className="mt-4 grid gap-x-10 gap-y-2 text-sm text-slate-300/84 md:grid-cols-2">
                                            {card.benefits.map((benefit) => (
                                                <li key={benefit} className="flex gap-2 leading-6">
                                                    <span className="text-slate-500">-</span>
                                                    <span>{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.article>
                            ))}
                        </div>

                        <div className="border-t border-white/6"></div>

                        <div className="px-6 py-12 md:px-8 lg:px-10">
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="mx-auto max-w-4xl rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,17,39,0.92)_0%,rgba(2,10,25,0.96)_100%)] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.28)] md:p-10"
                            >
                                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-emerald-400/25 bg-[#082820] shadow-[0_14px_30px_rgba(8,40,32,0.28)]">
                                        <Shield className="h-7 w-7 text-emerald-300" />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-bold text-white md:text-4xl">{t('landing.security.title')}</h3>
                                        <ul className="space-y-3 text-[15px] leading-7 text-slate-200/88">
                                            {securityPoints.map((point) => (
                                                <li key={point} className="flex gap-2">
                                                    <span className="text-slate-500">-</span>
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-[#0B1120] border-t border-white/5">
                <div className="container mx-auto px-4 md:px-8">
                    <h2 className="text-3xl font-bold text-center text-white mb-16">{t('landing.testimonials.title')}</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                            >
                                <SpotlightCard className="h-full">
                                    <div className="p-8 h-full flex flex-col justify-between">
                                        <div>
                                            <div className="flex gap-1 text-yellow-400 mb-4">
                                                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="h-4 w-4 fill-current" />)}
                                            </div>
                                            <p className="text-gray-300 mb-6 italic text-lg leading-relaxed">"{t.text}"</p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-4 border-t border-white/10 pt-4">
                                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                                {t.author.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{t.author}</p>
                                                <p className="text-xs text-gray-500">{t.role}, {t.company}</p>
                                            </div>
                                        </div>
                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-24 bg-[#0B1120] overflow-hidden relative border-t border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
                <div className="container mx-auto px-4 md:px-8 relative">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="md:w-1/2 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <div className="inline-flex items-center gap-2 text-teal-400 font-semibold tracking-wide uppercase text-sm mb-4">
                                    <TrendingUp className="h-4 w-4" /> {t('landing.market.insights')}
                                </div>
                                <h2 className="text-4xl font-bold text-white mb-4">
                                    {t('landing.market.title')}
                                </h2>
                                <p className="text-lg text-gray-400 leading-relaxed mb-6">
                                    {t('landing.market.desc')}
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <SpotlightCard>
                                        <div className="p-6">
                                            <div className="text-3xl font-bold text-white">+24%</div>
                                            <div className="text-sm text-gray-400">{t('landing.market.volume')}</div>
                                        </div>
                                    </SpotlightCard>
                                    <SpotlightCard>
                                        <div className="p-6">
                                            <div className="text-3xl font-bold text-white">-15%</div>
                                            <div className="text-sm text-gray-400">{t('landing.market.cost')}</div>
                                        </div>
                                    </SpotlightCard>
                                </div>
                            </motion.div>
                        </div>

                        <div className="md:w-1/2 w-full h-[400px] bg-[#111827] p-6 rounded-2xl shadow-xl border border-white/10 ring-1 ring-white/5">
                            <h3 className="font-semibold text-white mb-6">{t('landing.market.chartTitle')}</h3>
                            <ResponsiveContainer width="100%" height="85%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorTenders" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #374151', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="tenders"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorTenders)"
                                        name="Active Tenders"
                                        animationDuration={2000}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="successRate"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorSuccess)"
                                        name="Success Rate %"
                                        animationDuration={2500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-24 relative overflow-hidden bg-[#071019] border-t border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(95,157,55,0.28),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(235,118,27,0.22),transparent_34%),linear-gradient(135deg,#08111b_0%,#112016_48%,#2a2414_100%)]"></div>
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity }}
                    className="absolute top-0 left-0 w-96 h-96 bg-[#5f9d37]/20 rounded-full mix-blend-screen filter blur-3xl transform -translate-x-1/2 -translate-y-1/2"
                ></motion.div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#eb761b]/20 rounded-full mix-blend-screen filter blur-3xl transform translate-x-1/2 translate-y-1/2"></div>

                <div className="container mx-auto px-4 text-center relative z-10 text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/5 px-6 py-12 shadow-[0_30px_80px_rgba(4,10,22,0.45)] backdrop-blur-xl md:px-12 md:py-16"
                    >
                        <div className="mb-5 inline-flex items-center rounded-full border border-[#f2c661]/30 bg-[#f2c661]/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#fff0c1]">
                            {t('landing.nav.getStarted')}
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold mb-6">{t('landing.finalCta.title')}</h2>
                        <p className="text-[#fdf2d0] text-lg mb-6 max-w-2xl mx-auto">{t('landing.finalCta.subtitleAdmins')}</p>
                        <p className="text-[#f8e9bd] text-lg mb-10 max-w-2xl mx-auto">{t('landing.finalCta.subtitleContractors')}</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register">
                                <Button size="lg" className={`group relative h-16 px-10 text-lg rounded-full font-bold hover:scale-105 transition-all overflow-hidden ${brandButtonClass}`}>
                                    <span className="relative z-10">{t('landing.finalCta.btnClient')}</span>
                                    <div className="absolute inset-0 w-full h-full bg-white/10 scale-0 rounded-full transition-transform duration-300 group-hover:scale-150 origin-center"></div>
                                </Button>
                            </Link>
                            <Link to="/register">
                                <Button size="lg" variant="outline" className={`h-16 px-10 text-lg rounded-full border-2 ${brandOutlineClass}`}>
                                    {t('landing.finalCta.btnContractor')}
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative overflow-hidden border-t border-[#dcc9a8] bg-[#F7EFDE] py-16 text-[#4d463d]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(95,157,55,0.09),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(235,118,27,0.1),transparent_26%)]"></div>
                <div className="container relative mx-auto px-4 md:px-8">
                    <div className="grid gap-10 md:grid-cols-[1.1fr_0.85fr_0.85fr_0.85fr] md:gap-12 lg:gap-20">
                        <div className="space-y-6">
                            <div className="inline-flex px-2 py-2">
                                <img
                                    src={headerLogo}
                                    alt="Appalto Smart"
                                    className="h-10 w-auto max-w-[200px] md:h-11 md:max-w-[230px]"
                                />
                            </div>
                            <p className="max-w-xs text-[15px] leading-8 text-[#5f564a]">
                                {t('landing.footer.desc')}
                            </p>
                        </div>

                        {footerColumns.map((column) => (
                            <div key={column.title}>
                                <h4 className="text-[1.05rem] font-semibold text-[#1f2937]">
                                    {column.title}
                                </h4>
                                <ul className="mt-5 space-y-3.5">
                                    {column.items.map((item) => (
                                        <li key={item.label}>
                                            <Link
                                                to={item.to}
                                                className="text-[15px] text-[#6b6256] transition-colors hover:text-[#cf7c22]"
                                            >
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
};
export default LandingPage;
