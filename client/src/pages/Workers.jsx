import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Search, Eye, Phone, Settings2, X } from 'lucide-react';

const Workers = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [workers, setWorkers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [editingId, setEditingId] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '', contact: '', identityNumber: ''
    });

    const [adjustmentData, setAdjustmentData] = useState({
        type: 'payment', amount: '', goldAmount: '', notes: ''
    });

    useEffect(() => {
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        try {
            const { data } = await api.get('/workers');
            setWorkers(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (worker) => {
        setEditingId(worker._id);
        setFormData({
            name: worker.name || '',
            contact: worker.contact || '',
            identityNumber: worker.identityNumber || ''
        });
        setShowModal(true);
    };

    const handleOpenAdjustment = (worker) => {
        setSelectedWorker(worker);
        setAdjustmentData({ type: 'payment', amount: '', goldAmount: '', notes: 'Manual Adjustment' });
        setShowAdjustmentModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: '', contact: '', identityNumber: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/workers/${editingId}`, formData);
            } else {
                await api.post('/workers', formData);
            }
            closeModal();
            fetchWorkers();
        } catch (err) {
            const msg = err.response?.data?.message || 'Error saving worker';
            alert(msg);
            console.error(err);
        }
    };

    const handleAdjustmentSubmit = async (e) => {
        e.preventDefault();
        try {
            // We'll create a manual transaction for adjustments
            await api.post('/mgmt/transactions', {
                ...adjustmentData,
                workerId: selectedWorker._id,
                amount: parseFloat(adjustmentData.amount) || 0,
                goldAmount: parseFloat(adjustmentData.goldAmount) || 0
            });
            setShowAdjustmentModal(false);
            alert('Adjustment applied successfully');
            fetchWorkers();
        } catch (err) {
            alert('Error applying adjustment');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this worker?')) return;
        try {
            await api.delete(`/workers/${id}`);
            fetchWorkers();
        } catch (err) {
            alert('Error deleting worker: ' + (err.response?.data?.message || err.message));
        }
    };

    const filtered = workers.filter(w => 
        w.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        w.workerID?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isAdmin = user?.role === 'admin';

    return (
        <div className="glass" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 className="gold-gradient">WORKER DIRECTORY</h2>
                <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> <span className="desktop-only">Add Worker</span><span className="mobile-only">Add</span>
                </button>
            </div>

            <div style={{ marginBottom: '20px', position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} size={18}/>
                <input 
                    type="text" 
                    placeholder="Search by ID or name..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="glass" 
                    style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'var(--surface-bg)', border: 'none', color: 'var(--text-main)' }}
                />
            </div>

            <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '12px' }}>Worker ID</th>
                            <th style={{ padding: '12px' }}>Name</th>
                            <th style={{ padding: '12px' }}>Contact</th>
                            <th style={{ padding: '12px' }}>Identity Number</th>
                            <th style={{ padding: '12px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(w => (
                            <tr key={w._id} style={{ borderTop: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => navigate(`/workers/${w._id}`)}>
                                <td style={{ padding: '16px 12px' }}>
                                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--primary-gold)', fontWeight: 600, fontFamily: 'monospace' }}>
                                        {w.workerID || '—'}
                                    </span>
                                </td>
                                <td 
                                    style={{ 
                                        padding: '16px 12px', 
                                        fontWeight: 600, 
                                        color: 'var(--primary-gold)', 
                                        cursor: 'pointer' 
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/workers/${w._id}`);
                                    }}
                                    title="Click to view worker profile"
                                >
                                    <span>
                                        {w.name}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 12px' }}>
                                    {w.contact ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <Phone size={13}/> {w.contact}
                                        </span>
                                    ) : '—'}
                                </td>
                                <td style={{ padding: '16px 12px' }}>{w.identityNumber || '—'}</td>
                                <td style={{ padding: '16px 12px' }} onClick={e => e.stopPropagation()}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Eye size={16} title="View Dashboard" onClick={() => navigate(`/workers/${w._id}`)} style={{ cursor: 'pointer', color: 'var(--primary-gold)' }} />
                                        <Edit2 size={16} title="Edit Worker" onClick={() => handleEdit(w)} style={{ cursor: 'pointer', color: 'var(--accent-blue)' }} />
                                        {isAdmin && (
                                            <Settings2 size={16} title="Adjust History" onClick={() => handleOpenAdjustment(w)} style={{ cursor: 'pointer', color: 'var(--primary-gold)' }} />
                                        )}
                                        <Trash2 size={16} onClick={() => handleDelete(w._id)} style={{ cursor: 'pointer', color: 'var(--danger)' }} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filtered.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>No workers found.</p>
            )}

            {showModal && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
                    background: 'rgba(0, 0, 0, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    zIndex: 1000, backdropFilter: 'blur(4px)'
                }}>
                    <div className="glass" style={{ 
                        width: '90%', maxWidth: '460px', padding: '32px', borderRadius: '16px', 
                        maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--glass-border)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {editingId ? 'Edit Worker' : 'Register New Worker'}
                            </h3>
                            <button type="button" onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        Full Name *
                                    </label>
                                    <input 
                                        required 
                                        type="text"
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g. Rahul Sharma"
                                        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        Contact Number *
                                    </label>
                                    <input 
                                        required 
                                        type="tel" 
                                        value={formData.contact} 
                                        onChange={e => setFormData({...formData, contact: e.target.value.replace(/\D/g, '')})} 
                                        placeholder="e.g., 9876543210" 
                                        pattern="[0-9]{10}"
                                        maxLength={10}
                                        title="Mobile number must be exactly 10 digits"
                                        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        Identity Proof Number (Optional)
                                    </label>
                                    <input 
                                        type="text"
                                        value={formData.identityNumber} 
                                        onChange={e => setFormData({...formData, identityNumber: e.target.value})} 
                                        placeholder="e.g., Aadhar / PAN" 
                                        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                                <button type="button" className="glass" onClick={closeModal} style={{ padding: '10px 20px', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600, border: '1px solid var(--glass-border)' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" style={{ padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                    Save Worker
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAdjustmentModal && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
                }}>
                    <div className="glass" style={{ width: '90%', maxWidth: '480px', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 className="gold-gradient">History Adjustment: {selectedWorker?.name}</h3>
                            <X size={20} onClick={() => setShowAdjustmentModal(false)} style={{ cursor: 'pointer' }} />
                        </div>
                        <form onSubmit={handleAdjustmentSubmit}>
                            <div className="input-group">
                                <label>Adjustment Type</label>
                                <select value={adjustmentData.type} onChange={e => setAdjustmentData({...adjustmentData, type: e.target.value})} style={{ width: '100%', background: 'var(--surface-bg)', color: 'var(--text-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                    <option value="payment">Debit (Give/Subtract from worker)</option>
                                    <option value="earning">Credit (Add to worker balance)</option>
                                </select>
                            </div>
                            <div className="responsive-grid" style={{ gap: '15px' }}>
                                <div className="input-group"><label>Cash Amount (₹)</label><input type="number" value={adjustmentData.amount} onChange={e => setAdjustmentData({...adjustmentData, amount: e.target.value})} placeholder="0" /></div>
                                <div className="input-group"><label>Gold Weight (g)</label><input type="number" step="0.001" value={adjustmentData.goldAmount} onChange={e => setAdjustmentData({...adjustmentData, goldAmount: e.target.value})} placeholder="0.000" /></div>
                            </div>
                            <div className="input-group"><label>Notes / Reason</label><input required value={adjustmentData.notes} onChange={e => setAdjustmentData({...adjustmentData, notes: e.target.value})} /></div>
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="button" className="glass" onClick={() => setShowAdjustmentModal(false)} style={{ flex: 1, padding: '12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Apply Adjustment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Workers;
