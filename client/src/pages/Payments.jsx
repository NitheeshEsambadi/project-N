import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api';
import { Plus, CreditCard, ArrowUpRight, ArrowDownLeft, Search, Calendar, Landmark } from 'lucide-react';

const Payments = () => {
  const [transactions, setTransactions] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    workerId: '',
    type: 'payment',
    amount: '',
    paymentMode: 'Cash',
    notes: ''
  });

  useEffect(() => {
    fetchTransactions();
    fetchWorkers();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get('/mgmt/transactions');
      setTransactions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const { data } = await api.get('/workers');
      setWorkers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/mgmt/transactions', formData);
      setShowModal(false);
      setFormData({ workerId: '', type: 'payment', amount: '', paymentMode: 'Cash', notes: '' });
      fetchTransactions();
    } catch (err) {
      alert('Error recording transaction');
    }
  };

  return (
    <div className="glass" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 className="gold-gradient">LABOUR & PAYMENTS</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} className="desktop-only">Record payments and track worker financial history</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> <span className="desktop-only">Record Payment</span><span className="mobile-only">Record</span>
        </button>
      </div>

      <div className="responsive-grid" style={{ marginBottom: '30px' }}>
        <div className="glass" style={{ padding: '20px', borderLeft: '4px solid var(--success)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total Distributed</p>
            <h3 style={{ fontSize: '1.8rem', marginTop: '5px' }}>₹ {transactions.filter(t => t.type === 'payment').reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</h3>
        </div>
        <div className="glass" style={{ padding: '20px', borderLeft: '4px solid var(--primary-gold)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Unpaid Earnings</p>
            <h3 style={{ fontSize: '1.8rem', marginTop: '5px' }}>₹ {transactions.filter(t => t.type === 'earning').reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</h3>
        </div>
      </div>

      <div className="table-container">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <th style={{ padding: '12px' }}>DATE</th>
              <th style={{ padding: '12px' }}>WORKER</th>
              <th style={{ padding: '12px' }}>TYPE</th>
              <th style={{ padding: '12px' }}>MODE</th>
              <th style={{ padding: '12px' }}>AMOUNT</th>
              <th style={{ padding: '12px' }}>NOTES</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t._id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '16px 12px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} color="var(--text-muted)"/>
                        {new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).split(' ').join(' - ')}
                    </div>
                </td>
                <td style={{ padding: '16px 12px' }}>
                    <span style={{ fontWeight: 500 }}>{t.workerId?.name}</span>
                </td>
                <td style={{ padding: '16px 12px' }}>
                    <span style={{ 
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', 
                        borderRadius: '20px', fontSize: '0.7rem', 
                        background: t.type === 'earning' ? 'rgba(52, 152, 219, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                        color: t.type === 'earning' ? 'var(--accent-blue)' : 'var(--success)',
                        width: 'fit-content'
                    }}>
                        {t.type === 'earning' ? <ArrowUpRight size={12}/> : <ArrowDownLeft size={12}/>}
                        {t.type.toUpperCase()}
                    </span>
                </td>
                <td style={{ padding: '16px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <Landmark size={14} color="var(--text-muted)"/>
                        {t.paymentMode || 'N/A'}
                    </div>
                </td>
                <td style={{ padding: '16px 12px', fontWeight: 600, color: t.type === 'payment' ? 'var(--success)' : 'inherit' }}>
                    {t.type === 'payment' ? '-' : '+'} ₹ {t.amount.toLocaleString()}
                </td>
                <td style={{ padding: '16px 12px', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '90%', maxWidth: '450px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="gold-gradient" style={{ marginBottom: '20px' }}>Record Labour Payment</h3>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Worker Selection</label>
                <select required value={formData.workerId} onChange={e => setFormData({...formData, workerId: e.target.value})} style={{ width: '100%', background: 'var(--surface-bg)', color: 'var(--text-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <option value="">Select Worker...</option>
                  {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Payment Amount</label>
                <input required type="number" placeholder="₹ 0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Payment Mode</label>
                <select value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value})} style={{ width: '100%', background: 'var(--surface-bg)', color: 'var(--text-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI / Digital</option>
                </select>
              </div>
              <div className="input-group">
                <label>Notes</label>
                <input placeholder="Transaction reference or notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="glass" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', color: 'var(--text-main)' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
