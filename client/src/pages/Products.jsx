import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api';
import { Plus, CheckCircle, Clock, Package, ShieldCheck, ShieldAlert, ChevronRight } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [newProductData, setNewProductData] = useState({
    productId: '', category: 'Necklace', designName: '', expectedWeight: '', stoneDetails: '', workerId: ''
  });

  const [receiveData, setReceiveData] = useState({
    grossWeight: '', netWeight: '', actualWastage: '', qualityCheck: 'passed'
  });

  useEffect(() => {
    fetchProducts();
    fetchWorkers();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/mgmt/products');
      setProducts(data);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/mgmt/products', newProductData);
      setShowCreateModal(false);
      setNewProductData({ productId: '', category: 'Necklace', designName: '', expectedWeight: '', stoneDetails: '', workerId: '' });
      fetchProducts();
    } catch (err) {
      alert('Error creating product');
    }
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/mgmt/products/${selectedProduct._id}/receive`, receiveData);
      setShowReceiveModal(false);
      setSelectedProduct(null);
      setReceiveData({ grossWeight: '', netWeight: '', actualWastage: '', qualityCheck: 'passed' });
      fetchProducts();
    } catch (err) {
      alert('Error receiving product');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'rgba(243, 156, 18, 0.1)', color: '#f39c12', icon: <Clock size={14}/> },
      'in-progress': { bg: 'rgba(52, 152, 219, 0.1)', color: '#3498db', icon: <Package size={14}/> },
      completed: { bg: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', icon: <CheckCircle size={14}/> }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{ 
        display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', 
        borderRadius: '20px', fontSize: '0.75rem', background: style.bg, color: style.color, border: `1px solid ${style.color}22`
      }}>
        {style.icon} {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="glass" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 className="gold-gradient">PRODUCT LIFECYCLE</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Track products from design to final quality check</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> New Product
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {products.map(product => (
          <div key={product._id} className="glass" style={{ padding: '20px', borderLeft: `4px solid ${product.status === 'completed' ? 'var(--success)' : 'var(--primary-gold)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{product.productId}</span>
                <h3 style={{ fontSize: '1.2rem', margin: '4px 0' }}>{product.designName}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Category: {product.category}</p>
              </div>
              {getStatusBadge(product.status)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '20px 0', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ASSIGNED TO</p>
                <p style={{ fontSize: '0.9rem' }}>{product.workerId?.name || 'Unassigned'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>EXP. WEIGHT</p>
                <p style={{ fontSize: '0.9rem' }}>{product.expectedWeight}g</p>
              </div>
            </div>

            {product.status === 'completed' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.85rem' }}>
                  <ShieldCheck size={16} /> QC PASSED
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>NET WEIGHT</p>
                  <p style={{ fontSize: '1rem', fontWeight: 600 }}>{product.netWeight}g</p>
                </div>
              </div>
            ) : (
              <button 
                className="glass" 
                onClick={() => { setSelectedProduct(product); setShowReceiveModal(true); }}
                style={{ width: '100%', padding: '10px', color: 'var(--primary-gold)', border: '1px solid var(--primary-gold)', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                Receive Finished Product <ChevronRight size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
            <h3 className="gold-gradient" style={{ marginBottom: '20px' }}>Initialize New Product</h3>
            <form onSubmit={handleCreate}>
              <div className="input-group">
                <label>Product ID</label>
                <input required placeholder="e.g. PRD-101" value={newProductData.productId} onChange={e => setNewProductData({...newProductData, productId: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="input-group">
                  <label>Category</label>
                  <select value={newProductData.category} onChange={e => setNewProductData({...newProductData, category: e.target.value})} style={{ width: '100%', background: 'var(--surface-bg)', color: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <option value="Necklace">Necklace</option>
                    <option value="Ring">Ring</option>
                    <option value="Bangle">Bangle</option>
                    <option value="Earrings">Earrings</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Expected Weight (g)</label>
                  <input type="number" step="0.01" value={newProductData.expectedWeight} onChange={e => setNewProductData({...newProductData, expectedWeight: e.target.value})} />
                </div>
              </div>
              <div className="input-group">
                <label>Design Name / Description</label>
                <input required value={newProductData.designName} onChange={e => setNewProductData({...newProductData, designName: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Assign to Worker</label>
                <select required value={newProductData.workerId} onChange={e => setNewProductData({...newProductData, workerId: e.target.value})} style={{ width: '100%', background: 'var(--surface-bg)', color: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <option value="">Select Worker...</option>
                  {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="glass" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '12px', color: 'white' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Start Production</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Product Modal */}
      {showReceiveModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
            <h3 className="gold-gradient" style={{ marginBottom: '20px' }}>Receive Finished Product</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>Record final weights for <strong>{selectedProduct?.designName}</strong></p>
            <form onSubmit={handleReceive}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="input-group">
                  <label>Gross Weight (Received)</label>
                  <input required type="number" step="0.01" value={receiveData.grossWeight} onChange={e => setReceiveData({...receiveData, grossWeight: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Net Weight (Final)</label>
                  <input required type="number" step="0.01" value={receiveData.netWeight} onChange={e => setReceiveData({...receiveData, netWeight: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="input-group">
                  <label>Actual Wastage (g)</label>
                  <input required type="number" step="0.001" value={receiveData.actualWastage} onChange={e => setReceiveData({...receiveData, actualWastage: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Quality Check</label>
                  <select value={receiveData.qualityCheck} onChange={e => setReceiveData({...receiveData, qualityCheck: e.target.value})} style={{ width: '100%', background: 'var(--surface-bg)', color: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <option value="passed">Passed ✅</option>
                    <option value="failed">Failed ❌</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="glass" onClick={() => setShowReceiveModal(false)} style={{ flex: 1, padding: '12px', color: 'white' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Complete Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
