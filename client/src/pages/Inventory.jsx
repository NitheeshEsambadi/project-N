import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Package, ShieldCheck, Search, Download, Printer, X, Tag, Edit2, Trash2, Eye, FileText } from 'lucide-react';

const Inventory = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // View & Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [editFormData, setEditFormData] = useState({ designName: '', netWeight: '', stones: [] });
  const [goldRate, setGoldRate] = useState(0);

  // Worker Receipt History States
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'receiptHistory'
  const [showReceiptsModal, setShowReceiptsModal] = useState(false);
  const [receiptsList, setReceiptsList] = useState([]);
  const [selectedReceiptDetail, setSelectedReceiptDetail] = useState(null);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'receiptHistory') {
      fetchReceipts();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productRes, companyRes, settingsRes] = await Promise.all([
          api.get('/mgmt/products'),
          api.get('/company'),
          api.get('/settings')
      ]);
      setProducts(productRes.data.filter(p => p.status === 'completed') || []);
      if (companyRes.data) {
          setCompanySettings(companyRes.data);
      }
      if (settingsRes.data) {
          const sObj = settingsRes.data.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {});
          setGoldRate(parseFloat(sObj.goldRate) || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceipts = async () => {
    try {
      setLoadingReceipts(true);
      const res = await api.get('/mgmt/worker-receipts');
      setReceiptsList(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Error fetching receipt history');
    } finally {
      setLoadingReceipts(false);
    }
  };

  const handlePrintReceipt = (receiptData) => {
    const parseStonesLocal = (description) => {
      const stoneMatch = (description || '').match(/^\(([^)]+)\)/);
      if (!stoneMatch) return [];
      return stoneMatch[1].split(',').map(pair => {
          const parts = pair.split(':');
          return { name: parts[0]?.trim() || '', weight: parts[1]?.trim() || '' };
      });
    };

    const workerName = receiptData.workerId?.name || 'Walk-in Worker';
    const workerID = receiptData.workerId?.workerID || '—';
    const workerPhone = receiptData.workerId?.contact || '—';

    const printWindow = window.open('', '_blank', 'width=800,height=900');

    const dateStr = new Date(receiptData.date || receiptData.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).replace(/\s+/g, '-');

    const activeStones = (companySettings?.stones || []).filter(s => s.status !== 'Inactive');
    const finalStones = activeStones.length > 0 ? activeStones : [{ stoneName: 'AD' }, { stoneName: 'RUBY' }, { stoneName: 'EMERALD' }, { stoneName: 'SAPPHIRE' }, { stoneName: 'PEARL' }];

    const rows = receiptData.items.map((item, idx) => {
        const parsedStones = parseStonesLocal(item.description);
        const displayDesc = (item.description || '').replace(/^\([^)]+\)\s*/, '');
        
        const stoneCellsHtml = finalStones.map(stone => {
            const match = parsedStones.find(s => s.name.toLowerCase() === stone.stoneName.toLowerCase());
            return `<td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-family: monospace;">${match ? match.weight : '—'}</td>`;
        }).join('');
        
        return `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">${idx + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-family: monospace; font-weight: bold;">${item.barcode || '—'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${item.product}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px;">${(item.grossWeight || 0).toFixed(3)}g</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px;">${(item.stoneWeight || 0).toFixed(3)}g</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: 600; font-size: 12px;">${(item.netWeight || 0).toFixed(3)}g</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">${item.purity}%</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-family: monospace; font-size: 12px;">${item.huid || '—'}</td>
                ${stoneCellsHtml}
                <td style="border: 1px solid #ddd; padding: 8px; color: #333; font-size: 12px;">${displayDesc || '—'}</td>
            </tr>
        `;
    }).join('');

    const content = `
        <html>
            <head>
                <title>Worker Receipt - ${receiptData.receiptNumber}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
                    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                    .company-name { font-size: 26px; font-weight: 800; color: #6405FF; letter-spacing: -0.5px; }
                    .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .items-th { background: #6405FF; color: white; padding: 12px 10px; font-weight: 600; text-align: left; font-size: 13px; }
                    @media print {
                        body { margin: 20px; }
                        .items-th { background: #f2f2f2 !important; color: #000 !important; border: 1px solid #ccc !important; }
                    }
                </style>
            </head>
            <body>
                <table class="header-table">
                    <tr>
                        <td>
                            <div class="company-name">${companySettings?.name || 'MAHALAKSHMI JEWELLERS'}</div>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">${companySettings?.address || 'Gold & Diamond Ornament Manufacturer'}</div>
                        </td>
                        <td style="text-align: right; vertical-align: top;">
                            <div style="font-size: 18px; font-weight: 700; color: #333;">WORKER RECEIPT</div>
                            <div style="font-size: 13px; font-weight: 600; color: #6405FF; margin-top: 4px;">${receiptData.receiptNumber}</div>
                            <div style="font-size: 12px; color: #666; margin-top: 2px;">Date: ${dateStr}</div>
                        </td>
                    </tr>
                </table>
                <div style="border-bottom: 2px solid #6405FF; margin: 15px 0;"></div>
                <table style="width: 100%; margin-bottom: 20px; font-size: 13px;">
                    <tr>
                        <td style="width: 50%;"><strong>Craftsman:</strong> ${workerName} (${workerID})</td>
                        <td style="text-align: right;"><strong>Contact:</strong> ${workerPhone}</td>
                    </tr>
                </table>
                <table class="items-table">
                    <thead>
                        <tr style="background: #f2f2f2;">
                            <th class="items-th" style="width: 40px; text-align: center;">#</th>
                            <th class="items-th" style="text-align: center;">Barcode</th>
                            <th class="items-th">Ornament</th>
                            <th class="items-th" style="text-align: right;">Gross Wt</th>
                            <th class="items-th" style="text-align: right;">Stone Wt</th>
                            <th class="items-th" style="text-align: right;">Net Wt</th>
                            <th class="items-th" style="text-align: center;">Purity</th>
                            <th class="items-th" style="text-align: center;">HUID</th>
                            ${finalStones.map(s => `<th class="items-th" style="text-align: center;">${s.stoneName}</th>`).join('')}
                            <th class="items-th">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                        <tr style="background: #fafafa; font-weight: 700; border-top: 2px solid #6405FF;">
                            <td colspan="3" style="border: 1px solid #ddd; padding: 12px; text-align: right;">TOTALS:</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: right; color: #6405FF;">${(receiptData.totalWeight || 0).toFixed(3)}g</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: right; color: #666;">${(receiptData.totalStoneWeight || 0).toFixed(3)}g</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: right; color: #6405FF; font-size: 14px;">${((receiptData.totalWeight || 0) - (receiptData.totalStoneWeight || 0)).toFixed(3)}g</td>
                            <td colspan="2" style="border: 1px solid #ddd; padding: 12px; text-align: center;">Items: ${receiptData.totalItems || 0}</td>
                            ${finalStones.map(() => `<td style="border: 1px solid #ddd; padding: 12px;"></td>`).join('')}
                            <td style="border: 1px solid #ddd; padding: 12px;"></td>
                        </tr>
                    </tbody>
                </table>
                <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 13px;">
                    <div style="text-align: center; width: 200px;">
                        <div style="border-top: 1px solid #333; margin-top: 40px; padding-top: 8px;">Worker Signature</div>
                    </div>
                    <div style="text-align: center; width: 200px;">
                        <div style="border-top: 1px solid #333; margin-top: 40px; padding-top: 8px;">Authorized Signature</div>
                    </div>
                </div>
            </body>
        </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const handlePrint = (product) => {
      localStorage.setItem('printProduct', JSON.stringify(product));
      window.open('/print-qr', '_blank');
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setEditFormData({
        designName: product.designName,
        netWeight: product.netWeight,
        stones: product.stones || []
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
        await api.put(`/mgmt/products/${editingProduct._id}`, editFormData);
        setEditingProduct(null);
        fetchData();
        alert('Product updated successfully');
    } catch (err) {
        alert('Error updating product');
    }
  };

  const updateEditStone = (index, field, value) => {
    const newStones = [...editFormData.stones];
    newStones[index][field] = value;
    setEditFormData({ ...editFormData, stones: newStones });
  };

  // Filter & Search Logic
  let displayProducts = products.filter(p => 
    (p.designName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.productId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.workerId?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showSelectedOnly) {
    displayProducts = displayProducts.filter(p => selectedItems.includes(p._id));
  }

  displayProducts.sort((a, b) => {
    if (sortBy === 'name') return (a.designName || '').localeCompare(b.designName || '');
    if (sortBy === 'weight') return (b.netWeight || 0) - (a.netWeight || 0);
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(displayProducts.map(p => p._id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const calculateTotalStoneWeight = (stones) => {
      if (!stones || stones.length === 0) return 0;
      return stones.reduce((acc, current) => acc + (parseFloat(current.stoneWeight) || 0), 0);
  };

  if (loading) return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading inventory...</div>;

  return (
    <div className="glass" style={{ padding: '24px', background: 'var(--surface-bg)' }}>
      <div className="no-print" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
              <h2 className="gold-gradient" style={{ fontSize: '1.8rem', margin: 0 }}>INVENTORY</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '5px' }}>Manage and view your completed inventory items</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', background: 'var(--dark-bg)', padding: '5px', borderRadius: '10px' }}>
              <button 
                  onClick={() => setActiveTab('stock')} 
                  style={{ border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'stock' ? 'var(--primary-gold)' : 'transparent', color: activeTab === 'stock' ? 'white' : 'var(--text-muted)', fontWeight: 600 }}
              >
                  Active Stock
              </button>
              <button 
                  onClick={() => setActiveTab('receiptHistory')} 
                  style={{ border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'receiptHistory' ? 'var(--primary-gold)' : 'transparent', color: activeTab === 'receiptHistory' ? 'white' : 'var(--text-muted)', fontWeight: 600 }}
              >
                  Receipt History
              </button>
              <button 
                  onClick={() => navigate('/worker-receipt')}
                  style={{ border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', background: 'var(--secondary-gold)', color: 'white', fontWeight: 600 }}
              >
                  + Worker Receipt
              </button>
          </div>
      </div>
      {activeTab === 'stock' ? (
        <>
          <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
              <Search style={{ position: 'absolute', left: '15px', top: '14px', color: 'var(--primary-gold)' }} size={20}/>
              <input 
                  type="text" 
                  placeholder="Search by ID, name or worker..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '12px 15px 12px 45px', background: 'transparent', border: '2px solid var(--primary-gold)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
              />
            </div>
            
            <button 
              onClick={() => setShowSelectedOnly(!showSelectedOnly)}
              style={{ padding: '12px 20px', borderRadius: '8px', border: '2px solid var(--primary-gold)', color: showSelectedOnly ? 'var(--dark-bg)' : 'var(--primary-gold)', background: showSelectedOnly ? 'var(--primary-gold)' : 'transparent', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)' }}
            >
              {showSelectedOnly ? 'Show All' : 'Show selected |'}
            </button>

            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '12px 20px', borderRadius: '8px', border: '2px solid var(--primary-gold)', background: 'transparent', color: 'var(--primary-gold)', cursor: 'pointer', fontWeight: 600, outline: 'none' }}
            >
              <option value="date" style={{background: 'var(--dark-bg)'}}>Sorted by Date</option>
              <option value="name" style={{background: 'var(--dark-bg)'}}>Sorted by Name</option>
              <option value="weight" style={{background: 'var(--dark-bg)'}}>Sorted by Weight</option>
            </select>
          </div>

          <div className="glass no-print" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                  <thead>
                      <tr style={{ textAlign: 'left', background: 'var(--dark-bg)', borderBottom: '2px solid var(--primary-gold)', color: 'var(--primary-gold)', fontSize: '0.85rem' }}>
                          <th style={{ padding: '15px 10px', textAlign: 'center', width: '50px' }}>
                              <input 
                                type="checkbox" 
                                checked={displayProducts.length > 0 && selectedItems.length === displayProducts.length}
                                onChange={handleSelectAll}
                                style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--primary-gold)' }}
                                title="select all"
                              />
                          </th>
                          <th style={{ padding: '15px 10px', fontWeight: 600 }}>S.no</th>
                          <th style={{ padding: '15px', fontWeight: 600 }}>Product Code</th>
                          <th style={{ padding: '15px', fontWeight: 600 }}>Product name</th>
                          <th style={{ padding: '15px', fontWeight: 600 }}>Net Wt</th>
                          <th style={{ padding: '15px', fontWeight: 600 }}>Gross Wt</th>
                          <th style={{ padding: '15px', fontWeight: 600 }}>Stone Wt</th>
                          <th style={{ padding: '15px', fontWeight: 600 }}>Worker</th>
                          <th style={{ padding: '15px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      {displayProducts.map((product, index) => (
                          <tr key={product._id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem', transition: 'var(--transition)', background: selectedItems.includes(product._id) ? 'rgba(212, 175, 55, 0.05)' : 'transparent' }}>
                              <td style={{ padding: '15px 10px', textAlign: 'center' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={selectedItems.includes(product._id)}
                                    onChange={() => handleSelectItem(product._id)}
                                    style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--primary-gold)' }}
                                  />
                              </td>
                              <td style={{ padding: '15px 10px' }}>{index + 1}</td>
                              <td style={{ padding: '15px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{product.productId}</td>
                              <td style={{ padding: '15px', fontWeight: 600, color: 'var(--text-main)' }}>{product.designName}</td>
                              <td style={{ padding: '15px' }}>{product.netWeight}g</td>
                              <td style={{ padding: '15px' }}>{product.grossWeight}g</td>
                              <td style={{ padding: '15px' }}>{calculateTotalStoneWeight(product.stones).toFixed(2)}</td>
                              <td style={{ padding: '15px' }}>{product.workerId?.name || 'Unassigned'}</td>
                              <td style={{ padding: '15px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                      <button onClick={() => setSelectedProduct(product)} className="glass" style={{ padding: '6px', color: 'var(--secondary-gold)' }} title="View details"><Eye size={18}/></button>
                                      <button onClick={() => handleEditClick(product)} className="glass" style={{ padding: '6px', color: 'var(--text-muted)' }} title="Edit"><Edit2 size={18}/></button>
                                      <button onClick={() => handlePrint(product)} className="glass" style={{ padding: '6px', color: 'var(--text-main)' }} title="Print"><Printer size={18}/></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {displayProducts.length === 0 && (
                          <tr>
                              <td colSpan="9" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                                  <Package size={48} style={{ marginBottom: '15px', opacity: 0.2 }} />
                                  <p>No inventory items found.</p>
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
        </>
      ) : (
        <>
          <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
              <Search style={{ position: 'absolute', left: '15px', top: '14px', color: 'var(--primary-gold)' }} size={20}/>
              <input 
                  type="text" 
                  placeholder="Search receipts by number or worker name..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '12px 15px 12px 45px', background: 'transparent', border: '2px solid var(--primary-gold)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
              />
            </div>
          </div>

          {loadingReceipts ? (
              <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading receipt history...</div>
          ) : (
              <div className="glass no-print" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                      <thead>
                          <tr style={{ textAlign: 'left', background: 'var(--dark-bg)', borderBottom: '2px solid var(--primary-gold)', color: 'var(--primary-gold)', fontSize: '0.85rem' }}>
                              <th style={{ padding: '15px 10px', fontWeight: 600 }}>S.no</th>
                              <th style={{ padding: '15px', fontWeight: 600 }}>Receipt Number</th>
                              <th style={{ padding: '15px', fontWeight: 600 }}>Date</th>
                              <th style={{ padding: '15px', fontWeight: 600 }}>Worker</th>
                              <th style={{ padding: '15px', textAlign: 'right', fontWeight: 600 }}>Total Wt</th>
                              <th style={{ padding: '15px', textAlign: 'center', fontWeight: 600 }}>Total Items</th>
                              <th style={{ padding: '15px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {receiptsList
                              .filter(r => 
                                  (r.receiptNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (r.workerId?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map((receipt, index) => (
                                  <tr key={receipt._id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                                      <td style={{ padding: '15px 10px' }}>{index + 1}</td>
                                      <td style={{ padding: '15px', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--text-main)' }}>{receipt.receiptNumber}</td>
                                      <td style={{ padding: '15px' }}>{new Date(receipt.date || receipt.createdAt).toLocaleDateString()}</td>
                                      <td style={{ padding: '15px' }}>{receipt.workerId?.name || 'Walk-in Worker'}</td>
                                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: 600 }}>{(receipt.totalWeight || 0).toFixed(3)}g</td>
                                      <td style={{ padding: '15px', textAlign: 'center' }}>{receipt.totalItems || 0}</td>
                                      <td style={{ padding: '15px', textAlign: 'center' }}>
                                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                              <button onClick={() => setSelectedReceiptDetail(receipt)} className="glass" style={{ padding: '6px 12px', color: 'var(--secondary-gold)', display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.8rem' }} title="View details"><Eye size={16}/> View</button>
                                              <button onClick={() => handlePrintReceipt(receipt)} className="glass" style={{ padding: '6px 12px', color: 'var(--text-main)', display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.8rem' }} title="Print"><Printer size={16}/> Print</button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          {receiptsList.length === 0 && (
                              <tr>
                                  <td colSpan="7" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                                      <FileText size={48} style={{ marginBottom: '15px', opacity: 0.2 }} />
                                      <p>No submitted receipts found.</p>
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          )}
        </>
      )}

      {/* --- DETAILS MODAL --- */}
      {selectedProduct && (
          <div className="modal-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="glass" style={{ width: '90%', maxWidth: '650px', padding: '30px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Tag size={24} color="var(--primary-gold)"/>
                          <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Product Details</h3>
                      </div>
                      <X size={24} onClick={() => setSelectedProduct(null)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}/>
                  </div>

                  <div style={{ textAlign: 'center', marginBottom: '30px', padding: '20px', background: 'var(--dark-bg)', borderRadius: '16px' }}>
                      <p style={{ color: 'var(--primary-gold)', fontSize: '0.75rem', letterSpacing: '2px', fontWeight: 700 }}>{selectedProduct.productId}</p>
                      <h2 style={{ fontSize: '2rem', margin: '8px 0', color: 'var(--text-main)' }}>{selectedProduct.designName}</h2>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Category: {selectedProduct.category}</span>
                  </div>

                  <div className="responsive-grid" style={{ gap: '20px', marginBottom: '25px' }}>
                      <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '15px', textTransform: 'uppercase' }}>Crafting History</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Worker</span><span style={{ fontWeight: 600 }}>{selectedProduct.workerId?.name || 'Unassigned'}</span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Assigned</span><span>{new Date(selectedProduct.createdAt).toLocaleDateString()}</span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Finished</span><span style={{ color: 'var(--success)', fontWeight: 600 }}>{new Date(selectedProduct.updatedAt).toLocaleDateString()}</span></div>
                          </div>
                      </div>
                      <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '15px', textTransform: 'uppercase' }}>Gold Statistics</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Net Weight</span><span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedProduct.netWeight}g</span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Gross Weight</span><span>{selectedProduct.grossWeight}g</span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Actual Wastage</span><span style={{ color: 'var(--danger)', fontWeight: 600 }}>{selectedProduct.actualWastage}g</span></div>
                          </div>
                      </div>
                  </div>

                  <div style={{ borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden', marginBottom: '30px' }}>
                      <div style={{ background: 'var(--dark-bg)', padding: '15px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 0 }}>Stone Manifest</p>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-gold)' }}>TOTAL: {calculateTotalStoneWeight(selectedProduct.stones).toFixed(2)} ct/g</span>
                      </div>
                      {selectedProduct.stones && selectedProduct.stones.length > 0 ? (
                          <div style={{ padding: '10px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {selectedProduct.stones.map((st, idx) => (
                                        <tr key={idx} style={{ borderBottom: idx === selectedProduct.stones.length - 1 ? 'none' : '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '12px', fontWeight: 600 }}>{st.stoneName}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{st.stoneWeight}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{st.stoneDetails || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                          </div>
                      ) : (
                          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No stones recorded for this piece.</div>
                      )}
                  </div>

                  <div style={{ display: 'flex', gap: '15px' }}>
                      <button onClick={() => setSelectedProduct(null)} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-main)' }}>Close</button>
                      <button onClick={() => handlePrint(selectedProduct)} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderRadius: '10px' }}><Printer size={18}/> Print QR label</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- EDIT MODAL --- */}
      {editingProduct && (
          <div className="modal-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="glass" style={{ width: '90%', maxWidth: '500px', padding: '30px', background: 'var(--surface-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Edit Inventory Record</h3>
                      <X onClick={() => setEditingProduct(null)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}/>
                  </div>
                  <form onSubmit={handleEditSubmit}>
                      <div className="input-group">
                          <label>Design Name</label>
                          <input 
                            value={editFormData.designName} 
                            onChange={e => setEditFormData({...editFormData, designName: e.target.value})} 
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--dark-bg)', color: 'var(--text-main)' }}
                          />
                      </div>
                      <div className="input-group">
                          <label>Net Weight (g)</label>
                          <input 
                            type="number" step="0.01" 
                            value={editFormData.netWeight} 
                            onChange={e => setEditFormData({...editFormData, netWeight: e.target.value})} 
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--dark-bg)', color: 'var(--text-main)' }}
                          />
                      </div>
                      
                      <div style={{ marginBottom: '25px' }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Stone Weights</p>
                          <div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '5px' }}>
                            {editFormData.stones.map((st, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', background: 'var(--dark-bg)', padding: '12px', borderRadius: '10px' }}>
                                    <div style={{ flex: 2, fontWeight: 600, fontSize: '0.9rem' }}>{st.stoneName}</div>
                                    <input 
                                        type="number" step="0.01" 
                                        value={st.stoneWeight} 
                                        onChange={e => updateEditStone(idx, 'stoneWeight', e.target.value)} 
                                        style={{ flex: 1, border: 'none', background: 'var(--surface-bg)', padding: '5px 10px', borderRadius: '6px', textAlign: 'center' }} 
                                    />
                                </div>
                            ))}
                          </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                          <button type="button" onClick={() => setEditingProduct(null)} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                          <button type="submit" className="btn-primary" style={{ flex: 1, borderRadius: '10px' }}>Update Item</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
      {/* --- WORKER RECEIPT DETAILS SUB-MODAL --- */}
      {selectedReceiptDetail && (
          <div className="modal-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
              <div className="glass" style={{ width: '90%', maxWidth: '800px', padding: '30px', maxHeight: '85vh', overflowY: 'auto', background: 'var(--surface-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                      <div>
                          <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Receipt Details</h3>
                          <p style={{ color: 'var(--primary-gold)', fontFamily: 'monospace', margin: '4px 0 0', fontWeight: 'bold' }}>{selectedReceiptDetail.receiptNumber}</p>
                      </div>
                      <X size={24} onClick={() => setSelectedReceiptDetail(null)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}/>
                  </div>

                  <div className="responsive-grid" style={{ gap: '20px', marginBottom: '25px' }}>
                      <div style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--dark-bg)' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Craftsman</span>
                          <h4 style={{ margin: '5px 0 0' }}>{selectedReceiptDetail.workerId?.name || 'Walk-in Worker'} ({selectedReceiptDetail.workerId?.workerID || '—'})</h4>
                      </div>
                      <div style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--dark-bg)' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date</span>
                          <h4 style={{ margin: '5px 0 0' }}>{new Date(selectedReceiptDetail.date || selectedReceiptDetail.createdAt).toLocaleDateString()}</h4>
                      </div>
                  </div>

                  <div className="glass" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '25px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                              <tr style={{ background: 'var(--dark-bg)', borderBottom: '1px solid var(--glass-border)', color: 'var(--primary-gold)', fontSize: '0.8rem', textAlign: 'left' }}>
                                  <th style={{ padding: '12px' }}>Barcode</th>
                                  <th style={{ padding: '12px' }}>Ornament</th>
                                  <th style={{ padding: '12px', textAlign: 'right' }}>Gross Wt</th>
                                  <th style={{ padding: '12px', textAlign: 'right' }}>Stone Wt</th>
                                  <th style={{ padding: '12px', textAlign: 'right' }}>Net Wt</th>
                                  <th style={{ padding: '12px', textAlign: 'center' }}>Purity</th>
                                  <th style={{ padding: '12px' }}>HUID</th>
                              </tr>
                          </thead>
                          <tbody>
                              {selectedReceiptDetail.items?.map((item, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                                      <td style={{ padding: '12px', fontFamily: 'monospace' }}>{item.barcode || '—'}</td>
                                      <td style={{ padding: '12px' }}>{item.product}</td>
                                      <td style={{ padding: '12px', textAlign: 'right' }}>{(item.grossWeight || 0).toFixed(3)}g</td>
                                      <td style={{ padding: '12px', textAlign: 'right' }}>{(item.stoneWeight || 0).toFixed(3)}g</td>
                                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{(item.netWeight || 0).toFixed(3)}g</td>
                                      <td style={{ padding: '12px', textAlign: 'center' }}>{item.purity}%</td>
                                      <td style={{ padding: '12px' }}>{item.huid || '—'}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div style={{ display: 'flex', gap: '15px' }}>
                      <button onClick={() => setSelectedReceiptDetail(null)} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-main)' }}>Back</button>
                      <button onClick={() => handlePrintReceipt(selectedReceiptDetail)} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderRadius: '10px' }}><Printer size={18}/> Print Receipt</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Inventory;
