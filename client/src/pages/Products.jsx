import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Package, Clock, ChevronRight, Search, X, Trash2, Printer, Save, LayoutGrid, List, RotateCcw, FileText, Edit2, Scale, Gem, Settings, Percent, ArrowLeft, Filter, Calendar } from 'lucide-react';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([{ name: 'Necklace', code: 'NE' }]);
  const [companyStones, setCompanyStones] = useState([]);
  const [purityStandards, setPurityStandards] = useState([{label: '22k', value: '91.6'}]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null); 
  
  const [viewMode, setViewMode] = useState('list');
  
  // Create Assignment State
  const [newProductData, setNewProductData] = useState({
    category: '', designName: '', expectedWeight: '', expectedFinishedWeight: '', pureWeight: '', workerId: '', stones: [], totalStoneWeight: 0, purity: '100', purityType: 'Percentage', dueDate: '', issuanceDate: new Date().toISOString().split('T')[0], notes: ''
  });
  const [showStoneDetail, setShowStoneDetail] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('pending'); // 'pending' or 'completed'
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
  const [workerSearchText, setWorkerSearchText] = useState('');
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [activeWorkerIndex, setActiveWorkerIndex] = useState(-1);
  const [editingId, setEditingId] = useState(null);

  // Additional Issuance State
  const [showIssuanceModal, setShowIssuanceModal] = useState(false);
  const [selectedProductForIssuance, setSelectedProductForIssuance] = useState(null);
  const [issuanceFormData, setIssuanceFormData] = useState({
    weight: '', purity: '22k', notes: '', issuanceDate: new Date().toISOString().split('T')[0], stones: [], totalStoneWeight: 0, cashIssuance: ''
  });
  const [editingIssuanceId, setEditingIssuanceId] = useState(null);
  const [showIssuanceStoneDetail, setShowIssuanceStoneDetail] = useState(false);
  const [issuanceType, setIssuanceType] = useState('gold'); // 'gold' | 'stone' | 'cash'
  const [issuanceSort, setIssuanceSort] = useState('oldest'); // 'newest' | 'oldest'

  const filteredWorkers = workers.filter(w => 
    (w.name || '').toLowerCase().includes(workerSearchText.toLowerCase())
  );

  useEffect(() => {
    if (showCreateModal) {
      if (!editingId) {
        setWorkerSearchText('');
      }
      setShowWorkerDropdown(false);
      setActiveWorkerIndex(-1);
    }
  }, [showCreateModal, editingId]);

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
      setProducts(productRes.data || []);
      setWorkers(workersRes.data || []);
      if (companyRes.data) {
          if (companyRes.data.categories?.length > 0) {
              const activeCats = companyRes.data.categories.filter(c => c.status !== 'Inactive');
              setCategories(activeCats);
              if (activeCats.length > 0) {
                  setNewProductData(prev => ({...prev, category: activeCats[0].name}));
              }
          }
          if (companyRes.data.stones) {
              const activeStones = companyRes.data.stones.filter(s => s.status !== 'Inactive');
              setCompanyStones(activeStones);
          }
          if (companyRes.data.purityStandards?.length > 0) {
              setPurityStandards(companyRes.data.purityStandards);
              setNewProductData(prev => ({...prev, purity: '100', purityType: 'Percentage'}));
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

  const getProductTotalIssuedWeight = (product) => {
    const baseWeight = parseFloat(product.expectedWeight) || 0;
    const additionalWeight = (product.issuances || [])
      .filter(iss => (!iss.cashIssuance || parseFloat(iss.cashIssuance) === 0) && (!iss.stones || iss.stones.length === 0))
      .reduce((sum, iss) => sum + (parseFloat(iss.weight) || 0), 0);
    return baseWeight + additionalWeight;
  };

  const getProductTotalPureWeight = (product) => {
    const baseWeight = parseFloat(product.expectedWeight) || 0;
    let basePurityVal = 0;
    if (product.purityType === 'Carat') {
        const standard = purityStandards.find(s => s.label === product.purity);
        basePurityVal = standard ? parseFloat(standard.value) : 0;
    } else {
        basePurityVal = parseFloat(product.purity) || 0;
    }
    const basePure = (baseWeight * basePurityVal) / 100;

    const additionalPure = (product.issuances || [])
      .filter(iss => (!iss.cashIssuance || parseFloat(iss.cashIssuance) === 0) && (!iss.stones || iss.stones.length === 0))
      .reduce((sum, iss) => {
        const issWeight = parseFloat(iss.weight) || 0;
        let issPurityVal = 0;
        const issPurity = iss.purity || product.purity;
        if (product.purityType === 'Carat') {
            const standard = purityStandards.find(s => s.label === issPurity);
            issPurityVal = standard ? parseFloat(standard.value) : 0;
        } else {
            issPurityVal = parseFloat(issPurity) || 0;
        }
        return sum + ((issWeight * issPurityVal) / 100);
      }, 0);

    return basePure + additionalPure;
  };

  const handleOpenIssuances = (product) => {
    setSelectedProductForIssuance(product);
    setIssuanceFormData({
      weight: '',
      purity: '100',
      pureWeight: '',
      notes: '',
      issuanceDate: new Date().toISOString().split('T')[0],
      stones: [],
      totalStoneWeight: 0,
      cashIssuance: ''
    });
    setEditingIssuanceId(null);
    setShowIssuanceStoneDetail(false);
    setShowIssuanceModal(true);
  };

  const handleAddOrUpdateIssuance = async (e) => {
    e.preventDefault();
    if (!selectedProductForIssuance) return;

    // Clean payload based on issuanceType so stray tab fields are cleared
    const cleanedData = { ...issuanceFormData };
    if (issuanceType === 'gold') {
      cleanedData.cashIssuance = 0;
      cleanedData.stones = [];
      cleanedData.totalStoneWeight = 0;
    } else if (issuanceType === 'stone') {
      cleanedData.weight = 0;
      cleanedData.pureWeight = 0;
      cleanedData.cashIssuance = 0;
    } else if (issuanceType === 'cash') {
      cleanedData.weight = 0;
      cleanedData.pureWeight = 0;
      cleanedData.stones = [];
      cleanedData.totalStoneWeight = 0;
    }

    try {
      if (editingIssuanceId) {
        await api.put(`/mgmt/products/${selectedProductForIssuance._id}/issuances/${editingIssuanceId}`, cleanedData);
      } else {
        await api.post(`/mgmt/products/${selectedProductForIssuance._id}/issuances`, cleanedData);
      }
      fetchData();
      const { data } = await api.get('/mgmt/products');
      const updatedProd = data.find(p => p._id === selectedProductForIssuance._id);
      if (updatedProd) {
        setSelectedProductForIssuance(updatedProd);
      }
      setIssuanceFormData({
        weight: '',
        purity: '100',
        pureWeight: '',
        notes: '',
        issuanceDate: new Date().toISOString().split('T')[0],
        stones: [],
        totalStoneWeight: 0,
        cashIssuance: ''
      });
      setEditingIssuanceId(null);
      setShowIssuanceStoneDetail(false);
    } catch (err) {
      alert('Error saving issuance');
    }
  };

  const handleDeleteIssuance = async (issuanceId) => {
    if (!window.confirm('Delete this issuance?')) return;
    try {
      await api.delete(`/mgmt/products/${selectedProductForIssuance._id}/issuances/${issuanceId}`);
      fetchData();
      const { data } = await api.get('/mgmt/products');
      const updatedProd = data.find(p => p._id === selectedProductForIssuance._id);
      if (updatedProd) {
        setSelectedProductForIssuance(updatedProd);
      }
    } catch (err) {
      alert('Error deleting issuance');
    }
  };

  const handleEditIssuanceClick = (issuance) => {
    setEditingIssuanceId(issuance._id);
    let type = 'gold';
    if (issuance.cashIssuance > 0) {
      type = 'cash';
    } else if (issuance.stones && issuance.stones.length > 0) {
      type = 'stone';
    }
    setIssuanceType(type);

    setIssuanceFormData({
      weight: issuance.weight || '',
      purity: issuance.purity || '100',
      pureWeight: issuance.weight && issuance.purity ? ((parseFloat(issuance.weight) * parseFloat(issuance.purity)) / 100).toFixed(3) : '',
      notes: issuance.notes || '',
      issuanceDate: issuance.issuanceDate ? new Date(issuance.issuanceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      stones: (issuance.stones || []).map(st => ({
        stoneName: st.stoneName || '',
        stoneWeight: st.stoneWeight || '',
        stoneDetails: st.stoneDetails || '',
        pieces: st.pieces || 1,
        weightUnit: st.weightUnit || 'grams',
        avgWeight: st.avgWeight || ''
      })),
      totalStoneWeight: issuance.totalStoneWeight || 0,
      cashIssuance: issuance.cashIssuance || ''
    });
    setShowIssuanceStoneDetail(issuance.stones && issuance.stones.length > 0);
  };

  const addIssuanceStone = () => {
    setIssuanceFormData({
      ...issuanceFormData,
      stones: [...issuanceFormData.stones, { stoneName: '', stoneWeight: '', stoneDetails: '', pieces: 1, weightUnit: 'grams', avgWeight: '' }]
    });
  };

  const updateIssuanceStone = (i, f, v) => {
    const s = [...issuanceFormData.stones];
    s[i][f] = v;

    if (f === 'weightUnit') {
      if (v !== 'pieces') {
        s[i].pieces = 1;
        s[i].avgWeight = '';
      }
    }

    if (s[i].weightUnit === 'pieces') {
      if (f === 'pieces' || f === 'avgWeight') {
        const calculated = (parseFloat(s[i].pieces) || 0) * (parseFloat(s[i].avgWeight) || 0);
        s[i].stoneWeight = calculated > 0 ? calculated.toFixed(3) : '';
      }
    }

    const total = s.reduce((acc, st) => acc + (parseFloat(st.stoneWeight) || 0), 0);
    setIssuanceFormData({ ...issuanceFormData, stones: s, totalStoneWeight: total.toFixed(3) });
  };

  const removeIssuanceStone = (i) => {
    const s = [...issuanceFormData.stones];
    s.splice(i, 1);
    const total = s.reduce((acc, st) => acc + (parseFloat(st.stoneWeight) || 0), 0);
    setIssuanceFormData({ ...issuanceFormData, stones: s, totalStoneWeight: total.toFixed(3) });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    }).split(' ').join(' - ');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/mgmt/products/${editingId}`, newProductData);
      } else {
        await api.post('/mgmt/products', newProductData);
      }
      setShowCreateModal(false);
      setEditingId(null);
      setNewProductData({ category: categories[0]?.name || '', designName: '', expectedWeight: '', expectedFinishedWeight: '', pureWeight: '', workerId: '', stones: [], totalStoneWeight: 0, purity: '100', purityType: 'Percentage', dueDate: '', issuanceDate: new Date().toISOString().split('T')[0] });
      setWorkerSearchText('');
      setShowWorkerDropdown(false);
      fetchData();
    } catch (err) {
       alert(editingId ? 'Error updating assignment' : 'Error creating assignment');
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product._id);
    setNewProductData({
      category: product.category || '',
      designName: product.designName || '',
      expectedWeight: product.expectedWeight || '',
      expectedFinishedWeight: product.expectedFinishedWeight || '',
      pureWeight: product.pureWeight || '',
      workerId: product.workerId?._id || '',
      stones: product.stones || [],
      totalStoneWeight: product.totalStoneWeight || 0,
      purity: product.purity || '100',
      purityType: product.purityType || 'Percentage',
      dueDate: product.dueDate ? new Date(product.dueDate).toISOString().split('T')[0] : '',
      issuanceDate: product.issuanceDate ? new Date(product.issuanceDate).toISOString().split('T')[0] : '',
      notes: product.notes || ''
    });
    setWorkerSearchText(product.workerId?.name || '');
    setShowCreateModal(true);
  };

  const handleReceiveClick = (product) => {
    if (product.workerId?._id) {
      localStorage.setItem('worker_receipt_worker', product.workerId._id);
    }
    navigate('/worker-receipt');
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete assignment "${product.designName}" (${product.productId})? This action cannot be undone.`)) return;
    try {
      await api.delete(`/mgmt/products/${product._id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting assignment');
    }
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
  // Operational Metrics for Production Flow
  const ongoingProds = products.filter(p => p.status !== 'completed');
  const completedProds = products.filter(p => p.status === 'completed');
  const totalOngoingWeight = ongoingProds.reduce((acc, p) => acc + (parseFloat(p.expectedWeight) || 0), 0);
  const activeCraftsmenCount = new Set(ongoingProds.map(p => p.workerId?._id).filter(Boolean)).size;

  return (
    <div className="glass" style={{ padding: '28px', background: 'var(--surface-bg)', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 className="gold-gradient" style={{ fontSize: '2rem', margin: 0, tracking: '-0.03em' }}>PRODUCTION FLOW</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px', fontWeight: 500 }}>Monitor ongoing works and receive finished products</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="glass" onClick={() => navigate('/worker-receipt')} style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, color: 'var(--text-main)', border: '1px solid var(--glass-border)', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-gold)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}>
              <FileText size={18} color="var(--primary-gold)" /> Worker Receipt
          </button>
          <button className="btn-primary" onClick={() => { setEditingId(null); setShowCreateModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', padding: '12px 24px', transition: 'var(--transition)' }}>
              <Plus size={18} /> New Assignment
          </button>
        </div>
      </div>

      {/* Production Analytics Widget Grid */}
      <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '35px' }}>
        <div className="glass-card" style={{ padding: '20px', background: 'var(--dark-bg)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ongoing Tasks</p>
          <h3 style={{ fontSize: '1.8rem', marginTop: '8px', color: 'var(--text-main)', fontWeight: 800 }}>{ongoingProds.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>active</span></h3>
          <div style={{ height: '4px', background: 'var(--primary-gold)', width: '30px', marginTop: '12px', borderRadius: '2px' }} />
        </div>
        <div className="glass-card" style={{ padding: '20px', background: 'var(--dark-bg)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Metal in Circulation</p>
          <h3 style={{ fontSize: '1.8rem', marginTop: '8px', color: 'var(--primary-gold)', fontWeight: 800 }}>{totalOngoingWeight.toFixed(2)}<span style={{ fontSize: '0.9rem', fontWeight: 500 }}> g</span></h3>
          <div style={{ height: '4px', background: 'var(--secondary-gold)', width: '30px', marginTop: '12px', borderRadius: '2px' }} />
        </div>
        <div className="glass-card" style={{ padding: '20px', background: 'var(--dark-bg)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Craftsmen Working</p>
          <h3 style={{ fontSize: '1.8rem', marginTop: '8px', color: 'var(--text-main)', fontWeight: 800 }}>{activeCraftsmenCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>active</span></h3>
          <div style={{ height: '4px', background: 'var(--accent-blue)', width: '30px', marginTop: '12px', borderRadius: '2px' }} />
        </div>
        <div className="glass-card" style={{ padding: '20px', background: 'var(--dark-bg)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed Tasks</p>
          <h3 style={{ fontSize: '1.8rem', marginTop: '8px', color: 'var(--success)', fontWeight: 800 }}>{completedProds.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>items</span></h3>
          <div style={{ height: '4px', background: 'var(--success)', width: '30px', marginTop: '12px', borderRadius: '2px' }} />
        </div>
      </div>

      {/* Tabs & View Controls */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', flexWrap: 'wrap' }}>
          <button 
              onClick={() => setActiveSubTab('pending')}
              style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: activeSubTab === 'pending' ? 'rgba(139, 69, 255, 0.12)' : 'transparent', color: activeSubTab === 'pending' ? 'var(--primary-gold)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'var(--transition)' }}
          >
              Pending Assignments ({ongoingProds.length})
          </button>
          <button 
              onClick={() => setActiveSubTab('completed')}
              style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: activeSubTab === 'completed' ? 'rgba(139, 69, 255, 0.12)' : 'transparent', color: activeSubTab === 'completed' ? 'var(--primary-gold)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'var(--transition)' }}
          >
              Completed Assignments ({completedProds.length})
          </button>
          <div style={{ flex: 1 }} />
      </div>

      {/* Search & Grid/List controls */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20}/>
            <input 
                type="text" 
                placeholder="Search pending assignments by ID, design or craftsman..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '14px 14px 14px 48px', background: 'var(--dark-bg)', border: '1px solid var(--glass-border)', borderRadius: '14px', color: 'var(--text-main)', fontSize: '0.95rem', transition: 'var(--transition)' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary-gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
            />
        </div>
        <div style={{ display: 'flex', background: 'var(--dark-bg)', padding: '5px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <button 
                onClick={() => setViewMode('card')}
                style={{ padding: '8px 12px', borderRadius: '8px', background: viewMode === 'card' ? 'var(--primary-gold)' : 'transparent', color: viewMode === 'card' ? '#FFFFFF' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'var(--transition)', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '0.85rem' }}
            >
                <LayoutGrid size={16}/> Cards
            </button>
            <button 
                onClick={() => setViewMode('list')}
                style={{ padding: '8px 12px', borderRadius: '8px', background: viewMode === 'list' ? 'var(--primary-gold)' : 'transparent', color: viewMode === 'list' ? '#FFFFFF' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'var(--transition)', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '0.85rem' }}
            >
                <List size={16}/> List
            </button>
        </div>
      </div>

      {activeSubTab === 'pending' ? (
        <>
          {viewMode === 'card' ? (
            <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
                {filteredProducts.filter(p => p.status !== 'completed').map(product => {
                  // Sum up actual liquid cash issued from all issuances
                  const cashIssued = (product.issuances || []).reduce((acc, iss) => acc + (iss.cashIssuance || 0), 0);
                  // Sum up total stone weight (initial + additional issuances)
                  const initialStoneWeight = (product.stones || []).reduce((acc, st) => acc + (parseFloat(st.stoneWeight) || 0), 0);
                  const additionalStoneWeight = (product.issuances || []).reduce((acc, iss) => {
                    return acc + (iss.stones || []).reduce((sSum, s) => sSum + (parseFloat(s.stoneWeight) || 0), 0);
                  }, 0);
                  const totalStoneWeight = initialStoneWeight + additionalStoneWeight;

                  return (
                    <div 
                      key={product._id} 
                      className="glass-card fade-in" 
                      style={{ 
                        padding: '14px', 
                        background: 'var(--card-deep-bg)',
                        border: '2px solid var(--card-border)',
                        borderRadius: '16px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between', 
                        gap: '10px',
                        position: 'relative',
                        boxShadow: 'var(--card-shadow)'
                      }}
                    >
                      <div>
                        {/* Top Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          {/* Serial Number Pill */}
                          <div style={{ 
                            border: '1px solid var(--card-pill-border)', 
                            borderRadius: '6px', 
                            padding: '3px 6px', 
                            fontSize: '0.7rem', 
                            color: 'var(--card-pill-text)',
                            fontFamily: 'monospace',
                            background: 'var(--card-pill-bg)'
                          }}>
                            {product.productId}
                          </div>

                          {/* Actions Header */}
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button 
                              onClick={() => handleOpenIssuances(product)}
                              title="Manage Issuance"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary-gold)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Settings size={16} />
                            </button>
                            <div style={{ width: '1px', height: '14px', background: 'var(--card-divider)' }} />
                            <button 
                              onClick={() => handleEditClick(product)} 
                              title="Edit"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary-gold)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <div style={{ width: '1px', height: '14px', background: 'var(--card-divider)' }} />
                            <button 
                              onClick={() => handleDeleteProduct(product)} 
                              title="Delete"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--danger)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Trash2 size={16} style={{ color: 'var(--danger)' }} />
                            </button>
                          </div>
                        </div>

                        {/* Product Title / Category */}
                        <div style={{ marginBottom: '12px' }}>
                          <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--card-title-text)', fontWeight: '700', letterSpacing: '-0.02em', lineHeight: '1.2' }}>{product.designName}</h3>
                          <p style={{ margin: '4px 0 0 0', color: 'var(--secondary-gold)', fontWeight: '600', fontSize: '0.95rem' }}>{product.category}</p>
                        </div>

                        {/* Three Column Stats Grid */}
                        <div style={{ 
                          background: 'var(--card-inner-bg)', 
                          border: '1px solid var(--card-inner-border)',
                          borderRadius: '12px',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          padding: '12px 6px',
                          textAlign: 'center',
                          alignItems: 'center',
                          marginBottom: '12px'
                        }}>
                          {/* Issued Weight */}
                          <div style={{ borderRight: '1px solid var(--card-divider)' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                              <Scale size={18} style={{ color: 'var(--primary-gold)' }} />
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--card-stat-text)' }}>{getProductTotalPureWeight(product).toFixed(3)}g</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: '2px' }}>Pure Wt</div>
                          </div>

                          {/* Stones */}
                          <div style={{ borderRight: '1px solid var(--card-divider)' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                              <Gem size={18} style={{ color: 'var(--primary-gold)' }} />
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--card-stat-text)' }}>{totalStoneWeight.toFixed(2)}g</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: '2px' }}>Stone Wt</div>
                          </div>

                          {/* Cash Issued */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px', height: '18px', alignItems: 'center' }}>
                              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success)', lineHeight: '18px' }}>₹</span>
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>{cashIssued.toLocaleString('en-IN')}</div>
                          </div>
                        </div>

                        {/* Craftsman Info Block with Status next to Name */}
                        <div style={{ 
                          background: 'var(--card-inner-bg)', 
                          border: '1px solid var(--card-inner-border)',
                          borderRadius: '10px',
                          padding: '6px 10px',
                          marginBottom: '8px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: '750', color: 'var(--card-title-text)' }}>{product.workerId?.name || 'Unassigned'}</div>
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              padding: '3px 8px', 
                              borderRadius: '12px', 
                              fontSize: '0.65rem', 
                              fontWeight: 700, 
                              background: 'rgba(139, 69, 255, 0.12)', 
                              color: 'var(--primary-gold)',
                              border: '1px solid rgba(139, 69, 255, 0.2)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              <Clock size={10} style={{ color: 'var(--primary-gold)' }} /> {product.status}
                            </span>
                          </div>
                          {product.workerId?.contact && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{product.workerId.contact}</div>
                          )}
                        </div>
                      </div>

                      {/* Receive Work Button */}
                      <button 
                        className="glass" 
                        onClick={() => handleReceiveClick(product)}
                        style={{ 
                          width: '100%',
                          background: 'transparent',
                          border: '2px solid var(--primary-gold)',
                          borderRadius: '12px',
                          color: 'var(--primary-gold)',
                          fontWeight: 700,
                          fontSize: '1rem',
                          padding: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-gold)'; e.currentTarget.style.color = '#FFFFFF'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary-gold)'; }}
                      >
                        Receive Work <span style={{ fontSize: '1.2rem', lineHeight: '1rem' }}>&rsaquo;</span>
                      </button>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="table-container glass" style={{ padding: '0', overflow: 'hidden', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--dark-bg)' }}>
                        <tr style={{ textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            <th style={{ padding: '18px 20px' }}>ID / DATE</th>
                            <th style={{ padding: '18px 20px' }}>DESIGN / CAT</th>
                            <th style={{ padding: '18px 20px' }}>CRAFTSMAN</th>
                            <th style={{ padding: '18px 20px' }}>ISSUED (G)</th>
                            <th style={{ padding: '18px 20px' }}>PURE (G)</th>
                            <th style={{ padding: '18px 20px' }}>DUE DATE</th>
                            <th style={{ padding: '18px 20px', textAlign: 'right' }}>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.filter(p => p.status !== 'completed').map(product => (
                            <tr key={product._id} style={{ borderTop: '1px solid var(--glass-border)', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <td style={{ padding: '18px 20px' }}>
                                    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{product.productId}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{formatDate(product.issuanceDate)}</div>
                                </td>
                                <td style={{ padding: '18px 20px' }}>
                                    <div style={{ fontWeight: 750, fontSize: '0.95rem', color: 'var(--text-main)' }}>{product.designName}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary-gold)', fontWeight: 600, marginTop: '2px' }}>{product.category}</div>
                                </td>
                                <td style={{ padding: '18px 20px', fontWeight: 600, color: 'var(--text-main)' }}>{product.workerId?.name || 'Unassigned'}</td>
                                <td style={{ padding: '18px 20px', fontWeight: 700, color: 'var(--text-main)' }}>{getProductTotalIssuedWeight(product).toFixed(2)}g</td>
                                <td style={{ padding: '18px 20px', fontWeight: 800, color: 'var(--success)' }}>{getProductTotalPureWeight(product).toFixed(3)}g</td>
                                <td style={{ padding: '18px 20px' }}>
                                    <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.85rem' }}>
                                        {formatDate(product.dueDate)}
                                    </span>
                                </td>
                                <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        <button 
                                            onClick={() => handleOpenIssuances(product)}
                                            style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--primary-gold)', color: 'var(--primary-gold)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}
                                        >
                                            <Plus size={13} /> Issuances ({product.issuances?.length || 0})
                                        </button>
                                        <button 
                                            onClick={() => handleEditClick(product)}
                                            style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}
                                        >
                                            <Edit2 size={13} /> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteProduct(product)}
                                            style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}
                                        >
                                            <Trash2 size={13} /> Delete
                                        </button>
                                        <button 
                                            onClick={() => handleReceiveClick(product)}
                                            style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--primary-gold)', color: 'var(--primary-gold)', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, transition: 'var(--transition)' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-gold)'; e.currentTarget.style.color = '#FFFFFF'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary-gold)'; }}
                                        >
                                            Receive
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}

          {filteredProducts.filter(p => p.status !== 'completed').length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <Package size={50} style={{ opacity: 0.1, marginBottom: '20px' }}/>
              <p>No pending assignments found.</p>
            </div>
          )}
        </>
      ) : (
          /* COMPLETED TAB VIEW */
          <div className="table-container glass" style={{ padding: '0', overflow: 'hidden', borderRadius: '15px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--dark-bg)' }}>
                    <tr style={{ textAlign: 'left', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        <th style={{ padding: '15px' }}>Product Code</th>
                        <th style={{ padding: '15px' }}>Design</th>
                        <th style={{ padding: '15px' }}>Craftsman</th>
                        <th style={{ padding: '15px' }}>Net Weight</th>
                        <th style={{ padding: '15px' }}>Gross Weight</th>
                        <th style={{ padding: '15px' }}>Wastage</th>
                        <th style={{ padding: '15px' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.filter(p => p.status === 'completed').map(product => (
                        <tr key={product._id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                            <td style={{ padding: '15px', fontFamily: 'monospace', fontWeight: 600 }}>{product.productId}</td>
                            <td style={{ padding: '15px', fontWeight: 600 }}>{product.designName}</td>
                            <td style={{ padding: '15px' }}>{product.workerId?.name}</td>
                            <td style={{ padding: '15px' }}>{product.netWeight}g</td>
                            <td style={{ padding: '15px' }}>{product.grossWeight}g</td>
                            <td style={{ padding: '15px' }}>{product.actualWastage?.toFixed(3)}g</td>
                            <td style={{ padding: '15px' }}>
                                <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(46, 204, 113, 0.1)', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600 }}>COMPLETED</span>
                            </td>
                        </tr>
                    ))}
                    {filteredProducts.filter(p => p.status === 'completed').length === 0 && (
                        <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No completed assignments found.</td></tr>
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
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(7, 6, 10, 0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, transition: 'var(--transition)' }}>
          <div className="glass-card fade-in" style={{ width: '90%', maxWidth: '750px', padding: '36px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 850 }} className="gold-gradient">
                    {editingId ? 'Modify Production Assignment' : 'Gold Issuance & New Assignment'}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {editingId ? 'Edit materials and details for this active production order' : 'Issue materials and assign production orders to workshop craftsmen'}
                  </p>
                </div>
                <button className="glass" onClick={() => setShowCreateModal(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)', border: 'none', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} />
                </button>
            </div>
            
            <form onSubmit={handleCreate}>
              {/* Unified 3-Column Grid for Form Inputs */}
              <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'start' }}>
                
                {/* 1. Assign to Craftsman */}
                <div className="input-group" style={{ marginBottom: 0, position: 'relative' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assign to Craftsman *</label>
                  <input 
                    type="text"
                    required 
                    value={workerSearchText} 
                    onFocus={() => setShowWorkerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowWorkerDropdown(false), 200)}
                    onChange={e => {
                      const val = e.target.value;
                      setWorkerSearchText(val);
                      const worker = workers.find(w => w.name.toLowerCase() === val.toLowerCase());
                      setNewProductData(prev => ({ ...prev, workerId: worker ? worker._id : '' }));
                    }} 
                    placeholder="Type to search worker..." 
                    style={{ background: 'var(--dark-bg)', padding: '14px', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '0.95rem', width: '100%', color: 'var(--text-main)' }} 
                  />
                  {showWorkerDropdown && (
                    <div className="custom-autocomplete-dropdown">
                      {filteredWorkers.length > 0 ? (
                        filteredWorkers.map(w => (
                          <div 
                            key={w._id}
                            onMouseDown={() => {
                              setWorkerSearchText(w.name);
                              setNewProductData(prev => ({ ...prev, workerId: w._id }));
                              setShowWorkerDropdown(false);
                            }}
                            className="custom-autocomplete-item"
                          >
                            {w.name}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '10px 14px', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                          No workers found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Issued Gold */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Issued Gold (Grams) *</label>
                  <input type="number" step="0.001" required value={newProductData.expectedWeight} onChange={e => setNewProductData({...newProductData, expectedWeight: e.target.value})} style={{ background: 'var(--dark-bg)', padding: '14px', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '0.95rem' }} placeholder="0.000 g" />
                </div>

                {/* 3. Expected Weight */}
                <div className="input-group" style={{ marginBottom: 0, opacity: 0.85 }}>
                  <label style={{ fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Expected Weight (Grams)</label>
                  <input type="number" step="0.001" value={newProductData.expectedFinishedWeight || ''} onChange={e => setNewProductData({...newProductData, expectedFinishedWeight: e.target.value})} style={{ background: 'var(--dark-bg)', padding: '14px', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '0.95rem', color: 'var(--text-main)' }} placeholder="0.000 g" />
                </div>

                {/* 4. Purity Selection */}
                <div className="input-group" style={{ marginBottom: 0, opacity: 0.85 }}>
                  <label style={{ fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Purity Selection</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                      <select value={newProductData.purityType} onChange={e => {
                          const type = e.target.value;
                          setNewProductData({
                              ...newProductData, 
                              purityType: type, 
                              purity: type === 'Percentage' ? '100' : (purityStandards[0]?.label || '22k')
                          });
                      }} style={{ width: '110px', background: 'var(--dark-bg)', padding: '14px', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '0.95rem' }}>
                          <option value="Carat">Carat</option>
                          <option value="Percentage">Percentage</option>
                      </select>
                      {newProductData.purityType === 'Carat' && (
                        <div style={{ flex: 1 }}>
                            <input list="purity-standards" value={newProductData.purity} onChange={e => setNewProductData({...newProductData, purity: e.target.value})} style={{ width: '100%', background: 'var(--dark-bg)', padding: '14px', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '0.95rem' }} />
                            <datalist id="purity-standards">
                                {purityStandards.map(ps => <option key={ps.label} value={ps.label} />)}
                            </datalist>
                        </div>
                      )}
                      {newProductData.purityType === 'Percentage' && (
                        <input type="number" step="0.01" value={newProductData.purity} onChange={e => setNewProductData({...newProductData, purity: e.target.value})} style={{ flex: 1, background: 'var(--dark-bg)', padding: '14px', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '0.95rem' }} />
                      )}
                  </div>
                </div>

                {/* 5. Pure Weight */}
                <div className="input-group" style={{ marginBottom: 0, opacity: 0.75 }}>
                  <label style={{ fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Pure Weight</label>
                  <input type="text" readOnly value={`${newProductData.pureWeight || '0.000'} grams`} style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '0.95rem', color: 'var(--text-muted)', cursor: 'not-allowed', width: '100%' }} />
                </div>

                {/* 6. Assignment Date */}
                <div className="input-group" style={{ marginBottom: 0, opacity: 0.75 }}>
                  <label style={{ fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Assignment Date</label>
                  <input type="date" value={newProductData.issuanceDate} onChange={e => setNewProductData({...newProductData, issuanceDate: e.target.value})} style={{ background: 'var(--dark-bg)', padding: '14px', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '0.95rem', color: 'var(--text-muted)', width: '100%' }} />
                </div>

                {/* 7. Due Date */}
                <div className="input-group" style={{ marginBottom: 0, opacity: 0.75 }}>
                  <label style={{ fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Due Date</label>
                  <input type="date" value={newProductData.dueDate} onChange={e => setNewProductData({...newProductData, dueDate: e.target.value})} style={{ background: 'var(--dark-bg)', padding: '14px', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '0.95rem', width: '100%' }} />
                </div>

              </div>

              {/* Stone Section */}
              <div className="glass-card" style={{ marginTop: '28px', padding: '20px', background: 'var(--dark-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)', opacity: 0.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.1rem' }}>💎</span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Stone Issuance Ledger</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Weight (g):</span>
                        <input 
                            type="number" 
                            step="0.001" 
                            value={newProductData.totalStoneWeight} 
                            onChange={e => setNewProductData({...newProductData, totalStoneWeight: parseFloat(e.target.value) || 0})}
                            style={{ width: '90px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center', padding: '6px' }}
                        />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {newProductData.stones.map((stone, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '12px', background: 'var(--surface-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', alignItems: 'center', transition: 'var(--transition)' }}>
                              <select value={stone.stoneName} onChange={e => updateCreateStone(idx, 'stoneName', e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', fontWeight: 600 }}>
                                  <option value="">Select Stone...</option>
                                  {companyStones.map(s => <option key={s.stoneName} value={s.stoneName}>{s.stoneName}</option>)}
                              </select>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '16px' }}>
                                  <input type="number" step="0.001" placeholder="0.000" value={stone.stoneWeight} onChange={e => updateCreateStone(idx, 'stoneWeight', e.target.value)} style={{ width: '90px', background: 'transparent', border: 'none', color: 'var(--primary-gold)', fontWeight: 750, outline: 'none', fontSize: '0.95rem' }} />
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>g</span>
                              </div>
                              <button type="button" onClick={() => removeCreateStone(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}><Trash2 size={16}/></button>
                          </div>
                      ))}
                      <button 
                          type="button" 
                          onClick={addCreateStone} 
                          style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--glass-border)', color: 'var(--text-muted)', padding: '10px', borderRadius: '12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700, marginTop: '8px', transition: 'var(--transition)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                      >
                          + Add Stone Item to Split
                      </button>
                  </div>
              </div>

              {/* Design Description */}
              <div className="input-group" style={{ marginTop: '28px', marginBottom: 0, opacity: 0.8 }}>
                  <label style={{ fontWeight: 500, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Design & Instructions Description</label>
                  <textarea 
                    value={newProductData.designName} 
                    onChange={e => setNewProductData({...newProductData, designName: e.target.value})} 
                    style={{ background: 'var(--dark-bg)', minHeight: '100px', width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--glass-border)', color: 'var(--text-main)', resize: 'vertical', fontSize: '0.95rem', transition: 'var(--transition)' }} 
                    placeholder="Enter design details or special instructions (optional)..."
                    onFocus={e => e.target.style.borderColor = 'var(--primary-gold)'}
                    onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                  />
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '36px' }}>
                <button type="button" className="glass" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 750, color: 'var(--text-main)', transition: 'var(--transition)', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, borderRadius: '12px', padding: '14px', fontWeight: 750, transition: 'var(--transition)' }}>
                  {editingId ? 'Save Changes' : 'Issue Gold & Assign Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showIssuanceModal && selectedProductForIssuance && (() => {
        // Calculate metrics
        const totalGoldIssued = (parseFloat(selectedProductForIssuance.expectedWeight) || 0) + 
          (selectedProductForIssuance.issuances || [])
            .filter(iss => (!iss.cashIssuance || parseFloat(iss.cashIssuance) === 0) && (!iss.stones || iss.stones.length === 0))
            .reduce((sum, iss) => sum + (parseFloat(iss.weight) || 0), 0);

        const initialStonesCount = (selectedProductForIssuance.stones || []).reduce((sum, s) => sum + (parseInt(s.pieces) || 1), 0);
        const additionalStonesCount = (selectedProductForIssuance.issuances || [])
          .filter(iss => iss.stones && iss.stones.length > 0)
          .reduce((sum, iss) => {
            return sum + (iss.stones || []).reduce((sSum, s) => sSum + (parseInt(s.pieces) || 1), 0);
          }, 0);
        const totalStonesCount = initialStonesCount + additionalStonesCount;

        const initialStoneWeight = (selectedProductForIssuance.stones || []).reduce((sum, s) => sum + (parseFloat(s.stoneWeight) || 0), 0);
        const additionalStoneWeight = (selectedProductForIssuance.issuances || [])
          .filter(iss => iss.stones && iss.stones.length > 0)
          .reduce((sum, iss) => {
            return sum + (iss.stones || []).reduce((sSum, s) => sSum + (parseFloat(s.stoneWeight) || 0), 0);
          }, 0);
        const totalStoneWeightIssued = initialStoneWeight + additionalStoneWeight;

        const totalCashIssued = (selectedProductForIssuance.issuances || [])
          .filter(iss => iss.cashIssuance && parseFloat(iss.cashIssuance) > 0)
          .reduce((sum, iss) => sum + (parseFloat(iss.cashIssuance) || 0), 0);

        // Combine history
        const allIssuancesCombined = [{
          id: 'initial',
          type: 'initial',
          sequence: 1,
          date: selectedProductForIssuance.issuanceDate || selectedProductForIssuance.createdAt || new Date(),
          weight: selectedProductForIssuance.expectedWeight,
          purity: selectedProductForIssuance.purity,
          stones: selectedProductForIssuance.stones || [],
          notes: selectedProductForIssuance.notes || 'Initial Issuance',
          raw: selectedProductForIssuance
        }];

        if (selectedProductForIssuance.issuances) {
          selectedProductForIssuance.issuances.forEach((iss, index) => {
            allIssuancesCombined.push({
              id: iss._id || index,
              type: 'additional',
              sequence: index + 2,
              date: iss.issuanceDate || new Date(),
              weight: iss.weight,
              purity: iss.purity,
              stones: iss.stones || [],
              notes: iss.notes,
              cashIssuance: iss.cashIssuance,
              raw: iss
            });
          });
        }

        allIssuancesCombined.sort((a, b) => {
          const dateA = new Date(a.date).getTime() || 0;
          const dateB = new Date(b.date).getTime() || 0;
          if (dateA === dateB) {
            return a.sequence - b.sequence;
          }
          return issuanceSort === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            background: 'var(--dark-bg)', display: 'flex', flexDirection: 'column', zIndex: 1000,
            fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
            color: 'var(--text-main)'
          }}>
            {/* Header Panel */}
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              padding: '20px 24px', background: 'var(--dark-bg)', borderBottom: '1px solid var(--card-inner-border)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={() => setShowIssuanceModal(false)} 
                  style={{ background: 'var(--card-deep-bg)', border: '1px solid var(--card-btn-border)', borderRadius: '8px', cursor: 'pointer', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-gold)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--card-btn-border)'}
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Material & Cash Issuance</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    Product ID: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{selectedProductForIssuance.productId}</span> • {selectedProductForIssuance.designName} • Worker: <span style={{ color: 'var(--primary-gold)', fontWeight: 800, fontSize: '0.95rem', background: 'rgba(139, 69, 255, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>{selectedProductForIssuance.workerId?.name || 'Unassigned'}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowIssuanceModal(false)} 
                style={{ background: 'var(--card-deep-bg)', border: '1px solid var(--card-btn-border)', borderRadius: '8px', cursor: 'pointer', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--danger)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--card-btn-border)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Page Content Panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '40px', padding: '30px 40px', flex: 1, overflowY: 'auto', background: 'var(--dark-bg)' }}>
              
              {/* Left Side: Metrics and Issuance Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Metric Box Row */}
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary-gold)', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '16px' }}>Total Issued to Worker</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    
                    {/* Gold Metric */}
                    <div style={{ background: 'var(--card-inner-bg)', border: '1px solid var(--card-inner-border)', padding: '20px', borderRadius: '12px' }}>
                      <div style={{ color: '#E0A96D', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.3px' }}>Gold</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: '10px 0 6px' }}>{getProductTotalPureWeight(selectedProductForIssuance).toFixed(3)} g</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Pure Gold</div>
                    </div>

                    {/* Stones Metric */}
                    <div style={{ background: 'var(--card-inner-bg)', border: '1px solid var(--card-inner-border)', padding: '20px', borderRadius: '12px' }}>
                      <div style={{ color: 'var(--primary-gold)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.3px' }}>Stones</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: '10px 0 6px' }}>{totalStoneWeightIssued.toFixed(3)} g</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Pieces: {totalStonesCount} pcs</div>
                    </div>

                    {/* Cash Metric */}
                    <div style={{ background: 'var(--card-inner-bg)', border: '1px solid var(--card-inner-border)', padding: '20px', borderRadius: '12px' }}>
                      <div style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.3px' }}>Cash</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: '10px 0 6px' }}>₹ {totalCashIssued.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Amount</div>
                    </div>

                  </div>
                </div>

                {/* Timeline Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-inner-border)', paddingBottom: '16px', marginTop: '10px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.5px' }}>ISSUANCE HISTORY</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      value={issuanceSort} 
                      onChange={e => setIssuanceSort(e.target.value)}
                      style={{ background: 'var(--card-deep-bg)', border: '1px solid var(--card-btn-border)', color: 'var(--text-main)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                    <button style={{ background: 'var(--card-deep-bg)', border: '1px solid var(--card-btn-border)', color: 'var(--text-main)', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Filter size={16} />
                    </button>
                  </div>
                </div>

                {/* Timeline Container */}
                <div style={{ position: 'relative', paddingLeft: '35px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Vertical Timeline Line */}
                  <div style={{ position: 'absolute', left: '11px', top: '15px', bottom: '15px', width: '2px', background: 'var(--card-border)' }} />

                  {allIssuancesCombined.map((iss) => {
                    const numberLabel = `#${String(iss.sequence).padStart(3, '0')}`;
                    return (
                      <div key={iss.id} style={{ position: 'relative' }}>
                        {/* Timeline Dot */}
                        <div style={{ 
                          position: 'absolute', left: '-30px', top: '16px', 
                          width: '14px', height: '14px', borderRadius: '50%', 
                          background: 'var(--primary-gold)', border: '3px solid var(--dark-bg)',
                          boxShadow: '0 0 0 2px var(--card-border)'
                        }} />

                        {/* Timeline Card */}
                        <div style={{ background: 'var(--card-inner-bg)', border: '1px solid var(--card-inner-border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          
                          {/* Title Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'monospace' }}>{numberLabel}</span>
                              
                              {/* Type Badge */}
                              {iss.type === 'initial' || (iss.type === 'additional' && iss.weight > 0 && (!iss.stones || iss.stones.length === 0) && !iss.cashIssuance) ? (
                                <span style={{ background: 'rgba(224, 169, 109, 0.1)', color: '#E0A96D', padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gold Issuance</span>
                              ) : iss.stones && iss.stones.length > 0 ? (
                                <span style={{ background: 'rgba(139, 69, 255, 0.1)', color: 'var(--primary-gold)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stone Issuance</span>
                              ) : (
                                <span style={{ background: 'rgba(50, 215, 75, 0.1)', color: 'var(--success)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cash Issuance</span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                <Calendar size={14} /> {formatDate(iss.date)}
                              </span>
                              
                              {/* Actions (Only for additional issuances) */}
                              {iss.type === 'additional' ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <button 
                                    onClick={() => handleEditIssuanceClick(iss.raw)} 
                                    style={{ background: 'var(--card-pill-bg)', border: '1px solid var(--card-pill-border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                                    title="Edit"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteIssuance(iss.raw._id)} 
                                    style={{ background: 'var(--card-pill-bg)', border: '1px solid var(--card-pill-border)', color: 'var(--danger)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                                    title="Delete"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ) : (
                                // Show edit/delete icon on initial issuance as well, but disabled or styled similarly if needed by design, or keep it clean
                                null
                              )}
                            </div>
                          </div>

                          {/* Card Content details */}
                          {iss.type === 'initial' && (
                            <div style={{ fontSize: '0.9rem', color: 'var(--card-pill-text)', fontWeight: 500 }}>
                              Purity: <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{selectedProductForIssuance.purity}{selectedProductForIssuance.purityType === 'Carat' ? 'k' : '%'}</span> &nbsp;•&nbsp; Weight: <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{selectedProductForIssuance.expectedWeight} g</span> &nbsp;•&nbsp; Pure Weight: <span style={{ color: '#32D74B', fontWeight: 700 }}>{parseFloat(selectedProductForIssuance.pureWeight || 0).toFixed(3)} g</span>
                            </div>
                          )}

                          {iss.type === 'additional' && iss.weight > 0 && (!iss.stones || iss.stones.length === 0) && !iss.cashIssuance && (() => {
                            const p = parseFloat(iss.purity || selectedProductForIssuance.purity) || 0;
                            const w = parseFloat(iss.weight) || 0;
                            const pw = ((w * p) / 100).toFixed(3);
                            return (
                              <div style={{ fontSize: '0.9rem', color: 'var(--card-pill-text)', fontWeight: 500 }}>
                                Purity: <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{iss.purity || selectedProductForIssuance.purity}%</span> &nbsp;•&nbsp; Weight: <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{iss.weight} g</span> &nbsp;•&nbsp; Pure Weight: <span style={{ color: '#32D74B', fontWeight: 700 }}>{pw} g</span>
                              </div>
                            );
                          })()}

                          {iss.stones && iss.stones.length > 0 && (
                            <div style={{ overflowX: 'hidden', marginTop: '4px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                <thead>
                                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--card-inner-border)', fontSize: '0.75rem', fontWeight: 700 }}>
                                    <th style={{ padding: '8px 0', width: '40%' }}>Stone Name</th>
                                    <th style={{ padding: '8px 0', width: '30%' }}>Pieces</th>
                                    <th style={{ padding: '8px 0', width: '30%' }}>Weight</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {iss.stones.map((st, sidx) => (
                                    <tr key={sidx} style={{ color: 'var(--text-main)', borderBottom: sidx < iss.stones.length - 1 ? '1px solid var(--card-divider)' : 'none' }}>
                                      <td style={{ padding: '10px 0', fontWeight: 600 }}>{st.stoneName}</td>
                                      <td style={{ padding: '10px 0', color: 'var(--card-pill-text)' }}>{st.pieces || 1} pcs</td>
                                      <td style={{ padding: '10px 0', color: 'var(--card-pill-text)', fontWeight: 600 }}>{st.stoneWeight} {st.weightUnit === 'carat' ? 'ct' : 'g'}</td>
                                    </tr>
                                  ))}
                                  {iss.stones.length > 1 && (
                                    <tr style={{ color: 'var(--card-pill-text)', borderTop: '1px solid var(--card-inner-border)', fontWeight: 800 }}>
                                      <td style={{ padding: '10px 0' }}>Total</td>
                                      <td style={{ padding: '10px 0' }}>{iss.stones.reduce((acc, st) => acc + (parseInt(st.pieces) || 1), 0)} pcs</td>
                                      <td style={{ padding: '10px 0' }}>
                                        {iss.stones.reduce((acc, st) => acc + (parseFloat(st.stoneWeight) || 0), 0).toFixed(3)} {iss.stones[0]?.weightUnit === 'carat' ? 'ct' : 'g'}
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {iss.cashIssuance > 0 && (
                            <div style={{ fontSize: '0.9rem', color: 'var(--card-pill-text)', fontWeight: 500 }}>
                              Amount: <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>₹ {iss.cashIssuance.toLocaleString('en-IN')}</span>
                            </div>
                          )}

                          {/* Notes snippet */}
                          {iss.notes && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--card-inner-border)', paddingTop: '12px', marginTop: '6px' }}>
                              <FileText size={14} style={{ marginTop: '2px', flexShrink: 0 }} /> 
                              <span>Notes: {iss.notes}</span>
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}

                </div>

              </div>

              {/* Right Side: Form (ADD NEW ISSUANCE) */}
              <div style={{ background: 'var(--card-deep-bg)', border: '1px solid var(--card-btn-border)', borderRadius: '16px', padding: '30px', alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-gold)', fontWeight: 800, letterSpacing: '0.5px' }}>{editingIssuanceId ? 'MODIFY ISSUANCE' : 'ADD NEW ISSUANCE'}</h4>
                </div>

                {/* Tabs list (Select Issuance Type) */}
                <div>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.85rem', color: 'var(--card-pill-text)', fontWeight: 600 }}>Select Issuance Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    
                    {/* Gold Issuance tab */}
                    <button 
                      onClick={() => { setIssuanceType('gold'); }}
                      type="button"
                      style={{
                        background: 'var(--card-deep-bg)',
                        border: issuanceType === 'gold' ? '1.5px solid var(--primary-gold)' : '1px solid var(--card-btn-border)',
                        borderRadius: '8px',
                        padding: '14px 10px',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ 
                        width: '10px', height: '10px', borderRadius: '50%', 
                        background: '#D4AF37', 
                        border: '3px solid var(--primary-gold)',
                        boxSizing: 'border-box'
                      }} />
                      Gold Issuance
                    </button>

                    {/* Stone Issuance tab */}
                    <button 
                      onClick={() => { setIssuanceType('stone'); }}
                      type="button"
                      style={{
                        background: 'var(--card-deep-bg)',
                        border: issuanceType === 'stone' ? '1.5px solid var(--primary-gold)' : '1px solid var(--card-btn-border)',
                        borderRadius: '8px',
                        padding: '14px 10px',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-gold)' }} />
                      Stone Issuance
                    </button>

                    {/* Cash Issuance tab */}
                    <button 
                      onClick={() => { setIssuanceType('cash'); }}
                      type="button"
                      style={{
                        background: 'var(--card-deep-bg)',
                        border: issuanceType === 'cash' ? '1.5px solid var(--success)' : '1px solid var(--card-btn-border)',
                        borderRadius: '8px',
                        padding: '14px 10px',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }} />
                      Cash Issuance
                    </button>

                  </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleAddOrUpdateIssuance} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Gold Issuance Form Fields */}
                  {issuanceType === 'gold' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ color: '#E0A96D', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gold Details</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Weight (g)</label>
                          <input 
                            type="number" step="0.001" placeholder="0.000" 
                            value={issuanceFormData.weight} 
                            onChange={e => {
                              const w = parseFloat(e.target.value) || 0;
                              const p = parseFloat(issuanceFormData.purity) || 0;
                              const pw = w > 0 && p > 0 ? ((w * p) / 100).toFixed(3) : '';
                              setIssuanceFormData({
                                ...issuanceFormData, 
                                weight: e.target.value, 
                                pureWeight: pw,
                                cashIssuance: '', 
                                stones: []
                              });
                            }}
                            style={{ background: 'var(--dark-bg)', color: 'var(--text-main)', border: '1px solid var(--card-btn-border)', padding: '14px', borderRadius: '8px', width: '100%', outline: 'none', fontSize: '0.9rem', fontWeight: 500 }}
                            required
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Pure Wt (g)</label>
                          <input 
                            type="number" step="0.001" placeholder="0.000" 
                            value={issuanceFormData.pureWeight} 
                            onChange={e => {
                              const pw = parseFloat(e.target.value) || 0;
                              const w = parseFloat(issuanceFormData.weight) || 0;
                              const p = w > 0 && pw > 0 ? ((pw / w) * 100).toFixed(2) : issuanceFormData.purity;
                              setIssuanceFormData({
                                ...issuanceFormData, 
                                pureWeight: e.target.value, 
                                purity: p
                              });
                            }}
                            style={{ background: 'var(--dark-bg)', color: 'var(--text-main)', border: '1px solid var(--card-btn-border)', padding: '14px', borderRadius: '8px', width: '100%', outline: 'none', fontSize: '0.9rem', fontWeight: 500 }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ color: 'var(--primary-gold)', fontWeight: 700, fontSize: '0.85rem' }}>Purity (%)</label>
                          <input 
                            type="text" 
                            list="issuance-purity-standards"
                            value={issuanceFormData.purity} 
                            onChange={e => {
                              const p = parseFloat(e.target.value) || 0;
                              const w = parseFloat(issuanceFormData.weight) || 0;
                              const pw = w > 0 && p > 0 ? ((w * p) / 100).toFixed(3) : '';
                              setIssuanceFormData({
                                ...issuanceFormData, 
                                purity: e.target.value,
                                pureWeight: pw
                              });
                            }}
                            style={{ background: 'var(--dark-bg)', color: 'var(--text-main)', border: '1.5px solid var(--primary-gold)', padding: '14px', borderRadius: '8px', width: '100%', outline: 'none', fontSize: '0.9rem', fontWeight: 700 }}
                            placeholder="e.g. 100"
                          />
                          <datalist id="issuance-purity-standards">
                            <option value="100">100% (24k)</option>
                            <option value="91.6">91.6% (22k)</option>
                            <option value="75">75.0% (18k)</option>
                          </datalist>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stone Issuance Form Fields */}
                  {issuanceType === 'stone' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ color: 'var(--primary-gold)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Stone Details</span>
                        <button type="button" onClick={addIssuanceStone} style={{ background: 'var(--card-pill-bg)', border: '1px solid var(--card-pill-border)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>+ Add Row</button>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '220px', overflowY: 'auto' }}>
                        {issuanceFormData.stones.map((stone, idx) => (
                          <div key={idx} style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '10px', 
                            background: 'var(--card-inner-bg)', 
                            border: '1px solid var(--card-inner-border)', 
                            padding: '12px', 
                            borderRadius: '8px',
                            marginBottom: '6px'
                          }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <select 
                                value={stone.stoneName} 
                                onChange={e => updateIssuanceStone(idx, 'stoneName', e.target.value)} 
                                style={{ flex: 1.5, background: 'var(--dark-bg)', border: '1px solid var(--card-btn-border)', color: 'var(--text-main)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                                required
                              >
                                <option value="">Select Stone...</option>
                                {companyStones.map(s => <option key={s.stoneName} value={s.stoneName}>{s.stoneName}</option>)}
                              </select>
                              
                              <select 
                                value={stone.weightUnit || 'grams'} 
                                onChange={e => updateIssuanceStone(idx, 'weightUnit', e.target.value)} 
                                style={{ flex: 1, background: 'var(--dark-bg)', border: '1px solid var(--card-btn-border)', color: 'var(--text-main)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
                              >
                                <option value="grams">Grams</option>
                                <option value="carat">Carat</option>
                                <option value="pieces">Pieces</option>
                              </select>

                              {stone.weightUnit !== 'pieces' && (
                                <input 
                                  type="number" step="0.001" 
                                  placeholder={stone.weightUnit === 'carat' ? 'Wt (ct)' : 'Wt (g)'} 
                                  value={stone.stoneWeight} 
                                  onChange={e => updateIssuanceStone(idx, 'stoneWeight', e.target.value)} 
                                  style={{ flex: 1.2, padding: '10px', border: '1px solid var(--card-btn-border)', borderRadius: '6px', fontSize: '0.85rem', background: 'var(--dark-bg)', color: 'var(--text-main)', outline: 'none' }} 
                                  required
                                />
                              )}

                              {stone.weightUnit !== 'pieces' && (
                                <input 
                                  type="number" placeholder="Pcs" 
                                  value={stone.pieces || ''} 
                                  onChange={e => updateIssuanceStone(idx, 'pieces', parseInt(e.target.value) || 1)} 
                                  style={{ width: '60px', padding: '10px', border: '1px solid var(--card-btn-border)', borderRadius: '6px', fontSize: '0.85rem', background: 'var(--dark-bg)', color: 'var(--text-main)', outline: 'none' }} 
                                />
                              )}

                              <button type="button" onClick={() => removeIssuanceStone(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
                            </div>

                            {stone.weightUnit === 'pieces' && (
                              <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr 1fr', 
                                gap: '10px', 
                                background: 'var(--dark-bg)', 
                                padding: '10px', 
                                borderRadius: '6px',
                                border: '1px solid rgba(139, 69, 255, 0.15)',
                                marginTop: '4px'
                              }}>
                                <div>
                                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Pieces Count</label>
                                  <input 
                                    type="number" placeholder="Pieces" 
                                    value={stone.pieces || ''} 
                                    onChange={e => updateIssuanceStone(idx, 'pieces', parseInt(e.target.value) || 0)} 
                                    style={{ width: '100%', padding: '8px', border: '1px solid var(--card-inner-border)', borderRadius: '6px', fontSize: '0.8rem', background: 'var(--card-inner-bg)', color: 'var(--text-main)', outline: 'none' }} 
                                    required
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Avg Wt / Pc (g)</label>
                                  <input 
                                    type="number" step="0.001" placeholder="Avg Wt" 
                                    value={stone.avgWeight || ''} 
                                    onChange={e => updateIssuanceStone(idx, 'avgWeight', e.target.value)} 
                                    style={{ width: '100%', padding: '8px', border: '1px solid var(--card-inner-border)', borderRadius: '6px', fontSize: '0.8rem', background: 'var(--card-inner-bg)', color: 'var(--text-main)', outline: 'none' }} 
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.7rem', color: 'var(--primary-gold)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>Total Wt (g)</label>
                                  <input 
                                    type="number" step="0.001" placeholder="Total Wt" 
                                    value={stone.stoneWeight} 
                                    onChange={e => updateIssuanceStone(idx, 'stoneWeight', e.target.value)} 
                                    style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold)', borderRadius: '6px', fontSize: '0.8rem', background: 'var(--card-inner-bg)', color: 'var(--text-main)', outline: 'none', fontWeight: 700 }} 
                                    required
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {issuanceFormData.stones.length === 0 && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0', border: '1px dashed var(--card-btn-border)', borderRadius: '8px' }}>No stones added yet. Click "+ Add Row" above.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cash Issuance Form Fields */}
                  {issuanceType === 'cash' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cash Details</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Amount (₹)</label>
                        <input 
                          type="number" placeholder="5,000" 
                          value={issuanceFormData.cashIssuance} 
                          onChange={e => setIssuanceFormData({...issuanceFormData, cashIssuance: e.target.value, weight: '', stones: []})}
                          style={{ background: 'var(--dark-bg)', color: 'var(--text-main)', border: '1px solid var(--card-btn-border)', padding: '14px', borderRadius: '8px', width: '100%', outline: 'none', fontSize: '0.9rem', fontWeight: 500 }}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Notes Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>NOTES (OPTIONAL)</label>
                    <textarea 
                      value={issuanceFormData.notes} 
                      onChange={e => setIssuanceFormData({...issuanceFormData, notes: e.target.value})}
                      placeholder="Enter notes or instructions..."
                      style={{ background: 'var(--dark-bg)', color: 'var(--text-main)', border: '1px solid var(--card-btn-border)', padding: '14px', borderRadius: '8px', width: '100%', minHeight: '100px', outline: 'none', resize: 'vertical', fontSize: '0.9rem', fontWeight: 500 }}
                    />
                  </div>

                  {/* Footer Buttons */}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIssuanceFormData({
                          weight: '', purity: '22k', notes: '', issuanceDate: new Date().toISOString().split('T')[0], stones: [], totalStoneWeight: 0, cashIssuance: ''
                        });
                        setEditingIssuanceId(null);
                      }}
                      style={{ flex: 1, padding: '14px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--card-btn-border)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' }}
                    >
                      Clear
                    </button>
                    <button 
                      type="submit"
                      style={{ 
                        flex: 2, padding: '14px', borderRadius: '8px', 
                        background: 'linear-gradient(90deg, #FF2E93, #8B45FF)', 
                        border: 'none', color: '#FFF', cursor: 'pointer', fontWeight: 700,
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 15px rgba(139, 69, 255, 0.3)'
                      }}
                    >
                      {editingIssuanceId ? 'Update Issuance' : 'Add Issuance'}
                    </button>
                  </div>

                </form>

              </div>
 
            </div>
 
          </div>
        );
      })()}
    </div>
  );
};

export default Products;
