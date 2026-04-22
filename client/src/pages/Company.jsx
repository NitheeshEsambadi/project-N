import React, { useState, useEffect } from 'react';
import api from '../api';
import { Save, Plus, Trash2, Tag, Gem, QrCode, Image as ImageIcon } from 'lucide-react';

const Company = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [stones, setStones] = useState([]);
  const [qrFormat, setQrFormat] = useState('qr');
  const [logo, setLogo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/company');
      if (data) {
        setCategories(data.categories || []);
        setStones(data.stones || []);
        setQrFormat(data.qrFormat || 'qr');
        setLogo(data.logo || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/company', { categories, stones, qrFormat, logo });
      alert('Company settings saved successfully!');
    } catch (err) {
      alert('Error saving settings: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const updateArray = (setter, items, index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setter(newItems);
  };

  const removeArrayItem = (setter, items, index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setter(newItems);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'logo', label: 'Brand Logo', icon: <ImageIcon size={16}/> },
    { id: 'categories', label: 'Categories / Products', icon: <Tag size={16}/> },
    { id: 'stones', label: 'Stone Types', icon: <Gem size={16}/> },
    { id: 'qr', label: 'QR Settings', icon: <QrCode size={16}/> },
  ];

  if (loading) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading company profile...</div>;

  return (
    <div className="glass" style={{ padding: '24px', background: 'var(--surface-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 className="gold-gradient" style={{ fontSize: '1.8rem', marginBottom: '5px' }}>COMPANY PORTAL</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage product types, stones, branding, and print templates</p>
        </div>
        <button 
            className="btn-primary" 
            onClick={handleSave} 
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '50px' }}
        >
          <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', background: 'var(--dark-bg)', padding: '6px', borderRadius: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '12px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'var(--transition)', minWidth: '150px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: activeTab === tab.id ? 'var(--surface-bg)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: activeTab === tab.id ? '0 2px 5px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'logo' && (
        <div style={{ padding: '10px' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '15px' }}>Company Logo</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Upload your brand logo for invoices and dashboards.</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '30px', flexWrap: 'wrap' }}>
            <div style={{ 
                width: '180px', height: '180px', borderRadius: '12px', border: '2px dashed var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark-bg)', overflow: 'hidden'
            }}>
                {logo ? <img src={logo} alt="Company Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <ImageIcon size={48} color="var(--text-muted)" opacity={0.5} />}
            </div>
            <div style={{ flex: 1 }}>
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} id="logoUpload" />
                <label htmlFor="logoUpload" className="btn-primary" style={{ display: 'inline-block', cursor: 'pointer', textTransform: 'none', letterSpacing: 'normal' }}>
                    Choose Image
                </label>
                <div style={{ marginTop: '15px' }}>
                    <button onClick={() => setLogo('')} style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Remove Logo</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div style={{ padding: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
                <h3 style={{ fontSize: '1.4rem' }}>Product Categories</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>Define the types of jewellery your company produces.</p>
            </div>
            <button 
                onClick={() => setCategories([...categories, { name: '', code: '' }])}
                style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--dark-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              <Plus size={16}/> Add Category
            </button>
          </div>
          <div className="responsive-grid" style={{ gap: '15px' }}>
              {categories.map((cat, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'var(--dark-bg)', padding: '15px', borderRadius: '12px' }}>
                      <div className="input-group" style={{ marginBottom: 0, flex: 2 }}>
                          <input placeholder="Name (e.g. Necklace)" value={cat.name} onChange={(e) => updateArray(setCategories, categories, idx, 'name', e.target.value)} style={{ border: 'none' }} />
                      </div>
                      <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                          <input placeholder="Code (e.g. NE)" maxLength="3" value={cat.code} onChange={(e) => updateArray(setCategories, categories, idx, 'code', e.target.value.toUpperCase())} style={{ border: 'none' }} />
                      </div>
                      <Trash2 size={20} color="var(--danger)" cursor="pointer" onClick={() => removeArrayItem(setCategories, categories, idx)} style={{ marginLeft: '5px' }}/>
                  </div>
              ))}
          </div>
          {categories.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px', background: 'var(--dark-bg)', borderRadius: '12px' }}>No categories configured.</p>}
        </div>
      )}

      {activeTab === 'stones' && (
        <div style={{ padding: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
                <h3 style={{ fontSize: '1.4rem' }}>Stone Master List</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>List standard stones used in productions.</p>
            </div>
            <button 
                onClick={() => setStones([...stones, { stoneName: '', stoneType: 'Semiprecious' }])}
                style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--dark-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              <Plus size={16}/> Add Stone
            </button>
          </div>
          <div className="responsive-grid" style={{ gap: '15px' }}>
              {stones.map((stone, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'var(--dark-bg)', padding: '15px', borderRadius: '12px' }}>
                      <div className="input-group" style={{ marginBottom: 0, flex: 2 }}>
                          <input placeholder="Stone Name (e.g. Ruby)" value={stone.stoneName} onChange={(e) => updateArray(setStones, stones, idx, 'stoneName', e.target.value)} style={{ border: 'none' }} />
                      </div>
                      <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                          <select value={stone.stoneType} onChange={(e) => updateArray(setStones, stones, idx, 'stoneType', e.target.value)} style={{ border: 'none', width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--surface-bg)' }}>
                              <option value="Precious">Precious</option>
                              <option value="Semiprecious">Semiprecious</option>
                              <option value="Synthetic">Synthetic</option>
                              <option value="Other">Other</option>
                          </select>
                      </div>
                      <Trash2 size={20} color="var(--danger)" cursor="pointer" onClick={() => removeArrayItem(setStones, stones, idx)} style={{ marginLeft: '5px' }}/>
                  </div>
              ))}
          </div>
          {stones.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px', background: 'var(--dark-bg)', borderRadius: '12px' }}>No stones configured.</p>}
        </div>
      )}

      {activeTab === 'qr' && (
        <div style={{ padding: '10px' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '10px' }}>QR Code Print Template</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '30px' }}>
              Select the data format you want displayed alongside the printed QR label. This setting applies globally to all inventory labels.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px' }}>
              {[
                  { value: 'qr', label: 'QR Code Only (Minimal)' },
                  { value: 'qr_name', label: 'QR Code + Product Design Name' },
                  { value: 'qr_name_wt', label: 'QR + Name + Net Weight' },
                  { value: 'qr_name_wt_stone', label: 'QR + Name + Net/Gross Weight + Stone Total' },
                  { value: 'qr_name_wt_stonewt_details', label: 'Full Manifest (All Details & Stones)' },
              ].map(option => (
                  <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '18px', background: qrFormat === option.value ? 'rgba(255, 183, 178, 0.1)' : 'var(--dark-bg)', border: `2px solid ${qrFormat === option.value ? 'var(--primary-gold)' : 'transparent'}`, borderRadius: '12px', cursor: 'pointer', transition: 'var(--transition)' }}>
                      <input 
                          type="radio" 
                          name="qrTemplate" 
                          value={option.value} 
                          checked={qrFormat === option.value} 
                          onChange={(e) => setQrFormat(e.target.value)}
                          style={{ width: '20px', height: '20px', accentColor: 'var(--secondary-gold)' }}
                      />
                      <span style={{ fontSize: '1.05rem', fontWeight: qrFormat === option.value ? 600 : 500, color: qrFormat === option.value ? 'var(--secondary-gold)' : 'var(--text-main)' }}>{option.label}</span>
                  </label>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Company;
