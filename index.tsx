import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// --- SVG Icons ---

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '48px', height: '48px', color: '#2563EB' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

// --- Mock Data ---
const mockDesigns = [
    {
        id: 'd-001',
        design_name: 'Main Housing Unit',
        material: 'ABS',
        quantity: 150,
        status: 'analysis_complete',
        created_at: '2023-10-26T14:30:00Z',
    },
    {
        id: 'd-002',
        design_name: 'Mounting Bracket V2',
        material: 'PLA',
        quantity: 500,
        status: 'pending_analysis',
        created_at: '2023-10-27T10:15:00Z',
    },
    {
        id: 'd-003',
        design_name: 'Gear Cog (Unsupported Format)',
        material: 'Nylon',
        quantity: 200,
        status: 'analysis_failed',
        created_at: '2023-10-27T11:05:00Z',
    },
     {
        id: 'd-004',
        design_name: 'Front Panel Enclosure',
        material: 'ABS',
        quantity: 75,
        status: 'analysis_complete',
        created_at: '2023-10-25T09:00:00Z',
    },
];

// --- Reusable Components ---

type CtaButtonProps = {
    text: string;
    href?: string;
    onClick?: (e?: React.MouseEvent) => void;
    primary?: boolean;
    type?: 'button' | 'submit' | 'reset';
    children?: React.ReactNode;
};

const CtaButton = ({ text, href = "#", onClick, primary = false, type = "button", children }: CtaButtonProps) => {
    const [hover, setHover] = useState(false);

    const variantStyle = primary ? styles.buttonPrimary : styles.buttonSecondary;
    const hoverStyle = primary ? styles.buttonPrimaryHover : styles.buttonSecondaryHover;

    const style = {
        ...styles.button,
        ...variantStyle,
        ...(hover ? hoverStyle : {}),
    };

    const commonProps = {
        style: style,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
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
                            <CtaButton text="Get Started" primary />
                        </>
                    )}
                </div>
            </div>
        </div>
    </header>
);

const Hero = () => (
    <section style={styles.hero}>
        <div style={styles.container}>
            <div style={styles.heroContent}>
                <h1 style={styles.heroTitle}>Instant Manufacturing Quotes. From Design to Delivery.</h1>
                <p style={styles.heroSubtitle}>Upload your CAD files and receive competitive quotes from our global network of vetted manufacturers in minutes.</p>
                <div style={styles.heroActions}>
                    <CtaButton text="Upload a Design" primary />
                    <CtaButton text="Join as a Manufacturer" />
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
    onLoginSuccess: () => void;
    onNavigate: (page: string) => void;
    role: 'customer' | 'manufacturer';
};

const LoginPage = ({ onLoginSuccess, onNavigate, role }: LoginPageProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isCustomer = role === 'customer';

    const title = isCustomer ? "Customer Sign In" : "Manufacturer Sign In";
    const subtitle = isCustomer
        ? "Access your account to manage your designs and orders."
        : "Access your dashboard to manage quotes and production.";
    const mockEmail = isCustomer ? 'customer@example.com' : 'manufacturer@example.com';
    const mockPassword = isCustomer ? 'password123' : 'password456';
    const signupText = isCustomer ? "Don't have an account? Sign Up" : "Want to join our network? Apply here";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        setTimeout(() => {
            if (email === mockEmail && password === mockPassword) {
                onLoginSuccess();
            } else {
                setError('Invalid email or password. Please try again.');
            }
            setLoading(false);
        }, 1000);
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
                     <CtaButton text={loading ? "Signing In..." : "Sign In"} primary type="submit" />
                </form>
                <div style={styles.loginLinks}>
                    <a href="#" style={styles.loginLink} onClick={(e) => { e.preventDefault(); }}>Forgot password?</a>
                    <a href="#" style={styles.loginLink} onClick={(e) => { e.preventDefault(); }}>{signupText}</a>
                </div>
            </div>
        </div>
    );
};

const LoginRoleSelector = ({ onNavigate }: { onNavigate: (page: string) => void }) => (
    <div style={styles.loginPage}>
        <div style={styles.loginContainer}>
            <h2 style={styles.loginTitle}>Sign In</h2>
            <p style={styles.loginSubtitle}>Please select your role to continue.</p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px'}}>
                <CtaButton text="I'm a Customer" primary onClick={() => onNavigate('login-customer')} />
                <CtaButton text="I'm a Manufacturer" onClick={() => onNavigate('login-manufacturer')} />
            </div>
             <div style={{...styles.loginLinks, justifyContent: 'center'}}>
                 <a href="#" style={{...styles.loginLink, color: '#4B5563'}} onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}>
                    Back to Homepage
                </a>
            </div>
        </div>
    </div>
);

