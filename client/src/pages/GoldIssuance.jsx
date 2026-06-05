import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash2, Clock, CheckCircle, AlertCircle, Eye, Edit2, X, Search, Filter, Calendar, Percent, Gem, Scale, Settings } from 'lucide-react';

const GoldIssuance = () => {
  const [issues, setIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [companyStones, setCompanyStones] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  
  const [formData, setFormData] = useState({
    workerId: '',
    weight: '',
    purity: '22k',
    expectedWastage: '0',
    deliveryDate: '',
    notes: '',
    stones: [],
    itemName: '',
    category: '',
    cashIssued: ''
  });

  const [purityStandards, setPurityStandards] = useState([]);
  const [workerSearchText, setWorkerSearchText] = useState('');
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);

  const filteredWorkers = workers.filter(w => 
    (w.name || '').toLowerCase().includes(workerSearchText.toLowerCase())
  );
  
  useEffect(() => {
    fetchIssues();
    fetchWorkers();
    fetchCompanyData();
  }, []);

  const fetchIssues = async () => {
    try {
      const { data } = await api.get('/gold');
      setIssues(data);
    } catch (err) {
      console.error('Error fetching issues:', err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const { data } = await api.get('/workers');
      setWorkers(data);
    } catch (err) {
      console.error('Error fetching workers:', err);
    }
  };

  const fetchCompanyData = async () => {
    try {
      const { data } = await api.get('/company');
      if (data) {
          if (data.stones) {
              const activeStones = data.stones.filter(s => s.status !== 'Inactive');
              setCompanyStones(activeStones);
          }
          if (data.purityStandards) setPurityStandards(data.purityStandards);
      }
    } catch (err) {
      console.error('Error fetching company data:', err);
    }
  };

  const openModal = (issue = null) => {
    if (issue) {
      setEditingId(issue._id);
      setFormData({
        workerId: issue.workerId?._id || '',
        weight: issue.weight,
        purity: issue.purity,
        expectedWastage: issue.expectedWastage,
        deliveryDate: issue.deliveryDate ? new Date(issue.deliveryDate).toISOString().split('T')[0] : '',
        notes: issue.notes || '',
        stones: issue.stones || [],
        itemName: issue.itemName || '',
        category: issue.category || '',
        cashIssued: issue.cashIssued || ''
      });
      setWorkerSearchText(issue.workerId?.name || '');
    } else {
      setEditingId(null);
      setFormData({ 
        workerId: '', 
        weight: '', 
        purity: '22k', 
        expectedWastage: '0', 
        deliveryDate: '', 
        notes: '', 
        stones: [],
        itemName: '',
        category: '',
        cashIssued: ''
      });
      setWorkerSearchText('');
    }
    setShowWorkerDropdown(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/mgmt/gold/${editingId}`, formData);
      } else {
        await api.post('/mgmt/gold', formData);
      }
      setShowModal(false);
      fetchIssues();
    } catch (err) {
      alert('Error saving issuance');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this gold issuance?')) return;
    try {
      await api.delete(`/mgmt/gold/${id}`);
      fetchIssues();
    } catch(err) {
      alert('Error deleting');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/mgmt/gold/${id}`, { status });
      fetchIssues();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const addStone = () => {
    setFormData({ ...formData, stones: [...formData.stones, { stoneName: '', stoneWeight: '' }] });
  };

  const updateStone = (index, field, value) => {
    const newStones = [...formData.stones];
    newStones[index][field] = value;
    setFormData({ ...formData, stones: newStones });
  };

  const removeStone = (index) => {
    const newStones = [...formData.stones];
    newStones.splice(index, 1);
    setFormData({ ...formData, stones: newStones });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'rgba(160, 196, 255, 0.2)', color: '#A0C4FF', icon: <Clock size={14}/> },
      completed: { bg: 'rgba(202, 255, 191, 0.2)', color: '#2ecc71', icon: <CheckCircle size={14}/> }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{ 
        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', 
        borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: style.bg, color: style.color, border: `1px solid ${style.color}33`, width: 'fit-content'
      }}>
        {style.icon} {status.toUpperCase()}
      </span>
    );
  };

  const filteredIssues = issues.filter(issue => 
    issue.workerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass" style={{ padding: '24px', background: 'var(--surface-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 className="gold-gradient" style={{ fontSize: '1.8rem' }}>MATERIAL LEDGER</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Track metal and stones handed over for production</p>
        </div>
        <button className="btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}>
          <Plus size={18} /> New Issuance
        </button>
      </div>

      <div style={{ marginBottom: '25px', position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '15px', top: '15px', color: 'var(--text-muted)' }} size={20}/>
        <input 
            type="text" 
            placeholder="Filter by worker name or notes..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '15px 15px 15px 50px', background: 'var(--dark-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '1rem' }}
        />
      </div>

      {/* View Toggle and Cards Grid / Table */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '10px' }}>
        <button 
          onClick={() => setViewMode('cards')} 
          className={viewMode === 'cards' ? 'btn-primary' : 'glass'}
          style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          Cards View
        </button>
        <button 
          onClick={() => setViewMode('table')} 
          className={viewMode === 'table' ? 'btn-primary' : 'glass'}
          style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          Table View
        </button>
      </div>

      {viewMode === 'cards' ? (
        <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {filteredIssues.map(issue => {
            // Generate a clean serial number based on worker and date
            const dateStr = issue.createdAt 
              ? new Date(issue.createdAt).toLocaleDateString('en-GB').replace(/\//g, '')
              : '05062026';
            const workerNum = issue.workerId?.workerID || '001';
            const serialNumber = `00${workerNum}${dateStr}${issue._id ? issue._id.substring(issue._id.length - 4) : '0001'}`;

            // Determine title and category (using worker specialization or notes as fallback)
            const title = issue.itemName || (issue.notes && issue.notes.split('\n')[0].length < 15 
              ? issue.notes.split('\n')[0] 
              : (issue.workerId?.specialization || 'Gold Jewelry'));
            const subtitle = issue.category || (issue.purity ? `${issue.purity} Gold (${issue.purity})` : 'Standard');

            // Calculate estimated cash issued (baseRate * weight) or fallback
            const estimatedCash = issue.cashIssued || Math.round((issue.workerId?.baseRate || 500) * issue.weight);

            return (
              <div 
                key={issue._id} 
                className="glass-card fade-in" 
                style={{ 
                  padding: '14px', 
                  background: '#0D0C12', // Match very dark background from user image
                  border: '2px solid #3c1e70', // Deep purple border
                  borderRadius: '16px', // Rounded corners
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'relative',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)'
                }}
              >
                {/* Top Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  {/* Serial Number Pill */}
                  <div style={{ 
                    border: '1px solid #282630', 
                    borderRadius: '6px', 
                    padding: '3px 6px', 
                    fontSize: '0.7rem', 
                    color: '#AFAEB4',
                    fontFamily: 'monospace',
                    background: '#16151B'
                  }}>
                    {serialNumber}
                  </div>

                  {/* Actions Header */}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {issue.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => updateStatus(issue._id, 'completed')}
                          title="Manage Issuance"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#8B45FF',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Settings size={16} />
                        </button>
                        <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.12)' }} />
                      </>
                    )}
                    <button 
                      onClick={() => openModal(issue)} 
                      title="Edit"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#8B45FF',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.12)' }} />
                    <button 
                      onClick={() => handleDelete(issue._id)} 
                      title="Delete"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FF453A',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={16} style={{ color: '#FF453A' }} />
                    </button>
                  </div>
                </div>

                {/* Product Title / Category */}
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#FFF', fontWeight: '700', letterSpacing: '-0.02em', lineHeight: '1.2' }}>{title}</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#FF2E93', fontWeight: '600', fontSize: '0.95rem' }}>{subtitle}</p>
                </div>

                {/* Three Column Stats Grid */}
                <div style={{ 
                  background: '#131219', 
                  border: '1px solid #201E2A',
                  borderRadius: '12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  padding: '12px 6px',
                  textAlign: 'center',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  {/* Issued Weight */}
                  <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                      <Scale size={18} style={{ color: '#8B45FF' }} />
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF' }}>{issue.weight}g</div>
                    <div style={{ fontSize: '0.7rem', color: '#8F8B9E', textTransform: 'capitalize', marginTop: '2px' }}>Issued Wt</div>
                  </div>

                  {/* Stones */}
                  <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                      <Gem size={18} style={{ color: '#8B45FF' }} />
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF' }}>
                      {(issue.stones?.reduce((acc, st) => acc + (parseFloat(st.stoneWeight) || 0), 0) || issue.totalStoneWeight || 0).toFixed(2)}g
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#8F8B9E', textTransform: 'capitalize', marginTop: '2px' }}>Stone Wt</div>
                  </div>

                  {/* Cash Issued */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px', height: '18px', alignItems: 'center' }}>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#32D74B', lineHeight: '18px' }}>₹</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#32D74B' }}>
                      {(issue.cashIssued || 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#8F8B9E', textTransform: 'capitalize', marginTop: '2px' }}>Cash Issued</div>
                  </div>
                </div>
                {/* Craftsman Info Block with Status next to Name */}
                <div style={{ 
                  background: '#131219', 
                  border: '1px solid #201E2A',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '750', color: '#FFF' }}>{issue.workerId?.name || 'N/A'}</div>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      padding: '3px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.65rem', 
                      fontWeight: 700, 
                      background: 'rgba(139, 69, 255, 0.12)', 
                      color: '#8B45FF',
                      border: '1px solid rgba(139, 69, 255, 0.2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      <Clock size={10} style={{ color: '#8B45FF' }} /> {issue.status}
                    </span>
                  </div>
                  {issue.workerId?.contact && (
                    <div style={{ fontSize: '0.75rem', color: '#8F8B9E', marginTop: '4px' }}>{issue.workerId.contact}</div>
                  )}
                </div>

                {/* Full Width Action Button at the bottom */}
                {issue.status === 'pending' && (
                  <button 
                    onClick={() => updateStatus(issue._id, 'completed')}
                    style={{ 
                      width: '100%',
                      background: 'transparent',
                      border: '2px solid #8B45FF',
                      borderRadius: '12px',
                      color: '#8B45FF',
                      fontWeight: 700,
                      fontSize: '1rem',
                      padding: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#8B45FF';
                      e.currentTarget.style.color = '#FFF';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#8B45FF';
                    }}
                  >
                    Receive Work <span style={{ fontSize: '1.2rem', lineHeight: '1rem' }}>&rsaquo;</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--surface-bg)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'var(--dark-bg)', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                <th style={{ padding: '20px' }}>Handed To</th>
                <th style={{ padding: '20px' }}>Weight / Purity</th>
                <th style={{ padding: '20px' }}>Stones Attached</th>
                <th style={{ padding: '20px' }}>Exp. Delivery</th>
                <th style={{ padding: '20px' }}>Current Status</th>
                <th style={{ padding: '20px', textAlign: 'right' }}>Management</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map(issue => (
                <tr key={issue._id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'var(--transition)' }}>
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{issue.workerId?.name || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{issue.weight}g</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{issue.purity} Gold</div>
                  </td>
                  <td style={{ padding: '18px 20px' }}>
                    {issue.stones && issue.stones.length > 0 ? (
                        <span style={{ fontSize: '0.85rem', background: 'var(--hover-bg)', padding: '4px 10px', borderRadius: '6px' }}>{issue.stones.length} unique items</span>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>None</span>}
                  </td>
                  <td style={{ padding: '18px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {issue.deliveryDate ? new Date(issue.deliveryDate).toLocaleDateString() : 'No date set'}
                  </td>
                  <td style={{ padding: '18px 20px' }}>
                      {getStatusBadge(issue.status)}
                  </td>
                  <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          {issue.status === 'pending' && (
                              <button 
                                  onClick={() => updateStatus(issue._id, 'completed')}
                                  style={{ background: 'var(--success)', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '8px', color: 'white', display: 'flex', alignItems: 'center' }}
                                  title="Mark as Received"
                              >
                                  <CheckCircle size={18} />
                              </button>
                          )}
                          <button onClick={() => openModal(issue)} style={{ background: 'var(--dark-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', padding: '8px', color: 'var(--text-muted)' }} title="Edit Record">
                              <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(issue._id)} style={{ background: 'rgba(255, 198, 255, 0.2)', border: '1px solid var(--danger)', borderRadius: '8px', cursor: 'pointer', padding: '8px', color: 'var(--secondary-gold)' }} title="Delete Record">
                              <Trash2 size={16} />
                          </button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredIssues.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <Clock size={48} style={{ opacity: 0.1, marginBottom: '15px' }} />
              <p>No material issuance records found.</p>
          </div>
      )}

      {showModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div className="glass" style={{ width: '90%', maxWidth: '650px', padding: '30px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem' }} className="gold-gradient">{editingId ? 'Modify Issuance' : 'New Metal & Stone Issuance'}</h3>
                <X onClick={() => setShowModal(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} size={24}/>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group" style={{ position: 'relative' }}>
                <label>Responsible Craftsman *</label>
                <input 
                  type="text"
                  required 
                  value={workerSearchText} 
                  onFocus={() => setShowWorkerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowWorkerDropdown(false), 200)}
                  onChange={e => {
                    const val = e.target.value;
                    setWorkerSearchText(val);
                    const worker = workers.find(w => w.name.toLowerCase() === val.toLowerCase());
                    setFormData(prev => ({ ...prev, workerId: worker ? worker._id : '' }));
                  }} 
                  placeholder="Type to search craftsman..." 
                  style={{ background: 'var(--dark-bg)', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '8px', width: '100%', color: 'var(--text-main)' }} 
                />
                {showWorkerDropdown && (
                  <div className="custom-autocomplete-dropdown">
                    {filteredWorkers.length > 0 ? (
                      filteredWorkers.map(w => (
                        <div 
                          key={w._id}
                          onMouseDown={() => {
                            setWorkerSearchText(w.name);
                            setFormData(prev => ({ ...prev, workerId: w._id }));
                            setShowWorkerDropdown(false);
                          }}
                          className="custom-autocomplete-item"
                        >
                          {w.name}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '10px 14px', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                        No workers found
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="responsive-grid" style={{ gap: '20px', marginBottom: '10px' }}>
                <div className="input-group">
                    <label>Item Name (e.g., Chain) *</label>
                    <input required type="text" placeholder="Chain, Ring, Bangle..." value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                </div>
                <div className="input-group">
                    <label>Category (e.g., Studs) *</label>
                    <input required type="text" placeholder="Studs, Antique, Plain..." value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                </div>
              </div>

              <div className="responsive-grid" style={{ gap: '20px' }}>
                <div className="input-group">
                    <label>Metal Weight (Grams) *</label>
                    <input required type="number" step="0.01" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                </div>
                <div className="input-group" style={{ opacity: 0.85 }}>
                    <label>Purity Standard</label>
                    <select 
                        value={formData.purity} 
                        onChange={e => setFormData({...formData, purity: e.target.value})}
                        style={{ background: 'var(--dark-bg)' }}
                    >
                        {purityStandards.length > 0 ? (
                            purityStandards.map(ps => <option key={ps.label} value={ps.label}>{ps.label}</option>)
                        ) : (
                            <>
                                <option value="22k">22k Gold</option>
                                <option value="24k">24k Gold</option>
                                <option value="18k">18k Gold</option>
                            </>
                        )}
                    </select>
                </div>
                <div className="input-group">
                    <label>Cash Issued (₹)</label>
                    <input type="number" placeholder="25000" value={formData.cashIssued} onChange={e => setFormData({...formData, cashIssued: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                </div>
              </div>

              {/* Stones Section */}
              <div style={{ marginBottom: '25px', padding: '20px', background: 'var(--dark-bg)', borderRadius: '15px', opacity: 0.85 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                   <label style={{ margin: 0, fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>ATTACHED STONES</label>
                   <button type="button" onClick={addStone} style={{ background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>+ Add Stone</button>
                </div>
                
                <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
                    {formData.stones.map((stone, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', background: 'var(--surface-bg)', padding: '12px', borderRadius: '10px' }}>
                        <div style={{ flex: 2, position: 'relative' }}>
                            <input 
                                list={`gold-iss-stone-${idx}`}
                                placeholder="Stone Type"
                                value={stone.stoneName} 
                                onChange={e => updateStone(idx, 'stoneName', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--glass-border)', borderRadius: '6px' }}
                            />
                            <datalist id={`gold-iss-stone-${idx}`}>
                                {companyStones.map(cs => <option key={cs.stoneName} value={cs.stoneName}>{cs.stoneName}</option>)}
                            </datalist>
                        </div>
                        <input type="number" step="0.01" required placeholder="Weight" value={stone.stoneWeight} onChange={e => updateStone(idx, 'stoneWeight', e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid var(--glass-border)', borderRadius: '6px' }} />
                        <Trash2 size={18} onClick={() => removeStone(idx)} color="var(--danger)" style={{ cursor: 'pointer' }} />
                    </div>
                    ))}
                    {formData.stones.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>No stones included in this assignment.</p>}
                </div>
              </div>

              <div className="responsive-grid" style={{ gap: '20px' }}>
                <div className="input-group" style={{ opacity: 0.8 }}>
                    <label>Allowed Wastage %</label>
                    <input type="number" step="0.1" value={formData.expectedWastage} onChange={e => setFormData({...formData, expectedWastage: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                </div>
                <div className="input-group" style={{ opacity: 0.8 }}>
                    <label>Due Date</label>
                    <input type="date" value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                </div>
              </div>

              <div className="input-group" style={{ opacity: 0.8 }}>
                <label>Working Notes / Instructions</label>
                <textarea 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Specific design instructions or quality notes (optional)..."
                    style={{ background: 'var(--dark-bg)', minHeight: '100px' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" className="glass" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '15px', fontWeight: 600 }}>Discard</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, fontWeight: 600, borderRadius: '10px' }}>{editingId ? 'Save Changes' : 'Confirm Issuance'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoldIssuance;
