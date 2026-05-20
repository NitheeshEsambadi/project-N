import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Package, Clock, ChevronRight, Search, X, Trash2, Printer, Save, LayoutGrid, List, RotateCcw } from 'lucide-react';

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
  
  const [viewMode, setViewMode] = useState('card');
  
  // Create Assignment State
  const [newProductData, setNewProductData] = useState({
    category: '', designName: '', expectedWeight: '', pureWeight: '', workerId: '', stones: [], totalStoneWeight: 0, purity: '92', purityType: 'Percentage', dueDate: '', issuanceDate: new Date().toISOString().split('T')[0], notes: ''
  });
  const [showStoneDetail, setShowStoneDetail] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('ongoing'); // 'ongoing' or 'received'
  const [showReceiveDecisionModal, setShowReceiveDecisionModal] = useState(false);
  const [pendingReceiveProduct, setPendingReceiveProduct] = useState(null);
  const [receivedWeightInput, setReceivedWeightInput] = useState('');

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
              setNewProductData(prev => ({...prev, purity: '92', purityType: 'Percentage'}));
          }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-calculate Pure Weight
  useEffect(() => {
    const wt = parseFloat(newProductData.expectedWeight) || 0;
    let purityVal = 0;
    
    if (newProductData.purityType === 'Carat') {
        const standard = purityStandards.find(s => s.label === newProductData.purity);
        purityVal = standard ? parseFloat(standard.value) : 0;
    } else {
        purityVal = parseFloat(newProductData.purity) || 0;
    }
    
    const pure = (wt * purityVal) / 100;
    setNewProductData(prev => ({ ...prev, pureWeight: pure.toFixed(3) }));
  }, [newProductData.expectedWeight, newProductData.purity, newProductData.purityType, purityStandards]);

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    }).split(' ').join(' - ');
  };

  // ---- CREATE ASSIGNMENT LOGIC ----
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/mgmt/products', newProductData);
      setShowCreateModal(false);
      setNewProductData({ category: categories[0]?.name || '', designName: '', expectedWeight: '', pureWeight: '', workerId: '', stones: [], totalStoneWeight: 0, purity: '92', purityType: 'Percentage', dueDate: '', issuanceDate: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
       alert('Error creating assignment');
    }
  };

  const handleReceiveClick = (product) => {
    setPendingReceiveProduct(product);
    setReceivedWeightInput(product.expectedWeight || ''); // Default to issued weight
    setShowReceiveDecisionModal(true);
  };

  const processReceiveDecision = async (decision) => {
    if (decision === 'now') {
      setSelectedAssignment(pendingReceiveProduct);
      setShowReceiveDecisionModal(false);
    } else {
      if (!receivedWeightInput) {
        alert('Please enter the received weight.');
        return;
      }
      try {
        await api.put(`/mgmt/products/${pendingReceiveProduct._id}`, { 
          status: 'received',
          grossWeight: parseFloat(receivedWeightInput)
        });
        setShowReceiveDecisionModal(false);
        setReceivedWeightInput('');
        fetchData();
        setActiveSubTab('received');
      } catch (err) {
        alert('Error updating status');
      }
    }
  };

  const addCreateStone = () => setNewProductData({ ...newProductData, stones: [...newProductData.stones, { stoneName: '', stoneWeight: '', stoneDetails: '' }] });
  const updateCreateStone = (i, f, v) => { 
    const s = [...newProductData.stones]; 
    s[i][f] = v; 
    const total = s.reduce((acc, st) => acc + (parseFloat(st.stoneWeight) || 0), 0);
    setNewProductData({ ...newProductData, stones: s, totalStoneWeight: total.toFixed(3) }); 
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
                  {selectedAssignment.notes && (
                    <div style={{ flex: 1 }}><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DESIGN NOTES</span><div style={{ fontWeight: 600, color: 'var(--primary-gold)' }}>{selectedAssignment.notes}</div></div>
                  )}
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
                                      <input value={item.name} onChange={e => updateInlineDraft(idx, 'name', e.target.value)} style={{ width: '100%', background: 'transparent', border: '1px dashed transparent', padding: '4px', color: 'var(--text-main)', outline: 'none' }} onFocus={e => e.target.style.border = '1px dashed var(--primary-gold)'} onBlur={(e) => { e.target.style.border = '1px dashed transparent'; handleInlineBlur(); }} />
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                      <input type="number" step="0.01" value={item.grossWt} onChange={e => updateInlineDraft(idx, 'grossWt', e.target.value)} style={{ width: '100%', background: 'transparent', border: '1px dashed transparent', padding: '4px', color: 'var(--text-main)', outline: 'none' }} onFocus={e => e.target.style.border = '1px dashed var(--primary-gold)'} onBlur={(e) => { e.target.style.border = '1px dashed transparent'; handleInlineBlur(); }} />
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                      <input type="number" step="0.01" value={item.goldWt} onChange={e => updateInlineDraft(idx, 'goldWt', e.target.value)} style={{ width: '100%', background: 'transparent', border: '1px dashed transparent', padding: '4px', color: 'var(--text-main)', outline: 'none' }} onFocus={e => e.target.style.border = '1px dashed var(--primary-gold)'} onBlur={(e) => { e.target.style.border = '1px dashed transparent'; handleInlineBlur(); }} />
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                      <input type="number" step="0.01" value={item.stoneWt} onChange={e => updateInlineDraft(idx, 'stoneWt', e.target.value)} style={{ width: '100%', background: 'transparent', border: '1px dashed transparent', padding: '4px', color: 'var(--text-main)', outline: 'none' }} onFocus={e => e.target.style.border = '1px dashed var(--primary-gold)'} onBlur={(e) => { e.target.style.border = '1px dashed transparent'; handleInlineBlur(); }} />
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

      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
          <button 
              onClick={() => setActiveSubTab('ongoing')}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeSubTab === 'ongoing' ? 'rgba(212, 175, 55, 0.15)' : 'transparent', color: activeSubTab === 'ongoing' ? 'var(--primary-gold)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
          >
              Ongoing Assignments ({products.filter(p => p.status !== 'received').length})
          </button>
          <button 
              onClick={() => setActiveSubTab('received')}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeSubTab === 'received' ? 'rgba(212, 175, 55, 0.15)' : 'transparent', color: activeSubTab === 'received' ? 'var(--primary-gold)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
          >
              Received Work ({products.filter(p => p.status === 'received').length})
          </button>
          <div style={{ flex: 1 }} />
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '15px', top: '15px', color: 'var(--text-muted)' }} size={20}/>
            <input 
                type="text" 
                placeholder="Search pending assignments by ID, design or craftsman..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="glass" 
                style={{ width: '100%', padding: '15px 15px 15px 50px', background: 'var(--dark-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)' }}
            />
        </div>
        <div style={{ display: 'flex', background: 'var(--dark-bg)', padding: '5px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
            <button 
                onClick={() => setViewMode('card')}
                style={{ padding: '8px', borderRadius: '6px', background: viewMode === 'card' ? 'var(--primary-gold)' : 'transparent', color: viewMode === 'card' ? 'black' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: '0.2s' }}
            >
                <LayoutGrid size={20}/>
            </button>
            <button 
                onClick={() => setViewMode('list')}
                style={{ padding: '8px', borderRadius: '6px', background: viewMode === 'list' ? 'var(--primary-gold)' : 'transparent', color: viewMode === 'list' ? 'black' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: '0.2s' }}
            >
                <List size={20}/>
            </button>
        </div>
      </div>

      {activeSubTab === 'ongoing' ? (
        <>
          {viewMode === 'card' ? (
            <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {filteredProducts.filter(p => p.status !== 'received').map(product => (
                <div key={product._id} className="glass" style={{ padding: '20px', borderTop: `4px solid ${product.status === 'in-progress' ? 'var(--accent-blue)' : 'var(--primary-gold)'}`, background: 'var(--surface-bg)', borderRadius: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{product.productId}</span>
                                <h3 style={{ fontSize: '1.15rem', margin: '4px 0', fontWeight: 700 }}>{product.designName}</h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--primary-gold)', fontWeight: 600 }}>{product.category}</span>
                            </div>
                            <span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700, background: 'rgba(212, 175, 55, 0.1)', color: 'var(--primary-gold)', border: '1px solid rgba(212, 175, 55, 0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12}/> {product.status.toUpperCase()}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '15px 0', padding: '12px', background: 'var(--dark-bg)', borderRadius: '10px' }}>
                            <div>
                                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Issued</p>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{product.expectedWeight}g</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Purity</p>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-gold)' }}>{product.purity}{product.purityType === 'Carat' ? 'k' : '%'}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Pure Wt</p>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)' }}>{product.pureWeight?.toFixed(3) || '0.000'}g</p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px', padding: '10px', background: 'var(--dark-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px' }}>CRAFTSMAN</p>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{product.workerId?.name || 'Unassigned'}</p>
                        </div>

                        {product.dueDate && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '8px 12px', background: 'rgba(231, 76, 60, 0.05)', borderRadius: '8px' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>DUE DATE</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger)' }}>{formatDate(product.dueDate)}</span>
                            </div>
                        )}
                    </div>

                    <button 
                        className="glass" 
                        onClick={() => handleReceiveClick(product)}
                        style={{ width: '100%', padding: '12px', color: 'var(--primary-gold)', border: '1px solid var(--primary-gold)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700, transition: '0.3s' }}
                    >
                        Receive Work <ChevronRight size={18} />
                    </button>
                </div>
                ))}
            </div>
          ) : (
            <div className="table-container glass" style={{ padding: '0', overflow: 'hidden', borderRadius: '15px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--dark-bg)' }}>
                        <tr style={{ textAlign: 'left', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '15px' }}>ID / DATE</th>
                            <th style={{ padding: '15px' }}>DESIGN / CAT</th>
                            <th style={{ padding: '15px' }}>CRAFTSMAN</th>
                            <th style={{ padding: '15px' }}>ISSUED (G)</th>
                            <th style={{ padding: '15px' }}>PURE (G)</th>
                            <th style={{ padding: '15px' }}>DUE DATE</th>
                            <th style={{ padding: '15px', textAlign: 'right' }}>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.filter(p => p.status !== 'received').map(product => (
                            <tr key={product._id} style={{ borderTop: '1px solid var(--glass-border)', transition: '0.2s' }}>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{product.productId}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatDate(product.issuanceDate)}</div>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{product.designName}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--primary-gold)' }}>{product.category}</div>
                                </td>
                                <td style={{ padding: '15px', fontWeight: 500 }}>{product.workerId?.name || 'Unassigned'}</td>
                                <td style={{ padding: '15px', fontWeight: 600 }}>{product.expectedWeight}g</td>
                                <td style={{ padding: '15px', fontWeight: 700, color: 'var(--success)' }}>{product.pureWeight?.toFixed(3)}g</td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.85rem' }}>
                                        {formatDate(product.dueDate)}
                                    </span>
                                </td>
                                <td style={{ padding: '15px', textAlign: 'right' }}>
                                    <button 
                                        onClick={() => handleReceiveClick(product)}
                                        style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--primary-gold)', color: 'var(--primary-gold)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        Receive
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}

          {filteredProducts.filter(p => p.status !== 'received').length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <Package size={50} style={{ opacity: 0.1, marginBottom: '20px' }}/>
              <p>No pending assignments found.</p>
            </div>
          )}
        </>
      ) : (
          /* RECEIVED TAB VIEW */
          <div className="table-container glass" style={{ padding: '0', overflow: 'hidden', borderRadius: '15px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--dark-bg)' }}>
                    <tr style={{ textAlign: 'left', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        <th style={{ padding: '15px' }}>Product Code</th>
                        <th style={{ padding: '15px' }}>Design</th>
                        <th style={{ padding: '15px' }}>Craftsman</th>
                        <th style={{ padding: '15px' }}>Issued Wt</th>
                        <th style={{ padding: '15px' }}>Status</th>
                        <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.filter(p => p.status === 'received').map(product => (
                        <tr key={product._id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                            <td style={{ padding: '15px', fontFamily: 'monospace', fontWeight: 600 }}>{product.productId}</td>
                            <td style={{ padding: '15px', fontWeight: 600 }}>{product.designName}</td>
                            <td style={{ padding: '15px' }}>{product.workerId?.name}</td>
                            <td style={{ padding: '15px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Issued: {product.expectedWeight}g</div>
                                <div style={{ fontWeight: 700, color: 'var(--primary-gold)' }}>Recvd: {product.grossWeight}g</div>
                            </td>
                            <td style={{ padding: '15px' }}>
                                <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--primary-gold)', fontSize: '0.75rem', fontWeight: 600 }}>PENDING SEPARATION</span>
                            </td>
                            <td style={{ padding: '15px', textAlign: 'right' }}>
                                <button onClick={() => setSelectedAssignment(product)} className="btn-primary" style={{ padding: '8px 15px', borderRadius: '6px', fontSize: '0.8rem' }}>Separate & Add stock</button>
                            </td>
                        </tr>
                    ))}
                    {filteredProducts.filter(p => p.status === 'received').length === 0 && (
                        <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No work is currently pending detailed separation.</td></tr>
                    )}
                </tbody>
            </table>
          </div>
      )}

      {/* Decision Modal */}
      {showReceiveDecisionModal && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
              <div className="glass" style={{ width: '90%', maxWidth: '400px', padding: '30px', textAlign: 'center', border: '1px solid var(--primary-gold)' }}>
                  <div style={{ background: 'rgba(212, 175, 55, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <RotateCcw size={30} color="var(--primary-gold)"/>
                  </div>
                  <h3 style={{ marginBottom: '10px' }}>Receive Work</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>Record the weight received from craftsman before proceeding.</p>
                  
                  <div style={{ background: 'var(--dark-bg)', padding: '15px', borderRadius: '10px', marginBottom: '25px', border: '1px solid var(--glass-border)' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--primary-gold)', fontWeight: 700, display: 'block', marginBottom: '8px', textAlign: 'left' }}>RECEIVED GROSS WEIGHT (G)</label>
                      <input 
                        type="number" 
                        step="0.001" 
                        value={receivedWeightInput}
                        onChange={e => setReceivedWeightInput(e.target.value)}
                        placeholder="0.000"
                        style={{ width: '100%', padding: '12px', background: 'var(--surface-bg)', border: '1px solid var(--primary-gold)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 700, textAlign: 'center' }}
                      />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <button onClick={() => processReceiveDecision('later')} className="btn-primary" style={{ padding: '14px', borderRadius: '10px', fontWeight: 600 }}>Mark Received (Separate Later)</button>
                      <button onClick={() => processReceiveDecision('now')} className="glass" style={{ padding: '14px', borderRadius: '10px', fontWeight: 600, color: 'var(--text-main)' }}>Separate Detailed Work Now</button>
                      <button onClick={() => setShowReceiveDecisionModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', marginTop: '10px', cursor: 'pointer' }}>Cancel</button>
                  </div>
              </div>
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
                  <label>Date</label>
                  <input type="date" value={newProductData.issuanceDate} onChange={e => setNewProductData({...newProductData, issuanceDate: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                </div>
              </div>

              <div className="responsive-grid" style={{ gap: '20px', marginTop: '15px' }}>
                <div className="input-group">
                  <label>Gold Issued Weight (Grams) *</label>
                  <input type="number" step="0.001" required value={newProductData.expectedWeight} onChange={e => setNewProductData({...newProductData, expectedWeight: e.target.value})} style={{ background: 'var(--dark-bg)' }} placeholder="0.000 g" />
                </div>
                <div className="input-group">
                  <label>Purity Selection</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                      <select value={newProductData.purityType} onChange={e => {
                          const type = e.target.value;
                          setNewProductData({
                              ...newProductData, 
                              purityType: type, 
                              purity: type === 'Percentage' ? '92' : (purityStandards[0]?.label || '22k')
                          });
                      }} style={{ width: '130px', background: 'var(--dark-bg)' }}>
                          <option value="Carat">Carat</option>
                          <option value="Percentage">Percentage</option>
                      </select>
                      {newProductData.purityType === 'Carat' && (
                        <div style={{ flex: 1 }}>
                            <input list="purity-standards" value={newProductData.purity} onChange={e => setNewProductData({...newProductData, purity: e.target.value})} style={{ width: '100%', background: 'var(--dark-bg)' }} />
                            <datalist id="purity-standards">
                                {purityStandards.map(ps => <option key={ps.label} value={ps.label} />)}
                            </datalist>
                        </div>
                      )}
                      {newProductData.purityType === 'Percentage' && (
                        <input type="number" step="0.01" value={newProductData.purity} onChange={e => setNewProductData({...newProductData, purity: e.target.value})} style={{ flex: 1, background: 'var(--dark-bg)' }} />
                      )}
                  </div>
                </div>
              </div>

              <div className="responsive-grid" style={{ gap: '20px', marginTop: '15px' }}>
                <div className="input-group">
                  <label>Pure Weight (Grams)</label>
                  <input type="number" readOnly value={newProductData.pureWeight} style={{ background: 'rgba(46, 204, 113, 0.05)', color: 'var(--success)', fontWeight: 700 }} />
                </div>
                <div className="input-group">
                  <label>Due Date (Optional)</label>
                  <input type="date" value={newProductData.dueDate} onChange={e => setNewProductData({...newProductData, dueDate: e.target.value})} style={{ background: 'var(--dark-bg)' }} />
                </div>
              </div>

              {/* Stone Section */}
              <div className="glass" style={{ marginTop: '25px', padding: '20px', background: 'rgba(212, 175, 55, 0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={18} color="var(--primary-gold)"/>
                        <p style={{ fontSize: '0.9rem', color: 'var(--primary-gold)', margin: 0, fontWeight: 700 }}>Stone Issuance</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Stone Wt (g):</span>
                        <input 
                            type="number" 
                            step="0.001" 
                            value={newProductData.totalStoneWeight} 
                            onChange={e => setNewProductData({...newProductData, totalStoneWeight: parseFloat(e.target.value) || 0})}
                            style={{ width: '100px', background: 'var(--dark-bg)', border: '1px solid var(--primary-gold)', borderRadius: '6px', color: 'var(--primary-gold)', fontWeight: 700, textAlign: 'center', padding: '5px' }}
                        />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {newProductData.stones.map((stone, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '8px', background: 'var(--dark-bg)', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                              <select value={stone.stoneName} onChange={e => updateCreateStone(idx, 'stoneName', e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}>
                                  <option value="">Select Stone...</option>
                                  {companyStones.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                              </select>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '10px' }}>
                                  <input type="number" step="0.001" placeholder="0.000" value={stone.stoneWeight} onChange={e => updateCreateStone(idx, 'stoneWeight', e.target.value)} style={{ width: '80px', background: 'transparent', border: 'none', color: 'var(--primary-gold)', fontWeight: 600, outline: 'none' }} />
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>g</span>
                              </div>
                              <button type="button" onClick={() => removeCreateStone(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0 5px' }}><X size={16}/></button>
                          </div>
                      ))}
                      <button 
                          type="button" 
                          onClick={addCreateStone} 
                          style={{ background: 'transparent', border: '1px dashed var(--primary-gold)', color: 'var(--primary-gold)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, marginTop: '5px' }}
                      >
                          + Add Stone Item to Split
                      </button>
                  </div>
              </div>

              <div className="input-group" style={{ marginTop: '20px' }}>
                  <label>Design & Instructions Description</label>
                  <textarea 
                    required 
                    value={newProductData.designName} 
                    onChange={e => setNewProductData({...newProductData, designName: e.target.value})} 
                    style={{ background: 'var(--dark-bg)', minHeight: '120px', width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-main)', resize: 'vertical' }} 
                    placeholder="Enter full design details and instructions here..."
                  />
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