// --- Dashboard Components ---

const UploadDesignModal = ({ onClose, onUpload }) => {
    const [designName, setDesignName] = useState('');
    const [material, setMaterial] = useState('ABS');
    const [quantity, setQuantity] = useState(1);
    const [fileName, setFileName] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
        } else {
            setFileName('');
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const newDesign = {
            id: `d-${Math.random().toString(36).substr(2, 9)}`,
            design_name: designName,
            material,
            quantity: Number(quantity),
            status: 'pending_analysis',
            created_at: new Date().toISOString(),
        };
        onUpload(newDesign);
    };

    return (
        <div style={styles.modalBackdrop} onClick={onClose} role="dialog" aria-modal="true">
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <h3 style={styles.modalTitle}>Upload a New Design</h3>
                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label htmlFor="designName" style={styles.label}>Design Name</label>
                        <input type="text" id="designName" value={designName} onChange={e => setDesignName(e.target.value)} style={styles.input} required />
                    </div>
                     <div style={styles.formGroup}>
                        <label htmlFor="file" style={styles.label}>CAD File (.stl, .step, .iges)</label>
                        <label htmlFor="file-upload" style={styles.fileUploadLabel}>
                            {fileName || "Select a file..."}
                        </label>
                        <input type="file" id="file-upload" onChange={handleFileChange} style={styles.fileUploadInput} accept=".stl,.step,.iges,.stp" required />
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="material" style={styles.label}>Material</label>
                        <select id="material" value={material} onChange={e => setMaterial(e.target.value)} style={styles.input}>
                            <option>ABS</option>
                            <option>PLA</option>
                            <option>Nylon</option>
                            <option>PETG</option>
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="quantity" style={styles.label}>Quantity</label>
                        <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(e.target.value)} style={styles.input} min="1" required />
                    </div>
                    <div style={styles.modalActions}>
                        <CtaButton text="Cancel" onClick={onClose} />
                        <CtaButton text="Upload Design" primary type="submit" />
                    </div>
                </form>
            </div>
        </div>
    );
};

const CustomerDashboard = () => {
    const [designs, setDesigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setDesigns(mockDesigns);
            setLoading(false);
        }, 500);
    }, []);

    const handleDelete = (id) => {
        setDesigns(prevDesigns => prevDesigns.filter(d => d.id !== id));
    };

    const handleUpload = (newDesign) => {
        setDesigns(prevDesigns => [newDesign, ...prevDesigns]);
        setUploadModalOpen(false);
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
            {isUploadModalOpen && <UploadDesignModal onUpload={handleUpload} onClose={() => setUploadModalOpen(false)} />}
            <div style={styles.dashboardHeader}>
                <h1 style={styles.dashboardTitle}>My Designs</h1>
                <CtaButton text="Upload New Design" primary onClick={() => setUploadModalOpen(true)}>
                    <PlusIcon />
                </CtaButton>
            </div>
            {loading ? <p>Loading designs...</p> : (
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

    const handleLoginSuccess = (role: 'customer' | 'manufacturer') => {
        setIsAuthenticated(true);
        setUserRole(role);
        setPage('dashboard');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUserRole(null);
        setPage('landing');
    };

    const renderContent = () => {
        switch (page) {
            case 'landing':
                return (
                    <>
                        <Hero />
                        <HowItWorks />
                        <Features />
                    </>
                );
            case 'login':
                return <LoginRoleSelector onNavigate={setPage} />;
            case 'login-customer':
                return <LoginPage role="customer" onLoginSuccess={() => handleLoginSuccess('customer')} onNavigate={setPage} />;
            case 'login-manufacturer':
                return <LoginPage role="manufacturer" onLoginSuccess={() => handleLoginSuccess('manufacturer')} onNavigate={setPage} />;
            case 'dashboard':
                if (isAuthenticated) {
                    if (userRole === 'customer') {
                        return <CustomerDashboard />;
                    }
                    if (userRole === 'manufacturer') {
                        const dashboardTitle = 'Manufacturer Dashboard';
                        return (
                            <div style={styles.container}>
                                <h1 style={{...styles.sectionTitle, marginTop: '64px'}}>{dashboardTitle}</h1>
                                <p style={{textAlign: 'center', fontSize: '18px', color: '#4B5563'}}>This is where you can manage your quotes and production.</p>
                            </div>
                        );
                    }
                }
                 // Fallback to landing for any invalid state
                 setPage('landing');
                 return null;
            default:
                 setPage('landing');
                 return null;
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
        transition: