import React, { useState, useEffect } from 'react';
import { Printer, Plus, Trash2, Search, Barcode, HelpCircle, FileText, Menu } from 'lucide-react';
import api from '../api';

const Billing = ({ setSidebarOpen }) => {
  const [items, setItems] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [grossWt, setGrossWt] = useState('');
  const [stoneWt, setStoneWt] = useState('0');
  const [netWt, setNetWt] = useState('');
  const [wastage, setWastage] = useState('92+');
  const [purity, setPurity] = useState('92'); 
  const [category, setCategory] = useState('Gold');
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [printDropdownOpen, setPrintDropdownOpen] = useState(false);
  const [activePrintFormat, setActivePrintFormat] = useState('estimation');

  // Db Products & Stones
  const [availableProducts, setAvailableProducts] = useState([]);
  const [companyStones, setCompanyStones] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [company, setCompany] = useState({});

  // Customer & Bill
  const [customerName, setCustomerName] = useState('Mr. Arun Kumar');
  const [customerPhone, setCustomerPhone] = useState('98765 43210');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimationDate, setEstimationDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalTagWeight, setTotalTagWeight] = useState('48.400 g');
  const [description, setDescription] = useState('Estimation for custom jewellery design as per requirement.');
  const [hallmarkCharges, setHallmarkCharges] = useState(0);
  const [makePayment, setMakePayment] = useState(false);
  const [makeDiscount, setMakeDiscount] = useState(false);

  // Search Modals / Popup States
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Fetch products and company stones on mount
  useEffect(() => {
    const fetchProdsAndStones = async () => {
      try {
        setLoadingProducts(true);
        const [prodRes, companyRes] = await Promise.all([
          api.get('/mgmt/products?status=completed').catch(() => ({ data: [] })),
          api.get('/company').catch(() => ({ data: {} }))
        ]);
        setAvailableProducts(prodRes.data || []);
        setCompany(companyRes.data || {});
        
        // Use stones from company or default list if empty
        const fetchedStones = (companyRes.data?.stones || []).filter(s => s.status !== 'Inactive');
        if (fetchedStones.length === 0) {
          setCompanyStones([
            { stoneName: 'AD', stoneType: 'Precious' },
            { stoneName: 'MT', stoneType: 'Precious' }
          ]);
        } else {
          setCompanyStones(fetchedStones);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProdsAndStones();
  }, []);

  // Keyboard Shortcuts (F1, F2, F4, Ctrl+J)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'j') {
        e.preventDefault();
        handlePrint();
      }
      if (e.key === 'F2') {
        e.preventDefault();
        setShowCustomerSearch(true);
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setShowProductSearch(true);
      }
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcutsHelp(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live Barcode input listener
  useEffect(() => {
    if (!barcode) return;
    
    const found = availableProducts.find(
      p => p.productId?.toLowerCase() === barcode.trim().toLowerCase()
    );

    if (found) {
      setGrossWt(found.goldWeight || found.netWeight || '');
      setNetWt(found.netWeight || '');
      setCategory(found.category || 'Gold');
      setPurity('92');
      
      if (autoSubmit) {
        const timer = setTimeout(() => {
          commitItem({
            barcode: found.productId,
            name: found.designName || `${found.category} Ornament`,
            category: found.category,
            grossWt: parseFloat(found.goldWeight || found.netWeight) || 0,
            stoneWt: parseFloat(found.stoneWeight || 0),
            netWeight: parseFloat(found.netWeight) || 0,
            purity: 92,
            wastage: '92+',
            amount: Math.round((found.netWeight || 0) * 6200)
          });
          setBarcode('');
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [barcode, availableProducts, autoSubmit]);

  const commitItem = (customItem) => {
    const newItem = {
      id: Date.now(),
      barcode: customItem.barcode,
      name: customItem.name,
      category: customItem.category,
      grossWt: customItem.grossWt,
      stoneWt: customItem.stoneWt,
      netWeight: customItem.netWeight,
      purity: customItem.purity,
      wastage: customItem.wastage,
      pureWeight: parseFloat((customItem.netWeight * 0.92).toFixed(3)),
      labor: 150,
      laborRate: 40,
      ad: 0,
      adRate: 0,
      mt: 0,
      mtRate: 0,
      pgd: 0,
      pgdRate: 0,
      uk: 0,
      ukRate: 0,
      blk: 0,
      blkRate: 0,
      em: 0,
      emRate: 0,
      amount: customItem.amount
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleAddItem = () => {
    if (!grossWt) {
      alert("Please enter Gross Weight");
      return;
    }

    const g = parseFloat(grossWt) || 0;
    const s = parseFloat(stoneWt) || 0;
    const n = parseFloat(netWt) || Math.max(0, g - s);

    commitItem({
      barcode: barcode || `BC-${Math.floor(100000 + Math.random() * 900000)}`,
      name: `${category} Ornament`,
      category: category,
      grossWt: g,
      stoneWt: s,
      netWeight: n,
      purity: parseFloat(purity) || 92,
      wastage: wastage,
      amount: Math.round(n * 6200)
    });

    setBarcode('');
    setGrossWt('');
    setStoneWt('0');
    setNetWt('');
  };

  const handleDeleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear the entire bill?")) {
      setItems([]);
      setBarcode('');
      setGrossWt('');
      setStoneWt('0');
      setNetWt('');
      setCustomerName('');
      setCustomerPhone('');
      setDescription('');
    }
  };

  const triggerPrintFormat = (format) => {
    setActivePrintFormat(format);
    setPrintDropdownOpen(false);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Pre-populate some dummy items if empty to match the beautiful demo
  useEffect(() => {
    if (items.length === 0) {
      setItems([
        {
          id: 1,
          name: 'GOLD NECKLACE',
          barcode: 'NKC1023',
          category: 'Gold',
          grossWt: 25.450,
          stoneWt: 1.250,
          netWeight: 24.200,
          purity: 916,
          wastage: '10.00',
          pureWeight: 22.167,
          amount: 168950
        },
        {
          id: 2,
          name: 'GOLD BANGLES',
          barcode: 'BGL2045',
          category: 'Gold',
          grossWt: 18.300,
          stoneWt: 0.800,
          netWeight: 17.500,
          purity: 916,
          wastage: '10.00',
          pureWeight: 16.030,
          amount: 118450
        },
        {
          id: 3,
          name: 'GOLD RING',
          barcode: 'RNG3012',
          category: 'Gold',
          grossWt: 4.650,
          stoneWt: 0.150,
          netWeight: 4.500,
          purity: 916,
          wastage: '10.00',
          pureWeight: 4.122,
          amount: 30650
        }
      ]);
    }
  }, []);

  // Calculations for billing row
  const totalGross = items.reduce((acc, curr) => acc + curr.grossWt, 0);
  const totalStone = items.reduce((acc, curr) => acc + curr.stoneWt, 0);
  const totalNet = items.reduce((acc, curr) => acc + curr.netWeight, 0);
  const totalPure = items.reduce((acc, curr) => acc + curr.pureWeight, 0);
  const cashTotal = items.reduce((acc, curr) => acc + curr.amount, 0);
  const finalDiscount = makeDiscount ? 1500 : 0;
  const balanceGold = (totalPure * 1.05).toFixed(3);
  const balanceCash = Math.max(0, cashTotal + parseFloat(hallmarkCharges) - finalDiscount);

  // Helper to convert number to Rupees words
  const numberToWords = (num) => {
    if (num === 0) return 'Zero Only';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const count = (n, suffix) => {
      let temp = '';
      if (n > 19) {
        temp += b[Math.floor(n / 10)] + ' ' + a[n % 10];
      } else {
        temp += a[n];
      }
      if (n) temp += suffix;
      return temp;
    };

    let word = '';
    word += count(Math.floor(num / 10000000), 'Crore ');
    word += count(Math.floor((num % 10000000) / 100000), 'Lakh ');
    word += count(Math.floor((num % 100000) / 1000), 'Thousand ');
    word += count(Math.floor((num % 1000) / 100), 'Hundred ');
    if (num > 100 && num % 100) word += 'and ';
    word += count(num % 100, '');
    return word + 'Rupees Only';
  };

  const printSettings = company.printSettings || {
    showHeaderLogo: true,
    showHeaderGSTIN: true,
    showHeaderAddress: true,
    showHeaderContact: true,
    showHallmarkLogo: true,
    showBISLogo: true,
    showItemBarcode: true,
    showItemHUID: true,
    showItemDescription: true,
    showItemStoneDetails: true,
    groupStoneDetails: true,
    showItemProductImage: true,
    showAmountGoldRate: true,
    showAmountStoneCharges: true,
    showAmountMakingCharges: true,
    showAmountDiscount: true,
    showAmountGST: true,
    defaultTemplate: 'classic',
    watermark: 'none',
    multiCopy: { customerCopy: true, officeCopy: true, workerCopy: false },
    defaultPageSize: 'a4',
    qrOption: 'invoice'
  };

  const getPageSizeCSS = () => {
    let sizeStr = 'A4 portrait';
    let marginStr = '12mm';
    
    if (activePrintFormat === 'tag') {
      sizeStr = '50mm 25mm';
      marginStr = '0mm';
    } else if (activePrintFormat === 'worker' || activePrintFormat === 'jobcard') {
      sizeStr = 'A5 portrait';
      marginStr = '8mm';
    } else if (activePrintFormat === 'thermal') {
      sizeStr = '80mm auto';
      marginStr = '2mm';
    }
    
    return `
      @page {
        size: ${sizeStr};
        margin: ${marginStr};
      }
    `;
  };

  return (
    <div style={{
      backgroundColor: 'var(--dark-bg)',
      color: 'var(--text-main)',
      fontSize: '13px',
      fontFamily: 'Inter, Arial, sans-serif',
      minHeight: '100vh',
      paddingBottom: '50px',
      transition: 'var(--transition)'
    }}>
      
      {/* Self-contained CSS styles for clean printing layout exactly like reference */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide all screen components */
          body * {
            visibility: hidden;
          }
          #print-invoice-root, #print-invoice-root * {
            visibility: visible;
          }
          #print-invoice-root {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: ${printSettings.defaultTemplate === 'classic' ? 'Georgia, serif' : 'Inter, sans-serif'} !important;
            padding: 10px !important;
          }
          ${getPageSizeCSS()}
        }
      `}} />

      {/* Screen Interface Wrapper (hidden on print) */}
      <div className="no-print">
        {/* Top Header Bar */}
        <header style={{
          background: 'linear-gradient(180deg, #0059a8 0%, #003d7a 100%)',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          color: '#ffffff',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {setSidebarOpen && (
              <button 
                type="button" 
                className=""
                onClick={() => setSidebarOpen(prev => !prev)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '5px'
                }}
              >
                <Menu size={20} />
              </button>
            )}
            <FileText size={20} style={{ color: '#ffffff' }} />
            <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0, letterSpacing: 'normal', color: '#ffffff' }}>
              Multi Stone-Less Ornament Sales Returns(Barcode)
            </h2>
            <span className="desktop-only" style={{ fontSize: '11px', color: '#cbd5e1' }}>Sales & Returns Module</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => setShowShortcutsHelp(true)} 
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}
            >
              <HelpCircle size={16} /> Keyboard Shortcuts (F1)
            </button>
            <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.2)' }} className="desktop-only" />
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#ffffff' }} className="desktop-only">Active: ERP Billing Mode</span>
          </div>
        </header>

        {/* Main Billing Form Content Area */}
        <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Entry Section Form Card */}
          <div style={{
            backgroundColor: 'var(--surface-bg)',
            borderRadius: '4px',
            border: '1px solid var(--glass-border)',
            padding: '12px',
            transition: 'var(--transition)'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '10px' }}>
              
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '3px', color: 'var(--text-muted)', fontSize: '11px' }}>Barcode Lookup</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input 
                    type="text" 
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    placeholder="Scan Barcode / ID..."
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--dark-bg)', color: 'var(--text-main)' }}
                  />
                  <button type="button" onClick={() => setShowProductSearch(true)} style={{ padding: '6px', background: '#0059a8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} title="Browse completed stock">
                    <Search size={16} />
                  </button>
                </div>
              </div>

              <div style={{ flex: '1 1 90px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '3px', color: 'var(--text-muted)', fontSize: '11px' }}>Gross Wt.</label>
                <input 
                  type="number" 
                  step="0.001"
                  value={grossWt}
                  onChange={e => setGrossWt(e.target.value)}
                  placeholder="In Grams"
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                />
              </div>

              <div style={{ flex: '1 1 90px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '3px', color: 'var(--text-muted)', fontSize: '11px' }}>Stone Wt.</label>
                <input 
                  type="number" 
                  step="0.001"
                  value={stoneWt}
                  onChange={e => setStoneWt(e.target.value)}
                  placeholder="In Grams"
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                />
              </div>

              <div style={{ flex: '1 1 90px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '3px', color: 'var(--text-muted)', fontSize: '11px' }}>Net Wt.</label>
                <input 
                  type="number" 
                  step="0.001"
                  value={netWt}
                  onChange={e => setNetWt(e.target.value)}
                  placeholder="In Grams"
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                />
              </div>

              <div style={{ flex: '1 1 80px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '3px', color: 'var(--text-muted)', fontSize: '11px' }}>Wastage</label>
                <input 
                  type="text" 
                  value={wastage}
                  onChange={e => setWastage(e.target.value)}
                  placeholder="92+"
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                />
              </div>

              <div style={{ flex: '1 1 80px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '3px', color: 'var(--text-muted)', fontSize: '11px' }}>Purity %</label>
                <input 
                  type="text" 
                  value={purity}
                  onChange={e => setPurity(e.target.value)}
                  placeholder="92"
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                />
              </div>

              <div style={{ flex: '1 1 90px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '3px', color: 'var(--text-muted)', fontSize: '11px' }}>Category</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                >
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Diamond">Diamond</option>
                  <option value="Platinum">Platinum</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingBottom: '8px' }}>
                <input 
                  type="checkbox" 
                  id="auto-submit-cb" 
                  checked={autoSubmit} 
                  onChange={e => setAutoSubmit(e.target.checked)} 
                />
                <label htmlFor="auto-submit-cb" style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}>Auto Submission</label>
              </div>

              <div style={{ display: 'flex', gap: '5px' }}>
                <button 
                  type="button" 
                  onClick={handleAddItem}
                  style={{ padding: '7px 15px', background: '#0088a9', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  Add <Plus size={14} />
                </button>
              </div>

            </div>
          </div>

          {/* Transaction Grid Table */}
          <div style={{
            backgroundColor: 'var(--surface-bg)',
            borderRadius: '4px',
            border: '1px solid var(--glass-border)',
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto', maxHeight: '250px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1300px' }}>
                <thead>
                  <tr style={{ background: '#0088a9', color: '#ffffff', fontSize: '11px', fontWeight: '700' }}>
                    <th style={{ padding: '8px 10px', width: '40px' }}>Del</th>
                    <th style={{ padding: '8px 10px' }}>Item Name</th>
                    <th style={{ padding: '8px 10px' }}>Barcode</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Gross Wt.</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Stone Wt.</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Net Wt.</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Purity %</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Wastage</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Pure Wt.</th>
                    {companyStones.map(stone => (
                      <th key={stone.stoneName} style={{ padding: '8px 10px', textAlign: 'right' }}>{stone.stoneName}</th>
                    ))}
                    {companyStones.length === 0 && (
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Stones</th>
                    )}
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} style={{ 
                      borderBottom: '1px solid var(--glass-border)', 
                      background: index % 2 === 0 ? 'var(--surface-bg)' : 'var(--hover-bg)',
                      height: '32px'
                    }}>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteItem(item.id)}
                          style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                      <td style={{ padding: '6px 10px', fontWeight: '500' }}>{item.name}</td>
                      <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{item.barcode}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '600' }}>{item.grossWt.toFixed(3)}g</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-muted)' }}>{item.stoneWt.toFixed(3)}g</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '600' }}>{item.netWeight.toFixed(3)}g</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>{item.purity}%</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>{item.wastage}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '600', color: '#0369a1' }}>{item.pureWeight.toFixed(3)}g</td>
                      {companyStones.map(stone => (
                        <td key={stone.stoneName} style={{ padding: '6px 10px', textAlign: 'right' }}>
                          {item.stoneWt > 0 ? (item.stoneWt / companyStones.length).toFixed(3) + 'g' : '0.000g'}
                        </td>
                      ))}
                      {companyStones.length === 0 && (
                        <td style={{ padding: '6px 10px', textAlign: 'right' }}>{item.stoneWt.toFixed(3)}g</td>
                      )}
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '700', color: 'var(--success)' }}>₹{item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="16" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {loadingProducts ? "Loading completed stock list..." : "No items selected. Use Barcode Lookup above or press F4 to search."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer & Billing Form Layout Grid at the bottom */}
          <div style={{
            backgroundColor: 'var(--surface-bg)',
            borderRadius: '4px',
            border: '1px solid var(--glass-border)',
            padding: '15px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              alignItems: 'start'
            }}>
              
              {/* Column 1 */}
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Date</label>
                  <input 
                    type="date" 
                    value={billDate}
                    onChange={e => setBillDate(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                  />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Estimation Date</label>
                  <input 
                    type="date" 
                    value={estimationDate}
                    onChange={e => setEstimationDate(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Total Tag Weight</label>
                  <input 
                    type="text" 
                    placeholder="Total Tag Weight"
                    value={totalTagWeight}
                    onChange={e => setTotalTagWeight(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Customer (F2 to Search)</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input 
                      type="text" 
                      placeholder="Customer Name"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                  />
                    <button type="button" onClick={() => setShowCustomerSearch(true)} style={{ padding: '6px', background: '#0088a9', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      <Search size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Total Items</label>
                  <input 
                    type="text" 
                    readOnly
                    value={items.length}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--dark-bg)', color: 'var(--text-main)', fontWeight: '600' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Description</label>
                  <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows="1"
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', resize: 'vertical', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              {/* Column 3 & 4: Weights Totals */}
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Gross Total</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={`${totalGross.toFixed(3)} g`}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--dark-bg)', color: 'var(--text-main)', fontWeight: '600' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Gross Total (Return)</label>
                  <input 
                    type="text" 
                    placeholder="Total Gross"
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              {/* Column 5: Stone Totals */}
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Stone Total</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={`${totalStone.toFixed(3)} g`}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--dark-bg)', color: 'var(--text-main)', fontWeight: '600' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Stone Total (Return)</label>
                  <input 
                    type="text" 
                    placeholder="Total Stone"
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              {/* Column 6: Net Totals */}
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Net Total</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={`${totalNet.toFixed(3)} g`}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--dark-bg)', color: 'var(--text-main)', fontWeight: '600' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Net Total (Return)</label>
                  <input 
                    type="text" 
                    placeholder="Total Net"
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              {/* Column 7: Pure Total & Gold Balance */}
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Pure Total</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={items.length > 0 ? `${totalPure.toFixed(3)} g` : 'NaN'}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--dark-bg)', color: 'var(--text-main)', fontWeight: '600' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Balance Gold</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={items.length > 0 ? `${balanceGold} g` : 'NaN'}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--dark-bg)', color: 'var(--text-main)', fontWeight: '600' }}
                  />
                </div>
              </div>

              {/* Column 8: Cash Total & Balance Cash */}
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Cash Total</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={`₹ ${cashTotal.toLocaleString()}`}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--dark-bg)', color: 'var(--text-main)', fontWeight: '600' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Balance Cash</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={`₹ ${balanceCash.toLocaleString()}`}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--dark-bg)', color: 'var(--text-main)', fontWeight: '600' }}
                  />
                </div>
              </div>

              {/* Column 9: Hallmark & Addons */}
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Hallmark Charges</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={hallmarkCharges}
                    onChange={e => setHallmarkCharges(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="checkbox" 
                      id="make-payment-cb" 
                      checked={makePayment} 
                      onChange={e => setMakePayment(e.target.checked)} 
                    />
                    <label htmlFor="make-payment-cb" style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}>Make Payment</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="checkbox" 
                      id="make-discount-cb" 
                      checked={makeDiscount} 
                      onChange={e => setMakeDiscount(e.target.checked)} 
                    />
                    <label htmlFor="make-discount-cb" style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}>Make Discount</label>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Action Section Panel at the bottom right */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button 
              onClick={() => {
                if (items.length === 0) {
                  alert("Please add at least one item to complete the bill.");
                  return;
                }
                alert("Bill Submitted successfully to ERP database!");
                setItems([]);
              }} 
              style={{ 
                padding: '10px 24px', 
                background: '#28a745', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '4px', 
                fontWeight: '700', 
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              Submit
            </button>
            <button 
              onClick={handleClearAll} 
              style={{ 
                padding: '10px 24px', 
                background: '#dc3545', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '4px', 
                fontWeight: '700', 
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              All Clear ✘
            </button>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setPrintDropdownOpen(!printDropdownOpen)} 
                style={{ 
                  padding: '10px 24px', 
                  background: '#0059a8', 
                  color: '#ffffff', 
                  border: 'none', 
                  borderRadius: '4px', 
                  fontWeight: '700', 
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Printer size={14} /> Print Options ▼
              </button>
              {printDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  marginBottom: '8px',
                  backgroundColor: 'var(--surface-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  zIndex: 999,
                  minWidth: '220px',
                  padding: '8px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  <div style={{ padding: '6px 12px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid var(--glass-border)' }}>ERP Print Center</div>
                  {[
                    { key: 'estimation', label: '🧾 Estimation Bill' },
                    { key: 'invoice', label: '📄 Tax Invoice' },
                    { key: 'tag', label: '🏷 Product Tag' },
                    { key: 'worker', label: '👷 Worker Receipt' },
                    { key: 'delivery', label: '📦 Delivery Note' },
                    { key: 'jobcard', label: '📋 Job Card' },
                    { key: 'order', label: '📑 Order Receipt' }
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => triggerPrintFormat(opt.key)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        padding: '10px 16px',
                        fontSize: '12px',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'block',
                        width: '100%',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.target.style.backgroundColor = 'var(--hover-bg)'}
                      onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <div style={{ height: '1px', backgroundColor: 'var(--glass-border)', margin: '4px 0' }} />
                  <button
                    onClick={() => { setPrintDropdownOpen(false); alert('Generating PDF and sending email to customer...'); }}
                    style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: '8px 16px', fontSize: '12px', color: 'var(--text-main)', cursor: 'pointer', width: '100%' }}
                    onMouseEnter={e => e.target.style.backgroundColor = 'var(--hover-bg)'}
                    onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                  >
                    📧 Email PDF
                  </button>
                  <button
                    onClick={() => { setPrintDropdownOpen(false); alert('Downloading PDF receipt...'); }}
                    style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: '8px 16px', fontSize: '12px', color: 'var(--text-main)', cursor: 'pointer', width: '100%' }}
                    onMouseEnter={e => e.target.style.backgroundColor = 'var(--hover-bg)'}
                    onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                  >
                    ⬇ Download PDF
                  </button>
                  <button
                    onClick={() => { setPrintDropdownOpen(false); alert('Link copied to clipboard. Share with customer!'); }}
                    style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: '8px 16px', fontSize: '12px', color: 'var(--text-main)', cursor: 'pointer', width: '100%' }}
                    onMouseEnter={e => e.target.style.backgroundColor = 'var(--hover-bg)'}
                    onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                  >
                    🔗 Share Link
                  </button>
                  <button
                    onClick={() => { setPrintDropdownOpen(false); alert('Generating tracking QR Code for customer...'); }}
                    style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: '8px 16px', fontSize: '12px', color: 'var(--text-main)', cursor: 'pointer', width: '100%' }}
                    onMouseEnter={e => e.target.style.backgroundColor = 'var(--hover-bg)'}
                    onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                  >
                    📱 Generate QR
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <div id="print-invoice-root" style={{ display: 'none', backgroundColor: '#ffffff', color: '#000000', padding: 0 }}>
        
        {(() => {
          // Prepare copies to render
          const copiesToPrint = [];
          if (activePrintFormat === 'worker' || activePrintFormat === 'tag') {
            copiesToPrint.push('ORIGINAL');
          } else {
            if (printSettings.multiCopy?.customerCopy) copiesToPrint.push('CUSTOMER COPY');
            if (printSettings.multiCopy?.officeCopy) copiesToPrint.push('OFFICE COPY');
            if (printSettings.multiCopy?.workerCopy) copiesToPrint.push('WORKER COPY');
            if (copiesToPrint.length === 0) copiesToPrint.push('ORIGINAL');
          }

          // Template themes helper
          const getThemeStyles = (templateName) => {
            switch(templateName) {
              case 'luxury':
                return {
                  fontFamily: 'Georgia, serif',
                  borderColor: '#b45309',
                  headingColor: '#78350f',
                  bgColor: '#fffcf5',
                  accentColor: '#d97706'
                };
              case 'minimal':
                return {
                  fontFamily: 'sans-serif',
                  borderColor: '#cbd5e1',
                  headingColor: '#1e293b',
                  bgColor: '#ffffff',
                  accentColor: '#475569'
                };
              case 'corporate':
                return {
                  fontFamily: 'monospace',
                  borderColor: '#334155',
                  headingColor: '#0f172a',
                  bgColor: '#f8fafc',
                  accentColor: '#334155'
                };
              case 'classic':
              default:
                return {
                  fontFamily: 'Georgia, serif',
                  borderColor: '#b45309',
                  headingColor: '#0f172a',
                  bgColor: '#ffffff',
                  accentColor: '#b45309'
                };
            }
          };

          const customerTheme = getThemeStyles(printSettings.customerTemplate || 'classic');
          const workerTheme = getThemeStyles(printSettings.workerTemplate || 'corporate');

          return copiesToPrint.map((copyTitle, copyIdx) => {
            const isLast = copyIdx === copiesToPrint.length - 1;
            
            // Format specific overrides
            const isWorker = activePrintFormat === 'worker';
            const isTag = activePrintFormat === 'tag';
            const isJobCard = activePrintFormat === 'jobcard';
            const isInvoice = activePrintFormat === 'invoice';
            const isDelivery = activePrintFormat === 'delivery';
            const isOrder = activePrintFormat === 'order';
            const isEstimation = activePrintFormat === 'estimation';

            const theme = (isWorker || isJobCard) ? workerTheme : customerTheme;

            // Document Title
            let docTitle = "ESTIMATION BILL";
            if (isInvoice) docTitle = "TAX INVOICE";
            if (isWorker) docTitle = "WORKER RECEIPT";
            if (isTag) docTitle = "PRODUCT TAG";
            if (isDelivery) docTitle = "DELIVERY RECEIPT";
            if (isJobCard) docTitle = "JOB CARD";
            if (isOrder) docTitle = "ORDER RECEIPT";

            // 1. Tag Print Layout (Compact 50x25 / aspect ratios)
            if (isTag) {
              return (
                <div key={copyIdx} style={{
                  width: '50mm',
                  height: '25mm',
                  padding: '2px',
                  fontFamily: 'sans-serif',
                  fontSize: '8px',
                  lineHeight: '1.2',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  pageBreakAfter: isLast ? 'auto' : 'always',
                  border: '1px solid #000'
                }}>
                  {items.map((item, i) => {
                    if (i > 0) return null; // print first item for preview
                    return (
                      <div key={item.id} style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '1px' }}>{item.name}</div>
                        <div>
                          <div><strong>ID:</strong> {item.barcode}</div>
                          <div><strong>Gross:</strong> {item.grossWt.toFixed(3)}g</div>
                          <div><strong>Net:</strong> {item.netWeight.toFixed(3)}g</div>
                        </div>
                        <div style={{ fontSize: '7px', fontFamily: 'monospace', textAlign: 'center', background: '#000', color: '#fff', padding: '1px 0' }}>
                          * {item.barcode} *
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '5px' }}>No items in Tag draft.</div>
                  )}
                </div>
              );
            }

            // 2. Worker Receipt Layout (A5 Portrait Compact)
            if (isWorker) {
              return (
                <div key={copyIdx} style={{
                  width: '148mm',
                  minHeight: '210mm',
                  padding: '12px',
                  fontFamily: 'monospace',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  fontSize: '11px',
                  pageBreakAfter: isLast ? 'auto' : 'always',
                  border: '1px solid #cbd5e1'
                }}>
                  <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '8px', marginBottom: '10px' }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>WORKER RECEIPT</h3>
                    <div>Receipt No: WR-{Math.floor(10000 + Math.random() * 90000)}</div>
                    <div>Date: {new Date(billDate).toLocaleDateString('en-GB')}</div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div><strong>Worker:</strong> Ramesh (Gold Smith)</div>
                    <div><strong>Mobile:</strong> 9876543210</div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '2px dashed #000', marginBottom: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <th style={{ textAlign: 'left', padding: '4px 0' }}>Product</th>
                        <th style={{ textAlign: 'right', padding: '4px 0' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '4px 0' }}>Gross Wt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id}>
                          <td style={{ padding: '4px 0' }}>{item.name}</td>
                          <td style={{ textAlign: 'right', padding: '4px 0' }}>1</td>
                          <td style={{ textAlign: 'right', padding: '4px 0' }}>{item.grossWt.toFixed(3)}g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ textAlign: 'right', marginBottom: '30px' }}>
                    <strong>Total Qty:</strong> {items.length}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                    <div>
                      <div style={{ width: '100px', borderBottom: '1px solid #000', height: '20px' }}></div>
                      <div style={{ fontSize: '9px', marginTop: '4px' }}>Worker Signature</div>
                    </div>
                    <div>
                      <div style={{ width: '100px', borderBottom: '1px solid #000', height: '20px' }}></div>
                      <div style={{ fontSize: '9px', marginTop: '4px' }}>Manager Signature</div>
                    </div>
                  </div>
                </div>
              );
            }

            // 3. Regular A4/A5 Bill templates (Estimation, Invoice, Delivery Note, Job Card, Order Receipt)
            return (
              <div key={copyIdx} style={{
                boxSizing: 'border-box',
                fontFamily: theme.fontFamily,
                backgroundColor: theme.bgColor,
                padding: '20px',
                minHeight: '297mm',
                position: 'relative',
                border: copyIdx > 0 ? '1px dashed #cbd5e1' : 'none',
                marginTop: copyIdx > 0 ? '40px' : '0',
                pageBreakAfter: isLast ? 'auto' : 'always'
              }}>
                {/* Watermark overlay */}
                {((isEstimation && printSettings.watermark !== 'none') || (isInvoice && printSettings.watermark === 'none' ? false : printSettings.watermark !== 'none')) && (
                  <div style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-30deg)',
                    fontSize: '6rem',
                    color: 'rgba(239, 68, 68, 0.08)',
                    fontWeight: '900',
                    pointerEvents: 'none',
                    border: '10px double rgba(239, 68, 68, 0.08)',
                    padding: '10px 40px',
                    letterSpacing: '10px',
                    zIndex: 0
                  }}>
                    {printSettings.watermark === 'none' ? (isEstimation ? 'ESTIMATION' : 'PAID') : printSettings.watermark}
                  </div>
                )}

                {/* Copy title Badge */}
                <div style={{ position: 'absolute', top: '10px', right: '20px', fontSize: '9px', fontWeight: 'bold', color: '#64748b', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '4px' }}>
                  {copyTitle}
                </div>

                {/* Invoice Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${theme.borderColor}`, paddingBottom: '12px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {printSettings.showHeaderLogo && (
                      company?.logo ? (
                        <img src={company.logo} alt="Logo" style={{ width: '55px', height: '55px', objectFit: 'contain', borderRadius: '8px' }} />
                      ) : (
                        <div style={{ border: `2px solid ${theme.accentColor}`, borderRadius: '50%', width: '55px', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '24px', color: theme.accentColor }}>
                          {(company?.name || 'M')[0].toUpperCase()}
                        </div>
                      )
                    )}
                    <div>
                      <h1 style={{ fontSize: '22px', fontWeight: '800', color: theme.headingColor, margin: '0', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        {company?.name || 'MAHALAKSHMI JEWELLERY'}
                      </h1>
                      {printSettings.showHeaderAddress && <p style={{ fontSize: '9px', color: '#475569', margin: '2px 0 2px 0' }}>{company?.address || '123, Gold Street, Coimbatore - 641 001'}</p>}
                      {printSettings.showHeaderContact && (
                        <p style={{ fontSize: '9px', color: '#475569', margin: '0' }}>
                          {company?.phone ? `📞 ${company.phone}` : ''} {company?.email ? ` | ✉ ${company.email}` : ''}
                        </p>
                      )}
                      {printSettings.showHeaderGSTIN && company?.taxId && <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e293b', margin: '2px 0 0 0' }}>GSTIN : {company.taxId}</p>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: '10px' }}>
                    <div style={{ background: theme.accentColor, color: '#ffffff', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', display: 'inline-block' }}>
                      {docTitle}
                    </div>
                    <table style={{ fontSize: '10px', width: '200px', borderCollapse: 'collapse', textAlign: 'left', border: 'none', marginLeft: 'auto' }}>
                      <tbody>
                        <tr><td style={{ padding: '2px 0', fontWeight: 'bold', color: '#475569' }}>Bill No.</td><td style={{ padding: '2px 0', textAlign: 'right' }}>{isInvoice ? 'INV' : 'EST'}-{Math.floor(10000 + Math.random() * 90000)}</td></tr>
                        <tr><td style={{ padding: '2px 0', fontWeight: 'bold', color: '#475569' }}>Date</td><td style={{ padding: '2px 0', textAlign: 'right' }}>{new Date(billDate).toLocaleDateString('en-GB')}</td></tr>
                        {isEstimation && <tr><td style={{ padding: '2px 0', fontWeight: 'bold', color: '#475569' }}>Est Date</td><td style={{ padding: '2px 0', textAlign: 'right' }}>{new Date(estimationDate).toLocaleDateString('en-GB')}</td></tr>}
                        <tr><td style={{ padding: '2px 0', fontWeight: 'bold', color: '#475569' }}>Valid Till</td><td style={{ padding: '2px 0', textAlign: 'right' }}>07/06/2026</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Customer Details Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px 12px' }}>
                    <h4 style={{ margin: '0 0 6px 0', color: theme.accentColor, fontSize: '11px', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px' }}>CUSTOMER DETAILS</h4>
                    <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr><td style={{ width: '80px', padding: '2px 0', color: '#64748b' }}>Name</td><td style={{ padding: '2px 0', fontWeight: 'bold' }}>: {customerName}</td></tr>
                        <tr><td style={{ padding: '2px 0', color: '#64748b' }}>Mobile</td><td style={{ padding: '2px 0' }}>: {customerPhone}</td></tr>
                        <tr><td style={{ padding: '2px 0', color: '#64748b' }}>Customer ID</td><td style={{ padding: '2px 0' }}>: CUST000123</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px 12px' }}>
                    <h4 style={{ margin: '0 0 6px 0', color: theme.accentColor, fontSize: '11px', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px' }}>DOCUMENT DETAILS</h4>
                    <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr><td style={{ width: '80px', padding: '2px 0', color: '#64748b' }}>Total Items</td><td style={{ padding: '2px 0', fontWeight: 'bold' }}>: {items.length}</td></tr>
                        {printSettings.showHeaderGSTIN && isInvoice && <tr><td style={{ padding: '2px 0', color: '#64748b' }}>HSN Code</td><td style={{ padding: '2px 0' }}>: 7113 (Gold Jewellery)</td></tr>}
                        <tr><td style={{ padding: '2px 0', color: '#64748b' }}>Description</td><td style={{ padding: '2px 0' }}>: {description}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Items Grid Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '15px' }}>
                  <thead>
                    <tr style={{ backgroundColor: theme.headingColor, color: '#ffffff', textAlign: 'left', fontWeight: 'bold' }}>
                      <th style={{ padding: '6px', border: '1px solid #334155' }}>#</th>
                      <th style={{ padding: '6px', border: '1px solid #334155' }}>PRODUCT / DESIGN</th>
                      {printSettings.showItemBarcode && <th style={{ padding: '6px', border: '1px solid #334155' }}>BARCODE</th>}
                      {printSettings.showItemHUID && <th style={{ padding: '6px', border: '1px solid #334155' }}>HUID</th>}
                      <th style={{ padding: '6px', border: '1px solid #334155', textAlign: 'right' }}>GROSS WT</th>
                      {printSettings.showItemStoneDetails && !printSettings.groupStoneDetails && companyStones.map(stone => (
                        <th key={stone.stoneName} style={{ padding: '6px', border: '1px solid #334155', textAlign: 'right' }}>{stone.stoneName}</th>
                      ))}
                      <th style={{ padding: '6px', border: '1px solid #334155', textAlign: 'right' }}>NET WT</th>
                      <th style={{ padding: '6px', border: '1px solid #334155', textAlign: 'center' }}>PURITY</th>
                      <th style={{ padding: '6px', border: '1px solid #334155', textAlign: 'right' }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                        <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                          {item.name}
                          {printSettings.showItemDescription && <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'normal' }}>Description: {item.category} Ornament</div>}
                          {printSettings.showItemStoneDetails && printSettings.groupStoneDetails && (
                            <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'normal', fontStyle: 'italic', marginTop: '2px' }}>
                              Stone Details: {companyStones.map((stone, sidx) => `${stone.stoneName} ${(item.stoneWt > 0 ? (item.stoneWt / companyStones.length) : 0).toFixed(2)}g`).join(', ')}
                            </div>
                          )}
                        </td>
                        {printSettings.showItemBarcode && <td style={{ padding: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{item.barcode}</td>}
                        {printSettings.showItemHUID && <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>HUID{Math.floor(100000 + Math.random()*900000)}</td>}
                        <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{item.grossWt.toFixed(3)}g</td>
                        {printSettings.showItemStoneDetails && !printSettings.groupStoneDetails && companyStones.map(stone => (
                          <td key={stone.stoneName} style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                            {item.stoneWt > 0 ? (item.stoneWt / companyStones.length).toFixed(3) : '0.000'}
                          </td>
                        ))}
                        <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold' }}>{item.netWeight.toFixed(3)}g</td>
                        <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{item.purity}%</td>
                        <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold' }}>₹{item.amount.toLocaleString()}.00</td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                      <td colSpan={printSettings.showItemBarcode ? (printSettings.showItemHUID ? 4 : 3) : (printSettings.showItemHUID ? 3 : 2)} style={{ padding: '6px', border: '1px solid #cbd5e1' }}>TOTAL</td>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{totalGross.toFixed(3)}g</td>
                      {printSettings.showItemStoneDetails && !printSettings.groupStoneDetails && companyStones.map(stone => (
                        <td key={stone.stoneName} style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{(totalStone / (companyStones.length || 1)).toFixed(3)}</td>
                      ))}
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{totalNet.toFixed(3)}g</td>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}></td>
                      <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>₹{cashTotal.toLocaleString()}.00</td>
                    </tr>
                  </tbody>
                </table>

                {/* Estimation / Invoice Summaries */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  
                  {/* Weight Summary */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px' }}>
                    <h4 style={{ margin: '0 0 8px 0', borderBottom: `1.5px solid ${theme.borderColor}`, paddingBottom: '4px', color: '#1e293b', fontSize: '11px', fontWeight: '700' }}>WEIGHT SUMMARY</h4>
                    <table style={{ width: '100%', fontSize: '10px' }}>
                      <tbody>
                        <tr><td style={{ padding: '3px 0', color: '#475569' }}>Gross Total</td><td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 'bold' }}>: {totalGross.toFixed(3)} g</td></tr>
                        <tr><td style={{ padding: '3px 0', color: '#475569' }}>Stone Total</td><td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 'bold' }}>: {totalStone.toFixed(3)} g</td></tr>
                        <tr><td style={{ padding: '3px 0', color: '#475569' }}>Net Total</td><td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 'bold' }}>: {totalNet.toFixed(3)} g</td></tr>
                        <tr><td style={{ padding: '3px 0', color: '#475569' }}>Pure Total</td><td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>: {totalPure.toFixed(3)} g</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Rate & Value Summary */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px' }}>
                    <h4 style={{ margin: '0 0 8px 0', borderBottom: `1.5px solid ${theme.borderColor}`, paddingBottom: '4px', color: '#1e293b', fontSize: '11px', fontWeight: '700' }}>RATE & VALUE SUMMARY</h4>
                    <table style={{ width: '100%', fontSize: '9px' }}>
                      <tbody>
                        {printSettings.showAmountGoldRate && <tr><td style={{ padding: '2px 0', color: '#475569' }}>Gold Rate (₹/g)</td><td style={{ padding: '2px 0', textAlign: 'right' }}>: 6,150.00</td></tr>}
                        {printSettings.showAmountGoldRate && <tr><td style={{ padding: '2px 0', color: '#475569' }}>Gold Value</td><td style={{ padding: '2px 0', textAlign: 'right' }}>: {(totalNet * 6150).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>}
                        {printSettings.showAmountStoneCharges && <tr><td style={{ padding: '2px 0', color: '#475569' }}>Stone Charges</td><td style={{ padding: '2px 0', textAlign: 'right' }}>: {(totalStone * 1200).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>}
                        {printSettings.showAmountMakingCharges && <tr><td style={{ padding: '2px 0', color: '#475569' }}>Making Charges (10%)</td><td style={{ padding: '2px 0', textAlign: 'right' }}>: {(totalNet * 6150 * 0.1).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>}
                        {printSettings.showAmountDiscount && <tr><td style={{ padding: '2px 0', color: '#475569' }}>Discount</td><td style={{ padding: '2px 0', textAlign: 'right' }}>: {finalDiscount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>}
                        {printSettings.showAmountGST && isInvoice && <tr><td style={{ padding: '2px 0', color: '#475569' }}>GST (3%)</td><td style={{ padding: '2px 0', textAlign: 'right' }}>: {(balanceCash * 0.03).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>}
                        <tr style={{ borderTop: '1px solid #cbd5e1', fontWeight: 'bold' }}><td style={{ padding: '4px 0', color: '#000' }}>Sub Total</td><td style={{ padding: '4px 0', textAlign: 'right' }}>: {(balanceCash * (isInvoice ? 1.03 : 1)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Estimation Total Badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ border: `1px solid ${theme.borderColor}`, borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ background: theme.accentColor, color: '#ffffff', padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px' }}>
                        ₹ {isInvoice ? 'INVOICE TOTAL' : 'ESTIMATION TOTAL'}
                      </div>
                      <div style={{ padding: '10px', textAlign: 'center', background: theme.bgColor }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: theme.headingColor }}>₹ {Math.round(balanceCash * (isInvoice ? 1.03 : 1)).toLocaleString()}.00</div>
                        <div style={{ fontSize: '8px', color: '#475569', marginTop: '4px', textTransform: 'capitalize', fontStyle: 'italic' }}>
                          ({numberToWords(Math.round(balanceCash * (isInvoice ? 1.03 : 1)))})
                        </div>
                      </div>
                    </div>
                    {/* Hallmark / BIS details */}
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                      {printSettings.showHallmarkLogo && <span style={{ fontSize: '8px', border: '1px solid #d97706', padding: '2px 5px', borderRadius: '4px', color: '#d97706', fontWeight: 'bold' }}>🎗 916 BIS Hallmark</span>}
                      {printSettings.showBISLogo && <span style={{ fontSize: '8px', border: '1px solid #0284c7', padding: '2px 5px', borderRadius: '4px', color: '#0284c7', fontWeight: 'bold' }}>BIS Certified</span>}
                    </div>
                  </div>

                </div>

                {/* Terms & Conditions & Signatory */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', borderTop: '1px solid #cbd5e1', paddingTop: '12px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '8px', color: '#475569' }}>
                    <strong style={{ fontSize: '9px', color: '#0f172a' }}>TERMS & CONDITIONS</strong>
                    <ul style={{ margin: '4px 0 0 12px', padding: 0 }}>
                      <li>Gold rate and making charges are subject to change without notice.</li>
                      <li>100% advance to be paid for order confirmation.</li>
                      <li>Delivery will be made as per the mutually agreed timeline.</li>
                      <li>This is computer generated estimate, no signature required.</li>
                    </ul>
                  </div>
                  <div style={{ textAlign: 'center', alignSelf: 'end' }}>
                    <p style={{ fontSize: '9px', fontWeight: 'bold', margin: '0 0 35px 0' }}>For {company?.name || 'Mahalakshmi Jewellery'}</p>
                    <div style={{ width: '150px', borderBottom: '1px solid #000', margin: '0 auto 4px auto' }} />
                    <p style={{ fontSize: '8px', color: '#475569', margin: 0 }}>Authorised Signatory</p>
                  </div>
                </div>

                {/* Footer Badges bar */}
                <div style={{ borderTop: '2.5px solid #cbd5e1', borderBottom: '2.5px solid #cbd5e1', padding: '6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', fontWeight: 'bold', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.accentColor }}>
                    💎 THANK YOU FOR CHOOSING US!
                  </div>
                  <div style={{ width: '1px', height: '10px', backgroundColor: '#cbd5e1' }} />
                  <div>Purity You Can Trust, Elegance You Deserve.</div>
                  <div style={{ width: '1px', height: '10px', backgroundColor: '#cbd5e1' }} />
                  <div>🎗 916 BIS Hallmarked</div>
                  <div style={{ width: '1px', height: '10px', backgroundColor: '#cbd5e1' }} />
                  <div>Certified Diamonds</div>
                </div>

              </div>
            );
          });
        })()}

      </div>

    </div>
  );
};

export default Billing;
