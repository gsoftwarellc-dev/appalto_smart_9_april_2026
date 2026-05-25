import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, ChevronDown, ChevronUp, Coins, Trophy,
    FileText, Users, ArrowRight, Building, UserCheck,
    ClipboardList, Eye, Award, CreditCard, Zap, Shield,
    HelpCircle, Star, AlertCircle, Menu, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import headerLogo from '../../logo_transparacny.png';

const brandGradient = 'bg-gradient-to-r from-[#5f9d37] via-[#b6a330] to-[#eb761b]';
const brandText = 'text-transparent bg-clip-text bg-gradient-to-r from-[#8fd15a] via-[#f1cd58] to-[#ef8c28]';
const brandButtonClass = 'bg-gradient-to-r from-[#5f9d37] via-[#b6a330] to-[#eb761b] text-white shadow-[0_12px_35px_rgba(235,118,27,0.24)] hover:shadow-[0_18px_45px_rgba(95,157,55,0.28)]';
const brandHeaderOutlineClass = 'border border-[#c5a252]/45 bg-white/70 text-[#213144] hover:border-[#eb761b]/45 hover:bg-white hover:text-[#111827] shadow-[0_10px_24px_rgba(129,102,33,0.12)]';

// ─── Step Badge ───────────────────────────────────────────────────────────────
const StepBadge = ({ number }) => (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${brandGradient} text-white font-bold text-sm shadow-lg`}>
        {number}
    </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ eyebrow, title, subtitle }) => (
    <div className="mb-12 text-center">
        {eyebrow && (
            <span className="mb-3 inline-block rounded-full border border-[#f2c661]/30 bg-[#f2c661]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#f2c661]">
                {eyebrow}
            </span>
        )}
        <h2 className="text-3xl font-extrabold text-white md:text-4xl">{title}</h2>
        {subtitle && <p className="mt-3 text-base text-slate-400 max-w-2xl mx-auto">{subtitle}</p>}
    </div>
);

// ─── FAQ Item ────────────────────────────────────────────────────────────────
const FaqItem = ({ question, answer }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-white/10 rounded-2xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-white hover:bg-white/5 transition-colors"
            >
                <span className="font-semibold text-base">{question}</span>
                <span className="shrink-0 text-[#f2c661]">
                    {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div className="px-6 pb-5 text-slate-400 text-sm leading-relaxed border-t border-white/10 pt-4">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Credit Tier Card ─────────────────────────────────────────────────────────
const TierCard = ({ range, credits, example, highlight }) => (
    <div className={`relative rounded-2xl border p-6 ${highlight ? 'border-[#f2c661]/50 bg-[#f2c661]/5' : 'border-white/10 bg-white/3'}`}>
        {highlight && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#f2c661] to-[#eb761b] px-3 py-0.5 text-xs font-bold text-[#07173a]">
                Più comune
            </span>
        )}
        <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2c661]/15">
                <Coins size={18} className="text-[#f2c661]" />
            </div>
            <span className="text-white font-bold text-lg">{credits} crediti</span>
        </div>
        <p className="text-slate-300 text-sm font-medium">{range}</p>
        <p className="mt-1 text-slate-500 text-xs">{example}</p>
    </div>
);

// ─── Flow Step ────────────────────────────────────────────────────────────────
const FlowStep = ({ number, icon: Icon, title, desc, last }) => (
    <div className="flex gap-4">
        <div className="flex flex-col items-center">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${brandGradient} text-white font-bold text-sm shadow-lg`}>
                {number}
            </div>
            {!last && <div className="mt-2 flex-1 w-px bg-gradient-to-b from-[#f2c661]/40 to-transparent" style={{ minHeight: 32 }} />}
        </div>
        <div className="pb-8">
            <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className="text-[#f2c661]" />
                <span className="text-white font-semibold text-sm">{title}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
        </div>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HowItWorksPage() {
    const { t, i18n } = useTranslation();
    const isIT = i18n.language?.startsWith('it');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const copy = {
        nav: {
            back: isIT ? 'Torna alla home' : 'Back to home',
            login: isIT ? 'Accedi' : 'Sign In',
            register: isIT ? 'Registrati' : 'Register',
        },
        hero: {
            eyebrow: isIT ? 'Come funziona' : 'How it works',
            title: isIT ? 'Tutto quello che devi sapere prima di iniziare' : 'Everything you need to know before you start',
            subtitle: isIT
                ? 'Appalto Smart è una piattaforma digitale per la gestione trasparente degli appalti edili. Ecco il funzionamento passo dopo passo, i costi reali e le risposte alle domande più frequenti.'
                : 'Appalto Smart is a digital platform for transparent management of construction tenders. Here is how it works step by step, the real costs, and answers to the most common questions.',
        },
        overview: {
            eyebrow: isIT ? 'La piattaforma' : 'The platform',
            title: isIT ? 'Due percorsi, un unico metodo' : 'Two paths, one single method',
            subtitle: isIT
                ? 'Appalto Smart distingue il percorso del Committente (gratuito) da quello dell\'Impresa Appaltatrice (a crediti).'
                : 'Appalto Smart separates the Client journey (free) from the Contractor journey (credit-based).',
            clientTitle: isIT ? 'Committente' : 'Client',
            clientSub: isIT ? 'Amministratore o Tecnico Delegato' : 'Building Manager or Delegated Technician',
            clientFree: isIT ? 'Servizio completamente gratuito' : 'Completely free service',
            contractorTitle: isIT ? 'Impresa Appaltatrice' : 'Contractor',
            contractorSub: isIT ? 'Impresa edile o artigiana' : 'Construction or trade company',
            contractorPaid: isIT ? 'A crediti + commissione su aggiudicazione' : 'Credit-based + commission on award',
        },
        clientFlow: {
            eyebrow: isIT ? 'Flusso Committente' : 'Client flow',
            title: isIT ? 'Come funziona per il Committente' : 'How it works for the Client',
            subtitle: isIT ? 'Gratuito. Strutturato. Completamente tracciato.' : 'Free. Structured. Fully tracked.',
            steps: isIT ? [
                { icon: FileText, title: 'Crea l\'appalto', desc: 'Inserisci titolo, descrizione, fascia economica stimata e carica il computo metrico redatto dal professionista.' },
                { icon: Users, title: 'Le imprese fanno le offerte', desc: 'Per 15 giorni le imprese partecipano compilando lo stesso computo. Le offerte restano riservate fino alla scadenza — nessuna visibilità anticipata.' },
                { icon: Eye, title: 'Visualizza tutte le offerte insieme', desc: 'Alla scadenza vedi tutte le offerte simultaneamente e puoi scaricare i preventivi per condividerli in assemblea o con il cliente.' },
                { icon: Award, title: 'Aggiudica e formalizza', desc: 'Se sei Amministratore di Condominio, carichi il verbale di assemblea. Se sei Tecnico Delegato, carichi il preventivo firmato per accettazione dal cliente.' },
            ] : [
                { icon: FileText, title: 'Create the tender', desc: 'Enter title, description, estimated budget range and upload the professional BOQ.' },
                { icon: Users, title: 'Contractors submit bids', desc: 'For 15 days contractors participate by filling in the same BOQ. Bids remain private until the deadline — no early visibility.' },
                { icon: Eye, title: 'See all offers at once', desc: 'At the deadline you see all bids simultaneously and can download quotes to share with the client or in the assembly.' },
                { icon: Award, title: 'Award and formalise', desc: 'If you are a Building Manager, upload the assembly minutes. If you are a Delegated Technician, upload the quote signed and accepted by the client.' },
            ],
            benefits: isIT ? [
                'Nessuna ricerca manuale delle imprese',
                'Offerte comparabili voce per voce',
                'Processo tracciato in ogni fase',
                'Gestione completa dal proprio studio',
                'Servizio gratuito per Amministratori e Tecnici',
            ] : [
                'No manual search for contractors',
                'Like-for-like comparison of offers item by item',
                'Process tracked at every stage',
                'Full management from your office',
                'Free service for Building Managers and Technicians',
            ],
        },
        contractorFlow: {
            eyebrow: isIT ? 'Flusso Impresa' : 'Contractor flow',
            title: isIT ? 'Come funziona per l\'Impresa Appaltatrice' : 'How it works for the Contractor',
            subtitle: isIT ? 'Registrazione gratuita. Paghi solo se partecipi.' : 'Free registration. You pay only if you participate.',
            steps: isIT ? [
                { icon: UserCheck, title: 'Registrazione gratuita + 10 crediti', desc: 'Crea il tuo account e compila il profilo aziendale. Nessun abbonamento richiesto. Al momento della registrazione ricevi automaticamente 10 crediti di benvenuto gratuiti.' },
                { icon: ClipboardList, title: 'Consulta le gare disponibili', desc: 'Sfoglia le gare nella tua zona con informazioni su tipologia di intervento e fascia economica — prima di spendere un credito.' },
                { icon: Coins, title: 'Sblocca la gara con i crediti', desc: 'Per accedere al computo metrico completo e partecipare, utilizzi i tuoi crediti. Il costo varia da 10 a 40 crediti in base alla fascia dell\'appalto.' },
                { icon: FileText, title: 'Compila il computo e invia l\'offerta', desc: 'Inserisci i prezzi unitari sul computo metrico online e carica il tuo preventivo firmato. Puoi usare la funzione AI Scan per estrarre automaticamente le voci dal PDF del computo.' },
                { icon: Trophy, title: 'In caso di aggiudicazione', desc: 'Se vieni selezionato, si attiva la commissione del 3% sul valore del contratto. Solo dopo il pagamento viene regolarizzato l\'appalto e rilasciato il Nulla Osta alla firma del contratto.' },
            ] : [
                { icon: UserCheck, title: 'Free registration + 10 credits', desc: 'Create your account and fill in your company profile. No subscription required. Upon registration you automatically receive 10 free welcome credits.' },
                { icon: ClipboardList, title: 'Browse available tenders', desc: 'Browse tenders in your area with information on type of works and budget range — before spending a single credit.' },
                { icon: Coins, title: 'Unlock the tender with credits', desc: 'To access the full BOQ and participate, you use your credits. The cost ranges from 10 to 40 credits depending on the tender\'s budget range.' },
                { icon: FileText, title: 'Fill in the BOQ and submit your bid', desc: 'Enter unit prices on the online BOQ and upload your signed quote. Use the AI Scan feature to automatically extract line items from your BOQ PDF.' },
                { icon: Trophy, title: 'If you are awarded', desc: 'If you are selected, a 3% commission on the contract value is activated. Only after payment is the award regularised and the clearance for signing the contract issued.' },
            ],
            benefits: isIT ? [
                'Accesso a nuove opportunità di lavoro',
                'Lavori sempre su documentazione tecnica chiara',
                'Nessun abbonamento obbligatorio',
                'Paghi solo se partecipi alla gara',
                'Maggiore visibilità presso amministratori e tecnici',
            ] : [
                'Access to new work opportunities',
                'Always work with clear technical documentation',
                'No mandatory subscription',
                'You pay only if you participate in a tender',
                'Greater visibility with building managers and technicians',
            ],
        },
        credits: {
            eyebrow: isIT ? 'Crediti & Costi' : 'Credits & Costs',
            title: isIT ? 'Quanto costa partecipare?' : 'How much does it cost to participate?',
            subtitle: isIT
                ? '1 euro = 1 credito. Acquisti i crediti una volta e li usi per sbloccare le gare che ti interessano. Al momento della registrazione ricevi 10 crediti di benvenuto gratuiti.'
                : '1 euro = 1 credit. Buy credits once and use them to unlock the tenders you are interested in. On registration you receive 10 free welcome credits.',
            tiers: isIT ? [
                { range: 'Fino a €50.000', credits: 10, example: 'es. piccoli lavori di manutenzione' },
                { range: '€50.000 – €100.000', credits: 15, example: 'es. ristrutturazioni di piccolo taglio', highlight: true },
                { range: '€100.000 – €250.000', credits: 25, example: 'es. ristrutturazioni condominiali' },
                { range: 'Oltre €250.000', credits: 40, example: 'es. grandi interventi strutturali' },
            ] : [
                { range: 'Up to €50,000', credits: 10, example: 'e.g. small maintenance works' },
                { range: '€50,000 – €100,000', credits: 15, example: 'e.g. small-scale renovations', highlight: true },
                { range: '€100,000 – €250,000', credits: 25, example: 'e.g. condominium renovations' },
                { range: 'Over €250,000', credits: 40, example: 'e.g. major structural works' },
            ],
            packagesTitle: isIT ? 'Pacchetti crediti disponibili' : 'Available credit packages',
            packages: isIT ? [
                { name: 'Basic', price: '€ 50', credits: 50, desc: 'Ideale per iniziare' },
                { name: 'Pro', price: '€ 120', credits: 120, desc: 'Il più scelto' },
                { name: 'Enterprise', price: '€ 300', credits: 300, desc: 'Per imprese attive' },
            ] : [
                { name: 'Basic', price: '€ 50', credits: 50, desc: 'Ideal to get started' },
                { name: 'Pro', price: '€ 120', credits: 120, desc: 'Most popular' },
                { name: 'Enterprise', price: '€ 300', credits: 300, desc: 'For active contractors' },
            ],
            commissionTitle: isIT ? 'Commissione di aggiudicazione' : 'Award commission',
            commissionDesc: isIT
                ? 'Solo se vieni aggiudicato, la piattaforma applica una commissione del 3% sul valore del contratto. Questa commissione attiva il Nulla Osta ufficiale alla firma del contratto. Se non vinci, non paghi nulla oltre ai crediti usati per partecipare.'
                : 'Only if you are awarded, the platform applies a 3% commission on the contract value. This commission activates the official clearance to sign the contract. If you do not win, you pay nothing beyond the credits used to participate.',
            exampleTitle: isIT ? 'Esempio concreto' : 'Concrete example',
            exampleRows: isIT ? [
                { label: 'Valore appalto', value: '€ 80.000' },
                { label: 'Crediti usati per sbloccare', value: '15 crediti (€ 15)' },
                { label: 'Commissione aggiudicazione (3%)', value: '€ 2.400' },
                { label: 'Costo totale se aggiudicato', value: '€ 2.415', bold: true },
                { label: 'Costo se non aggiudicato', value: '€ 15', note: true },
            ] : [
                { label: 'Contract value', value: '€ 80,000' },
                { label: 'Credits used to unlock', value: '15 credits (€ 15)' },
                { label: 'Award commission (3%)', value: '€ 2,400' },
                { label: 'Total cost if awarded', value: '€ 2,415', bold: true },
                { label: 'Cost if not awarded', value: '€ 15', note: true },
            ],
            notice: isIT
                ? 'I crediti acquistati non sono rimborsabili dopo l\'utilizzo. La commissione di aggiudicazione si attiva solo in caso di effettiva aggiudicazione del contratto.'
                : 'Purchased credits are non-refundable after use. The award commission is only activated upon actual contract award.',
        },
        faq: {
            eyebrow: 'FAQ',
            title: isIT ? 'Domande frequenti' : 'Frequently asked questions',
            items: isIT ? [
                {
                    q: 'La registrazione è gratuita?',
                    a: 'Sì, la registrazione è completamente gratuita sia per i Committenti che per le Imprese. I Committenti non pagano nulla per l\'intero utilizzo della piattaforma. Le Imprese pagano solo i crediti per sbloccare le gare a cui intendono partecipare.',
                },
                {
                    q: 'Come si acquistano i crediti?',
                    a: 'Dalla sezione "Fatturazione" della tua dashboard. Puoi scegliere tra tre pacchetti: Basic (50 crediti a €50), Pro (120 crediti a €120) ed Enterprise (300 crediti a €300). Pagamento sicuro tramite Stripe (carta di credito/debito). 1 euro = 1 credito. I crediti non hanno scadenza. Alla registrazione ricevi automaticamente 10 crediti di benvenuto gratuiti.',
                },
                {
                    q: 'Cosa succede se non vinco la gara?',
                    a: 'I crediti usati per sbloccare la gara non vengono rimborsati — sono il costo di accesso alla documentazione completa. Non è dovuta nessuna commissione aggiuntiva. Paghi solo i crediti spesi, nient\'altro.',
                },
                {
                    q: 'Quando si paga la commissione del 3%?',
                    a: 'La commissione del 3% si attiva solo se sei aggiudicato (cioè se il Committente ti seleziona come impresa vincitrice). Viene calcolata sull\'importo del contratto aggiudicato. Solo dopo il pagamento la piattaforma rilascia il Nulla Osta ufficiale che permette la firma del contratto.',
                },
                {
                    q: 'Cos\'è il Nulla Osta alla firma?',
                    a: 'È il documento ufficiale rilasciato da Appalto Smart che certifica che tutte le condizioni della piattaforma sono state soddisfatte (compresa la commissione). È necessario per procedere alla firma formale del contratto tra Committente e Impresa.',
                },
                {
                    q: 'Cos\'è il verbale di assemblea / accettazione cliente?',
                    a: 'È il documento caricato dal Committente per formalizzare l\'aggiudicazione. Se il Committente è un Amministratore di Condominio, carica il verbale dell\'assemblea condominiale che autorizza i lavori. Se è un Tecnico Delegato, carica il preventivo firmato per accettazione dal cliente privato.',
                },
                {
                    q: 'Le offerte sono visibili prima della scadenza?',
                    a: 'No. Le offerte rimangono completamente riservate fino alla scadenza della gara (15 giorni). Al momento della scadenza tutti i preventivi vengono resi visibili al Committente simultaneamente, garantendo piena parità tra le imprese partecipanti.',
                },
                {
                    q: 'Posso partecipare a più gare contemporaneamente?',
                    a: 'Sì, puoi partecipare a tutte le gare che vuoi. Ogni gara richiede i propri crediti di sblocco. Non ci sono limiti al numero di gare a cui puoi partecipare.',
                },
                {
                    q: 'Cos\'è la funzione AI Scan?',
                    a: 'AI Scan è uno strumento disponibile nella dashboard delle Imprese che analizza automaticamente il PDF del computo metrico e ne estrae le voci (descrizione, unità di misura, quantità). Permette di compilare l\'offerta in modo rapido senza dover inserire manualmente ogni riga.',
                },
                {
                    q: 'Ricevo crediti gratis alla registrazione?',
                    a: 'Sì. Ogni nuova Impresa Appaltatrice riceve automaticamente 10 crediti di benvenuto al momento della registrazione. Questi crediti possono essere usati subito per sbloccare e partecipare alle gare disponibili, senza acquistare nulla.',
                },
            ] : [
                {
                    q: 'Is registration free?',
                    a: 'Yes, registration is completely free for both Clients and Contractors. Clients pay nothing for the entire use of the platform. Contractors pay only the credits to unlock the tenders they want to participate in.',
                },
                {
                    q: 'How do I buy credits?',
                    a: 'From the "Billing" section of your dashboard. Choose from three packages: Basic (50 credits at €50), Pro (120 credits at €120), or Enterprise (300 credits at €300). Secure payment via Stripe (credit/debit card). 1 euro = 1 credit. Credits have no expiry date. Upon registration you automatically receive 10 free welcome credits.',
                },
                {
                    q: 'What happens if I do not win the tender?',
                    a: 'Credits used to unlock the tender are non-refundable — they are the access cost for the full documentation. No additional commission is due. You pay only the credits spent, nothing else.',
                },
                {
                    q: 'When is the 3% commission paid?',
                    a: 'The 3% commission is only activated if you are awarded (i.e. if the Client selects you as the winning contractor). It is calculated on the awarded contract value. Only after payment does the platform issue the official clearance that allows the contract to be signed.',
                },
                {
                    q: 'What is the clearance for signing (Nulla Osta)?',
                    a: 'It is the official document issued by Appalto Smart certifying that all platform conditions have been met (including the commission). It is required to proceed to the formal signing of the contract between Client and Contractor.',
                },
                {
                    q: 'What are the assembly minutes / client acceptance?',
                    a: 'It is the document uploaded by the Client to formalise the award. If the Client is a Building Manager, they upload the condominium assembly minutes authorising the works. If they are a Delegated Technician, they upload the quote signed and accepted by the private client.',
                },
                {
                    q: 'Are bids visible before the deadline?',
                    a: 'No. Bids remain completely private until the tender deadline (15 days). At the deadline all quotes are revealed to the Client simultaneously, ensuring full equality among participating contractors.',
                },
                {
                    q: 'Can I participate in multiple tenders at the same time?',
                    a: 'Yes, you can participate in as many tenders as you want. Each tender requires its own unlock credits. There are no limits on the number of tenders you can participate in.',
                },
                {
                    q: 'What is the AI Scan feature?',
                    a: 'AI Scan is a tool available in the Contractor dashboard that automatically analyses a BOQ PDF and extracts its line items (description, unit of measure, quantity). It lets you fill in your bid quickly without manually entering every row.',
                },
                {
                    q: 'Do I get free credits on registration?',
                    a: 'Yes. Every new Contractor automatically receives 10 welcome credits upon registration. These credits can be used immediately to unlock and participate in available tenders, with no purchase required.',
                },
            ],
        },
        cta: {
            title: isIT ? 'Pronto a iniziare?' : 'Ready to start?',
            subtitle: isIT ? 'Registrazione gratuita. Nessuna carta richiesta.' : 'Free registration. No card required.',
            contractor: isIT ? 'Registrati come Impresa' : 'Register as Contractor',
            client: isIT ? 'Pubblica un appalto' : 'Publish a tender',
        },
    };

    return (
        <div className="w-full min-h-screen bg-[#07173a] text-white overflow-x-hidden">

            {/* ── Navbar — identical to LandingPage ── */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed top-0 w-full z-50 border-b border-[#dcc589]/55 bg-[linear-gradient(90deg,rgba(254,249,239,0.95)_0%,rgba(248,238,214,0.93)_48%,rgba(255,248,235,0.94)_100%)] shadow-[0_18px_45px_rgba(12,18,32,0.18)] backdrop-blur-xl"
            >
                <div className="container mx-auto flex min-h-[92px] items-center justify-between px-4 py-3 md:px-8">
                    <Link to="/" className="flex items-center px-2 py-2">
                        <img
                            src={headerLogo}
                            alt="Appalto Smart"
                            className="h-10 w-auto max-w-[235px] md:h-12 md:max-w-[340px] lg:h-14 lg:max-w-[420px]"
                        />
                    </Link>
                    <div className="hidden md:flex items-center gap-3">
                        <Link to="/">
                            <Button variant="outline" className={`h-11 rounded-full px-5 font-semibold ${brandHeaderOutlineClass}`}>
                                {isIT ? 'Home' : 'Home'}
                            </Button>
                        </Link>
                        <LanguageSwitcher />
                        <Link to="/login">
                            <Button variant="outline" className={`h-11 rounded-full px-5 font-semibold ${brandHeaderOutlineClass}`}>
                                {t('landing.nav.signIn')}
                            </Button>
                        </Link>
                        <Link to="/register">
                            <Button className={`relative overflow-hidden px-6 py-2 rounded-full font-semibold transition-all group ${brandButtonClass}`}>
                                <span className="relative z-10">{t('landing.nav.getStarted')}</span>
                                <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.32)_50%,transparent_80%)] -translate-x-full transition-transform duration-700 group-hover:translate-x-full" />
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
                                <Link to="/" className="w-full">
                                    <Button variant="outline" className={`w-full justify-center rounded-full ${brandHeaderOutlineClass}`}>Home</Button>
                                </Link>
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

            {/* ── Hero ── */}
            <section className="relative overflow-hidden px-6 pb-24 pt-40 text-center">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(95,157,55,0.18),transparent)]" />
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative mx-auto max-w-3xl"
                >
                    <span className="mb-4 inline-block rounded-full border border-[#f2c661]/30 bg-[#f2c661]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#f2c661]">
                        {copy.hero.eyebrow}
                    </span>
                    <h1 className="text-4xl font-extrabold leading-tight text-white md:text-5xl">
                        {copy.hero.title}
                    </h1>
                    <p className="mt-5 text-lg text-slate-400 leading-relaxed">
                        {copy.hero.subtitle}
                    </p>
                    {/* Quick jump links */}
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        {[
                            { label: isIT ? 'Flusso Committente' : 'Client flow', href: '#client' },
                            { label: isIT ? 'Flusso Impresa' : 'Contractor flow', href: '#contractor' },
                            { label: isIT ? 'Crediti & Costi' : 'Credits & Costs', href: '#credits' },
                            { label: 'FAQ', href: '#faq' },
                        ].map(({ label, href }) => (
                            <a
                                key={href}
                                href={href}
                                className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-slate-300 transition hover:border-[#f2c661]/40 hover:text-white"
                            >
                                {label}
                            </a>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── Overview cards ── */}
            <section className="px-6 pb-20">
                <div className="mx-auto max-w-4xl">
                    <SectionHeader
                        eyebrow={copy.overview.eyebrow}
                        title={copy.overview.title}
                        subtitle={copy.overview.subtitle}
                    />
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Client card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="rounded-2xl border border-[#5f9d37]/40 bg-[#5f9d37]/8 p-8"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5f9d37]/20">
                                    <Building size={20} className="text-[#8fd15a]" />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-lg">{copy.overview.clientTitle}</p>
                                    <p className="text-slate-400 text-xs">{copy.overview.clientSub}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4 rounded-xl bg-[#5f9d37]/15 px-4 py-2">
                                <CheckCircle size={16} className="text-[#8fd15a]" />
                                <span className="text-[#8fd15a] font-semibold text-sm">{copy.overview.clientFree}</span>
                            </div>
                            <a href="#client" className="mt-4 flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
                                {isIT ? 'Scopri il flusso' : 'See the flow'} <ArrowRight size={14} />
                            </a>
                        </motion.div>

                        {/* Contractor card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            className="rounded-2xl border border-[#f2c661]/40 bg-[#f2c661]/5 p-8"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2c661]/15">
                                    <Zap size={20} className="text-[#f2c661]" />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-lg">{copy.overview.contractorTitle}</p>
                                    <p className="text-slate-400 text-xs">{copy.overview.contractorSub}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4 rounded-xl bg-[#f2c661]/10 px-4 py-2">
                                <Coins size={16} className="text-[#f2c661]" />
                                <span className="text-[#f2c661] font-semibold text-sm">{copy.overview.contractorPaid}</span>
                            </div>
                            <a href="#contractor" className="mt-4 flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
                                {isIT ? 'Scopri il flusso' : 'See the flow'} <ArrowRight size={14} />
                            </a>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Client Flow ── */}
            <section id="client" className="border-t border-white/8 px-6 py-20">
                <div className="mx-auto max-w-4xl">
                    <SectionHeader
                        eyebrow={copy.clientFlow.eyebrow}
                        title={copy.clientFlow.title}
                        subtitle={copy.clientFlow.subtitle}
                    />
                    <div className="grid gap-12 md:grid-cols-2">
                        <div>
                            {copy.clientFlow.steps.map((step, i) => (
                                <FlowStep
                                    key={i}
                                    number={i + 1}
                                    icon={step.icon}
                                    title={step.title}
                                    desc={step.desc}
                                    last={i === copy.clientFlow.steps.length - 1}
                                />
                            ))}
                        </div>
                        <div className="rounded-2xl border border-[#5f9d37]/30 bg-[#5f9d37]/6 p-7">
                            <p className="mb-5 font-bold text-white text-base flex items-center gap-2">
                                <Star size={16} className="text-[#8fd15a]" />
                                {isIT ? 'Vantaggi per il Committente' : 'Benefits for the Client'}
                            </p>
                            <ul className="space-y-3">
                                {copy.clientFlow.benefits.map((b, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle size={16} className="mt-0.5 shrink-0 text-[#8fd15a]" />
                                        <span className="text-slate-300 text-sm">{b}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-7 rounded-xl bg-[#5f9d37]/15 px-4 py-3 text-center">
                                <p className="text-[#8fd15a] font-bold text-xl">€ 0</p>
                                <p className="text-slate-400 text-xs mt-0.5">{isIT ? 'Costo totale per il Committente' : 'Total cost for the Client'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Contractor Flow ── */}
            <section id="contractor" className="border-t border-white/8 px-6 py-20 bg-[#04112c]">
                <div className="mx-auto max-w-4xl">
                    <SectionHeader
                        eyebrow={copy.contractorFlow.eyebrow}
                        title={copy.contractorFlow.title}
                        subtitle={copy.contractorFlow.subtitle}
                    />
                    <div className="grid gap-12 md:grid-cols-2">
                        <div>
                            {copy.contractorFlow.steps.map((step, i) => (
                                <FlowStep
                                    key={i}
                                    number={i + 1}
                                    icon={step.icon}
                                    title={step.title}
                                    desc={step.desc}
                                    last={i === copy.contractorFlow.steps.length - 1}
                                />
                            ))}
                        </div>
                        <div className="rounded-2xl border border-[#f2c661]/30 bg-[#f2c661]/5 p-7">
                            <p className="mb-5 font-bold text-white text-base flex items-center gap-2">
                                <Star size={16} className="text-[#f2c661]" />
                                {isIT ? 'Vantaggi per l\'Impresa' : 'Benefits for the Contractor'}
                            </p>
                            <ul className="space-y-3">
                                {copy.contractorFlow.benefits.map((b, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle size={16} className="mt-0.5 shrink-0 text-[#f2c661]" />
                                        <span className="text-slate-300 text-sm">{b}</span>
                                    </li>
                                ))}
                            </ul>
                            <a href="#credits" className="mt-7 flex items-center justify-center gap-2 rounded-xl border border-[#f2c661]/30 bg-[#f2c661]/10 px-4 py-3 text-[#f2c661] text-sm font-semibold hover:bg-[#f2c661]/15 transition">
                                <Coins size={15} />
                                {isIT ? 'Vedi i costi dettagliati →' : 'See detailed costs →'}
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Credits & Pricing ── */}
            <section id="credits" className="border-t border-white/8 px-6 py-20">
                <div className="mx-auto max-w-4xl">
                    <SectionHeader
                        eyebrow={copy.credits.eyebrow}
                        title={copy.credits.title}
                        subtitle={copy.credits.subtitle}
                    />

                    {/* Welcome credits notice */}
                    <div className="mb-8 flex items-center gap-3 rounded-xl border border-[#8fd15a]/30 bg-[#5f9d37]/10 px-5 py-4">
                        <CheckCircle size={18} className="shrink-0 text-[#8fd15a]" />
                        <p className="text-[#8fd15a] text-sm font-semibold">
                            {isIT ? '10 crediti di benvenuto gratuiti — disponibili subito dopo la registrazione, nessuna carta richiesta.' : '10 free welcome credits — available immediately after registration, no card required.'}
                        </p>
                    </div>

                    {/* Tier cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                        {copy.credits.tiers.map((tier, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <TierCard {...tier} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Credit packages */}
                    <div className="mb-14">
                        <p className="text-white font-bold text-base mb-4 flex items-center gap-2">
                            <CreditCard size={16} className="text-[#f2c661]" />
                            {copy.credits.packagesTitle}
                        </p>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {copy.credits.packages.map((pkg, i) => (
                                <div key={i} className={`rounded-2xl border p-5 text-center ${i === 1 ? 'border-[#f2c661]/50 bg-[#f2c661]/5' : 'border-white/10 bg-white/3'}`}>
                                    {i === 1 && (
                                        <span className="mb-2 inline-block rounded-full bg-gradient-to-r from-[#f2c661] to-[#eb761b] px-3 py-0.5 text-xs font-bold text-[#07173a]">
                                            {isIT ? 'Più scelto' : 'Most popular'}
                                        </span>
                                    )}
                                    <p className="text-white font-bold text-lg">{pkg.name}</p>
                                    <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#f2c661] to-[#eb761b] mt-1">{pkg.price}</p>
                                    <p className="text-slate-400 text-sm mt-1">{pkg.credits} {isIT ? 'crediti' : 'credits'}</p>
                                    <p className="text-slate-500 text-xs mt-2">{pkg.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Commission + Example */}
                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Commission */}
                        <div className="rounded-2xl border border-[#eb761b]/30 bg-[#eb761b]/6 p-7">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eb761b]/20">
                                    <Trophy size={18} className="text-[#eb761b]" />
                                </div>
                                <p className="font-bold text-white">{copy.credits.commissionTitle}</p>
                            </div>
                            <div className="mb-4 text-center">
                                <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#f2c661] to-[#eb761b]">3%</span>
                                <p className="text-slate-400 text-xs mt-1">{isIT ? 'sul valore del contratto aggiudicato' : 'on the awarded contract value'}</p>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">{copy.credits.commissionDesc}</p>
                        </div>

                        {/* Example */}
                        <div className="rounded-2xl border border-white/10 bg-white/3 p-7">
                            <p className="font-bold text-white mb-5 flex items-center gap-2">
                                <CreditCard size={16} className="text-[#f2c661]" />
                                {copy.credits.exampleTitle}
                            </p>
                            <div className="space-y-3">
                                {copy.credits.exampleRows.map((row, i) => (
                                    <div key={i} className={`flex items-center justify-between gap-4 ${row.bold ? 'rounded-xl bg-white/8 px-3 py-2' : ''}`}>
                                        <span className={`text-sm ${row.bold ? 'text-white font-semibold' : 'text-slate-400'}`}>{row.label}</span>
                                        <span className={`text-sm font-semibold ${row.bold ? 'text-[#f2c661]' : row.note ? 'text-[#8fd15a]' : 'text-white'}`}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Notice */}
                    <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/4 px-5 py-4">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-slate-500" />
                        <p className="text-slate-500 text-xs leading-relaxed">{copy.credits.notice}</p>
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section id="faq" className="border-t border-white/8 px-6 py-20 bg-[#04112c]">
                <div className="mx-auto max-w-3xl">
                    <SectionHeader
                        eyebrow={copy.faq.eyebrow}
                        title={copy.faq.title}
                    />
                    <div className="space-y-3">
                        {copy.faq.items.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <FaqItem question={item.q} answer={item.a} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="border-t border-white/8 px-6 py-24 text-center">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(95,157,55,0.12),transparent)]" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mx-auto max-w-xl"
                >
                    <h2 className="text-3xl font-extrabold text-white md:text-4xl">{copy.cta.title}</h2>
                    <p className="mt-3 text-slate-400">{copy.cta.subtitle}</p>
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register">
                            <Button className={`h-12 rounded-xl px-7 text-base font-semibold text-white ${brandGradient} shadow-[0_12px_35px_rgba(235,118,27,0.24)] hover:opacity-90`}>
                                {copy.cta.contractor}
                            </Button>
                        </Link>
                        <Link to="/register">
                            <Button variant="outline" className="h-12 rounded-xl border-white/20 bg-white/5 px-7 text-base font-semibold text-white hover:bg-white/10">
                                {copy.cta.client}
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-white/8 px-6 py-8 text-center">
                <p className="text-slate-600 text-xs">© {new Date().getFullYear()} Appalto Smart · <Link to="/" className="hover:text-slate-400 transition">{isIT ? 'Home' : 'Home'}</Link> · <Link to="/login" className="hover:text-slate-400 transition">{copy.nav.login}</Link></p>
            </footer>
        </div>
    );
}
