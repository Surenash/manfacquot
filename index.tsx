import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- API Client ---
const API_BASE_URL = '/api'; // Using relative URL for proxying

const getTokens = () => ({
    access: localStorage.getItem('accessToken'),
    refresh: localStorage.getItem('refreshToken'),
});

const setTokens = (access: string, refresh: string) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
};

const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};

const api = {
    async request(endpoint: string, options: RequestInit = {}) {
        const headers = new Headers(options.headers || {});
        const { access } = getTokens();
        if (access) {
            headers.set('Authorization', `Bearer ${access}`);
        }
        if (options.body && !(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
            options.body = JSON.stringify(options.body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

        if (!response.ok) {
            if (response.status === 401) {
                 // Simple logout on auth error. A real app would handle token refresh.
                clearTokens();
                window.location.href = '/login'; 
            }
            const errorData = await response.json().catch(() => ({ detail: 'An unexpected error occurred.' }));
            throw new Error(errorData.detail || `Request failed with status ${response.status}`);
        }

        if (response.status === 204) { // No Content
            return null;
        }

        return response.json();
    },

    login(credentials: object) {
        return this.request('/auth/token/', { method: 'POST', body: credentials });
    },
    
    register(userData: object) {
        return this.request('/auth/register/', { method: 'POST', body: userData });
    },

    getMe() {
        return this.request('/auth/me/');
    },

    getDesigns() {
        return this.request('/designs/');
    },

    deleteDesign(id: string) {
        return this.request(`/designs/${id}/`, { method: 'DELETE' });
    },

    getUploadUrl(fileName: string, fileType: string) {
        return this.request('/designs/upload-url/', { method: 'POST', body: { fileName, fileType } });
    },

    async uploadFileToS3(url: string, file: File) {
        const response = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
        });
        if (!response.ok) {
            throw new Error('Failed to upload file to S3.');
        }
    },

    createDesign(designData: object) {
        return this.request('/designs/', { method: 'POST', body: designData });
    },
    
    updateManufacturerProfile(profileData: object) {
        return this.request('/manufacturers/profile/', { method: 'PUT', body: profileData });
    }
};

// --- SVG Icons ---

const UploadIcon = ({ style = { width: '48px', height: '48px', color: '#2563EB' } }: {style?: React.CSSProperties}) => (
    <svg xmlns="http://www.w3.org/2000/svg" style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const QuoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '48px', height: '48px', color: '#2563EB' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const ManufactureIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '48px', height: '48px', color: '#2563EB' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px', marginRight: '8px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7h14"/></svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 5v6m4-5v6"/></svg>
);

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);

const FileIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '48px', height: '48px', color: '#374151' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const InfoIcon = ({ style }: { style?: React.CSSProperties }) => (
    <svg xmlns="http://www.w3.org/2000/svg" style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// --- Constants for Manufacturer Signup ---
const PRODUCTION_VOLUMES = ['Prototyping', 'Low Volume', 'Medium Volume', 'High Volume'];
const CERTIFICATIONS = ['ISO 9001', 'AS9100', 'IATF 16949', 'ISO 13485 (Medical)', 'RoHS Compliant'];
const MACHINING_PROCESSES = ['CNC Milling (3-axis)', 'CNC Milling (4-axis)', 'CNC Milling (5-axis)', 'CNC Turning', 'Swiss Machining', 'EDM (Electrical Discharge Machining)', 'Grinding / Lapping'];
const SHEET_METAL_PROCESSES = ['Laser Cutting', 'Waterjet Cutting', 'Plasma Cutting', 'Bending (Press Brake)', 'Punching', 'Sheet Metal Welding'];
const CASTING_PROCESSES = ['Sand Casting', 'Die Casting', 'Investment Casting', 'Gravity Casting'];
const FORGING_PROCESSES = ['Open Die Forging', 'Closed Die Forging', 'Cold Forging'];
const INJECTION_MOLDING_PROCESSES = ['Thermoplastics', 'Thermosets', 'Insert Molding / Overmolding'];
const ADDITIVE_PROCESSES = ['FDM', 'SLA', 'SLS', 'DMLS / SLM (Metal)', 'Multi Jet Fusion (MJF)'];
const WELDING_JOINING_PROCESSES = ['MIG Welding', 'TIG Welding', 'Spot Welding', 'Laser Welding', 'Brazing / Soldering', 'Riveting / Adhesives'];
const MATERIALS_METALS = ['Aluminum', 'Steel (Mild, Stainless, Tool)', 'Titanium', 'Brass', 'Copper'];
const MATERIALS_PLASTICS = ['ABS', 'Nylon', 'POM', 'Polycarbonate', 'PEEK', 'PE', 'PP', 'Acrylic (PMMA)'];
const MATERIALS_COMPOSITES = ['CFRP (Carbon Fiber)', 'GFRP (Glass Fiber)'];
const MATERIALS_OTHERS = ['Rubber', 'Silicone', 'Foam', 'Ceramics'];
const SURFACE_FINISHES = ['Sandblasting', 'Anodizing (Type I, II, III)', 'Powder Coating', 'Electroplating (Chrome, Nickel, Zinc)', 'Polishing', 'Heat Treatment'];
const POST_PROCESSING_ASSEMBLY = ['Threading / Tapping', 'Press-fitting', 'Assembly Welding', 'Fastening', 'Full Product Assembly', 'Custom Packaging'];
const FILE_FORMATS = ['STEP (.stp, .step)', 'IGES (.igs, .iges)', 'SolidWorks (.sldprt)', 'PDF (Drawings)', 'DXF'];
const INCOTERMS = ['EXW (Ex Works)', 'FOB (Free On Board)', 'DDP (Delivered Duty Paid)'];
const SPECIAL_CAPABILITIES = ['Clean Room Manufacturing', 'Aerospace Grade', 'Medical Grade', 'Supply Chain Integration', 'Custom Tooling / Mold Making', 'Rapid Prototyping', 'Lights-Out Manufacturing'];

// --- Reusable Components ---

type CtaButtonProps = {
    text: string;
    href?: string;
    onClick?: (e?: React.MouseEvent) => void;
    primary?: boolean;
    type?: 'button' | 'submit' | 'reset';
    children?: React.ReactNode;
    disabled?: boolean;
};

const CtaButton = ({ text, href = "#", onClick, primary = false, type = "button", children, disabled = false }: CtaButtonProps) => {
    const [hover, setHover] = useState(false);

    const variantStyle = primary ? styles.buttonPrimary : styles.buttonSecondary;
    const hoverStyle = primary && !disabled ? styles.buttonPrimaryHover : !disabled ? styles.buttonSecondaryHover : {};
    const disabledStyle = disabled ? styles.buttonDisabled : {};

    const style = {
        ...styles.button,
        ...variantStyle,
        ...(hover ? hoverStyle : {}),
        ...disabledStyle,
    };

    const commonProps = {
        style: style,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        disabled: disabled,
    };

    if (type === 'submit' || type === 'reset' || onClick) {
        return (
            <button type={type} onClick={onClick} {...commonProps}>
                {children}{text}
            </button>
        );
    }
    
    return (
        <a href={href} {...commonProps}>
            {children}{text}
        </a>
    );
};

// Helper component for checkbox groups
const CheckboxGroup = ({ title, options, selected, onChange }) => (
    <div style={styles.formGroup}>
        {title && <label style={styles.subLegend}>{title}</label>}
        <div style={styles.checkboxGrid}>
            {options.map(option => (
                <label key={option} style={styles.checkboxLabel}>
                    <input type="checkbox" style={styles.checkboxInput} checked={selected.includes(option)} onChange={() => onChange(option)} />
                    {option}
                </label>
            ))}
        </div>
    </div>
);

// --- Page Sections ---

type HeaderProps = {
    isAuthenticated: boolean;
    onLogout: () => void;
    onNavigate: (page: string) => void;
};

const Header = ({ isAuthenticated, onLogout, onNavigate }: HeaderProps) => (
    <header style={styles.header} role="banner">
        <div style={styles.container}>
            <div style={styles.headerContent}>
                <a href="#" style={styles.logo} onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}>GMQP</a>
                <nav style={styles.nav} role="navigation" aria-label="Main Navigation">
                    <a href="#" style={styles.navLink}>For Customers</a>
                    <a href="#" style={styles.navLink}>For Manufacturers</a>
                </nav>
                <div style={styles.headerActions}>
                    {isAuthenticated ? (
                        <>
                             <a href="#" style={styles.navLink} onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>My Dashboard</a>
                             <CtaButton text="Log Out" onClick={onLogout} />
                        </>
                    ) : (
                        <>
                            <a href="#" style={styles.navLink} onClick={(e) => { e.preventDefault(); onNavigate('login'); }}>Log In</a>
                            <CtaButton text="Get Started" primary onClick={() => onNavigate('signup')} />
                        </>
                    )}
                </div>
            </div>
        </div>
    </header>
);

