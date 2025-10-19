import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppSettings, Product, StockMovement, Estimate, Invoice, User, UserRole } from './types';
import { DEFAULT_SETTINGS, GITHUB_DATA_PATHS } from './constants';
import { GithubService } from './services/githubService';
import { DashboardIcon, DocumentIcon, ProductIcon, ReportIcon, SettingsIcon, StockIcon, SunIcon, MoonIcon, SyncIcon, UsersIcon, LogoutIcon } from './components/icons';
import { ProductsComponent } from './components/ProductsComponent';
import { SettingsComponent } from './components/SettingsComponent';
import { StockManagementComponent } from './components/StockManagementComponent';
import { UserManagementComponent } from './components/UserManagementComponent';
import { Button, Card, Input } from './components/common';


const Dashboard = ({ products, invoices }: { products: Product[], invoices: Invoice[] }) => <div className="p-4"><h1 className="text-2xl">Dashboard</h1><p>Products: {products.length}</p><p>Invoices: {invoices.length}</p></div>;
const Estimates = ({ products, estimates, onSave }: { products: Product[], estimates: Estimate[], onSave: (estimates: Estimate[]) => void }) => <div className="p-4"><h1 className="text-2xl">Estimates</h1></div>;
const InvoicesComponent = ({ products, invoices, onSave }: { products: Product[], invoices: Invoice[], onSave: (invoices: Invoice[]) => void }) => <div className="p-4"><h1 className="text-2xl">Invoices</h1></div>;
const Reports = ({ products, invoices, stock }: { products: Product[], invoices: Invoice[], stock: StockMovement[] }) => <div className="p-4"><h1 className="text-2xl">Reports</h1></div>;


const ALL_NAV_ITEMS = [
  { name: 'Dashboard', icon: DashboardIcon, roles: [UserRole.ADMIN, UserRole.EXECUTIVE, UserRole.STORE_MANAGER, UserRole.TEAM_LEADER] },
  { name: 'Products', icon: ProductIcon, roles: [UserRole.ADMIN, UserRole.EXECUTIVE, UserRole.STORE_MANAGER] },
  { name: 'Stock', icon: StockIcon, roles: [UserRole.ADMIN, UserRole.EXECUTIVE, UserRole.STORE_MANAGER] },
  { name: 'Estimates', icon: DocumentIcon, roles: [UserRole.ADMIN, UserRole.EXECUTIVE] },
  { name: 'Invoices', icon: DocumentIcon, roles: [UserRole.ADMIN, UserRole.EXECUTIVE] },
  { name: 'Reports', icon: ReportIcon, roles: [UserRole.ADMIN, UserRole.EXECUTIVE, UserRole.TEAM_LEADER] },
  { name: 'Users', icon: UsersIcon, roles: [UserRole.ADMIN] },
  { name: 'Settings', icon: SettingsIcon, roles: [UserRole.ADMIN] },
];

