import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { 
    Coins, TrendingUp, Users, Save, ToggleLeft, ToggleRight, 
    Tag, Gem, QrCode, Image as ImageIcon, Plus, Trash2, 
    UserPlus, Shield, Trash, X, Settings as SettingsIcon, History
} from 'lucide-react';

const Settings = () => {
    const prodNameRef = useRef(null);
    const stoneNameRef = useRef(null);
    // Basic Settings
    const [settings, setSettings] = useState({});
    const [saveStatus, setSaveStatus] = useState('');
    
    // Company Settings
    const [categories, setCategories] = useState([]);
    const [stones, setStones] = useState([]);
    const [qrFormat, setQrFormat] = useState('qr');
    const [logo, setLogo] = useState('');
    
    // User Management
    const [users, setUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [newUserData, setNewUserData] = useState({ username: '', password: '', role: 'accountant' });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [isDark, setIsDark] = useState(document.body.classList.contains('dark-theme'));
    
    // New Extended Settings
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [taxId, setTaxId] = useState('');
    const [purityStandards, setPurityStandards] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [currency, setCurrency] = useState('₹');

    // Products and Stones states
    const [prodForm, setProdForm] = useState({ name: '', code: '' });
    const [editProdIdx, setEditProdIdx] = useState(null);
    const [prodSearch, setProdSearch] = useState('');

    const [stoneForm, setStoneForm] = useState({ stoneName: '', code: '', pricePerUnit: 0, unit: 'carat', pieceWeight: 0 });
    const [editStoneIdx, setEditStoneIdx] = useState(null);
    const [stoneSearch, setStoneSearch] = useState('');

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        document.body.classList.toggle('dark-theme', newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    };

    // Product Master CRUD
    const handleSaveProduct = (e) => {
        e.preventDefault();
        const nameVal = prodForm.name.trim();
        const codeVal = prodForm.code.trim().toUpperCase();

        if (!nameVal || !codeVal) {
            alert('Product Name and Code are required!');
            return;
        }

        // Validate duplicates
        const dupName = categories.find((c, idx) => c.name.toLowerCase() === nameVal.toLowerCase() && idx !== editProdIdx);
        if (dupName) {
            alert('A product with this duplicate name already exists!');
            return;
        }

        const dupCode = categories.find((c, idx) => c.code === codeVal && idx !== editProdIdx);
        if (dupCode) {
            alert('A product with this duplicate code already exists!');
            return;
        }

        const updatedCategories = [...categories];
        if (editProdIdx !== null) {
            updatedCategories[editProdIdx] = {
                ...updatedCategories[editProdIdx],
                name: nameVal,
                code: codeVal
            };
            setEditProdIdx(null);
        } else {
            updatedCategories.push({
                name: nameVal,
                code: codeVal,
                status: 'Active',
                createdAt: new Date(),
                defaultLabourRate: 0
            });
        }

        setCategories(updatedCategories);
        setProdForm({ name: '', code: '' });
        setTimeout(() => {
            prodNameRef.current?.focus();
        }, 50);
    };

    const handleToggleProductStatus = (idx) => {
        const updated = [...categories];
        updated[idx].status = updated[idx].status === 'Active' ? 'Inactive' : 'Active';
        setCategories(updated);
    };

    const handleDeleteProduct = (idx) => {
        if (window.confirm('Are you sure you want to deactivate/soft delete this product?')) {
            const updated = [...categories];
            updated[idx].status = 'Inactive';
            setCategories(updated);
        }
    };

    // Stone Master CRUD
    const handleSaveStone = (e) => {
        e.preventDefault();
        const nameVal = stoneForm.stoneName.trim();
        const codeVal = stoneForm.code.trim().toUpperCase();

        if (!nameVal || !codeVal) {
            alert('Stone Name and Code are required!');
            return;
        }

        // Validate duplicates
        const dupName = stones.find((s, idx) => s.stoneName.toLowerCase() === nameVal.toLowerCase() && idx !== editStoneIdx);
        if (dupName) {
            alert('A stone with this duplicate name already exists!');
            return;
        }

        const dupCode = stones.find((s, idx) => s.code === codeVal && idx !== editStoneIdx);
        if (dupCode) {
            alert('A stone with this duplicate code already exists!');
            return;
        }

        const updatedStones = [...stones];
        const pieceWeightVal = stoneForm.unit === 'piece' ? (parseFloat(stoneForm.pieceWeight) || 0) : 0;
        if (editStoneIdx !== null) {
            updatedStones[editStoneIdx] = {
                ...updatedStones[editStoneIdx],
                stoneName: nameVal,
                code: codeVal,
                pricePerUnit: parseFloat(stoneForm.pricePerUnit) || 0,
                unit: stoneForm.unit,
                pieceWeight: pieceWeightVal
            };
            setEditStoneIdx(null);
        } else {
            updatedStones.push({
                stoneName: nameVal,
                code: codeVal,
                pricePerUnit: parseFloat(stoneForm.pricePerUnit) || 0,
                unit: stoneForm.unit,
                pieceWeight: pieceWeightVal,
                status: 'Active',
                createdAt: new Date(),
                stoneType: 'Precious'
            });
        }

        setStones(updatedStones);
        setStoneForm({ stoneName: '', code: '', pricePerUnit: 0, unit: 'carat', pieceWeight: 0 });
        setTimeout(() => {
            stoneNameRef.current?.focus();
        }, 50);
    };

    const handleToggleStoneStatus = (idx) => {
        const updated = [...stones];
        updated[idx].status = updated[idx].status === 'Active' ? 'Inactive' : 'Active';
        setStones(updated);
    };

    const handleDeleteStone = (idx) => {
        if (window.confirm('Are you sure you want to deactivate/soft delete this stone?')) {
            const updated = [...stones];
            updated[idx].status = 'Inactive';
            setStones(updated);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [setRes, compRes, userRes] = await Promise.all([
                api.get('/settings'),
                api.get('/company'),
                api.get('/mgmt/system/users')
            ]);
            
            // Map settings array to object
            const settingsObj = setRes.data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
            setSettings(settingsObj);
            
            // Map company data
            if (compRes.data) {
                setCategories(compRes.data.categories || []);
                setStones(compRes.data.stones || []);
                setPurityStandards(compRes.data.purityStandards || []);
                setQrFormat(compRes.data.qrFormat || 'qr');
                setLogo(compRes.data.logo || '');
                setAddress(compRes.data.address || '');
                setPhone(compRes.data.phone || '');
                setEmail(compRes.data.email || '');
                setTaxId(compRes.data.taxId || '');
                setCurrency(compRes.data.currency || '₹');
            }
            
            // Map users
            setUsers(userRes.data || []);

            // Audit Logs (only if admin)
            try {
                const auditRes = await api.get('/mgmt/audit');
                setAuditLogs(auditRes.data);
            } catch (e) { /* silent fail for non-admins */ }
            
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            // Reusing auth/register or a system route
            await api.post('/auth/register', newUserData);
            alert('User created successfully');
            setShowUserModal(false);
            setNewUserData({ username: '', password: '', role: 'accountant' });
            fetchAllData();
        } catch (err) {
            alert('Failed to create user');
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setSaveStatus('Saving everything...');
        try {
            const updates = [
                ...Object.entries(settings).map(([key, value]) => api.post('/settings', { key, value })),
                api.put('/company', { 
                    categories, stones, qrFormat, logo, address, phone, email, taxId, purityStandards, currency 
                })
            ];
            await Promise.all(updates);
            setSaveStatus('✓ All settings synced!');
            setTimeout(() => setSaveStatus(''), 3000);
        } catch (err) {
            setSaveStatus('Error saving details');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLogo(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleClearData = async () => {
        if (!window.confirm('CRITICAL ACTION: This will delete ALL products, workers, and transactions. This cannot be undone. Are you sure?')) return;
        try {
            await api.post('/mgmt/system/clear-data');
            alert('System cleared successfully.');
            window.location.reload();
        } catch (err) {
            alert('Clear failed');
        }
    };

    if (loading) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading System Configuration...</div>;

    const tabs = [
        { id: 'general', label: 'General', icon: <SettingsIcon size={18}/> },
        { id: 'branding', label: 'Branding', icon: <ImageIcon size={18}/> },
        { id: 'categories', label: 'Products', icon: <Tag size={18}/> },
        { id: 'stones', label: 'Stones', icon: <Gem size={18}/> },
        { id: 'purity', label: 'Purity', icon: <TrendingUp size={18}/> },
        { id: 'qr', label: 'Print/QR', icon: <QrCode size={18}/> },
        { id: 'users', label: 'Team', icon: <Users size={18}/> },
        { id: 'audit', label: 'Audit Log', icon: <History size={18}/> },
        { id: 'danger', label: 'Advanced', icon: <Shield size={18}/> },
    ];

    return (
        <div className="glass" style={{ padding: '24px', background: 'var(--surface-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h2 className="gold-gradient" style={{ fontSize: '1.8rem' }}>MANAGEMENT CONSOLE</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Centralized control for branding, security, and global parameters</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {saveStatus && <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>{saveStatus}</span>}
                    <button className="btn-primary" onClick={handleSaveAll} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '50px', padding: '12px 25px' }}>
                        <Save size={18}/> {saving ? 'Syncing...' : 'Save All Changes'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '10px 0', marginBottom: '30px', borderBottom: '1px solid var(--glass-border)' }} className="hide-scrollbar">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '10px 20px', whiteSpace: 'nowrap', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: '0.3s',
                            background: activeTab === tab.id ? 'var(--primary-gold)' : 'transparent',
                            color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="fade-in">
                    <div className="responsive-grid" style={{ marginBottom: '30px' }}>
                        <RateCard icon={<Coins size={20} color="var(--primary-gold)"/>} title="Gold Rate (22k)" value={settings.goldRate} onChange={v => setSettings({...settings, goldRate: v})} />
                        <RateCard icon={<Coins size={20} color="#C0C0C0"/>} title="Silver Rate" value={settings.silverRate} onChange={v => setSettings({...settings, silverRate: v})} />
                        <RateCard icon={<TrendingUp size={20} color="var(--danger)"/>} title="Wastage Limit" value={settings.wastageThreshold} unit="%" onChange={v => setSettings({...settings, wastageThreshold: v})} />
                    </div>

                    <div className="glass" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--dark-bg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ background: 'var(--surface-bg)', padding: '10px', borderRadius: '12px' }}>
                                {isDark ? <ToggleRight color="var(--primary-gold)" /> : <ToggleLeft color="var(--text-muted)" />}
                            </div>
                            <div>
                                <h4 style={{ margin: 0 }}>Dark Appearance</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enable midnight slate theme for low-light environments</p>
                            </div>
                        </div>
                        <button 
                            onClick={toggleTheme}
                             style={{ background: isDark ? 'var(--primary-gold)' : 'var(--text-muted)', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '50px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            {isDark ? 'ENABLED' : 'DISABLED'}
                        </button>
                    </div>
                </div>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
                <div className="fade-in">
                    <h3 style={{ marginBottom: '20px' }}>Company Identity</h3>
                    <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '30px' }}>
                        <div style={{ width: '150px', height: '150px', borderRadius: '20px', background: 'var(--dark-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--glass-border)', overflow: 'hidden' }}>
                            {logo ? <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImageIcon size={40} opacity={0.3}/>}
                        </div>
                        <div>
                            <input type="file" id="logoInp" hidden onChange={handleLogoUpload} />
                            <label htmlFor="logoInp" className="btn-primary" style={{ display: 'inline-block', cursor: 'pointer', textTransform: 'none' }}>Upload New Logo</label>
                            <p style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Prefer transparent PNG or SVG for best look.</p>
                        </div>
                    </div>
                    
                    <div className="responsive-grid">
                        <div className="input-group">
                            <label>Registered Address</label>
                            <textarea value={address} onChange={e => setAddress(e.target.value)} style={{ minHeight: '80px' }} placeholder="Shop 12, Gold Souk..."/>
                        </div>
                        <div className="input-group">
                            <label>Official Contact</label>
                            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXX XXX XXX" />
                        </div>
                        <div className="input-group">
                            <label>Email Support</label>
                            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@youbrand.com" />
                        </div>
                        <div className="input-group">
                            <label>GSTIN / Tax ID</label>
                            <input value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="Enter Tax Registration No." />
                        </div>
                    </div>
                </div>
            )}

            {/* Products Tab */}
            {activeTab === 'categories' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    {/* Add/Edit Product Form */}
                    <div className="glass" style={{ padding: '24px', background: 'var(--dark-bg)', borderRadius: '16px' }}>
                        <h4 style={{ margin: '0 0 20px 0', color: 'var(--primary-gold)', fontSize: '1.1rem' }}>
                            {editProdIdx !== null ? '📝 Edit Product' : '➕ Add Product'}
                        </h4>
                        <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
                            <div style={{ width: '250px' }} className="input-group">
                                <label>Product Name *</label>
                                <input 
                                    ref={prodNameRef}
                                    required 
                                    placeholder="e.g. Bridal Necklace" 
                                    value={prodForm.name} 
                                    onChange={e => setProdForm({ ...prodForm, name: e.target.value })} 
                                />
                            </div>
                            <div style={{ width: '150px' }} className="input-group">
                                <label>Product Code *</label>
                                <input 
                                    required 
                                    placeholder="e.g. NE" 
                                    value={prodForm.code} 
                                    onChange={e => setProdForm({ ...prodForm, code: e.target.value })} 
                                />
                            </div>
                            <button type="submit" className="btn-primary" style={{ height: '45px', marginBottom: '20px', borderRadius: '8px' }}>
                                {editProdIdx !== null ? 'Update Product' : 'Create Product'}
                            </button>
                            {editProdIdx !== null && (
                                <button type="button" className="glass" onClick={() => { setEditProdIdx(null); setProdForm({ name: '', code: '' }); }} style={{ height: '45px', marginBottom: '20px', padding: '0 20px', borderRadius: '8px', color: 'var(--text-main)' }}>
                                    Cancel
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Search & Grid list */}
                    <div className="glass" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                            <h4 style={{ margin: 0 }}>Product Master Grid</h4>
                            <input 
                                type="text" 
                                placeholder="Search by name or code..." 
                                value={prodSearch} 
                                onChange={e => setProdSearch(e.target.value)} 
                                style={{ padding: '8px 15px', background: 'var(--dark-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', width: '250px' }}
                            />
                        </div>

                        <div className="table-container" style={{ border: '1px solid var(--glass-border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--dark-bg)' }}>
                                    <tr style={{ textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '12px' }}>#</th>
                                        <th style={{ padding: '12px' }}>Product Name</th>
                                        <th style={{ padding: '12px' }}>Product Code</th>
                                        <th style={{ padding: '12px' }}>Status</th>
                                        <th style={{ padding: '12px' }}>Created Date</th>
                                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories
                                        .map((c, originalIdx) => ({ ...c, originalIdx }))
                                        .filter(c => c.name.toLowerCase().includes(prodSearch.toLowerCase()) || c.code.toLowerCase().includes(prodSearch.toLowerCase()))
                                        .map((c, idx) => (
                                            <tr key={idx} style={{ borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                                                <td style={{ padding: '12px' }}>{idx + 1}</td>
                                                <td style={{ padding: '12px', fontWeight: 600 }}>{c.name}</td>
                                                <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--primary-gold)', fontWeight: 700 }}>{c.code}</td>
                                                <td style={{ padding: '12px' }}>
                                                    <span 
                                                        onClick={() => handleToggleProductStatus(c.originalIdx)}
                                                        style={{ 
                                                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                                                            background: c.status !== 'Inactive' ? 'rgba(52, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                                                            color: c.status !== 'Inactive' ? 'var(--success)' : 'var(--danger)'
                                                        }}
                                                        title="Click to toggle status"
                                                    >
                                                        {c.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                        <button 
                                                            onClick={() => { setEditProdIdx(c.originalIdx); setProdForm({ name: c.name, code: c.code }); }}
                                                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer' }}
                                                            title="Edit Product"
                                                        >
                                                            <ToggleLeft size={16} /> Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteProduct(c.originalIdx)}
                                                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                                            title="Delete Product"
                                                        >
                                                            <Trash2 size={16} /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    {categories.length === 0 && (
                                        <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No products registered.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Stones Tab */}
            {activeTab === 'stones' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    {/* Add/Edit Stone Form */}
                    <div className="glass" style={{ padding: '24px', background: 'var(--dark-bg)', borderRadius: '16px' }}>
                        <h4 style={{ margin: '0 0 20px 0', color: 'var(--primary-gold)', fontSize: '1.1rem' }}>
                            {editStoneIdx !== null ? '📝 Edit Stone' : '➕ Add Stone'}
                        </h4>
                        <form onSubmit={handleSaveStone} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
                            <div style={{ width: '250px' }} className="input-group">
                                <label>Stone Name *</label>
                                <input 
                                    ref={stoneNameRef}
                                    required 
                                    placeholder="e.g. Ruby" 
                                    value={stoneForm.stoneName} 
                                    onChange={e => setStoneForm({ ...stoneForm, stoneName: e.target.value })} 
                                />
                            </div>
                            <div style={{ width: '120px' }} className="input-group">
                                <label>Stone Code *</label>
                                <input 
                                    required 
                                    placeholder="e.g. RU" 
                                    value={stoneForm.code} 
                                    onChange={e => setStoneForm({ ...stoneForm, code: e.target.value })} 
                                />
                            </div>
                            <div style={{ width: '120px' }} className="input-group">
                                <label>Price per Unit (₹)</label>
                                <input 
                                    type="number"
                                    placeholder="Price" 
                                    value={stoneForm.pricePerUnit || ''} 
                                    onChange={e => setStoneForm({ ...stoneForm, pricePerUnit: e.target.value })} 
                                />
                            </div>
                            <div style={{ width: '120px' }} className="input-group">
                                <label>Unit</label>
                                <select 
                                    value={stoneForm.unit} 
                                    onChange={e => setStoneForm({ ...stoneForm, unit: e.target.value, pieceWeight: e.target.value === 'piece' ? stoneForm.pieceWeight || 0 : 0 })}
                                    style={{ width: '100%', padding: '12px', background: 'var(--surface-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                                >
                                    <option value="carat">Carat</option>
                                    <option value="gram">Grams</option>
                                    <option value="piece">Piece</option>
                                </select>
                            </div>
                            {stoneForm.unit === 'piece' && (
                                <div style={{ width: '120px' }} className="input-group">
                                    <label>Piece Weight (g) *</label>
                                    <input 
                                        required
                                        type="number"
                                        step="0.001"
                                        placeholder="Weight" 
                                        value={stoneForm.pieceWeight || ''} 
                                        onChange={e => setStoneForm({ ...stoneForm, pieceWeight: e.target.value })}
                                        style={{ width: '100%', padding: '12px', background: 'var(--surface-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                                    />
                                </div>
                            )}
                            <button type="submit" className="btn-primary" style={{ height: '45px', marginBottom: '20px', borderRadius: '8px' }}>
                                {editStoneIdx !== null ? 'Update Stone' : 'Create Stone'}
                            </button>
                            {editStoneIdx !== null && (
                                <button type="button" className="glass" onClick={() => { setEditStoneIdx(null); setStoneForm({ stoneName: '', code: '', pricePerUnit: 0, unit: 'carat', pieceWeight: 0 }); }} style={{ height: '45px', marginBottom: '20px', padding: '0 20px', borderRadius: '8px', color: 'var(--text-main)' }}>
                                    Cancel
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Search & Grid list */}
                    <div className="glass" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                            <h4 style={{ margin: 0 }}>Stone Catalog Grid</h4>
                            <input 
                                type="text" 
                                placeholder="Search by name or code..." 
                                value={stoneSearch} 
                                onChange={e => setStoneSearch(e.target.value)} 
                                style={{ padding: '8px 15px', background: 'var(--dark-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', width: '250px' }}
                            />
                        </div>

                        <div className="table-container" style={{ border: '1px solid var(--glass-border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--dark-bg)' }}>
                                    <tr style={{ textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '12px' }}>#</th>
                                        <th style={{ padding: '12px' }}>Stone Name</th>
                                        <th style={{ padding: '12px' }}>Stone Code</th>
                                        <th style={{ padding: '12px' }}>Price / Unit</th>
                                        <th style={{ padding: '12px' }}>Unit</th>
                                        <th style={{ padding: '12px' }}>Status</th>
                                        <th style={{ padding: '12px' }}>Created Date</th>
                                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stones
                                        .map((s, originalIdx) => ({ ...s, originalIdx }))
                                        .filter(s => s.stoneName.toLowerCase().includes(stoneSearch.toLowerCase()) || (s.code || '').toLowerCase().includes(stoneSearch.toLowerCase()))
                                        .map((s, idx) => (
                                            <tr key={idx} style={{ borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                                                <td style={{ padding: '12px' }}>{idx + 1}</td>
                                                <td style={{ padding: '12px', fontWeight: 600 }}>{s.stoneName}</td>
                                                <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--primary-gold)', fontWeight: 700 }}>{s.code || '—'}</td>
                                                <td style={{ padding: '12px' }}>₹{s.pricePerUnit || 0}</td>
                                                <td style={{ padding: '12px', textTransform: 'capitalize' }}>
                                                    {s.unit}{s.unit === 'piece' && s.pieceWeight ? ` (${s.pieceWeight}g)` : ''}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <span 
                                                        onClick={() => handleToggleStoneStatus(s.originalIdx)}
                                                        style={{ 
                                                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                                                            background: s.status !== 'Inactive' ? 'rgba(52, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                                                            color: s.status !== 'Inactive' ? 'var(--success)' : 'var(--danger)'
                                                        }}
                                                        title="Click to toggle status"
                                                    >
                                                        {s.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                        <button 
                                                            onClick={() => { setEditStoneIdx(s.originalIdx); setStoneForm({ stoneName: s.stoneName, code: s.code || '', pricePerUnit: s.pricePerUnit || 0, unit: s.unit, pieceWeight: s.pieceWeight || 0 }); }}
                                                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer' }}
                                                            title="Edit Stone"
                                                        >
                                                            <ToggleLeft size={16} /> Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteStone(s.originalIdx)}
                                                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                                            title="Delete Stone"
                                                        >
                                                            <Trash2 size={16} /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    {stones.length === 0 && (
                                        <tr><td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No stones registered.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Purity Tab */}
            {activeTab === 'purity' && (
                <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>Purity Standards Management</h3>
                        <button className="glass" onClick={() => setPurityStandards([...purityStandards, {label: '', value: ''}])} style={{ padding: '8px 15px', color: 'var(--primary-gold)', borderRadius: '8px' }}>+ New Standard</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                        {purityStandards.map((std, idx) => (
                            <div key={idx} style={{ background: 'var(--dark-bg)', padding: '12px 20px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--glass-border)' }}>
                                <input placeholder="Label (e.g. 22k)" value={std.label} onChange={e => { const a = [...purityStandards]; a[idx].label = e.target.value; setPurityStandards(a); }} style={{ width: '100px', fontWeight: 600, border: 'none', background: 'transparent', color: 'white' }} />
                                <input type="number" placeholder="%" value={std.value} onChange={e => { const a = [...purityStandards]; a[idx].value = e.target.value; setPurityStandards(a); }} style={{ width: '60px', color: 'var(--primary-gold)', border: 'none', background: 'transparent' }} />
                                <Trash2 size={14} color="var(--danger)" cursor="pointer" onClick={() => { const a = [...purityStandards]; a.splice(idx,1); setPurityStandards(a); }} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Print/QR Tab */}
            {activeTab === 'qr' && (
                <div className="fade-in">
                    <h3 style={{ marginBottom: '20px' }}>Print Label & Tag Configuration</h3>
                    <div className="glass" style={{ padding: '24px', background: 'var(--dark-bg)' }}>
                        <div className="input-group" style={{ marginBottom: '20px' }}>
                            <label>Label Format Strategy</label>
                            <select 
                                value={qrFormat} 
                                onChange={e => setQrFormat(e.target.value)} 
                                style={{ background: 'var(--surface-bg)', padding: '12px', width: '100%', maxWidth: '400px' }}
                            >
                                <option value="qr">Standard QR Code (ID Only)</option>
                                <option value="qr_name_wt">QR + Name & Net Wt</option>
                                <option value="qr_name_wt_stone">QR + Name, Gross/Net & Stone Wt</option>
                                <option value="qr_name_wt_stonewt_details">QR + Full Details (Includes individual stones)</option>
                                <option value="barcode_128">Standard Barcode (CODE128)</option>
                            </select>
                            <p style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                Choose whether to print a standard QR Code or a Barcode (CODE128), and select the level of detail to print alongside it.
                            </p>
                        </div>

                        <div style={{ padding: '20px', background: 'var(--surface-bg)', borderRadius: '12px', border: '1px dashed var(--glass-border)', display: 'inline-block' }}>
                            <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: 'var(--primary-gold)', fontWeight: 600 }}>PREVIEW</p>
                            <div style={{ width: '200px', height: '100px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                                {qrFormat === 'barcode_128' ? (
                                    <div style={{ color: 'black', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                        ||||| |||| |||<br/>
                                        <span style={{ fontSize: '10px' }}>PROD-12345</span>
                                    </div>
                                ) : (
                                    <div style={{ color: 'black', textAlign: 'center', fontWeight: 'bold' }}>
                                        [ QR ]<br/>
                                        {qrFormat !== 'qr' && <span style={{ fontSize: '10px' }}>Details...</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Log Tab */}
            {activeTab === 'audit' && (
                <div className="fade-in">
                    <h3>Administrative Activity History</h3>
                    <div className="glass" style={{ marginTop: '20px', padding: '0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--dark-bg)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                <tr>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Time</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Action</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Details</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.map(log => (
                                    <tr key={log._id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                                        <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                                        <td style={{ padding: '15px' }}><span style={{ color: 'var(--primary-gold)', fontWeight: 600 }}>{log.action}</span></td>
                                        <td style={{ padding: '15px' }}>{log.details}</td>
                                        <td style={{ padding: '15px' }}>{log.user?.username}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Team/Users Tab */}
            {activeTab === 'users' && (
                <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>User & Permissions Management</h3>
                        <button className="btn-primary" onClick={() => setShowUserModal(true)} style={{ padding: '8px 15px', borderRadius: '8px' }}>+ New User</button>
                    </div>

                    {showUserModal && (
                        <div className="modal-overlay" style={{ position: 'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 1100 }}>
                            <div className="glass" style={{ width:'400px', padding:'24px' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px' }}>
                                    <h3>Create System User</h3>
                                    <X size={20} cursor="pointer" onClick={() => setShowUserModal(false)} />
                                </div>
                                <form onSubmit={handleCreateUser}>
                                    <div className="input-group"><label>Username</label><input required value={newUserData.username} onChange={e => setNewUserData({...newUserData, username: e.target.value})} /></div>
                                    <div className="input-group"><label>Password</label><input type="password" required value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} /></div>
                                    <div className="input-group">
                                        <label>Role</label>
                                        <select value={newUserData.role} onChange={e => setNewUserData({...newUserData, role: e.target.value})} style={{ width:'100%', padding:'10px', background:'var(--dark-bg)', color:'white', border:'none', borderRadius:'8px' }}>
                                            <option value="admin">Admin (All Power)</option>
                                            <option value="accountant">Accountant</option>
                                            <option value="worker">Worker (View Only)</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ width:'100%', marginTop:'10px' }}>Create User</button>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--dark-bg)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                <tr>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>User</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Role</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Permissions</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '15px', fontWeight: 600 }}>{u.username}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{ background: 'var(--hover-bg)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem' }}>{u.role}</span>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                {u.permissions?.map(p => <span key={p} style={{ fontSize: '0.65rem', color: 'var(--primary-gold)' }}>• {p}</span>)}
                                                {(!u.permissions || u.permissions.length === 0) && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No direct permissions</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'right' }}>
                                            <button className="glass" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>Manager Actions</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
                <div className="fade-in">
                    <div style={{ padding: '24px', background: 'rgba(231, 76, 60, 0.05)', border: '1px solid var(--danger)', borderRadius: '15px' }}>
                        <h4 style={{ color: 'var(--danger)', marginBottom: '10px' }}>System Maintenance (Danger Zone)</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>Perform hard system resets and database maintenance here. These actions are irreversible.</p>
                        <button onClick={handleClearData} className="glass" style={{ padding: '12px 24px', color: 'var(--danger)', fontWeight: 700, border: '1px solid var(--danger)' }}>
                            WIPE ALL TRANSACTION DATA
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const RateCard = ({ icon, title, value, unit, onChange }) => (
    <div className="glass" style={{ padding: '20px', background: 'var(--dark-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            {icon}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <input 
                type="number" 
                value={value} 
                onChange={e => onChange(e.target.value)}
                style={{ width: '100px', fontSize: '1.4rem', fontWeight: 700, background: 'transparent', border: 'none', color: 'var(--text-main)', borderBottom: '1px solid var(--glass-border)' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{unit || '₹ / g'}</span>
        </div>
    </div>
);

export default Settings;