const Hero = ({ onNavigate }: { onNavigate: (page: string) => void }) => (
    <section style={styles.hero}>
        <div style={styles.container}>
            <div style={styles.heroContent}>
                <h1 style={styles.heroTitle}>Instant Manufacturing Quotes. From Design to Delivery.</h1>
                <p style={styles.heroSubtitle}>Upload your CAD files and receive competitive quotes from our global network of vetted manufacturers in minutes.</p>
                <div style={styles.heroActions}>
                    <CtaButton text="Upload a Design" primary onClick={() => onNavigate('upload')} />
                    <CtaButton text="Join as a Manufacturer" onClick={() => onNavigate('signup')} />
                </div>
            </div>
        </div>
    </section>
);

const HowItWorks = () => (
    <section style={styles.howItWorks}>
        <div style={styles.container}>
            <h2 style={styles.sectionTitle}>Get Your Parts Made in 3 Simple Steps</h2>
            <div style={styles.stepsGrid}>
                <div style={styles.step}>
                    <UploadIcon />
                    <h3 style={styles.stepTitle}>1. Upload Your Design</h3>
                    <p style={styles.stepText}>Securely upload your STL, STEP, or IGES files and specify your material and quantity requirements.</p>
                </div>
                <div style={styles.step}>
                    <QuoteIcon />
                    <h3 style={styles.stepTitle}>2. Receive Instant Quotes</h3>
                    <p style={styles.stepText}>Our AI-powered engine analyzes your design and provides instant quotes from qualified manufacturers.</p>
                </div>
                <div style={styles.step}>
                    <ManufactureIcon />
                    <h3 style={styles.stepTitle}>3. Order & Manufacture</h3>
                    <p style={styles.stepText}>Accept your preferred quote to begin production. Track your order status until it's delivered.</p>
                </div>
            </div>
        </div>
    </section>
);

const Features = () => (
    <section style={styles.features}>
        <div style={styles.container}>
            <h2 style={styles.sectionTitle}>A Platform Built for Growth</h2>
            <div style={styles.featuresGrid}>
                <div style={styles.featureCard}>
                    <h3 style={styles.featureTitle}>For Customers</h3>
                    <ul style={styles.featureList}>
                        <li>Fast & Competitive Quotes</li>
                        <li>Global Network of Suppliers</li>
                        <li>Secure IP Protection</li>
                        <li>Streamlined Ordering</li>
                    </ul>
                </div>
                <div style={styles.featureCard}>
                    <h3 style={styles.featureTitle}>For Manufacturers</h3>
                     <ul style={styles.featureList}>
                        <li>Access a New Stream of Orders</li>
                        <li>Automate Your Quoting Process</li>
                        <li>Reduce Administrative Overhead</li>
                        <li>Grow Your Business</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>
);

const LandingPageContent = ({ onNavigate }: { onNavigate: (page: string) => void }) => (
    <>
        <Hero onNavigate={onNavigate} />
        <HowItWorks />
        <Features />
    </>
);

const Footer = () => (
    <footer style={styles.footer} role="contentinfo">
        <div style={styles.container}>
            <div style={styles.footerContent}>
                <div style={styles.footerLinks}>
                    <a href="#" style={styles.footerLink}>About Us</a>
                    <a href="#" style={styles.footerLink}>Contact</a>
                    <a href="#" style={styles.footerLink}>Privacy Policy</a>
                    <a href="#" style={styles.footerLink}>Terms of Service</a>
                </div>
                <p style={styles.footerCopyright}>© {new Date().getFullYear()} Global Manufacturing Quotation Platform. All rights reserved.</p>
            </div>
        </div>
    </footer>
);

type LoginPageProps = {
    onLogin: (credentials: object, role: 'customer' | 'manufacturer') => Promise<void>;
    onNavigate: (page: string) => void;
    role: 'customer' | 'manufacturer';
};


// --- Signup Components ---

const SignupRoleSelector = ({ onNavigate }: { onNavigate: (page: string) => void }) => (
    <div style={styles.loginPage}>
        <div style={styles.loginContainer}>
            <h2 style={styles.loginTitle}>Join GMQP</h2>
            <p style={styles.loginSubtitle}>Select your account type to get started.</p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px'}}>
                <CtaButton text="Sign Up as a Customer" primary onClick={() => onNavigate('signup-customer')} />
                <CtaButton text="Sign Up as a Manufacturer" onClick={() => onNavigate('signup-manufacturer')} />
            </div>
             <div style={{textAlign: 'center', marginTop: '24px'}}>
                 <p style={{color: '#4B5563', fontSize: '14px'}}>
                    Already have an account?{' '}
                    <a href="#" style={{...styles.loginLink, fontSize: '14px'}} onClick={(e) => { e.preventDefault(); onNavigate('login'); }}>
                        Log In
                    </a>
                 </p>
            </div>
        </div>
    </div>
);