const App: React.FC = () => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [products, setProducts] = useState<Product[]>([]);
    const [stock, setStock] = useState<StockMovement[]>([]);
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    const [currentPage, setCurrentPage] = useState('Dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [needsFirstUser, setNeedsFirstUser] = useState(false);

    // Login state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const githubService = useMemo(() => {
        if (settings.githubToken && settings.githubRepo) {
            try { return new GithubService(settings.githubToken, settings.githubRepo); } catch (e) { setError((e as Error).message); return null; }
        }
        return null;
    }, [settings.githubToken, settings.githubRepo]);
    
    const navItems = useMemo(() => {
        if (!currentUser) return [];
        return ALL_NAV_ITEMS.filter(item => item.roles.includes(currentUser.role));
    }, [currentUser]);

    useEffect(() => {
        const localSettings = localStorage.getItem('bhagya-settings');
        if (localSettings) {
            const parsedSettings = JSON.parse(localSettings);
            setSettings(parsedSettings);
            if (parsedSettings.githubToken && parsedSettings.githubRepo) {
                setIsSetupComplete(true);
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (settings.theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [settings.theme]);

    const fetchDataFromGithub = useCallback(async () => {
        if (!githubService) {
            setError("GitHub not configured. Please go to Settings.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const [productsData, stockData, estimatesData, invoicesData, settingsData, usersData] = await Promise.all([
                githubService.getFile(GITHUB_DATA_PATHS.products),
                githubService.getFile(GITHUB_DATA_PATHS.stock),
                githubService.getFile(GITHUB_DATA_PATHS.estimates),
                githubService.getFile(GITHUB_DATA_PATHS.invoices),
                githubService.getFile(GITHUB_DATA_PATHS.settings),
                githubService.getFile(GITHUB_DATA_PATHS.users),
            ]);

            if(settingsData) setSettings(JSON.parse(settingsData.content));
            if(productsData) setProducts(JSON.parse(productsData.content));
            if(stockData) setStock(JSON.parse(stockData.content));
            if(estimatesData) setEstimates(JSON.parse(estimatesData.content));
            if(invoicesData) setInvoices(JSON.parse(invoicesData.content));
            
            const loadedUsers = usersData ? JSON.parse(usersData.content) : [];
            setUsers(loadedUsers);
            if (isSetupComplete && loadedUsers.length === 0) {
                setNeedsFirstUser(true);
            }

        } catch (e) {
            setError(`Failed to fetch data from GitHub: ${(e as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    }, [githubService, isSetupComplete]);

    useEffect(() => {
        if (isSetupComplete) {
            fetchDataFromGithub();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSetupComplete]);
    
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            setCurrentUser(user);
            setCurrentPage('Dashboard');
        } else {
            setLoginError('Invalid username or password.');
        }
    };
    
    const handleLogout = () => {
        setCurrentUser(null);
        setUsername('');
        setPassword('');
    };

    const handleSaveSettings = async (newSettings: AppSettings) => {
        setIsSyncing(true);
        try {
            const tempService = new GithubService(newSettings.githubToken, newSettings.githubRepo);
            await tempService.createOrUpdateFile(GITHUB_DATA_PATHS.settings, JSON.stringify(newSettings, null, 2), 'update settings');
            setSettings(newSettings);
            localStorage.setItem('bhagya-settings', JSON.stringify(newSettings));
            
            if (!isSetupComplete) {
                setIsSetupComplete(true);
            }
            setError(null);
        } catch (e) {
            setError(`Failed to save settings: ${(e as Error).message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const syncToGithub = useCallback(async (path: string, data: any, message: string) => {
        if (!githubService) return;
        setIsSyncing(true);
        try {
            await githubService.createOrUpdateFile(path, JSON.stringify(data, null, 2), message);
        } catch (e) { setError(`Sync failed for ${path}: ${(e as Error).message}`); } finally { setIsSyncing(false); }
    }, [githubService]);
    
    const handleSaveProducts = (updatedProducts: Product[]) => { setProducts(updatedProducts); syncToGithub(GITHUB_DATA_PATHS.products, updatedProducts, 'update products'); };
    const handleSaveUsers = (updatedUsers: User[]) => { 
        setUsers(updatedUsers); 
        syncToGithub(GITHUB_DATA_PATHS.users, updatedUsers, 'update users');
        if (needsFirstUser) { // First admin created, proceed to login
            setNeedsFirstUser(false);
        }
    };
    const handleSaveStock = (updatedStock: StockMovement[], updatedProducts: Product[]) => {
        setStock(updatedStock);
        setProducts(updatedProducts);
        syncToGithub(GITHUB_DATA_PATHS.stock, updatedStock, 'update stock movements');
        syncToGithub(GITHUB_DATA_PATHS.products, updatedProducts, 'update product quantities from stock change');
    };

    const renderPage = () => {
        if (!navItems.find(item => item.name === currentPage) && currentUser) {
            setCurrentPage('Dashboard');
            return <Dashboard products={products} invoices={invoices} />;
        }
        switch (currentPage) {
            case 'Dashboard': return <Dashboard products={products} invoices={invoices} />;
            case 'Products': return <ProductsComponent products={products} onSave={handleSaveProducts} />;
            case 'Stock': return <StockManagementComponent products={products} stock={stock} onSave={handleSaveStock} lowStockThreshold={settings.lowStockThreshold} />;
            case 'Estimates': return <Estimates products={products} estimates={estimates} onSave={() => {}} />;
            case 'Invoices': return <InvoicesComponent products={products} invoices={invoices} onSave={() => {}} />;
            case 'Reports': return <Reports products={products} invoices={invoices} stock={stock} />;
            case 'Users': return <UserManagementComponent users={users} onSave={handleSaveUsers} />;
            case 'Settings': return <SettingsComponent settings={settings} onSave={handleSaveSettings} isSyncing={isSyncing} />;
            default: return <Dashboard products={products} invoices={invoices} />;
        }
    };
    
    if (isLoading && isSetupComplete) return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">Loading data...</div>;

    if (!isSetupComplete) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-4xl">
                <div className="text-center p-8 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                    <h1 className="text-3xl font-bold mb-2">Welcome to Bhagya Groups Manager</h1>
                    <p className="text-gray-600 dark:text-gray-300">Please configure your GitHub repository below to get started.</p>
                </div>
                <SettingsComponent settings={settings} onSave={handleSaveSettings} isSyncing={isSyncing} />
            </div>
        </div>;
    }
    
    if (needsFirstUser) {
         return <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-4xl">
                <UserManagementComponent users={users} onSave={handleSaveUsers} isFirstUserSetup={true} />
            </div>
        </div>;
    }

    if (!currentUser) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="w-full max-w-sm">
                <div className="text-center mb-6">
                    {settings.logoBase64 ? 
                        <img src={settings.logoBase64} alt="Logo" className="h-12 w-auto mx-auto mb-4"/> :
                        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{settings.companyDetails.name}</h1>
                    }
                    <h2 className="text-xl font-semibold">Login to your account</h2>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <Input label="Username" id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                    <Input label="Password" id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
                    <Button type="submit" className="w-full">Login</Button>
                </form>
            </Card>
        </div>;
    }
    
    return (
        <div className="flex h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between h-16">
                    {settings.logoBase64 ? <img src={settings.logoBase64} alt="Logo" className="h-10 w-auto"/> : <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">{settings.companyDetails.name}</h1> }
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map(item => (
                        <button key={item.name} onClick={() => setCurrentPage(item.name)}
                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${ currentPage === item.name ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700' }`}>
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.name}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t dark:border-gray-700">
                    <div className='mb-4 p-2 rounded-md bg-gray-100 dark:bg-gray-700/50'>
                        <p className='font-bold text-sm'>{currentUser.name}</p>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>{currentUser.role}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        {/* FIX: Removed invalid JSX tags `<_c>` and `</_c>` which were causing a compile error. */}
                        <button onClick={() => handleSaveSettings({...settings, theme: settings.theme === 'light' ? 'dark' : 'light'})} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">{settings.theme === 'light' ? <MoonIcon /> : <SunIcon />}</button>
                        <button onClick={fetchDataFromGithub} disabled={isSyncing || isLoading} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"><SyncIcon className={isSyncing || isLoading ? 'animate-spin' : ''} /></button>
                        <button onClick={handleLogout} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"><LogoutIcon /></button>
                    </div>
                </div>
            </aside>
            
            <main className="flex-1 p-6 overflow-y-auto">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                        <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3"><span className="text-2xl">&times;</span></button>
                    </div>
                )}
                {renderPage()}
            </main>
        </div>
    );
}

export default App;