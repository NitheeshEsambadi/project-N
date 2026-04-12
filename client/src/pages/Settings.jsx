import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Coins, TrendingUp, Users, Database, Save, ToggleLeft, ToggleRight } from 'lucide-react';

const Settings = () => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/settings');
            const settingsObj = data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
            setSettings(settingsObj);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaveStatus('Saving...');
        try {
            const updates = Object.entries(settings).map(([key, value]) => 
                axios.post('http://localhost:5000/api/settings', { key, value })
            );
            await Promise.all(updates);
            setSaveStatus('✓ Saved!');
            setTimeout(() => setSaveStatus(''), 3000);
        } catch (err) {
            setSaveStatus('Error saving settings');
        }
    };

    const handleBackup = async () => {
        try {
            const [w, p, t, i] = await Promise.all([
                axios.get('http://localhost:5000/api/workers'),
                axios.get('http://localhost:5000/api/mgmt/products'),
                axios.get('http://localhost:5000/api/mgmt/transactions'),
                axios.get('http://localhost:5000/api/gold')
            ]);
            const backupData = {
                workers: w.data,
                products: p.data,
                transactions: t.data,
                goldIssues: i.data,
                timestamp: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `jewellery_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        } catch (err) {
            alert('Error generating backup');
        }
    };

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (loading) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading System Configuration...</div>;

    return (
        <div className="glass" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 className="gold-gradient">SYSTEM SETTINGS</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configure global thresholds and system parameters</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {saveStatus && <span style={{ fontSize: '0.85rem', color: 'var(--success)' }}>{saveStatus}</span>}
                    <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Save size={18}/> Save All Changes
                    </button>
                </div>
            </div>

            {/* Rate Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                <RateCard
                    icon={<Coins size={20} color="var(--primary-gold)"/>}
                    title="Gold Rate"
                    value={settings.goldRate || ''}
                    unit="₹ / Gram"
                    onChange={val => setSettings({ ...settings, goldRate: val })}
                    borderColor="var(--primary-gold)"
                />
                <RateCard
                    icon={<Coins size={20} color="#C0C0C0"/>}
                    title="Silver Rate"
                    value={settings.silverRate || ''}
                    unit="₹ / Gram"
                    onChange={val => setSettings({ ...settings, silverRate: val })}
                    borderColor="#C0C0C0"
                />
                <RateCard
                    icon={<TrendingUp size={20} color="var(--danger)"/>}
                    title="Wastage Threshold"
                    value={settings.wastageThreshold || ''}
                    unit="%"
                    onChange={val => setSettings({ ...settings, wastageThreshold: val })}
                    borderColor="var(--danger)"
                />
                <RateCard
                    icon={<Users size={20} color="var(--accent-blue)"/>}
                    title="Labour Base Rate"
                    value={settings.labourBase || ''}
                    unit="₹ / Gram"
                    onChange={val => setSettings({ ...settings, labourBase: val })}
                    borderColor="var(--accent-blue)"
                />
            </div>

            {/* Display Toggles */}
            <div style={{ marginTop: '40px' }}>
                <h3 style={{ marginBottom: '20px' }}>Display Preferences</h3>
                <div className="glass" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <ToggleRow
                        label="Show Gold Rate in Header"
                        description="Displays the current gold rate badge in the main dashboard header."
                        active={settings.showGoldRate !== false}
                        onToggle={() => toggleSetting('showGoldRate')}
                    />
                    <ToggleRow
                        label="Show Silver Rate in Header"
                        description="Displays the current silver rate badge alongside the gold rate."
                        active={!!settings.showSilverRate}
                        onToggle={() => toggleSetting('showSilverRate')}
                    />
                </div>
            </div>

            {/* Business Parameters */}
            <div style={{ marginTop: '40px' }}>
                <h3 style={{ marginBottom: '20px' }}>Business Parameters</h3>
                <div className="glass" style={{ padding: '30px' }}>
                    <div className="input-group">
                        <label>Organization Name</label>
                        <input 
                            type="text" 
                            value={settings.orgName || 'PRO JEWELLERY MASTERS'} 
                            onChange={e => setSettings({ ...settings, orgName: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="input-group">
                            <label>Default Wastage Allowance (%)</label>
                            <input 
                                type="number" step="0.1" 
                                value={settings.wastageThreshold || 5.0} 
                                onChange={e => setSettings({ ...settings, wastageThreshold: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label>Max Allowed Variance (%)</label>
                            <input 
                                type="number" step="0.1" 
                                value={settings.maxVariance || 1.5} 
                                onChange={e => setSettings({ ...settings, maxVariance: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="glass" style={{ marginTop: '30px', padding: '24px', borderLeft: '4px solid var(--danger)' }}>
                <h4 style={{ color: 'var(--danger)', marginBottom: '8px' }}>Security & Backups</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ensure your data is safe by enabling daily automated backups.</p>
                <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                    <button className="glass" onClick={handleBackup} style={{ padding: '10px 20px', color: 'white', fontSize: '0.9rem' }}>Download DB Backup</button>
                    <button className="glass" style={{ padding: '10px 20px', color: 'var(--danger)', fontSize: '0.9rem' }}>Internal System Audit</button>
                </div>
            </div>
        </div>
    );
};

const RateCard = ({ icon, title, value, unit, onChange, borderColor }) => (
    <div className="glass" style={{ padding: '24px', borderTop: `3px solid ${borderColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            {icon}
            <h3 style={{ fontSize: '1rem' }}>{title}</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <input 
                type="number" 
                value={value} 
                onChange={e => onChange(e.target.value)}
                style={{ width: '120px', fontSize: '1.5rem', fontWeight: 600, background: 'transparent', border: 'none', color: 'white', borderBottom: `2px solid ${borderColor}`, outline: 'none' }}
                placeholder="0"
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{unit}</span>
        </div>
    </div>
);

const ToggleRow = ({ label, description, active, onToggle }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(0,0,0,0.15)', borderRadius: '12px' }}>
        <div>
            <p style={{ fontWeight: 500 }}>{label}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>{description}</p>
        </div>
        <button 
            onClick={onToggle} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: active ? 'var(--success)' : 'var(--text-muted)', transition: 'var(--transition)' }}
        >
            {active ? <ToggleRight size={32}/> : <ToggleLeft size={32}/>}
        </button>
    </div>
);

export default Settings;