const CustomerSignupPage = ({ onLogin, onNavigate }: { onLogin: (credentials: object) => Promise<void>, onNavigate: (page: string) => void }) => {
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== password2) {
            setError('Passwords do not match.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            await api.register({
                email,
                password,
                password2,
                company_name: companyName,
                role: 'customer'
            });
            await onLogin({ email, password });
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div style={styles.loginPage}>
            <div style={styles.loginContainer}>
                <h2 style={styles.loginTitle}>Create Customer Account</h2>
                <p style={styles.loginSubtitle}>Get instant quotes from top manufacturers.</p>
                <form onSubmit={handleSubmit} style={styles.loginForm}>
                    {error && <p style={styles.loginError}>{error}</p>}
                    <div style={styles.formGroup}>
                        <label htmlFor="companyName" style={styles.label}>Company Name</label>
                        <input type="text" id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={styles.input} required />
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="email" style={styles.label}>Email Address</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required autoComplete="email" />
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="password" style={styles.label}>Password</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required autoComplete="new-password" />
                    </div>
                     <div style={styles.formGroup}>
                        <label htmlFor="password2" style={styles.label}>Confirm Password</label>
                        <input type="password" id="password2" value={password2} onChange={(e) => setPassword2(e.target.value)} style={styles.input} required autoComplete="new-password" />
                    </div>
                     <CtaButton text={loading ? "Creating Account..." : "Create Account"} primary type="submit" disabled={loading} />
                </form>
                <div style={styles.loginLinks}>
                    <a href="#" style={styles.loginLink} onClick={(e) => { e.preventDefault(); onNavigate('signup'); }}>Back to role selection</a>
                </div>
            </div>
        </div>
    );
};


const ManufacturerSignupPage = ({ onLogin, onNavigate }: { onLogin: (credentials: object) => Promise<void>, onNavigate: (page: string) => void }) => {
    const [formData, setFormData] = useState({
        companyName: '', email: '', password: '', password2: '',
        location: '', website: '',
        productionVolume: '', leadTimeRange: '', certifications: [], otherCertifications: '',
        qualityControlProcesses: '', materialTesting: '', moq: '',
        machining: [], sheetMetal: [], casting: [], forging: [],
        injectionMolding: { processes: [], cavityCount: '', moldClass: '' },
        threeDPrinting: [], weldingJoining: [],
        supportedMaterials: [],
        generalTolerance: '', specificTolerances: '', gdtSupport: false,
        minSizeX: '', minSizeY: '', minSizeZ: '', maxSizeX: '', maxSizeY: '', maxSizeZ: '',
        maxWeightKg: '', thinWallCapabilityMm: '',
        surfaceFinishes: [], postProcessing: [], acceptedFileFormats: [],
        shippingMethods: '', incoterms: [],
        specialCapabilities: [],
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
             setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleInjectionMoldingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            injectionMolding: { ...prev.injectionMolding, [name]: value }
        }));
    };
    
    const handleCheckboxGroupChange = (category: keyof typeof formData | 'injectionMoldingProcesses', value: string) => {
        if (category === 'injectionMoldingProcesses') {
            setFormData(prev => {
                const list = prev.injectionMolding.processes || [];
                const newList = list.includes(value) ? list.filter(item => item !== value) : [...list, value];
                return { ...prev, injectionMolding: { ...prev.injectionMolding, processes: newList } };
            });
        } else {
             setFormData(prev => {
                const list = (prev[category] as string[]) || [];
                const newList = list.includes(value) ? list.filter(item => item !== value) : [...list, value];
                return { ...prev, [category]: newList };
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { password, password2, companyName, email, location, productionVolume, leadTimeRange, moq, supportedMaterials, machining, sheetMetal, casting, forging, injectionMolding, threeDPrinting, weldingJoining } = formData;

        if (password !== password2) { setLoading(false); return setError('Passwords do not match.'); }
        if (!companyName || !email || !password || !location || !productionVolume || !leadTimeRange || !moq) { setLoading(false); return setError('Please fill all required fields in Account, Profile, and General Capabilities.'); }
        const totalProcesses = [...machining, ...sheetMetal, ...casting, ...forging, ...injectionMolding.processes, ...threeDPrinting, ...weldingJoining].length;
        if (totalProcesses === 0) { setLoading(false); return setError('Please select at least one Manufacturing Process.'); }
        if (supportedMaterials.length === 0) { setLoading(false); return setError('Please select at least one supported Material.'); }

        try {
            // 1. Register the basic user account
            await api.register({
                email,
                password,
                password2,
                company_name: companyName,
                role: 'manufacturer'
            });

            // 2. Log in to get tokens for the next step
            const { access, refresh } = await api.login({ email, password });
            setTokens(access, refresh);

            // 3. Construct and submit the detailed manufacturer profile
            const profileData = {
                location: formData.location,
                website_url: formData.website,
                certifications: [...formData.certifications, ...formData.otherCertifications.split(',').map(s => s.trim()).filter(Boolean)],
                capabilities: {
                    cnc: formData.machining.length > 0 || formData.sheetMetal.length > 0,
                    materials_supported: formData.supportedMaterials,
                    max_size_mm: [
                        formData.maxSizeX ? Number(formData.maxSizeX) : null,
                        formData.maxSizeY ? Number(formData.maxSizeY) : null,
                        formData.maxSizeZ ? Number(formData.maxSizeZ) : null,
                    ],
                    // In a real app, more capabilities would be mapped here
                }
            };
            await api.updateManufacturerProfile(profileData);
            
            // 4. Trigger the app's main login flow to set global state
            await onLogin({ email, password });

        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const manufacturerSignupContainerStyle = { ...styles.loginContainer, maxWidth: '900px' };

    return (
        <div style={styles.loginPage}>
            <div style={manufacturerSignupContainerStyle}>
                <h2 style={styles.loginTitle}>Create Manufacturer Account</h2>
                <p style={styles.loginSubtitle}>Join our network and start receiving orders. Fields marked with * are required.</p>
                <form onSubmit={handleSubmit}>
                    {error && <p style={styles.loginError}>{error}</p>}
                    
                    <fieldset style={styles.fieldset}>
                        <legend style={styles.legend}>Account & Profile</legend>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}><label htmlFor="companyName" style={styles.label}>Company Name *</label><input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} style={styles.input} required /></div>
                            <div style={styles.formGroup}><label htmlFor="email" style={styles.label}>Email Address *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} style={styles.input} required autoComplete="email" /></div>
                        </div>
                        <div style={styles.formRow}>
                             <div style={styles.formGroup}><label htmlFor="password" style={styles.label}>Password *</label><input type="password" name="password" value={formData.password} onChange={handleInputChange} style={styles.input} required autoComplete="new-password" /></div>
                             <div style={styles.formGroup}><label htmlFor="password2" style={styles.label}>Confirm Password *</label><input type="password" name="password2" value={formData.password2} onChange={handleInputChange} style={styles.input} required autoComplete="new-password" /></div>
                        </div>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}><label htmlFor="location" style={styles.label}>Location (City, Country) *</label><input type="text" name="location" value={formData.location} onChange={handleInputChange} style={styles.input} required /></div>
                            <div style={styles.formGroup}><label htmlFor="website" style={styles.label}>Website URL</label><input type="url" name="website" value={formData.website} onChange={handleInputChange} style={styles.input} placeholder="https://yourcompany.com" /></div>
                        </div>
                    </fieldset>
                    
                    <fieldset style={styles.fieldset}>
                        <legend style={styles.legend}>1. General Capabilities *</legend>
                         <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label htmlFor="productionVolume" style={styles.label}>Production Volume Capacity *</label>
                                <select name="productionVolume" value={formData.productionVolume} onChange={handleInputChange} style={styles.input} required>
                                    <option value="">Select volume...</option>
                                    {PRODUCTION_VOLUMES.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                             <div style={styles.formGroup}><label htmlFor="leadTimeRange" style={styles.label}>Typical Lead Time Range (e.g., 5-10 days) *</label><input type="text" name="leadTimeRange" value={formData.leadTimeRange} onChange={handleInputChange} style={styles.input} required /></div>
                        </div>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}><label htmlFor="moq" style={styles.label}>Minimum Order Quantity (MOQ) *</label><input type="number" name="moq" value={formData.moq} onChange={handleInputChange} style={styles.input} required min="0"/></div>
                            <div style={styles.formGroup}><label htmlFor="otherCertifications" style={styles.label}>Other Certifications (comma-separated)</label><input type="text" name="otherCertifications" value={formData.otherCertifications} onChange={handleInputChange} style={styles.input} /></div>
                        </div>
                         <CheckboxGroup title="Certifications" options={CERTIFICATIONS} selected={formData.certifications} onChange={(v) => handleCheckboxGroupChange('certifications', v)} />
                         <div style={styles.formGroup}><label htmlFor="qualityControlProcesses" style={styles.label}>Quality Control Processes</label><textarea name="qualityControlProcesses" value={formData.qualityControlProcesses} onChange={handleInputChange} style={styles.input} rows={3}></textarea></div>
                         <div style={styles.formGroup}><label htmlFor="materialTesting" style={styles.label}>Material Testing / Inspection Equipment</label><textarea name="materialTesting" value={formData.materialTesting} onChange={handleInputChange} style={styles.input} rows={3}></textarea></div>
                    </fieldset>

                    <fieldset style={styles.fieldset}>
                        <legend style={styles.legend}>2. Manufacturing Processes Supported *</legend>
                        <p style={styles.fieldsetDescription}>Select all that apply. You must select at least one process.</p>
                        <CheckboxGroup title="Machining" options={MACHINING_PROCESSES} selected={formData.machining} onChange={(v) => handleCheckboxGroupChange('machining', v)} />
                        <CheckboxGroup title="Sheet Metal Fabrication" options={SHEET_METAL_PROCESSES} selected={formData.sheetMetal} onChange={(v) => handleCheckboxGroupChange('sheetMetal', v)} />
                        <CheckboxGroup title="Casting" options={CASTING_PROCESSES} selected={formData.casting} onChange={(v) => handleCheckboxGroupChange('casting', v)} />
                        <CheckboxGroup title="Forging" options={FORGING_PROCESSES} selected={formData.forging} onChange={(v) => handleCheckboxGroupChange('forging', v)} />
                        <div>
                             <CheckboxGroup title="Injection Molding" options={INJECTION_MOLDING_PROCESSES} selected={formData.injectionMolding.processes} onChange={(v) => handleCheckboxGroupChange('injectionMoldingProcesses', v)} />
                             <div style={styles.formRow}>
                                <div style={styles.formGroup}><label htmlFor="cavityCount" style={styles.label}>Mold Cavity Count</label><input type="text" name="cavityCount" value={formData.injectionMolding.cavityCount} onChange={handleInjectionMoldingChange} style={styles.input} /></div>
                                <div style={styles.formGroup}><label htmlFor="moldClass" style={styles.label}>Mold Class</label><input type="text" name="moldClass" value={formData.injectionMolding.moldClass} onChange={handleInjectionMoldingChange} style={styles.input} /></div>
                             </div>
                        </div>
                        <CheckboxGroup title="3D Printing (Additive)" options={ADDITIVE_PROCESSES} selected={formData.threeDPrinting} onChange={(v) => handleCheckboxGroupChange('threeDPrinting', v)} />
                        <CheckboxGroup title="Welding & Joining" options={WELDING_JOINING_PROCESSES} selected={formData.weldingJoining} onChange={(v) => handleCheckboxGroupChange('weldingJoining', v)} />
                    </fieldset>
                    
                     <fieldset style={styles.fieldset}>
                        <legend style={styles.legend}>3. Material Capabilities *</legend>
                        <p style={styles.fieldsetDescription}>You must select at least one material.</p>
                        <CheckboxGroup title="Metals" options={MATERIALS_METALS} selected={formData.supportedMaterials} onChange={(v) => handleCheckboxGroupChange('supportedMaterials', v)} />
                        <CheckboxGroup title="Plastics" options={MATERIALS_PLASTICS} selected={formData.supportedMaterials} onChange={(v) => handleCheckboxGroupChange('supportedMaterials', v)} />
                        <CheckboxGroup title="Composites" options={MATERIALS_COMPOSITES} selected={formData.supportedMaterials} onChange={(v) => handleCheckboxGroupChange('supportedMaterials', v)} />
                        <CheckboxGroup title="Others" options={MATERIALS_OTHERS} selected={formData.supportedMaterials} onChange={(v) => handleCheckboxGroupChange('supportedMaterials', v)} />
                    </fieldset>

                    <fieldset style={styles.fieldset}>
                        <legend style={styles.legend}>4. Tolerances & 5. Part Limits</legend>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}><label htmlFor="generalTolerance" style={styles.label}>General Machining Tolerances</label><input type="text" name="generalTolerance" value={formData.generalTolerance} onChange={handleInputChange} style={styles.input} placeholder="e.g., ±0.01mm"/></div>
                             <div style={styles.formGroup}><label htmlFor="specificTolerances" style={styles.label}>Specific Tolerances (Flatness, etc.)</label><input type="text" name="specificTolerances" value={formData.specificTolerances} onChange={handleInputChange} style={styles.input} /></div>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.checkboxLabel}><input type="checkbox" style={styles.checkboxInput} name="gdtSupport" checked={formData.gdtSupport} onChange={handleInputChange} /> We support Geometric Dimensioning and Tolerancing (GD&T)</label>
                        </div>
                        <hr style={styles.hr} />
                        <label style={styles.subLegend}>Part Size (mm)</label>
                        <div style={styles.sizeInputGroup}>
                            <input type="number" name="minSizeX" value={formData.minSizeX} onChange={handleInputChange} style={styles.input} placeholder="Min X" aria-label="Min build size X" />
                            <input type="number" name="minSizeY" value={formData.minSizeY} onChange={handleInputChange} style={styles.input} placeholder="Min Y" aria-label="Min build size Y" />
                            <input type="number" name="minSizeZ" value={formData.minSizeZ} onChange={handleInputChange} style={styles.input} placeholder="Min Z" aria-label="Min build size Z" />
                        </div>
                        <div style={{...styles.sizeInputGroup, marginTop: '12px'}}>
                            <input type="number" name="maxSizeX" value={formData.maxSizeX} onChange={handleInputChange} style={styles.input} placeholder="Max X" aria-label="Max build size X" />
                            <input type="number" name="maxSizeY" value={formData.maxSizeY} onChange={handleInputChange} style={styles.input} placeholder="Max Y" aria-label="Max build size Y" />
                            <input type="number" name="maxSizeZ" value={formData.maxSizeZ} onChange={handleInputChange} style={styles.input} placeholder="Max Z" aria-label="Max build size Z" />
                        </div>
                        <hr style={styles.hr} />
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}><label htmlFor="maxWeightKg" style={styles.label}>Max Part Weight (kg)</label><input type="number" name="maxWeightKg" value={formData.maxWeightKg} onChange={handleInputChange} style={styles.input} /></div>
                            <div style={styles.formGroup}><label htmlFor="thinWallCapabilityMm" style={styles.label}>Thin Wall Capability (mm)</label><input type="text" name="thinWallCapabilityMm" value={formData.thinWallCapabilityMm} onChange={handleInputChange} style={styles.input} placeholder="e.g., 0.4mm" /></div>
                        </div>
                    </fieldset>

                     <fieldset style={styles.fieldset}>
                        <legend style={styles.legend}>6. Surface Finishing & 7. Post-Processing</legend>
                        <CheckboxGroup title="Surface Finishing Options" options={SURFACE_FINISHES} selected={formData.surfaceFinishes} onChange={(v) => handleCheckboxGroupChange('surfaceFinishes', v)} />
                        <CheckboxGroup title="Post-Processing & Assembly" options={POST_PROCESSING_ASSEMBLY} selected={formData.postProcessing} onChange={(v) => handleCheckboxGroupChange('postProcessing', v)} />
                    </fieldset>

                     <fieldset style={styles.fieldset}>
                        <legend style={styles.legend}>8. File Formats & 9. Shipping</legend>
                        <CheckboxGroup title="Accepted File Formats" options={FILE_FORMATS} selected={formData.acceptedFileFormats} onChange={(v) => handleCheckboxGroupChange('acceptedFileFormats', v)} />
                        <div style={styles.formGroup}><label htmlFor="shippingMethods" style={styles.label}>Available Shipping Methods</label><textarea name="shippingMethods" value={formData.shippingMethods} onChange={handleInputChange} style={styles.input} rows={2} placeholder="e.g., FedEx, DHL, Sea Freight"></textarea></div>
                        <CheckboxGroup title="Incoterms Supported" options={INCOTERMS} selected={formData.incoterms} onChange={(v) => handleCheckboxGroupChange('incoterms', v)} />
                    </fieldset>
                    
                    <fieldset style={styles.fieldset}>
                        <legend style={styles.legend}>10. Special Capabilities (Optional)</legend>
                        <CheckboxGroup title={null} options={SPECIAL_CAPABILITIES} selected={formData.specialCapabilities} onChange={(v) => handleCheckboxGroupChange('specialCapabilities', v)} />
                    </fieldset>
                    
                    <div style={{marginTop: '24px'}}>
                         <CtaButton text={loading ? "Creating Account..." : "Create Account & Go to Dashboard"} primary type="submit" disabled={loading}/>
                    </div>
                </form>
                <div style={styles.loginLinks}>
                     <a href="#" style={styles.loginLink} onClick={(e) => { e.preventDefault(); onNavigate('signup'); }}>Back to role selection</a>
                </div>
            </div>
        </div>
    );
};

