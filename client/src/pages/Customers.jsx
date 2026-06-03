import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { 
  Plus, Edit2, Trash2, Search, User, Phone, Mail, MapPin, 
  DollarSign, ShoppingBag, Receipt, Calendar, CreditCard, ChevronRight, X 
} from 'lucide-react';

const Customers = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    
    // States
    const [customers, setCustomers] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'sales', 'dues', 'insights'
    
    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '', contact: '', email: '', address: '', outstandingBalance: ''
    });
    
    const [paymentData, setPaymentData] = useState({
        type: 'receive', // 'receive' (subtract from dues) or 'charge' (add to dues)
        amount: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [custRes, saleRes] = await Promise.all([
                api.get('/customers'),
                api.get('/mgmt/sales').catch(() => ({ data: [] }))
            ]);
            setCustomers(custRes.data || []);
            setSales(saleRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name || '',
            contact: customer.contact || '',
            email: customer.email || '',
            address: customer.address || '',
            outstandingBalance: customer.outstandingBalance || 0
        });
        setShowModal(true);
    };

    const handleOpenPayment = (customer) => {
        setSelectedCustomer(customer);
        setPaymentData({ type: 'receive', amount: '', notes: 'Customer payment received' });
        setShowPaymentModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCustomer(null);
        setFormData({ name: '', contact: '', email: '', address: '', outstandingBalance: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSubmit = {
                ...formData,
                outstandingBalance: parseFloat(formData.outstandingBalance) || 0
            };
            if (editingCustomer) {
                await api.put(`/customers/${editingCustomer._id}`, dataToSubmit);
            } else {
                await api.post('/customers', dataToSubmit);
            }
            closeModal();
            fetchData();
        } catch (err) {
            const msg = err.response?.data?.message || 'Error saving customer';
            alert(msg);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            const amount = parseFloat(paymentData.amount) || 0;
            // 'receive' reduces dues (subtracts from outstandingBalance)
            // 'charge' increases dues (adds to outstandingBalance)
            const change = paymentData.type === 'receive' ? -amount : amount;
            const updatedBalance = (selectedCustomer.outstandingBalance || 0) + change;

            await api.put(`/customers/${selectedCustomer._id}`, {
                outstandingBalance: updatedBalance
            });
            
            setShowPaymentModal(false);
            alert('Outstanding balance updated successfully');
            fetchData();
        } catch (err) {
            alert('Error recording transaction');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;
        try {
            await api.delete(`/customers/${id}`);
            fetchData();
        } catch (err) {
            alert('Error deleting customer: ' + (err.response?.data?.message || err.message));
        }
    };

    const filteredCustomers = customers.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.customerID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contact?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalOutstandingDues = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
    const isAdmin = user?.role === 'admin';

    if (loading) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading customers data...</div>;

    return (
        <div className="glass" style={{ padding: '24px' }}>
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h2 className="gold-gradient">CUSTOMER HUB</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage retail customer accounts, payments, and invoices</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Register Customer
                    </button>
                </div>
            </div>

            {/* Inner Tabs navigation */}
            <div style={{ display: 'flex', gap: '5px', background: 'var(--dark-bg)', padding: '5px', borderRadius: '10px', marginBottom: '25px', width: 'fit-content' }}>
                <button 
                    onClick={() => setActiveTab('directory')} 
                    style={{ border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'directory' ? 'var(--primary-gold)' : 'transparent', color: activeTab === 'directory' ? 'white' : 'var(--text-muted)', fontWeight: 600 }}
                >
                    Directory
                </button>
                <button 
                    onClick={() => setActiveTab('dues')} 
                    style={{ border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'dues' ? 'var(--primary-gold)' : 'transparent', color: activeTab === 'dues' ? 'white' : 'var(--text-muted)', fontWeight: 600 }}
                >
                    Payments & Dues
                </button>
                <button 
                    onClick={() => setActiveTab('sales')} 
                    style={{ border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'sales' ? 'var(--primary-gold)' : 'transparent', color: activeTab === 'sales' ? 'white' : 'var(--text-muted)', fontWeight: 600 }}
                >
                    Sales History
                </button>
                <button 
                    onClick={() => setActiveTab('insights')} 
                    style={{ border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'insights' ? 'var(--primary-gold)' : 'transparent', color: activeTab === 'insights' ? 'white' : 'var(--text-muted)', fontWeight: 600 }}
                >
                    Insights
                </button>
            </div>

            {/* Search filter for Directory and Dues tabs */}
            {(activeTab === 'directory' || activeTab === 'dues') && (
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} size={18}/>
                    <input 
                        type="text" 
                        placeholder="Search by ID, name, or phone..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="glass" 
                        style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'var(--surface-bg)', border: 'none', color: 'var(--text-main)' }}
                    />
                </div>
            )}

            {/* TAB: Directory */}
            {activeTab === 'directory' && (
                <div className="table-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                <th style={{ padding: '12px' }}>Customer ID</th>
                                <th style={{ padding: '12px' }}>Name</th>
                                <th style={{ padding: '12px' }}>Contact</th>
                                <th style={{ padding: '12px' }}>Email</th>
                                <th style={{ padding: '12px' }}>Address</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Outstanding Dues</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(c => (
                                <tr key={c._id} style={{ borderTop: '1px solid var(--glass-border)', cursor: 'pointer' }}>
                                    <td style={{ padding: '16px 12px' }}>
                                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--primary-gold)', fontWeight: 600, fontFamily: 'monospace' }}>
                                            {c.customerID || '—'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--primary-gold)' }}>
                                        {c.name}
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                        {c.contact ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                                <Phone size={13} color="var(--text-muted)"/> {c.contact}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td style={{ padding: '16px 12px', fontSize: '0.85rem' }}>
                                        {c.email ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Mail size={13} color="var(--text-muted)"/> {c.email}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td style={{ padding: '16px 12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {c.address ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <MapPin size={13}/> {c.address}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 600, color: c.outstandingBalance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                        ₹ {(c.outstandingBalance || 0).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '16px 12px' }} onClick={e => e.stopPropagation()}>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                            <Edit2 size={16} title="Edit Profile" onClick={() => handleEdit(c)} style={{ cursor: 'pointer', color: 'var(--accent-blue)' }} />
                                            <Trash2 size={16} title="Delete Customer" onClick={() => handleDelete(c._id)} style={{ cursor: 'pointer', color: 'var(--danger)' }} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCustomers.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>No customers registered yet.</p>
                    )}
                </div>
            )}

            {/* TAB: Payments & Dues */}
            {activeTab === 'dues' && (
                <div className="table-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                <th style={{ padding: '12px' }}>Customer ID</th>
                                <th style={{ padding: '12px' }}>Name</th>
                                <th style={{ padding: '12px' }}>Contact</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Outstanding Dues</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(c => (
                                <tr key={c._id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '16px 12px' }}>{c.customerID}</td>
                                    <td style={{ padding: '16px 12px', fontWeight: 600 }}>{c.name}</td>
                                    <td style={{ padding: '16px 12px' }}>{c.contact || '—'}</td>
                                    <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 700, color: c.outstandingBalance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                        ₹ {(c.outstandingBalance || 0).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                        <button 
                                            className="glass" 
                                            onClick={() => handleOpenPayment(c)}
                                            style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--primary-gold)', border: '1px solid rgba(212,175,55,0.3)', fontWeight: 600 }}
                                        >
                                            Record Payment / Adjustment
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TAB: Sales History */}
            {activeTab === 'sales' && (
                <div className="table-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                <th style={{ padding: '12px' }}>Date</th>
                                <th style={{ padding: '12px' }}>Sale / Product</th>
                                <th style={{ padding: '12px' }}>Customer Name</th>
                                <th style={{ padding: '12px' }}>Contact Phone</th>
                                <th style={{ padding: '12px' }}>Method</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Total Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map(sale => (
                                <tr key={sale._id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {new Date(sale.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <div style={{ fontWeight: 600 }}>{sale.product?.designName || 'Finished Item'}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--primary-gold)', fontFamily: 'monospace' }}>{sale.product?.productId || 'SALE-INVOICE'}</div>
                                    </td>
                                    <td style={{ padding: '16px 12px', fontWeight: 500 }}>{sale.customerName}</td>
                                    <td style={{ padding: '16px 12px', fontSize: '0.85rem' }}>{sale.customerPhone || '—'}</td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', textTransform: 'uppercase' }}>
                                            {sale.paymentMethod || 'Cash'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                                        ₹ {sale.totalPrice?.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {sales.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No sales transactions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TAB: Insights */}
            {activeTab === 'insights' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                        <div className="glass" style={{ padding: '20px', borderTop: '4px solid var(--primary-gold)' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Total Registered Customers</p>
                            <h2 style={{ fontSize: '2rem', margin: 0 }}>{customers.length}</h2>
                        </div>
                        <div className="glass" style={{ padding: '20px', borderTop: '4px solid var(--danger)' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Total Outstanding Dues</p>
                            <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--danger)' }}>₹ {totalOutstandingDues.toLocaleString()}</h2>
                        </div>
                        <div className="glass" style={{ padding: '20px', borderTop: '4px solid var(--success)' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Total Store Sales</p>
                            <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--success)' }}>₹ {sales.reduce((sum, s) => sum + (s.totalPrice || 0), 0).toLocaleString()}</h2>
                        </div>
                    </div>

                    <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                        <div className="glass" style={{ padding: '24px' }}>
                            <h3 className="gold-gradient" style={{ marginBottom: '15px' }}>Top Performing Customers</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {customers.slice(0, 5).map((cust, i) => (
                                    <div key={cust._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--hover-bg)', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--primary-gold)' }}>#{i+1}</span>
                                            <span>{cust.name}</span>
                                        </div>
                                        <span style={{ fontWeight: 600 }}>₹ {(cust.outstandingBalance || 0).toLocaleString()} Dues</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '24px' }}>
                            <h3 className="gold-gradient" style={{ marginBottom: '15px' }}>Payment Method Mix</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {['Cash', 'Card', 'UPI'].map(method => {
                                    const methodSales = sales.filter(s => s.paymentMethod === method);
                                    const sum = methodSales.reduce((acc, s) => acc + s.totalPrice, 0);
                                    return (
                                        <div key={method} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                                            <span style={{ fontWeight: 500 }}>{method} Transactions</span>
                                            <span style={{ fontWeight: 700, color: 'var(--success)' }}>₹ {sum.toLocaleString()} ({methodSales.length} orders)</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Register/Edit Customer */}
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
                                {editingCustomer ? 'Edit Customer' : 'Register New Customer'}
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
                                        placeholder="e.g. Arun Kumar"
                                        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        Contact Number
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.contact} 
                                        onChange={e => setFormData({...formData, contact: e.target.value})} 
                                        placeholder="e.g., 9876543210" 
                                        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        Email Address
                                    </label>
                                    <input 
                                        type="email"
                                        value={formData.email} 
                                        onChange={e => setFormData({...formData, email: e.target.value})} 
                                        placeholder="e.g., arun@gmail.com" 
                                        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        Home Address
                                    </label>
                                    <input 
                                        type="text"
                                        value={formData.address} 
                                        onChange={e => setFormData({...formData, address: e.target.value})} 
                                        placeholder="e.g. 12th Block, MG Road" 
                                        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        Opening Outstanding Dues (₹)
                                    </label>
                                    <input 
                                        type="number"
                                        value={formData.outstandingBalance} 
                                        onChange={e => setFormData({...formData, outstandingBalance: e.target.value})} 
                                        placeholder="0" 
                                        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                                <button type="button" className="glass" onClick={closeModal} style={{ padding: '10px 20px', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600, border: '1px solid var(--glass-border)' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" style={{ padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                    Save Customer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Payment Record / Dues Adjustment */}
            {showPaymentModal && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
                }}>
                    <div className="glass" style={{ width: '90%', maxWidth: '480px', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 className="gold-gradient">Dues Ledger: {selectedCustomer?.name}</h3>
                            <X size={20} onClick={() => setShowPaymentModal(false)} style={{ cursor: 'pointer' }} />
                        </div>
                        <form onSubmit={handlePaymentSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>Adjustment Type</label>
                                    <select 
                                        value={paymentData.type} 
                                        onChange={e => setPaymentData({...paymentData, type: e.target.value})} 
                                        style={{ width: '100%', background: 'var(--surface-bg)', color: 'var(--text-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none' }}
                                    >
                                        <option value="receive">Payment Received (Reduces dues)</option>
                                        <option value="charge">New Charge / Credit Purchase (Increases dues)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        required
                                        value={paymentData.amount} 
                                        onChange={e => setPaymentData({...paymentData, amount: e.target.value})} 
                                        placeholder="0" 
                                        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>Notes / Remarks</label>
                                    <input 
                                        type="text" 
                                        value={paymentData.notes} 
                                        onChange={e => setPaymentData({...paymentData, notes: e.target.value})} 
                                        placeholder="e.g. Cash payment received" 
                                        style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="button" className="glass" onClick={() => setShowPaymentModal(false)} style={{ flex: 1, padding: '12px', color: 'var(--text-main)' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
