import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Package, Clock, ChevronRight, Search, X, Trash2, Printer, Save } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([{ name: 'Necklace', code: 'NE' }]);
  const [companyStones, setCompanyStones] = useState([]);
  const [purityStandards, setPurityStandards] = useState([{label: '22k', value: '91.6'}]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null); 
  
  // Create Assignment State
  const [newProductData, setNewProductData] = useState({
    category: '', designName: '', expectedWeight: '', workerId: '', stones: [], quantity: 1, totalStoneWeight: 0, purity: '22k', purityType: 'Carat', dueDate: '', notes: ''
  });
  const [showStoneDetail, setShowStoneDetail] = useState(false);

  // Draft Receive State
  const [draftList, setDraftList] = useState([]);
  const [draftForm, setDraftForm] = useState({
      name: '', goldWt: '', stoneWt: '', grossWt: '', stones: [], barcode: false
  });
  const [showDraftStones, setShowDraftStones] = useState(false);
  
  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
      // Load drafts from backend when assignment is selected
      if (selectedAssignment) {
          setDraftList(selectedAssignment.draftList || []);
      }
  }, [selectedAssignment]);

  const saveDraftToBackend = async (newDraftList) => {
      try {
          await api.put(`/mgmt/products/${selectedAssignment._id}`, { draftList: newDraftList });
      } catch (err) {
          console.error('Failed to auto-save draft to backend', err);
      }
  };

  const fetchData = async () => {
    try {
      const [productRes, companyRes, workersRes] = await Promise.all([
          api.get('/mgmt/products'),
          api.get('/company'),
          api.get('/workers').catch(() => ({ data: [] }))
      ]);
      setProducts(productRes.data.filter(p => p.status !== 'completed') || []);
      setWorkers(workersRes.data || []);
      if (companyRes.data) {
          if (companyRes.data.categories?.length > 0) {
              setCategories(companyRes.data.categories);
              setNewProductData(prev => ({...prev, category: companyRes.data.categories[0].name}));
          }
          if (companyRes.data.stones) setCompanyStones(companyRes.data.stones);
          if (companyRes.data.purityStandards?.length > 0) {
              setPurityStandards(companyRes.data.purityStandards);
              setNewProductData(prev => ({...prev, purity: companyRes.data.purityStandards[0].label}));
          }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ---- CREATE ASSIGNMENT LOGIC ----
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/mgmt/products', newProductData);
      setShowCreateModal(false);
      setNewProductData({ category: categories[0]?.name || '', designName: '', expectedWeight: '', workerId: '', stones: [], quantity: 1, totalStoneWeight: 0, purity: purityStandards[0]?.label || '22k', purityType: 'Carat', dueDate: '', notes: '' });
      fetchData();
    } catch (err) {
       alert('Error creating assignment');
    }
  };

  const addCreateStone = () => setNewProductData({ ...newProductData, stones: [...newProductData.stones, { stoneName: '', stoneWeight: '', stoneDetails: '' }] });
  const updateCreateStone = (i, f, v) => { 
    const s = [...newProductData.stones]; 
    s[i][f] = v; 
    const total = s.reduce((acc, st) => acc + (parseFloat(st.stoneWeight) || 0), 0);
    setNewProductData({ ...newProductData, stones: s, totalStoneWeight: total }); 
  };
  const removeCreateStone = (i) => { 
    const s = [...newProductData.stones]; 
    s.splice(i, 1); 
    const total = s.reduce((acc, st) => acc + (parseFloat(st.stoneWeight) || 0), 0);
    setNewProductData({ ...newProductData, stones: s, totalStoneWeight: total }); 
  };

  // ---- DRAFT RECEIVE LOGIC ----
  const addDraftStone = () => setDraftForm({ ...draftForm, stones: [...draftForm.stones, { stoneName: '', stoneWeight: '', stoneDetails: '' }] });
  const updateDraftStone = (i, f, v) => { const s = [...draftForm.stones]; s[i][f] = v; setDraftForm({ ...draftForm, stones: s }); };
  const removeDraftStone = (i) => { const s = [...draftForm.stones]; s.splice(i, 1); setDraftForm({ ...draftForm, stones: s }); };

  const handleAddDraft = () => {
      if (!draftForm.name || !draftForm.goldWt || !draftForm.grossWt) {
          alert('Please enter product name, net weight, and gross weight.');
          return;
      }
      const newList = [...draftList, { ...draftForm, id: Date.now() }];
      setDraftList(newList);
      saveDraftToBackend(newList);
      
      setDraftForm({ name: '', goldWt: '', stoneWt: '', grossWt: '', stones: [], barcode: false });
      setShowDraftStones(false);
  };

  const updateInlineDraft = (idx, field, value) => {
      const newList = [...draftList];
      newList[idx][field] = value;
      setDraftList(newList);
  };

  // Debounced auto-save for inline editing (simple blur save for now)
  const handleInlineBlur = () => {
      saveDraftToBackend(draftList);
  };

  const handleDeleteDraft = (index) => {
      const newList = [...draftList];
      newList.splice(index, 1);
      setDraftList(newList);
      saveDraftToBackend(newList);
  };

  const handleFinalSubmit = async () => {
      if (draftList.length === 0) {
          alert('No products drafted.');
          return;
      }

      const totalNetWt = draftList.reduce((acc, item) => acc + (parseFloat(item.goldWt) || 0), 0);
      const totalGrossWt = draftList.reduce((acc, item) => acc + (parseFloat(item.grossWt) || 0), 0);
      const actualWastage = totalGrossWt - totalNetWt;

      const confirmMsg = `You are about to create ${draftList.length} new inventory item(s).\n\nTotal Net Wt: ${totalNetWt}g\nTotal Gross Wt: ${totalGrossWt}g\nCalculated Wastage: ${actualWastage.toFixed(3)}g\n\nSubmit to Inventory?`;
      if (!window.confirm(confirmMsg)) return;

      setIsSubmitting(true);
      try {
          for (let i = 0; i < draftList.length; i++) {
              const item = draftList[i];
              const itemWastage = (parseFloat(item.grossWt) || 0) - (parseFloat(item.goldWt) || 0);
              
              const newItemPayload = {
                  category: selectedAssignment.category,
                  designName: item.name,
                  workerId: selectedAssignment.workerId?._id,
                  purity: selectedAssignment.purity,
                  netWeight: parseFloat(item.goldWt),
                  grossWeight: parseFloat(item.grossWt),
                  stones: item.stones,
                  status: 'completed',
                  actualWastage: itemWastage, 
                  qualityCheck: 'passed'
              };
              await api.post('/mgmt/products', newItemPayload);
          }

          // Mark assignment as completed and clear drafts
          await api.put(`/mgmt/products/${selectedAssignment._id}/receive`, {
              netWeight: totalNetWt,
              grossWeight: totalGrossWt,
              actualWastage: actualWastage,
              qualityCheck: 'passed',
              draftList: [] // clear draft from DB on complete
          });

          alert('Products successfully submitted to inventory!');
          setSelectedAssignment(null);
          setDraftList([]);
          fetchData();
      } catch (err) {
          console.error(err);
          alert('Error submitting to inventory.');
      } finally {
          setIsSubmitting(false);
      }
  };

  const handlePrintBarcodes = (type) => {
      let itemsToPrint = [];
      if (type === 'all') {
          itemsToPrint = draftList;
      } else {
          itemsToPrint = draftList.filter(d => d.barcode);
      }
      
      if (itemsToPrint.length === 0) {
          alert('No items selected for printing.');
          return;
      }

      // In a real bulk print scenario, we would pass an array. 
      // For now, PrintQR.jsx handles single items via localStorage 'printProduct'.
      // We will print the first selected item as an example of integration, 
      // or we can pass an array if PrintQR is adapted.
      alert(`Preparing to print barcodes for ${itemsToPrint.length} item(s). Ensure you have completed them first to get real Inventory IDs.`);
  };

  const filteredProducts = products.filter(p => 
    (p.designName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.productId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.workerId?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedAssignment) {
      const totalDraftNet = draftList.reduce((acc, i) => acc + (parseFloat(i.goldWt) || 0), 0);
      const totalDraftStone = draftList.reduce((acc, i) => acc + (parseFloat(i.stoneWt) || 0), 0);
      const totalDraftGross = draftList.reduce((acc, i) => acc + (parseFloat(i.grossWt) || 0), 0);

      const inputRowStyle = { display: 'flex', alignItems: 'center', marginBottom: '8px' };
      const labelStyle = { width: '150px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 };
      const inputStyle = { flex: 1, padding: '6px 10px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-main)' };

      return (
          <div className="glass" style={{ padding: '24px', background: 'var(--surface-bg)', minHeight: '80vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 className="gold-gradient" style={{ margin: 0 }}>PRODUCTION RECEIPT</h2>
                  <button onClick={() => setSelectedAssignment(null)} className="glass" style={{ padding: '8px 16px' }}>Back to Assignments</button>
              </div>

              {/* Assignment Context */}
              <div style={{ display: 'flex', gap: '20px', padding: '15px 20px', background: 'var(--dark-bg)', borderRadius: '12px', marginBottom: '20px', borderLeft: '4px solid var(--primary-gold)' }}>
                  <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ASSIGNED CODE</span><div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selectedAssignment.productId}</div></div>
                  <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>WORKER</span><div style={{ fontWeight: 600 }}>{selectedAssignment.workerId?.name || 'Unknown'}</div></div>
                  <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GOLD ISSUED</span><div style={{ fontWeight: 600 }}>{selectedAssignment.expectedWeight}g</div></div>
                  {selectedAssignment.dueDate && (
                    <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DUE DATE</span><div style={{ fontWeight: 600 }}>{new Date(selectedAssignment.dueDate).toLocaleDateString()}</div></div>
                  )}
              </div>

              {/* Add Received Item Form */}
              <div className="glass" style={{ padding: '24px', background: 'var(--dark-bg)', borderRadius: '15px', marginBottom: '25px', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                  <h4 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: 'var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18}/> Add Finished Item
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'flex-end' }}>
                      <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Product Name / Design</label>
                          <input value={draftForm.name} onChange={e => setDraftForm({...draftForm, name: e.target.value})} placeholder="e.g. Bridal Necklace - Final" style={{ width: '100%', padding: '12px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                          <div>
                              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Gross Wt (g)</label>
                              <input type="number" step="0.001" value={draftForm.grossWt} onChange={e => setDraftForm({...draftForm, grossWt: e.target.value})} placeholder="0.000" style={{ width: '100%', padding: '12px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)' }} />
                          </div>
                          <div>
                              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Net Wt (g)</label>
                              <input type="number" step="0.001" value={draftForm.goldWt} onChange={e => setDraftForm({...draftForm, goldWt: e.target.value})} placeholder="0.000" style={{ width: '100%', padding: '12px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)' }} />
                          </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Total Stone Wt</label>
                              <input type="number" step="0.001" value={draftForm.stoneWt} onChange={e => setDraftForm({...draftForm, stoneWt: e.target.value})} placeholder="0.000" style={{ width: '100%', padding: '12px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)' }} />
                          </div>
                          <button onClick={() => setShowDraftStones(!showDraftStones)} title="Stone Details" className="glass" style={{ padding: '0 15px', borderRadius: '8px', height: '45px', marginTop: '26px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>💎 <span style={{ fontSize: '0.7rem' }}>Stones</span></div>
                          </button>
                      </div>
                      <button onClick={handleAddDraft} className="btn-primary" style={{ padding: '12px', borderRadius: '8px', height: '45px', fontWeight: 600 }}>
                          SUBMIT TO LIST
                      </button>
                  </div>
                  
                  {/* Expanded Stone Panel */}
                  {showDraftStones && (
                      <div style={{ width: '100%', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--glass-border)', marginTop: '20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
                              {/* Assigned Stones Reference */}
                              <div style={{ borderRight: '1px solid var(--glass-border)', paddingRight: '20px' }}>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--primary-gold)', margin: '0 0 15px 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16}/> Assigned Stone Details
                                  </p>
                                  {selectedAssignment.stones && selectedAssignment.stones.length > 0 ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                          {selectedAssignment.stones.map((s, i) => (
                                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                                                  <span style={{ fontWeight: 500 }}>{s.stoneName}</span>
                                                  <span style={{ color: 'var(--text-muted)' }}>{s.stoneWeight}g</span>
                                              </div>
                                          ))}
                                      </div>
                                  ) : (
                                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No stones were assigned to this work.</p>
                                  )}
                              </div>

                              {/* Custom Stones Input */}
                              <div>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: '0 0 15px 0', fontWeight: 600 }}>Custom / Actual Stones Used</p>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                      {draftForm.stones.map((stone, idx) => (
                                          <div key={idx} style={{ display: 'flex', gap: '10px' }}>
                                              <input placeholder="Stone Name" value={stone.stoneName} onChange={e => updateDraftStone(idx, 'stoneName', e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--dark-bg)', color: 'var(--text-main)', fontSize: '0.8rem' }} />
                                              <input type="number" step="0.001" placeholder="Weight" value={stone.stoneWeight} onChange={e => updateDraftStone(idx, 'stoneWeight', e.target.value)} style={{ width: '90px', padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--dark-bg)', color: 'var(--text-main)', fontSize: '0.8rem' }} />
                                              <button onClick={() => removeDraftStone(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={18}/></button>
                                          </div>
                                      ))}
                                      <button type="button" onClick={addDraftStone} style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px dashed var(--primary-gold)', color: 'var(--primary-gold)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                                          + Add Custom Stone Details
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              {/* Draft Table with Inline Editing */}
              <div className="glass" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--glass-border)', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                      <thead style={{ background: 'var(--dark-bg)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          <tr>
                              <th style={{ padding: '12px', textAlign: 'left' }}>S.No</th>
                              <th style={{ padding: '12px', textAlign: 'left' }}>Product Name</th>
                              <th style={{ padding: '12px', textAlign: 'left', width: '100px' }}>Gross Wt</th>
                              <th style={{ padding: '12px', textAlign: 'left', width: '100px' }}>Net Wt</th>
                              <th style={{ padding: '12px', textAlign: 'left', width: '100px' }}>Stone Wt</th>
                              <th style={{ padding: '12px', textAlign: 'center' }}>Print Code</th>
                              <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                          </tr>
                      </thead>
                      <tbody>
                          {draftList.map((item, idx) => (
                              <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                  <td style={{ padding: '12px' }}>{idx + 1}</td>
                                  <td style={{ padding: '8px' }}>
                                      <input value={item.name} onChange={e => updateInlineDraft(idx, 'name', e.target.value)} onBlur={handleInlineBlur} style={{ width: '100%', background: 'transparent', border: '1px dashed transparent', padding: '4px', color: 'var(--text-main)', outline: 'none' }} onFocus={e => e.target.style.border = '1px dashed var(--primary-gold)'} onBlur={(e) => { e.target.style.border = '1px dashed transparent'; handleInlineBlur(); }} />
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                      <input type="number" step="0.01" value={item.grossWt} onChange={e => updateInlineDraft(idx, 'grossWt', e.target.value)} onBlur={handleInlineBlur} style={{ width: '100%', background: 'transparent', border: '1px dashed transparent', padding: '4px', color: 'var(--text-main)', outline: 'none' }} onFocus={e => e.target.style.border = '1px dashed var(--primary-gold)'} onBlur={(e) => { e.target.style.border = '1px dashed transparent'; handleInlineBlur(); }} />
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                      <input type="number" step="0.01" value={item.goldWt} onChange={e => updateInlineDraft(idx, 'goldWt', e.target.value)} onBlur={handleInlineBlur} style={{ width: '100%', background: 'transparent', border: '1px dashed transparent', padding: '4px', color: 'var(--text-main)', outline: 'none' }} onFocus={e => e.target.style.border = '1px dashed var(--primary-gold)'} onBlur={(e) => { e.target.style.border = '1px dashed transparent'; handleInlineBlur(); }} />
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                      <input type="number" step="0.01" value={item.stoneWt} onChange={e => updateInlineDraft(idx, 'stoneWt', e.target.value)} onBlur={handleInlineBlur} style={{ width: '100%', background: 'transparent', border: '1px dashed transparent', padding: '4px', color: 'var(--text-main)', outline: 'none' }} onFocus={e => e.target.style.border = '1px dashed var(--primary-gold)'} onBlur={(e) => { e.target.style.border = '1px dashed transparent'; handleInlineBlur(); }} />
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'center' }}>
                                      <input type="checkbox" checked={item.barcode} onChange={e => {
                                          updateInlineDraft(idx, 'barcode', e.target.checked);
                                          handleInlineBlur();
                                      }} style={{ accentColor: 'var(--primary-gold)' }} />
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'center' }}>
                                      <button onClick={() => handleDeleteDraft(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                  </td>
                              </tr>
                          ))}
                          {draftList.length === 0 && (
                              <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No items drafted yet. Use the form above to add products.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>

              {/* Footer Summary & Submit */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '12px', border: '1px solid var(--primary-gold)' }}>
                  <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                      <div>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOTAL GROSS WT</p>
                          <h3 style={{ margin: 0 }}>{totalDraftGross.toFixed(2)}g</h3>
                      </div>
                      <div>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOTAL NET WT</p>
                          <h3 style={{ margin: 0 }}>{totalDraftNet.toFixed(2)}g</h3>
                      </div>
                      <div>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOTAL STONE WT</p>
                          <h3 style={{ margin: 0 }}>{totalDraftStone.toFixed(2)}</h3>
                      </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handlePrintBarcodes('all')} className="glass" style={{ padding: '10px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Printer size={16}/> Print All Barcodes
                      </button>
                      <button onClick={() => handlePrintBarcodes('selected')} className="glass" style={{ padding: '10px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Printer size={16}/> Print Selected
                      </button>
                      <button onClick={handleFinalSubmit} disabled={isSubmitting || draftList.length === 0} className="btn-primary" style={{ padding: '12px 30px', borderRadius: '8px', fontSize: '1rem', marginLeft: '10px' }}>
                          {isSubmitting ? 'Submitting...' : 'Submit to Inventory'}
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // ---- MAIN ASSIGNMENT LIST VIEW ----
  return (
    <div className="glass" style={{ padding: '24px', background: 'var(--surface-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 className="gold-gradient" style={{ fontSize: '1.8rem', margin: 0 }}>PRODUCTION FLOW</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '5px' }}>Monitor ongoing works and receive finished products</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}>
            <Plus size={18} /> New Assignment
        </button>
      </div>

      <div style={{ marginBottom: '25px', position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '15px', top: '15px', color: 'var(--text-muted)' }} size={20}/>
        <input 
            type="text" 
            placeholder="Search pending assignments by ID, design or craftsman..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '15px 15px 15px 50px', background: 'var(--dark-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)' }}
        />
      </div>

      <div className="responsive-grid">
          {filteredProducts.map(product => (
          <div key={product._id} className="glass" style={{ padding: '20px', borderLeft: `5px solid ${product.status === 'in-progress' ? 'var(--accent-blue)' : 'var(--primary-gold)'}`, background: 'var(--surface-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{product.productId}</span>
                  <h3 style={{ fontSize: '1.25rem', margin: '4px 0' }}>{product.designName}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{product.category}</p>
              </div>
              <span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: 'rgba(255, 183, 178, 0.2)', color: '#FF9AA2', border: `1px solid #FF9AA233`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12}/> PENDING
              </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '20px 0', padding: '15px', background: 'var(--dark-bg)', borderRadius: '12px' }}>
              <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CRAFTSMAN</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{product.workerId?.name || 'Unassigned'}</p>
              </div>
              <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>GOLD ISSUED</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{product.expectedWeight}g</p>
              </div>
              </div>

              {product.dueDate && (
                <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(231, 76, 60, 0.05)', borderRadius: '8px', border: '1px solid rgba(231, 76, 60, 0.1)' }}>
                   <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>DUE DATE</p>
                   <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--danger)' }}>{new Date(product.dueDate).toLocaleDateString()}</p>
                </div>
              )}

              <button 
                  className="glass" 
                  onClick={() => setSelectedAssignment(product)}
                  style={{ width: '100%', padding: '12px', color: 'var(--primary-gold)', border: '1px solid var(--primary-gold)', marginTop: '5px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, transition: 'var(--transition)' }}
              >
                  Receive Work <ChevronRight size={18} />
              </button>
          </div>
          ))}
      </div>

      {filteredProducts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
          <Package size={50} style={{ opacity: 0.1, marginBottom: '20px' }}/>
          <p>No pending assignments match your search.</p>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '90%', maxWidth: '700px', padding: '30px', maxHeight: '95vh', overflowY: 'auto', background: 'var(--surface-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem' }} className="gold-gradient">Gold Issuance & New Assignment</h3>
                <X onClick={() => setShowCreateModal(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}/>
            </div>
            
            <form onSubmit={handleCreate}>
              <div className="responsive-grid" style={{ gap: '20px' }}>
                <div className="input-group">
                  <label>Assign to Craftsman *</label>
                  <select required value={newProductData.workerId} onChange={e => setNewProductData({...newProductData, workerId: e.target.value})} style={{ background: 'var(--dark-bg)' }}>
                    <option value="">Select Worker...</option>
                    {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Gold Issued Weight (g) *</label>
                  <input type="number" step="0.001" required value={newProductData.expectedWeight} onChange={e => setNewProductData({...newProductData, expectedWeight: e.target.value})} style={{ background: 'var(--dark-bg)' }} placeholder="0.000" />
                </div>
                <div className="input-group">
                  <label>Due Date</label>
                  <input type="date" required value={newProductData.dueDate} onChange={e => setNewProductData({...newProductData, dueDate: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                </div>
              </div>

              <div className="responsive-grid" style={{ gap: '20px' }}>
                <div className="input-group">
                  <label>Category</label>
                  <select value={newProductData.category} onChange={e => setNewProductData({...newProductData, category: e.target.value})} style={{ background: 'var(--dark-bg)' }}>
                    {categories.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ flex: 2 }}>
                  <label>Purity Value</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                      <input list="purity-standards" value={newProductData.purity} onChange={e => setNewProductData({...newProductData, purity: e.target.value})} style={{ flex: 1, background: 'var(--dark-bg)' }} />
                      <datalist id="purity-standards">
                          {purityStandards.map(ps => <option key={ps.label} value={ps.label} />)}
                      </datalist>
                      <select value={newProductData.purityType} onChange={e => setNewProductData({...newProductData, purityType: e.target.value})} style={{ width: '120px', background: 'var(--dark-bg)' }}>
                          <option value="Carat">Carat</option>
                          <option value="Percentage">Percentage</option>
                      </select>
                  </div>
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Bulk Quantity</label>
                  <input type="number" min="1" value={newProductData.quantity} onChange={e => setNewProductData({...newProductData, quantity: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                </div>
              </div>

              <div className="responsive-grid" style={{ gap: '20px' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Assignment / Design Name</label>
                    <input required value={newProductData.designName} onChange={e => setNewProductData({...newProductData, designName: e.target.value})} style={{ background: 'var(--dark-bg)' }} placeholder="e.g. Bridal Necklace" />
                  </div>
                  <div className="input-group" style={{ flex: 2 }}>
                    <label>Design Notes / Instructions</label>
                    <input value={newProductData.notes} onChange={e => setNewProductData({...newProductData, notes: e.target.value})} style={{ background: 'var(--dark-bg)' }} placeholder="e.g. Special pattern requested..." />
                  </div>
              </div>

              {/* Stone Issuance Section */}
              <div className="glass" style={{ padding: '20px', background: 'rgba(212, 175, 55, 0.02)', borderRadius: '12px', border: '1px dashed var(--primary-gold)', marginTop: '20px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--primary-gold)', margin: '0 0 15px 0', fontWeight: 600 }}>Issued Stones (Optional)</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {newProductData.stones.map((stone, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '10px' }}>
                              <select value={stone.stoneName} onChange={e => updateCreateStone(idx, 'stoneName', e.target.value)} style={{ flex: 1, background: 'var(--dark-bg)', padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}>
                                  <option value="">Select Stone...</option>
                                  {companyStones.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                              </select>
                              <input type="number" placeholder="Weight" value={stone.stoneWeight} onChange={e => updateCreateStone(idx, 'stoneWeight', e.target.value)} style={{ width: '90px', padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--dark-bg)', color: 'var(--text-main)' }} />
                              <button type="button" onClick={() => removeCreateStone(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={18}/></button>
                          </div>
                      ))}
                      <button type="button" onClick={addCreateStone} style={{ background: 'transparent', border: '1px dashed var(--primary-gold)', color: 'var(--primary-gold)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                          + Add Stone to Issuance
                      </button>
                  </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button type="button" className="glass" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '10px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, borderRadius: '10px' }}>Issue Gold & Assign Work</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