const LoginPage = ({ onLogin, onNavigate, role }: LoginPageProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isCustomer = role === 'customer';

    const title = isCustomer ? "Customer Sign In" : "Manufacturer Sign In";
    const subtitle = isCustomer
        ? "Access your account to manage your designs and orders."
        : "Access your dashboard to manage quotes and production.";

    const signupText = isCustomer ? "Don't have an account? Sign Up" : "Want to join our network? Apply here";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onLogin({ email, password }, role);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div style={styles.loginPage}>
            <div style={styles.loginContainer}>
                <h2 style={styles.loginTitle}>{title}</h2>
                <p style={styles.loginSubtitle}>{subtitle}</p>
                <form onSubmit={handleSubmit} style={styles.loginForm}>
                    {error && <p style={styles.loginError}>{error}</p>}
                    <div style={styles.formGroup}>
                        <label htmlFor="email" style={styles.label}>Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="password" style={styles.label}>Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                     <CtaButton text={loading ? "Signing In..." : "Sign In"} primary type="submit" disabled={loading}/>
                </form>
                <div style={styles.loginLinks}>
                    <a href="#" style={styles.loginLink} onClick={(e) => { e.preventDefault(); }}>Forgot password?</a>
                    <a href="#" style={styles.loginLink} onClick={(e) => { e.preventDefault(); onNavigate('signup'); }}>{signupText}</a>
                </div>
            </div>
        </div>
    );
};

const LoginRoleSelector = ({ onNavigate, reasonMessage }: { onNavigate: (page: string) => void, reasonMessage?: string }) => (
    <div style={styles.loginPage}>
        <div style={styles.loginContainer}>
            {reasonMessage && <p style={styles.loginReasonMessage}>{reasonMessage}</p>}
            <h2 style={styles.loginTitle}>Sign In</h2>
            <p style={styles.loginSubtitle}>Please select your role to continue.</p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px'}}>
                <CtaButton text="I'm a Customer" primary onClick={() => onNavigate('login-customer')} />
                <CtaButton text="I'm a Manufacturer" onClick={() => onNavigate('login-manufacturer')} />
            </div>
            <div style={{textAlign: 'center', marginTop: '24px'}}>
                 <p style={{color: '#4B5563', fontSize: '14px'}}>
                    New to GMQP?{' '}
                    <a href="#" style={{...styles.loginLink, fontSize: '14px'}} onClick={(e) => { e.preventDefault(); onNavigate('signup'); }}>
                        Create an account
                    </a>
                 </p>
                 <p style={{marginTop: '16px'}}>
                    <a href="#" style={{...styles.loginLink, color: '#4B5563', fontSize: '14px'}} onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}>
                        ← Back to Homepage
                    </a>
                </p>
            </div>
        </div>
    </div>
);

// --- Dashboard Components ---

