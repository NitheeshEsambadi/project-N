import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import { Plus, Edit2, Trash2, Search, Eye, Phone } from 'lucide-react';

const Workers = () => {
    const navigate = useNavigate();
    const [workers, setWorkers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '', contact: '', specialization: '', labourRateType: 'perGram', baseRate: ''
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
            specialization: worker.specialization || '',
            labourRateType: worker.labourRateType || 'perGram',
            baseRate: worker.baseRate || ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: '', contact: '', specialization: '', labourRateType: 'perGram', baseRate: '' });
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
        w.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.workerID?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    placeholder="Search by ID, name or specialization..." 
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
                            <th style={{ padding: '12px' }}>Specialization</th>
                            <th style={{ padding: '12px' }}>Rate Type</th>
                            <th style={{ padding: '12px' }}>Base Rate</th>
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
                                <td style={{ padding: '16px 12px', fontWeight: 500 }}>{w.name}</td>
                                <td style={{ padding: '16px 12px' }}>
                                    {w.contact ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <Phone size={13}/> {w.contact}
                                        </span>
                                    ) : '—'}
                                </td>
                                <td style={{ padding: '16px 12px' }}>{w.specialization}</td>
                                <td style={{ padding: '16px 12px' }}>
                                    <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', background: 'rgba(52, 152, 219, 0.1)', color: 'var(--accent-blue)' }}>
                                        {w.labourRateType}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 12px' }}>₹{w.baseRate}</td>
                                <td style={{ padding: '16px 12px' }} onClick={e => e.stopPropagation()}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Eye size={16} title="View Dashboard" onClick={() => navigate(`/workers/${w._id}`)} style={{ cursor: 'pointer', color: 'var(--primary-gold)' }} />
                                        <Edit2 size={16} title="Edit Worker" onClick={() => handleEdit(w)} style={{ cursor: 'pointer', color: 'var(--accent-blue)' }} />
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
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
                }}>
                    <div className="glass" style={{ width: '90%', maxWidth: '480px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '20px' }}>{editingId ? 'Edit Worker' : 'Register New Worker'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group"><label>Full Name *</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                            <div className="input-group"><label>Contact Number</label><input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="e.g., 98765 43210" /></div>
                            <div className="input-group"><label>Specialization</label><input value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} /></div>
                            <div className="input-group">
                                <label>Labour Rate Type</label>
                                <select 
                                    value={formData.labourRateType} 
                                    onChange={e => setFormData({...formData, labourRateType: e.target.value})}
                                    style={{ width: '100%', background: 'var(--surface-bg)', color: 'var(--text-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                                >
                                    <option value="perGram">Per Gram</option>
                                    <option value="perPiece">Per Piece</option>
                                    <option value="fixed">Fixed Rate</option>
                                </select>
                            </div>
                            <div className="input-group"><label>Base Rate (₹)</label><input type="number" required value={formData.baseRate} onChange={e => setFormData({...formData, baseRate: e.target.value})} /></div>
                            
                            {!editingId && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '10px' }}>Worker ID will be auto-generated (e.g., W001)</p>}
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="button" className="glass" onClick={closeModal} style={{ flex: 1, padding: '12px', color: 'var(--text-main)' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingId ? 'Update Worker' : 'Save Worker'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Workers;
