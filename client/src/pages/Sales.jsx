import React, { useState, useEffect } from 'react';
import api from '../api';
import { ShoppingBag, Search, Tag, User, DollarSign, CheckCircle, X, Printer, Filter } from 'lucide-react';

const Sales = () => {
    const [products, setProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSaleModal, setShowSaleModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [view, setView] = useState('inventory'); // 'inventory' or 'history'
    
    const [goldRate, setGoldRate] = useState(0);
    const [currency, setCurrency] = useState('₹');
    const [allCategories, setAllCategories] = useState([]);

    // Sale Form
    const [saleData, setSaleData] = useState({
        customerName: '',
        customerPhone: '',
        metalRateUsed: '',
        makingCharges: '',
        stoneCharges: 0,
        discount: 0,
        totalPrice: 0,
        paymentMethod: 'Cash'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, saleRes, settingsRes, compRes] = await Promise.all([
                api.get('/mgmt/products?status=completed'),
                api.get('/mgmt/sales'),
                api.get('/settings'),
                api.get('/company')
            ]);
            
            setProducts(prodRes.data || []);
            setSales(saleRes.data || []);
            
            const sObj = settingsRes.data.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {});
            const currentRate = parseFloat(sObj.goldRate) || 0;
            setGoldRate(currentRate);
            setCurrency(compRes.data?.currency || '₹');
            setAllCategories(compRes.data?.categories || []);
            
            // Initial form data with current rate
            setSaleData(prev => ({ ...prev, metalRateUsed: currentRate }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSale = (product) => {
        setSelectedProduct(product);
        
        // Find category data from allCategories
        const catData = allCategories.find(c => c.name === product.category);
        const defaultMaking = catData?.defaultLabourRate || 0;
        const totalStoneValue = product.stones?.reduce((acc, s) => acc + (s.stoneWeight || 0), 0) || 0;
        
        const initialPrice = (product.netWeight * goldRate) + defaultMaking + totalStoneValue;

        setSaleData({
            customerName: '',
            customerPhone: '',
            metalRateUsed: goldRate,
            makingCharges: defaultMaking,
            stoneCharges: totalStoneValue,
            discount: 0,
            totalPrice: initialPrice,
            paymentMethod: 'Cash'
        });
        setShowSaleModal(true);
    };

    const calculateTotal = (data) => {
        const metalValue = selectedProduct.netWeight * (parseFloat(data.metalRateUsed) || 0);
        const total = metalValue + (parseFloat(data.makingCharges) || 0) + (parseFloat(data.stoneCharges) || 0) - (parseFloat(data.discount) || 0);
        setSaleData({ ...data, totalPrice: Math.round(total) });
    };

    const handleSaleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/mgmt/sales', {
                ...saleData,
                productId: selectedProduct._id
            });
            setShowSaleModal(false);
            fetchData();
            alert('Product sold successfully!');
        } catch (err) {
            alert('Failed to record sale');
        }
    };

    if (loading) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading Sales Module...</div>;

    const filteredProducts = products.filter(p => 
        p.designName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.productId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '0 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 className="gold-gradient" style={{ fontSize: '1.8rem' }}>SALES & INVENTORY</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sell finished products and track sales history</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', background: 'var(--dark-bg)', padding: '5px', borderRadius: '10px' }}>
                    <button onClick={() => setView('inventory')} style={{ border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', background: view === 'inventory' ? 'var(--primary-gold)' : 'transparent', color: view === 'inventory' ? 'white' : 'var(--text-muted)', fontWeight: 600 }}>Active Inventory</button>
                    <button onClick={() => setView('history')} style={{ border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', background: view === 'history' ? 'var(--primary-gold)' : 'transparent', color: view === 'history' ? 'white' : 'var(--text-muted)', fontWeight: 600 }}>Sales History</button>
                </div>
            </div>

            {view === 'inventory' ? (
                <>
                    <div style={{ marginBottom: '25px', position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '15px', top: '15px', color: 'var(--text-muted)' }} size={20}/>
                        <input 
                            type="text" 
                            placeholder="Search ready stock by design or ID..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '15px 15px 15px 50px', background: 'var(--dark-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '1rem' }}
                        />
                    </div>

                    <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                        {filteredProducts.map(product => (
                            <div key={product._id} className="glass card-hover" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(212,175,55,0.1)', color: 'var(--primary-gold)', fontWeight: 700 }}>{product.productId}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.category}</span>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{product.designName}</h3>
                                    <p style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: '5px 0 0', fontWeight: 600, color: 'var(--primary-gold)' }}>
                                        <Tag size={14}/> {product.netWeight}g Gold
                                    </p>
                                </div>
                                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>VALUE EST.</p>
                                        <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{currency} {(product.netWeight * goldRate).toLocaleString()}</p>
                                    </div>
                                    <button 
                                        className="btn-primary" 
                                        onClick={() => handleOpenSale(product)}
                                        style={{ padding: '8px 20px', borderRadius: '50px', fontSize: '0.85rem' }}
                                    >
                                        Sell Item
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '100px', opacity: 0.5 }}>
                            <ShoppingBag size={48} style={{ marginBottom: '15px' }} />
                            <p>No ready products available for sale.</p>
                        </div>
                    )}
                </>
            ) : (
                <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--dark-bg)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            <tr>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Item</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Customer</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Amount</th>
                                <th style={{ padding: '15px', textAlign: 'left' }}>Seller</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map(sale => (
                                <tr key={sale._id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                                    <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{new Date(sale.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ fontWeight: 600 }}>{sale.product?.designName || 'Deleted Item'}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--primary-gold)' }}>{sale.product?.productId}</div>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <div>{sale.customerName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sale.customerPhone}</div>
                                    </td>
                                    <td style={{ padding: '15px', fontWeight: 700, color: 'var(--success)' }}>{currency} {sale.totalPrice.toLocaleString()}</td>
                                    <td style={{ padding: '15px', fontSize: '0.8rem' }}>{sale.soldBy?.username}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Sale Modal */}
            {showSaleModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
                    <div className="glass" style={{ width: '90%', maxWidth: '600px', padding: '30px', maxHeight: '95vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <div>
                                <h3 className="gold-gradient">Record Sale Transaction</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{selectedProduct.designName} ({selectedProduct.netWeight}g)</p>
                            </div>
                            <X size={24} cursor="pointer" onClick={() => setShowSaleModal(false)} />
                        </div>

                        <form onSubmit={handleSaleSubmit}>
                            <h4 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '15px', color: 'var(--primary-gold)' }}>Customer Details</h4>
                            <div className="responsive-grid" style={{ gap: '15px', marginBottom: '25px' }}>
                                <div className="input-group">
                                    <label>Customer Name</label>
                                    <input required value={saleData.customerName} onChange={e => setSaleData({...saleData, customerName: e.target.value})} placeholder="Full Name" />
                                </div>
                                <div className="input-group">
                                    <label>Phone Number</label>
                                    <input value={saleData.customerPhone} onChange={e => setSaleData({...saleData, customerPhone: e.target.value})} placeholder="Mobile Number" />
                                </div>
                            </div>

                            <h4 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '15px', color: 'var(--primary-gold)' }}>Pricing Calculation</h4>
                            <div className="responsive-grid" style={{ gap: '15px' }}>
                                <div className="input-group">
                                    <label>Metal Rate ({currency}/g)</label>
                                    <input type="number" step="0.01" value={saleData.metalRateUsed} onChange={e => { const d = {...saleData, metalRateUsed: e.target.value}; setSaleData(d); calculateTotal(d); }} />
                                </div>
                                <div className="input-group">
                                    <label>Making Charges ({currency})</label>
                                    <input type="number" value={saleData.makingCharges} onChange={e => { const d = {...saleData, makingCharges: e.target.value}; setSaleData(d); calculateTotal(d); }} />
                                </div>
                                <div className="input-group">
                                    <label>Stone Charges ({currency})</label>
                                    <input type="number" value={saleData.stoneCharges} onChange={e => { const d = {...saleData, stoneCharges: e.target.value}; setSaleData(d); calculateTotal(d); }} />
                                </div>
                                <div className="input-group">
                                    <label>Discount ({currency})</label>
                                    <input type="number" value={saleData.discount} onChange={e => { const d = {...saleData, discount: e.target.value}; setSaleData(d); calculateTotal(d); }} />
                                </div>
                            </div>

                            <div className="glass" style={{ margin: '20px 0', padding: '20px', background: 'var(--dark-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>FINAL BILLING AMOUNT</p>
                                    <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--success)' }}>{currency} {saleData.totalPrice.toLocaleString()}</h2>
                                </div>
                                <div className="input-group" style={{ width: '120px' }}>
                                    <label>Payment</label>
                                    <select value={saleData.paymentMethod} onChange={e => setSaleData({...saleData, paymentMethod: e.target.value})} style={{ padding: '8px', background: 'var(--surface-bg)', color: 'white', border: 'none', borderRadius: '8px' }}>
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="UPI">UPI / QR</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button type="button" className="glass" onClick={() => setShowSaleModal(false)} style={{ flex: 1, padding: '15px', fontWeight: 700 }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.1rem' }}>
                                    <CheckCircle size={20} /> Complete Sale
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;