const UploadPage = ({ onProceedToLogin, onNavigate }) => {
    const [designName, setDesignName] = useState('');
    const [material, setMaterial] = useState('ABS');
    const [quantity, setQuantity] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [fileTypeWarning, setFileTypeWarning] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const setFileAndWarning = (selectedFile: File | null) => {
        setFile(selectedFile);
        if (selectedFile) {
            const fileName = selectedFile.name.toLowerCase();
            if (fileName.endsWith('.step') || fileName.endsWith('.stp') || fileName.endsWith('.iges') || fileName.endsWith('.igs')) {
                setFileTypeWarning('Beta Support: STEP and IGES files are accepted for basic validation. Full geometric analysis for quoting is coming soon.');
            } else {
                setFileTypeWarning('');
            }
        } else {
            setFileTypeWarning('');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFileAndWarning(e.dataTransfer.files[0]);
            setError('');
            e.dataTransfer.clearData();
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileAndWarning(e.target.files[0]);
            setError('');
        }
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFileAndWarning(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }
        setLoading(true);
        setError('');

        // Pass data up to the parent App component to handle after login
        onProceedToLogin({
            file,
            designName,
            material,
            quantity,
        });
    };

    const dropzoneStyle = {
        ...styles.uploadDropzone,
        ...(isDragging ? styles.uploadDropzoneActive : {}),
    };

    return (
        <div style={styles.uploadPageContainer}>
            <div style={styles.dashboardHeader}>
                <h1 style={styles.dashboardTitle}>Upload a New Design</h1>
            </div>
            <p style={{...styles.loginSubtitle, textAlign: 'left', marginTop: '-16px', marginBottom: '32px'}}>Step 1 of 2: Specify design details and upload your CAD file.</p>
            
            <form onSubmit={handleSubmit}>
                {error && <p style={styles.loginError}>{error}</p>}
                <div style={styles.uploadLayout}>
                    <div style={styles.uploadDropzoneWrapper}>
                        <label style={styles.label}>CAD File (.stl, .step, .iges)</label>
                        <div
                            style={dropzoneStyle}
                            onDragEnter={e => e.stopPropagation()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept=".stl,.step,.iges,.stp,.igs"
                            />
                            {file ? (
                                <div style={styles.uploadFileInfo}>
                                    <FileIcon />
                                    <p style={styles.uploadFileName}>{file.name}</p>
                                    <p style={{fontSize: '12px', color: '#6B7280'}}>{(file.size / 1024).toFixed(2)} KB</p>
                                    <CtaButton 
                                        text="Clear"
                                        onClick={clearFile}
                                        type="button"
                                        primary={false} 
                                     />
                                </div>
                            ) : (
                                <>
                                    <UploadIcon />
                                    <p style={{color: '#4B5563', fontWeight: 500}}>Drag & drop file here</p>
                                    <p style={{color: '#6B7280', fontSize: '14px'}}>or click to browse</p>
                                </>
                            )}
                        </div>
                        {fileTypeWarning && (
                            <div style={styles.fileTypeWarning}>
                                <InfoIcon style={{ width: '24px', height: '24px', marginRight: '10px', color: '#31708f', flexShrink: 0 }} />
                                <span>{fileTypeWarning}</span>
                            </div>
                        )}
                    </div>
                    
                    <div style={styles.uploadFormFields}>
                         <div style={styles.formGroup}>
                            <label htmlFor="designName" style={styles.label}>Design Name *</label>
                            <input type="text" id="designName" value={designName} onChange={e => setDesignName(e.target.value)} style={styles.input} required placeholder="e.g., Main Housing Unit" />
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="material" style={styles.label}>Material *</label>
                            <select id="material" value={material} onChange={e => setMaterial(e.target.value)} style={styles.input}>
                                <option>ABS</option>
                                <option>PLA</option>
                                <option>Nylon</option>
                                <option>PETG</option>
                                <option>Aluminum</option>
                                <option>Steel</option>
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="quantity" style={styles.label}>Quantity *</label>
                            <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(Number(e.target.value))} style={styles.input} min="1" required />
                        </div>
                         <div style={styles.uploadActions}>
                            <CtaButton text="Cancel" onClick={() => onNavigate('landing')} type="button" />
                            <CtaButton text={loading ? 'Saving...' : 'Save and Continue'} primary type="submit" disabled={!file || !designName || loading} />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};


const CustomerDashboard = ({ designs, setDesigns, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDesigns = async () => {
            try {
                setLoading(true);
                setError('');
                const fetchedDesigns = await api.getDesigns();
                setDesigns(fetchedDesigns);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDesigns();
    }, [setDesigns]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this design?')) {
            try {
                await api.deleteDesign(id);
                setDesigns(prevDesigns => prevDesigns.filter(d => d.id !== id));
            } catch (err) {
                alert(`Failed to delete design: ${err.message}`);
            }
        }
    };

    const getStatusBadge = (status) => {
        const baseStyle = styles.statusBadge;
        switch (status) {
            case 'analysis_complete': return { ...baseStyle, ...styles.statusComplete };
            case 'pending_analysis': return { ...baseStyle, ...styles.statusPending };
            case 'analysis_failed': return { ...baseStyle, ...styles.statusFailed };
            default: return baseStyle;
        }
    };
    
    return (
        <div style={styles.dashboardContainer}>
            <div style={styles.dashboardHeader}>
                <h1 style={styles.dashboardTitle}>My Designs</h1>
                <CtaButton text="Upload New Design" primary onClick={() => onNavigate('upload')}>
                    <PlusIcon />
                </CtaButton>
            </div>
            {error && <p style={styles.loginError}>{error}</p>}
            {loading ? <p>Loading designs...</p> : designs.length === 0 ? (
                <div style={styles.emptyState}>
                    <UploadIcon style={{ width: '64px', height: '64px', color: '#9CA3AF' }} />
                    <h3 style={styles.emptyStateTitle}>No Designs Yet</h3>
                    <p style={styles.emptyStateText}>Get started by uploading your first design file.</p>
                    <CtaButton text="Upload a Design" primary onClick={() => onNavigate('upload')} />
                </div>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.designTable}>
                        <thead style={styles.tableHead}>
                            <tr>
                                <th style={styles.tableHeaderCell}>Design Name</th>
                                <th style={styles.tableHeaderCell}>Material</th>
                                <th style={styles.tableHeaderCell}>Quantity</th>
                                <th style={styles.tableHeaderCell}>Date Added</th>
                                <th style={styles.tableHeaderCell}>Status</th>
                                <th style={styles.tableHeaderCell}>Actions</th>
                            </tr>
                        </thead>
                        <tbody style={styles.tableBody}>
                            {designs.map(design => (
                                <tr key={design.id} style={styles.tableRow}>
                                    <td style={styles.tableCell}>{design.design_name}</td>
                                    <td style={styles.tableCell}>{design.material}</td>
                                    <td style={styles.tableCell}>{design.quantity}</td>
                                    <td style={styles.tableCell}>{new Date(design.created_at).toLocaleDateString()}</td>
                                    <td style={styles.tableCell}><span style={getStatusBadge(design.status)}>{design.status.replace(/_/g, ' ')}</span></td>
                                    <td style={{...styles.tableCell, ...styles.actionsCell}}>
                                        <button style={styles.iconButton} aria-label="View Quotes"><EyeIcon /></button>
                                        <button style={styles.iconButton} aria-label="Edit Design"><PencilIcon /></button>
                                        <button style={{...styles.iconButton, ...styles.iconButtonDanger}} aria-label="Delete Design" onClick={() => handleDelete(design.id)}><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};


const App = () => {
    const [page, setPage] = useState('landing');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState<'customer' | 'manufacturer' | null>(null);
    const [designs, setDesigns] = useState<any[]>([]);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [pendingUploadData, setPendingUploadData] = useState<any | null>(null);
    const [loginReasonMessage, setLoginReasonMessage] = useState('');


    useEffect(() => {
        const checkAuth = async () => {
            const { access } = getTokens();
            if (access) {
                try {
                    const user = await api.getMe();
                    setIsAuthenticated(true);
                    setUserRole(user.role);
                } catch (error) {
                    console.error("Auth check failed", error);
                    clearTokens();
                }
            }
            setIsAuthLoading(false);
        };
        checkAuth();
    }, []);

    const processPendingUpload = async (uploadData) => {
        try {
            const { file, designName, material, quantity } = uploadData;
            // Step 1: Get a pre-signed S3 URL from the backend
            const { uploadUrl, s3Key } = await api.getUploadUrl(file.name, file.type);
            
            // Step 2: Upload the file directly to S3
            await api.uploadFileToS3(uploadUrl, file);

            // Step 3: Create the design record in the database
            const newDesign = {
                design_name: designName,
                material,
                quantity: Number(quantity),
                s3_file_key: s3Key,
            };
            await api.createDesign(newDesign);

            setPendingUploadData(null); // Clear pending data on success
        } catch (err) {
            // In a real app, you'd show a toast or a more persistent error message
            alert(`We couldn't complete your upload after login. Please try uploading again from your dashboard. Error: ${err.message}`);
            setPendingUploadData(null); // Clear pending data on failure
        }
    };

    const handleLogin = async (credentials: object) => {
        const { access, refresh } = await api.login(credentials);
        setTokens(access, refresh);
        const user = await api.getMe();
        setIsAuthenticated(true);
        setUserRole(user.role);
        setLoginReasonMessage(''); // Clear reason message

        if (pendingUploadData) {
            await processPendingUpload(pendingUploadData);
        }
        
        setPage('dashboard');
    };

    const handleLogout = () => {
        clearTokens();
        setIsAuthenticated(false);
        setUserRole(null);
        setDesigns([]); // Clear designs on logout
        setPendingUploadData(null); // Clear any pending actions
        setLoginReasonMessage('');
        setPage('landing');
    };
    
    const handleProceedToLogin = (uploadData: any) => {
        setPendingUploadData(uploadData);
        setLoginReasonMessage('Please sign in or create an account to complete your upload.');
        setPage('login');
    };

    const renderContent = () => {
        if (isAuthLoading) {
            return <div style={{textAlign: 'center', padding: '100px'}}>Loading...</div>;
        }

        switch (page) {
            case 'landing':
                return <LandingPageContent onNavigate={setPage} />;
            case 'login':
                return <LoginRoleSelector onNavigate={setPage} reasonMessage={loginReasonMessage} />;
            case 'login-customer':
                return <LoginPage role="customer" onLogin={handleLogin} onNavigate={setPage} />;
            case 'login-manufacturer':
                return <LoginPage role="manufacturer" onLogin={handleLogin} onNavigate={setPage} />;
            case 'signup':
                return <SignupRoleSelector onNavigate={setPage} />;
            case 'signup-customer':
                return <CustomerSignupPage onLogin={handleLogin} onNavigate={setPage} />;
            case 'signup-manufacturer':
                return <ManufacturerSignupPage onLogin={handleLogin} onNavigate={setPage} />;

            case 'upload':
                return <UploadPage onProceedToLogin={handleProceedToLogin} onNavigate={setPage} />;

            case 'dashboard':
                if (!isAuthenticated) {
                    setLoginReasonMessage('You must be logged in to view your dashboard.');
                    return <LoginRoleSelector onNavigate={setPage} reasonMessage={loginReasonMessage} />;
                }
                if (userRole === 'customer') {
                    return <CustomerDashboard designs={designs} setDesigns={setDesigns} onNavigate={setPage} />;
                }
                if (userRole === 'manufacturer') {
                    const dashboardTitle = 'Manufacturer Dashboard';
                    return (
                        <div style={styles.container}>
                            <h1 style={{...styles.sectionTitle, marginTop: '64px'}}>{dashboardTitle}</h1>
                            <p style={{textAlign: 'center', fontSize: '18px', color: '#4B5563'}}>Welcome! Your profile is set up. You can now start receiving quote requests.</p>
                            <p style={{textAlign: 'center', fontSize: '16px', color: '#4B5563', marginTop: '16px'}}>Further profile management features coming soon.</p>
                        </div>
                    );
                }
                // Fallback for authenticated user with wrong role.
                return <LandingPageContent onNavigate={setPage} />;

            default:
                 return <LandingPageContent onNavigate={setPage} />;
        }
    };

    return (
        <div style={styles.app}>
            <Header
                isAuthenticated={isAuthenticated}
                onLogout={handleLogout}
                onNavigate={setPage}
            />
            <main role="main" style={styles.main}>
                {renderContent()}
            </main>
            <Footer />
        </div>
    );
};

// --- Styles ---

const styles: { [key: string]: React.CSSProperties } = {
    app: {
        backgroundColor: '#FFFFFF',
        color: '#1F2937',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
    },
    main: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    container: {
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        boxSizing: 'border-box',
    },
    // Header
    header: {
        padding: '16px 0',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
    },
    headerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1F2937',
        textDecoration: 'none',
        cursor: 'pointer',
    },
    nav: {
        display: 'flex',
        gap: '24px',
    },
    navLink: {
        color: '#4B5563',
        textDecoration: 'none',
        fontSize: '16px',
        fontWeight: 500,
        transition: 'color 0.2s',
        cursor: 'pointer',
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    // Buttons
    button: {
        padding: '10px 20px',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '16px',
        textDecoration: 'none',
        textAlign: 'center',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid transparent',
        transition: 'background-color 0.2s, color 0.2s, border-color 0.2s, opacity 0.2s',
        cursor: 'pointer',
        boxSizing: 'border-box',
    },
    buttonPrimary: {
        backgroundColor: '#2563EB',
        color: '#FFFFFF',
    },
    buttonPrimaryHover: {
        backgroundColor: '#1D4ED8',
    },
    buttonSecondary: {
        backgroundColor: '#FFFFFF',
        color: '#2563EB',
        border: '1px solid #D1D5DB',
    },
    buttonSecondaryHover: {
        backgroundColor: '#F9FAFB',
        borderColor: '#9CA3AF',
    },
    buttonDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
    },
    // Hero
    hero: {
        padding: '96px 0',
        textAlign: 'center',
    },
    heroContent: {
        maxWidth: '800px',
        margin: '0 auto',
    },
    heroTitle: {
        fontSize: '48px',
        fontWeight: 800,
        lineHeight: 1.2,
        marginBottom: '24px',
    },
    heroSubtitle: {
        fontSize: '20px',
        color: '#4B5563',
        marginBottom: '48px',
        lineHeight: 1.6,
    },
    heroActions: {
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        flexWrap: 'wrap',
    },
    // How It Works
    howItWorks: {
        padding: '96px 0',
        backgroundColor: '#F9FAFB',
    },
    sectionTitle: {
        fontSize: '36px',
        fontWeight: 700,
        textAlign: 'center',
        marginBottom: '64px',
    },
    stepsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '48px',
        textAlign: 'center',
    },
    step: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    stepTitle: {
        fontSize: '20px',
        fontWeight: 600,
        marginTop: '24px',
        marginBottom: '8px',
    },
    stepText: {
        fontSize: '16px',
        color: '#4B5563',
        lineHeight: 1.6,
        maxWidth: '320px',
    },
    // Features
    features: {
        padding: '96px 0',
    },
    featuresGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '48px',
    },
    featureCard: {
        padding: '32px',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        backgroundColor: '#FFFFFF',
    },
    featureTitle: {
        fontSize: '24px',
        fontWeight: 600,
        marginBottom: '16px',
    },
    featureList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        color: '#4B5563',
        fontSize: '16px',
        lineHeight: 1.8,
    },
     // Login & Signup Pages
    loginPage: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '64px 24px',
        backgroundColor: '#F9FAFB',
        flexGrow: 1,
    },
    loginContainer: {
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #E5E7EB',
    },
    loginTitle: {
        fontSize: '28px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '12px',
        color: '#111827',
    },
    loginSubtitle: {
        textAlign: 'center',
        color: '#4B5563',
        marginBottom: '32px',
        lineHeight: 1.5,
    },
    loginReasonMessage: {
        color: '#1D4ED8',
        backgroundColor: '#EFF6FF',
        padding: '12px',
        borderRadius: '8px',
        textAlign: 'center',
        fontSize: '14px',
        marginBottom: '24px',
        border: '1px solid #BEE3F8'
    },
    loginForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '4px', // Adjusted for better spacing in longer forms
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '16px',
    },
    label: {
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: 500,
        color: '#374151',
    },
    input: {
        padding: '12px',
        fontSize: '16px',
        border: '1px solid #D1D5DB',
        borderRadius: '8px',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    loginError: {
        color: '#EF4444',
        backgroundColor: '#FEE2E2',
        padding: '12px',
        borderRadius: '8px',
        textAlign: 'center',
        fontSize: '14px',
        marginBottom: '16px',
    },
    loginLinks: {
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
    },
    loginLink: {
        color: '#2563EB',
        textDecoration: 'none',
        fontWeight: 500,
        transition: 'color 0.2s',
    },
    fieldset: {
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '24px',
        margin: '0 0 32px 0',
    },
    legend: {
        padding: '0 8px',
        fontWeight: 700,
        color: '#111827',
        fontSize: '18px',
    },
    subLegend: {
        margin: '12px 0 12px 0',
        fontSize: '15px',
        fontWeight: 600,
        color: '#374151',
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '8px'
    },
    fieldsetDescription: {
        fontSize: '14px',
        color: '#4B5563',
        marginTop: '-8px',
        marginBottom: '16px',
    },
    checkboxGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '12px',
        marginTop: '8px',
        marginBottom: '16px',
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: 500,
        color: '#374151',
        cursor: 'pointer',
    },
    checkboxInput: {
        width: '16px',
        height: '16px',
        cursor: 'pointer',
    },
    sizeInputGroup: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
    },
    hr: {
        border: 'none',
        borderTop: '1px solid #E5E7EB',
        margin: '24px 0'
    },
    // Dashboard
    dashboardContainer: {
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '48px 24px',
        boxSizing: 'border-box',
        flexGrow: 1,
    },
    dashboardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
    },
    dashboardTitle: {
        fontSize: '32px',
        fontWeight: 700,
        color: '#111827',
    },
    emptyState: {
        textAlign: 'center',
        padding: '64px 0',
        border: '2px dashed #E5E7EB',
        borderRadius: '12px',
        backgroundColor: '#F9FAFB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    },
    emptyStateTitle: {
        fontSize: '20px',
        fontWeight: 600,
        color: '#1F2937',
    },
    emptyStateText: {
        fontSize: '16px',
        color: '#4B5563',
        maxWidth: '400px',
        lineHeight: 1.6,
        marginBottom: '16px',
    },
    tableContainer: {
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    },
    designTable: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '14px',
    },
    tableHead: {
        backgroundColor: '#F9FAFB',
    },
    tableHeaderCell: {
        padding: '12px 16px',
        fontWeight: 600,
        color: '#4B5563',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid #E5E7EB',
    },
    tableBody: {},
    tableRow: {
        borderBottom: '1px solid #E5E7EB',
    },
    tableCell: {
        padding: '16px',
        color: '#374151',
        verticalAlign: 'middle',
    },
    statusBadge: {
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontWeight: 500,
        fontSize: '12px',
        textTransform: 'capitalize',
    },
    statusComplete: { backgroundColor: '#D1FAE5', color: '#065F46' },
    statusPending: { backgroundColor: '#FEF3C7', color: '#92400E' },
    statusFailed: { backgroundColor: '#FEE2E2', color: '#991B1B' },
    actionsCell: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
    },
    iconButton: {
        background: 'none',
        border: 'none',
        padding: '6px',
        borderRadius: '50%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6B7280',
        transition: 'background-color 0.2s, color 0.2s',
    },
    iconButtonDanger: {
        color: '#EF4444',
    },
    fileTypeWarning: {
        display: 'flex',
        alignItems: 'flex-start',
        color: '#31708f',
        backgroundColor: '#d9edf7',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        marginTop: '16px',
        border: '1px solid #bce8f1',
        lineHeight: 1.5,
    },
    // Upload Page
    uploadPageContainer: {
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '48px 24px',
        boxSizing: 'border-box',
        flexGrow: 1,
    },
    uploadLayout: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '48px',
        alignItems: 'start',
    },
    uploadDropzoneWrapper: {
        display: 'flex',
        flexDirection: 'column',
    },
    uploadDropzone: {
        border: '2px dashed #D1D5DB',
        borderRadius: '12px',
        padding: '48px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.2s, background-color 0.2s',
        backgroundColor: '#F9FAFB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '340px',
        boxSizing: 'border-box',
    },
    uploadDropzoneActive: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    uploadFileInfo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
    uploadFileName: {
        fontWeight: '600',
        color: '#1F2937',
        marginTop: '16px',
        wordBreak: 'break-all',
    },
    uploadFormFields: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    uploadActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '20px',
        borderTop: '1px solid #E5E7EB',
        paddingTop: '24px',
    },
    // Footer
    footer: {
        padding: '48px 0',
        backgroundColor: '#111827',
        color: '#9CA3AF',
        marginTop: 'auto',
    },
    footerContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
    },
    footerLinks: {
        display: 'flex',
        gap: '24px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    footerLink: {
        color: '#D1D5DB',
        textDecoration: 'none',
        fontSize: '14px',
        transition: 'color 0.2s',
    },
    footerCopyright: {
        fontSize: '14px',
    },
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);