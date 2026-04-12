import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';

const GoldIssuance = () => {
  const [issues, setIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    workerId: '',
    weight: '',
    purity: '22k',
    expectedWastage: '0',
    deliveryDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchIssues();
    fetchWorkers();
  }, []);

  const fetchIssues = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/gold', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIssues(data);
    } catch (err) {
      console.error('Error fetching issues:', err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/workers');
      setWorkers(data);
    } catch (err) {
      console.error('Error fetching workers:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/gold', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setShowModal(false);
      setFormData({ workerId: '', weight: '', purity: '22k', expectedWastage: '0', deliveryDate: '', notes: '' });
      fetchIssues();
    } catch (err) {
      alert('Error recording issuance');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`http://localhost:5000/api/gold/${id}`, { status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchIssues();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'issued': return <Clock size={16} style={{ color: 'var(--accent-blue)' }} />;
      case 'completed': return <CheckCircle size={16} style={{ color: 'var(--success)' }} />;
      default: return <AlertCircle size={16} style={{ color: 'var(--text-muted)' }} />;
    }
  };

  return (
    <div className="glass" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 className="gold-gradient">MATERIAL TRACKING (GOLD ISSUANCE)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage and track gold issued to workers</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Issue Gold
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px' }}>Worker</th>
              <th style={{ padding: '12px' }}>Weight (g)</th>
              <th style={{ padding: '12px' }}>Purity</th>
              <th style={{ padding: '12px' }}>Waste %</th>
              <th style={{ padding: '12px' }}>Due Date</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map(issue => (
              <tr key={issue._id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '16px 12px' }}>
                  <div style={{ fontWeight: 500 }}>{issue.workerId?.name || 'N/A'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{issue.workerId?.specialization}</div>
                </td>
                <td style={{ padding: '16px 12px' }}>{issue.weight}g</td>
                <td style={{ padding: '16px 12px' }}>{issue.purity}</td>
                <td style={{ padding: '16px 12px' }}>{issue.expectedWastage}%</td>
                <td style={{ padding: '16px 12px' }}>
                    {issue.deliveryDate ? new Date(issue.deliveryDate).toLocaleDateString() : '-'}
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <span style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', 
                    borderRadius: '20px', fontSize: '0.75rem', background: 'var(--surface-bg)',
                    border: '1px solid var(--glass-border)', width: 'fit-content'
                  }}>
                    {getStatusIcon(issue.status)}
                    <span style={{ textTransform: 'capitalize' }}>{issue.status}</span>
                  </span>
                </td>
                <td style={{ padding: '16px 12px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {issue.status === 'issued' && (
                            <button 
                                onClick={() => updateStatus(issue._id, 'completed')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)' }}
                                title="Mark as Completed"
                            >
                                <CheckCircle size={18} />
                            </button>
                        )}
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <Eye size={18} />
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
            <h3 style={{ marginBottom: '20px' }} className="gold-gradient">New Gold Issuance</h3>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Select Worker</label>
                <select 
                  required
                  value={formData.workerId} 
                  onChange={e => setFormData({...formData, workerId: e.target.value})}
                  style={{ width: '100%', background: 'var(--surface-bg)', color: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                >
                  <option value="">Choose Worker...</option>
                  {workers.map(w => <option key={w._id} value={w._id}>{w.name} ({w.specialization})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="input-group">
                    <label>Weight (Grams)</label>
                    <input required type="number" step="0.01" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                </div>
                <div className="input-group">
                    <label>Purity</label>
                    <select 
                        value={formData.purity} 
                        onChange={e => setFormData({...formData, purity: e.target.value})}
                        style={{ width: '100%', background: 'var(--surface-bg)', color: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                    >
                        <option value="22k">22k</option>
                        <option value="24k">24k</option>
                        <option value="18k">18k</option>
                    </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="input-group">
                    <label>Expected Wastage %</label>
                    <input type="number" step="0.1" value={formData.expectedWastage} onChange={e => setFormData({...formData, expectedWastage: e.target.value})} />
                </div>
                <div className="input-group">
                    <label>Due Date</label>
                    <input type="date" value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})} />
                </div>
              </div>

              <div className="input-group">
                <label>Notes (Optional)</label>
                <textarea 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    style={{ width: '100%', background: 'var(--surface-bg)', color: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', minHeight: '80px', resize: 'vertical' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="glass" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', color: 'white', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Confirm Issuance</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoldIssuance;
