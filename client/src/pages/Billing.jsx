import React, { useState, useEffect } from 'react';
import { Printer, Plus, Trash2, Search, Barcode, HelpCircle, FileText, Menu } from 'lucide-react';
import api from '../api';

const Billing = ({ setSidebarOpen }) => {
  const [items, setItems] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [grossWt, setGrossWt] = useState('');
  const [stoneWt, setStoneWt] = useState('0');
  const [netWt, setNetWt] = useState('');
  const [wastage, setWastage] = useState('10');
  const [purity, setPurity] = useState('92'); 
  const [category, setCategory] = useState('Gold');
  const [huid, setHuid] = useState('');
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [goldRate, setGoldRate] = useState(6200);
  const [printDropdownOpen, setPrintDropdownOpen] = useState(false);
  const [activePrintFormat, setActivePrintFormat] = useState('estimation');
  const [invoiceSeq, setInvoiceSeq] = useState(() => {
    const saved = localStorage.getItem('nextInvoiceSeq');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Db Products & Stones
  const [availableProducts, setAvailableProducts] = useState([]);
  const [companyStones, setCompanyStones] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [company, setCompany] = useState({});

  // Customer & Bill
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimationDate, setEstimationDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalTagWeight, setTotalTagWeight] = useState('');
  const [description, setDescription] = useState('');
  const [hallmarkCharges, setHallmarkCharges] = useState('');
  const [makePayment, setMakePayment] = useState(false);
  const [makeDiscount, setMakeDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [finalAmount, setFinalAmount] = useState('');
  const [lastEditedField, setLastEditedField] = useState('percent'); // 'percent', 'amount', 'final'
  
  const [applyTax, setApplyTax] = useState(false);
  const [taxGoldPercent, setTaxGoldPercent] = useState('0');
  const [taxStonePercent, setTaxStonePercent] = useState('0');
  const [vatPercent, setVatPercent] = useState('0');

  // Search Modals / Popup States
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showStoneRatesModal, setShowStoneRatesModal] = useState(false);
  const [showWastageApplet, setShowWastageApplet] = useState(false);
  const [showWastageInNetWeight, setShowWastageInNetWeight] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [itemStones, setItemStones] = useState([]);
  const [showStoneDetail, setShowStoneDetail] = useState(false);

  // Fetch products and company stones on mount
  useEffect(() => {
    const fetchProdsAndStones = async () => {
      try {
        setLoadingProducts(true);
        const [prodRes, companyRes, custRes, settingsRes] = await Promise.all([
          api.get('/mgmt/products?status=completed').catch(() => ({ data: [] })),
          api.get('/company').catch(() => ({ data: {} })),
          api.get('/customers').catch(() => ({ data: [] })),
          api.get('/settings').catch(() => ({ data: [] }))
        ]);
        setAvailableProducts(prodRes.data || []);
        setCompany(companyRes.data || {});
        setCustomers(custRes.data || []);
        
        // Load gold rate from settings
        const settingsObj = (settingsRes.data || []).reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
        if (settingsObj.goldRate) {
          setGoldRate(parseFloat(settingsObj.goldRate) || 6200);
        }
        
        // Use stones from company or default list if empty
        const fetchedStones = (companyRes.data?.stones || [])
          .filter(s => s.status !== 'Inactive')
          .map(s => ({ ...s, rate: s.rate || 1200 }));
        if (fetchedStones.length === 0) {
          setCompanyStones([
            { stoneName: 'AD', stoneType: 'Precious', rate: 1200 },
            { stoneName: 'MT', stoneType: 'Precious', rate: 800 }
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

  // Keyboard Shortcuts (F1, F2, F4, F8)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F8') {
        e.preventDefault();
        setPrintDropdownOpen(prev => !prev);
      }
      if (e.key === 'F2') {
        e.preventDefault();
        setShowCustomerSearch(true);
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setShowProductSearch(true);
      }
      if (e.key === 'F9') {
        e.preventDefault();
        setShowStoneRatesModal(true);
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
      // Calculate total stone weight from individual stones or totalStoneWeight field
      const stoneWtFromStones = (found.stones || []).reduce((acc, s) => acc + (parseFloat(s.stoneWeight) || 0), 0);
      const totalStWt = found.totalStoneWeight || stoneWtFromStones || 0;
      
      setGrossWt(found.grossWeight || found.netWeight || '');
      setNetWt(found.netWeight || '');
      setCategory(found.category || 'Gold');
      setStoneWt(totalStWt.toString());
      setPurity('92');
      setHuid(found.huid || '');
      
      if (autoSubmit) {
        const timer = setTimeout(() => {
          const netWtVal = parseFloat(found.netWeight) || 0;
          const wastageVal = parseFloat(wastage) || 0;
          const billingWeight = netWtVal * (1 + wastageVal / 100);
          
          // Calculate stone charges from found.stones using companyStones rates
          const stoneCharges = (found.stones || []).reduce((sum, s) => {
            const matchedStone = companyStones.find(cs => cs.stoneName.toLowerCase().trim() === s.stoneName.toLowerCase().trim());
            const rate = matchedStone ? (parseFloat(matchedStone.rate) || 0) : 0;
            return sum + (parseFloat(s.stoneWeight) || 0) * rate;
          }, 0);

          const totalAmount = Math.round(billingWeight * goldRate) + stoneCharges;

          commitItem({
            barcode: found.productId,
            name: found.designName || `${found.category} Ornament`,
            category: found.category,
            grossWt: parseFloat(found.grossWeight || found.netWeight) || 0,
            stoneWt: totalStWt,
            netWeight: netWtVal,
            purity: parseFloat(purity) || 92,
            wastage: wastage,
            amount: totalAmount,
            huid: found.huid || '',
            stones: (found.stones || []).map(s => {
              const matchedStone = companyStones.find(cs => cs.stoneName.toLowerCase().trim() === s.stoneName.toLowerCase().trim());
              return {
                stoneName: s.stoneName,
                weight: s.stoneWeight,
                rate: matchedStone ? matchedStone.rate : 0
              };
            })
          });
          setBarcode('');
          setGrossWt('');
          setStoneWt('0');
          setNetWt('');
          setHuid('');
          setItemStones([]);
          setShowStoneDetail(false);
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [barcode, availableProducts, autoSubmit, wastage, purity, companyStones, goldRate]);



  const addStoneRow = () => {
    setItemStones([...itemStones, { stoneName: '', weight: '', rate: '' }]);
  };

  const updateStoneRow = (idx, field, value) => {
    const updated = [...itemStones];
    updated[idx][field] = value;
    
    // Auto populate rate if stoneName changes
    if (field === 'stoneName') {
      const matchedStone = companyStones.find(s => s.stoneName === value);
      if (matchedStone) {
        updated[idx]['rate'] = matchedStone.rate || '';
      }
    }
    
    setItemStones(updated);

    if (field === 'weight') {
      const total = updated.reduce((acc, curr) => acc + (parseFloat(curr.weight) || 0), 0);
      setStoneWt(total.toFixed(3));
      if (grossWt) {
        setNetWt((parseFloat(grossWt) - total).toFixed(3));
      }
    }
  };

  const removeStoneRow = (idx) => {
    const updated = [...itemStones];
    updated.splice(idx, 1);
    setItemStones(updated);
    
    const total = updated.reduce((acc, curr) => acc + (parseFloat(curr.weight) || 0), 0);
    setStoneWt(total.toFixed(3));
    if (grossWt) {
      setNetWt((parseFloat(grossWt) - total).toFixed(3));
    }
  };

  const commitItem = (customItem) => {
    if (customItem.barcode && items.some(item => item.barcode === customItem.barcode)) {
      alert("This item/barcode is already added to the bill.");
      return;
    }
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
      pureWeight: parseFloat((customItem.netWeight * (1 + (parseFloat(customItem.wastage) || 0) / 100) * ((parseFloat(customItem.purity) || 92) / 100)).toFixed(3)),
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
      amount: customItem.amount,
      stones: customItem.stones || [],
      huid: customItem.huid || ''
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
    const wastageVal = parseFloat(wastage) || 0;
    const billingWeight = n * (1 + wastageVal / 100);

    // Calculate total stone charges (weight * rate)
    const stoneCharges = itemStones.reduce((acc, curr) => acc + (parseFloat(curr.weight) || 0) * (parseFloat(curr.rate) || 0), 0);
    const totalAmount = Math.round(billingWeight * goldRate) + stoneCharges;

    commitItem({
      barcode: barcode || `BC-${Math.floor(100000 + Math.random() * 900000)}`,
      name: `${category} Ornament`,
      category: category,
      grossWt: g,
      stoneWt: s,
      netWeight: n,
      purity: parseFloat(purity) || 92,
      wastage: wastage,
      amount: totalAmount,
      stones: itemStones,
      huid: huid
    });

    setBarcode('');
    setGrossWt('');
    setStoneWt('0');
    setNetWt('');
    setHuid('');
    setItemStones([]);
    setShowStoneDetail(false);
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
      setHuid('');
      setCustomerName('');
      setCustomerPhone('');
      setSelectedCustomer(null);
      setDescription('');
      setTotalTagWeight('');
      setHallmarkCharges('');
      setMakePayment(false);
      setMakeDiscount(false);
      setDiscountPercent('0');
      setDiscountAmount('0');
      setFinalAmount('');
      setLastEditedField('percent');
      setApplyTax(false);
      setTaxGoldPercent('0');
      setTaxStonePercent('0');
      setVatPercent('0');
    }
  };

  const triggerPrintFormat = (format) => {
    setActivePrintFormat(format);
    setPrintDropdownOpen(false);
    setTimeout(() => {
      window.print();
    }, 250);
  };



  // Calculations for billing row
  const totalGross = items.reduce((acc, curr) => acc + curr.grossWt, 0);
  const totalStone = items.reduce((acc, curr) => acc + curr.stoneWt, 0);
  const totalNet = items.reduce((acc, curr) => acc + curr.netWeight, 0);
  const totalPure = items.reduce((acc, curr) => acc + curr.pureWeight, 0);
  const cashTotal = items.reduce((acc, curr) => acc + curr.amount, 0);
  const hasHUID = items.some(item => item.huid && item.huid.trim() !== '');

  const subtotal = cashTotal + (parseFloat(hallmarkCharges) || 0);

  const totalBaseGoldCost = items.reduce((sum, item) => sum + Math.round(item.netWeight * goldRate), 0);
  const totalWastageWt = items.reduce((sum, item) => sum + (item.netWeight * (parseFloat(item.wastage) || 0) / 100), 0);
  const totalWastageCost = items.reduce((sum, item) => sum + Math.round((item.netWeight * (parseFloat(item.wastage) || 0) / 100) * goldRate), 0);
  const totalStoneCost = items.reduce((sum, item) => sum + (item.stones || []).reduce((sSum, s) => sSum + (parseFloat(s.weight) || 0) * (parseFloat(s.rate) || 0), 0), 0);

  const goldValue = totalBaseGoldCost + totalWastageCost;
  const taxGoldValue = applyTax ? Math.round((goldValue * (parseFloat(taxGoldPercent) || 0)) / 100) : 0;
  const taxStoneValue = applyTax ? Math.round((totalStoneCost * (parseFloat(taxStonePercent) || 0)) / 100) : 0;
  const vatValue = applyTax ? Math.round((totalWastageCost * (parseFloat(vatPercent) || 0)) / 100) : 0;
  const totalTaxAmount = taxGoldValue + taxStoneValue + vatValue;

  const handlePercentChange = (val) => {
    setLastEditedField('percent');
    setDiscountPercent(val);
    let pct = parseFloat(val) || 0;
    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    const amt = (subtotal * pct) / 100;
    setDiscountAmount(Math.round(amt).toString());
    setFinalAmount(Math.round(subtotal + totalTaxAmount - amt).toString());
  };

  const handleAmountChange = (val) => {
    setLastEditedField('amount');
    setDiscountAmount(val);
    let amt = parseFloat(val) || 0;
    if (amt < 0) amt = 0;
    if (amt > subtotal) amt = subtotal;
    const pct = subtotal > 0 ? ((amt / subtotal) * 100).toFixed(1) : '0';
    setDiscountPercent(pct);
    setFinalAmount(Math.round(subtotal + totalTaxAmount - amt).toString());
  };

  const handleFinalAmountChange = (val) => {
    setLastEditedField('final');
    setFinalAmount(val);
    let finalAmt = parseFloat(val) || 0;
    if (finalAmt < 0) finalAmt = 0;
    const maxVal = subtotal + totalTaxAmount;
    if (finalAmt > maxVal) finalAmt = maxVal;
    const amt = (subtotal + totalTaxAmount) - finalAmt;
    setDiscountAmount(Math.round(amt).toString());
    const pct = subtotal > 0 ? ((amt / subtotal) * 100).toFixed(1) : '0';
    setDiscountPercent(pct);
  };

  // Synchronize discount inputs when subtotal or taxes change
  useEffect(() => {
    if (lastEditedField === 'percent') {
      const pct = parseFloat(discountPercent) || 0;
      const amt = (subtotal * pct) / 100;
      setDiscountAmount(Math.round(amt).toString());
      setFinalAmount(Math.round(subtotal + totalTaxAmount - amt).toString());
    } else if (lastEditedField === 'amount') {
      const amt = parseFloat(discountAmount) || 0;
      const pct = subtotal > 0 ? ((amt / subtotal) * 100).toFixed(1) : '0';
      setDiscountPercent(pct);
      setFinalAmount(Math.round(subtotal + totalTaxAmount - amt).toString());
    } else if (lastEditedField === 'final') {
      const finalAmt = parseFloat(finalAmount) || (subtotal + totalTaxAmount);
      const amt = Math.max(0, (subtotal + totalTaxAmount) - finalAmt);
      setDiscountAmount(Math.round(amt).toString());
      const pct = subtotal > 0 ? ((amt / subtotal) * 100).toFixed(1) : '0';
      setDiscountPercent(pct);
    }
  }, [subtotal, totalTaxAmount]);

  const finalDiscount = makeDiscount ? (parseFloat(discountAmount) || 0) : 0;
  const balanceGold = (totalPure * 1.05).toFixed(3);
  const balanceCash = Math.max(0, subtotal + totalTaxAmount - finalDiscount);

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
    showItemNetWeight: true,
    showItemStoneWeight: true,
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
    
    if (printSettings.defaultPageSize === 'a5') {
      sizeStr = 'A5 landscape';
      marginStr = '8mm';
    }

    if (activePrintFormat === 'tag') {
      sizeStr = '50mm 25mm';
      marginStr = '0mm';
    } else if (activePrintFormat === 'worker' || activePrintFormat === 'jobcard') {
      sizeStr = 'A5 portrait';
      marginStr = '8mm';
    } else if (activePrintFormat === 'thermal') {
      sizeStr = '80mm auto';
      marginStr = '2mm';
    } else if (activePrintFormat === 'bill3') {
      sizeStr = 'A4 portrait';
      marginStr = '10mm';
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
          background: 'linear-gradient(135deg, var(--primary-gold) 0%, #3e00a3 100%)',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          color: '#ffffff',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

            <FileText size={20} style={{ color: '#ffffff' }} />
            <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0, letterSpacing: 'normal', color: '#ffffff' }}>
              Billing
            </h2>
            <span style={{ fontSize: '12px', backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
              INVOICE NO: {String(invoiceSeq).padStart(2, '0')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' }}>GOLD RATE:</span>
              <input 
                type="number" 
                value={goldRate}
                onChange={e => setGoldRate(parseFloat(e.target.value) || 0)}
                style={{ width: '85px', padding: '3px 8px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'rgba(0,0,0,0.2)', color: '#ffffff', textAlign: 'right', fontWeight: 'bold', outline: 'none' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => setShowShortcutsHelp(true)} 
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}
            >
              <HelpCircle size={16} /> Keyboard Shortcuts (F1)
            </button>
            <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.2)' }} className="desktop-only" />
            <button 
              onClick={() => setShowStoneRatesModal(true)} 
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '4px',
                color: '#ffffff',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.target.style.backgroundColor = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            >
              💎 Stone Rates (F9)
            </button>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowWastageApplet(!showWastageApplet)} 
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.target.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
              >
                ⚖️ Wastage Applet ({wastage}%)
              </button>
              
              {showWastageApplet && (
                <div style={{
                  position: 'absolute',
                  top: '35px',
                  right: '0',
                  width: '260px',
                  backgroundColor: 'var(--surface-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  padding: '15px',
                  zIndex: 1000,
                  color: 'var(--text-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '12px' }}>Wastage Configurator</span>
                    <button onClick={() => setShowWastageApplet(false)} style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>×</button>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '5px' }}>Wastage Percentage</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input 
                        type="number" 
                        step="0.1"
                        value={wastage}
                        onChange={e => setWastage(e.target.value)}
                        style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--dark-bg)', color: 'var(--text-main)' }}
                      />
                      <span style={{ fontWeight: '600' }}>%</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '5px' }}>Quick Presets</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {['5', '8', '10', '12', '15'].map(pct => (
                        <button 
                          key={pct}
                          onClick={() => setWastage(pct)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--glass-border)',
                            backgroundColor: wastage === pct ? 'var(--primary-gold)' : 'var(--dark-bg)',
                            color: wastage === pct ? '#fff' : 'var(--text-main)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px', marginBottom: '5px' }}>
                    <input 
                      type="checkbox" 
                      id="showWastageInNetWeight"
                      checked={showWastageInNetWeight}
                      onChange={e => setShowWastageInNetWeight(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="showWastageInNetWeight" style={{ fontSize: '11px', cursor: 'pointer', userSelect: 'none', color: 'var(--text-main)' }}>
                      Show wastage % beside Wastage
                    </label>
                  </div>

                  <button 
                    onClick={() => setShowWastageApplet(false)} 
                    style={{
                      width: '100%',
                      padding: '6px',
                      borderRadius: '4px',
                      border: 'none',
                      background: 'linear-gradient(135deg, var(--secondary-gold), var(--primary-gold))',
                      color: '#fff',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Done & Apply
                  </button>
                </div>
              )}
            </div>
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
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '3px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  Barcode Lookup (Inv: {String(invoiceSeq).padStart(2, '0')})
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input 
                    type="text" 
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    placeholder="Scan Barcode / ID..."
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--dark-bg)', color: 'var(--text-main)' }}
                  />
                  <button type="button" onClick={() => setShowProductSearch(true)} style={{ padding: '6px', background: 'var(--primary-gold)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} title="Browse completed stock">
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
                  onFocus={e => e.target.select()}
                  placeholder="In Grams"
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                />
              </div>

              <div style={{ flex: '1 1 125px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '3px', color: 'var(--text-muted)', fontSize: '11px' }}>Stone Wt.</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input 
                    type="number" 
                    step="0.001"
                    value={stoneWt}
                    onChange={e => setStoneWt(e.target.value)}
                    onFocus={e => e.target.select()}
                    placeholder="In Grams"
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                  />
                  <button type="button" onClick={() => setShowStoneDetail(!showStoneDetail)} style={{ padding: '6px', background: showStoneDetail ? 'var(--primary-gold)' : 'var(--primary-gold)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Add individual stones, weights and rates">
                    💎
                  </button>
                </div>
              </div>

              <div style={{ flex: '1 1 90px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '3px', color: 'var(--text-muted)', fontSize: '11px' }}>Net Wt.</label>
                <input 
                  type="number" 
                  step="0.001"
                  value={netWt}
                  onChange={e => setNetWt(e.target.value)}
                  onFocus={e => e.target.select()}
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
                  onFocus={e => e.target.select()}
                  placeholder="10"
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                />
              </div>

              <div style={{ flex: '1 1 80px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '3px', color: 'var(--text-muted)', fontSize: '11px' }}>Purity %</label>
                <input 
                  type="text" 
                  value={purity}
                  onChange={e => {
                    const val = e.target.value;
                    const parsed = parseFloat(val);
                    if (val === '') {
                      setPurity(val);
                    } else if (!isNaN(parsed)) {
                      if (parsed >= 0 && parsed <= 100) {
                        setPurity(val);
                      }
                    }
                  }}
                  onFocus={e => e.target.select()}
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

              <div style={{ flex: '1 1 90px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '3px', color: 'var(--text-muted)', fontSize: '11px' }}>HUID</label>
                <input 
                  type="text" 
                  value={huid}
                  onChange={e => setHuid(e.target.value)}
                  placeholder="HUID"
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                />
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
                  style={{ padding: '7px 15px', background: 'var(--primary-gold)', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  Add <Plus size={14} />
                </button>
              </div>

            </div>

            {showStoneDetail && (
              <div style={{ marginTop: '12px', padding: '12px', background: 'var(--dark-bg)', borderRadius: '8px', border: '1px dashed var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '750', color: 'var(--primary-gold)' }}>💎 INDIVIDUAL STONES & RATES</span>
                  <button type="button" onClick={addStoneRow} style={{ padding: '3px 8px', background: 'transparent', border: '1px solid var(--primary-gold)', color: 'var(--primary-gold)', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '600' }}>+ Add Stone</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {itemStones.map((stone, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select 
                        value={stone.stoneName} 
                        onChange={e => updateStoneRow(idx, 'stoneName', e.target.value)}
                        style={{ flex: '2', padding: '6px 8px', background: 'var(--surface-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '11px' }}
                      >
                        <option value="">Select Stone...</option>
                        {companyStones.map(s => <option key={s.stoneName} value={s.stoneName}>{s.stoneName.replace(/\s*\(Precious\)/gi, '')}</option>)}
                      </select>
                      <input 
                        type="number" 
                        step="0.001" 
                        placeholder="Weight (g)" 
                        value={stone.weight} 
                        onChange={e => updateStoneRow(idx, 'weight', e.target.value)}
                        style={{ flex: '1.5', padding: '6px 8px', background: 'var(--surface-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '11px' }}
                      />
                      <input 
                        type="number" 
                        placeholder="Rate (₹/g or piece)" 
                        value={stone.rate} 
                        onChange={e => updateStoneRow(idx, 'rate', e.target.value)}
                        style={{ flex: '2', padding: '6px 8px', background: 'var(--surface-bg)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '11px' }}
                      />
                      <button type="button" onClick={() => removeStoneRow(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                    </div>
                  ))}
                  {itemStones.length === 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No custom stones added. Weights will fallback to default total Stone Wt.</span>
                  )}
                </div>
              </div>
            )}
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
                  <tr style={{ background: 'var(--primary-gold)', color: '#ffffff', fontSize: '11px', fontWeight: '700' }}>
                    <th style={{ padding: '8px 10px', width: '40px' }}>Del</th>
                    <th style={{ padding: '8px 10px' }}>Item Name</th>
                    <th style={{ padding: '8px 10px' }}>Barcode</th>
                    {hasHUID && <th style={{ padding: '8px 10px' }}>HUID</th>}
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Gross Wt.</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Stone Wt.</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Net Wt.</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Purity %</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Wastage</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Pure Wt.</th>
                    {companyStones.map(stone => (
                      <React.Fragment key={stone.stoneName}>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>{stone.stoneName}</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>{stone.stoneName} Rate</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>{stone.stoneName} Cost</th>
                      </React.Fragment>
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
                      <td style={{ padding: '6px 10px', fontWeight: '500' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{item.barcode}</td>
                      {hasHUID && <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{item.huid || '—'}</td>}
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '600' }}>{item.grossWt.toFixed(3)}g</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-muted)' }}>{item.stoneWt.toFixed(3)}g</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '600' }}>{item.netWeight.toFixed(3)}g</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>{item.purity}%</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                        {((item.netWeight * (parseFloat(item.wastage) || 0)) / 100).toFixed(3)}g
                        {showWastageInNetWeight && (
                          <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                            ({item.wastage}%)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '600', color: '#0369a1' }}>{item.pureWeight.toFixed(3)}g</td>
                      {companyStones.map(stone => {
                        const matchedStone = (item.stones || []).find(
                          s => s.stoneName && s.stoneName.toLowerCase().trim() === stone.stoneName.toLowerCase().trim()
                        );
                        const weight = matchedStone ? (parseFloat(matchedStone.weight) || 0) : 0;
                        const rate = matchedStone ? (parseFloat(matchedStone.rate) || 0) : 0;
                        const cost = weight * rate;
                        return (
                          <React.Fragment key={stone.stoneName}>
                            <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                              {weight > 0 ? weight.toFixed(3) + 'g' : '0.000g'}
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-muted)' }}>
                              {rate > 0 ? `₹${rate.toLocaleString()}` : '-'}
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '600' }}>
                              {cost > 0 ? `₹${cost.toLocaleString()}` : '-'}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      {companyStones.length === 0 && (
                        <td style={{ padding: '6px 10px', textAlign: 'right' }}>{item.stoneWt.toFixed(3)}g</td>
                      )}
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '700', color: 'var(--success)' }}>₹{item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={10 + (companyStones.length > 0 ? companyStones.length * 3 : 1) + (hasHUID ? 1 : 0)} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
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
              display: 'flex',
              gap: '20px',
              alignItems: 'start',
              flexWrap: 'wrap'
            }}>
              {/* Left Side: Inputs & Simple Totals */}
              <div style={{
                flex: '1 1 650px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}>
                {/* Upper Grid for inputs/totals */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px'
                }}>
                {/* Column 1: Dates */}
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
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Estimation Date</label>
                    <input 
                      type="date" 
                      value={estimationDate}
                      onChange={e => setEstimationDate(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                    />
                  </div>
                </div>

                {/* Column 2: Customer & Total Items */}
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Customer (F2 to Search)</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input 
                        type="text" 
                        placeholder="Customer Name"
                        value={customerName}
                        onChange={e => {
                          setCustomerName(e.target.value);
                          setSelectedCustomer(null);
                        }}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                      />
                      <button type="button" onClick={() => setShowCustomerSearch(true)} style={{ padding: '6px', background: 'var(--primary-gold)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        <Search size={14} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Total Items</label>
                    <input 
                      type="text" 
                      readOnly
                      value={items.length}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--dark-bg)', color: 'var(--text-main)', fontWeight: '600' }}
                    />
                  </div>
                </div>

                {/* Column 3: Tag Weight & Description */}
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Total Tag Weight</label>
                    <input 
                      type="text" 
                      placeholder="Total Tag Weight"
                      value={totalTagWeight}
                      onChange={e => setTotalTagWeight(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Description</label>
                    <textarea 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={Math.max(1, description.split('\n').length)}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', resize: 'vertical', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)', minHeight: '32px' }}
                    />
                  </div>
                </div>

                {/* Column 4: Hallmark */}
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Hallmark Charges</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={hallmarkCharges}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || parseFloat(val) >= 0) {
                          setHallmarkCharges(val);
                        }
                      }}
                      onFocus={e => e.target.select()}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                    />
                  </div>
                </div>

                {/* Column 5: Gross Total */}
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
                </div>

                {/* Column 6: Stone Total */}
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
                </div>

                {/* Column 7: Net Total */}
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
                </div>

                {/* Column 8: Pure Total */}
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>Pure Total</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={items.length > 0 ? `${totalPure.toFixed(3)} g` : '0.000 g'}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px', backgroundColor: 'var(--dark-bg)', color: 'var(--text-main)', fontWeight: '600' }}
                    />
                  </div>
                </div>

                {/* Column 9: Cash Total */}
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
                </div>
              </div>

              {/* Options Panel (Checkboxes & Discount/Tax Inputs) */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'var(--hover-bg)',
                borderRadius: '6px',
                border: '1.5px solid var(--glass-border)',
                width: '100%'
              }}>
                {/* Discount Row */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="checkbox" 
                      id="make-discount-cb" 
                      checked={makeDiscount} 
                      onChange={e => setMakeDiscount(e.target.checked)} 
                    />
                    <label htmlFor="make-discount-cb" style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Make Discount</label>
                  </div>

                  {makeDiscount && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ width: '75px' }}>
                        <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px', whiteSpace: 'nowrap' }}>Discount (%)</label>
                        <input 
                          id="discount-percent-input"
                          key="discount-percent-input"
                          type="number" 
                          step="0.1"
                          placeholder="Discount %"
                          value={discountPercent}
                          onChange={e => handlePercentChange(e.target.value)}
                          onFocus={e => e.target.select()}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '11px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                        />
                      </div>
                      <div style={{ width: '110px' }}>
                        <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px', whiteSpace: 'nowrap' }}>Discount Amount (₹)</label>
                        <input 
                          id="discount-amount-input"
                          key="discount-amount-input"
                          type="number" 
                          placeholder="Discount Amt"
                          value={discountAmount}
                          onChange={e => handleAmountChange(e.target.value)}
                          onFocus={e => e.target.select()}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '11px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                        />
                      </div>
                      <div style={{ width: '130px' }}>
                        <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px', whiteSpace: 'nowrap' }}>Final Rounded Amount (₹)</label>
                        <input 
                          id="discount-final-input"
                          key="discount-final-input"
                          type="number" 
                          placeholder="Round Off to"
                          value={finalAmount}
                          onChange={e => handleFinalAmountChange(e.target.value)}
                          onFocus={e => e.target.select()}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '11px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Tax Row */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '20px', borderTop: '1px dashed var(--glass-border)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="checkbox" 
                      id="apply-tax-cb" 
                      checked={applyTax} 
                      onChange={e => setApplyTax(e.target.checked)} 
                    />
                    <label htmlFor="apply-tax-cb" style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Apply Tax / VAT</label>
                  </div>

                  {applyTax && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ width: '95px' }}>
                        <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px', whiteSpace: 'nowrap' }}>Tax on Gold (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          placeholder="Gold Tax %"
                          value={taxGoldPercent}
                          onChange={e => setTaxGoldPercent(e.target.value)}
                          onFocus={e => e.target.select()}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '11px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                        />
                      </div>
                      <div style={{ width: '105px' }}>
                        <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px', whiteSpace: 'nowrap' }}>Tax on Stones (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          placeholder="Stone Tax %"
                          value={taxStonePercent}
                          onChange={e => setTaxStonePercent(e.target.value)}
                          onFocus={e => e.target.select()}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '11px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                        />
                      </div>
                      <div style={{ width: '150px' }}>
                        <label style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '2px', whiteSpace: 'nowrap' }}>Taxable Making Chargers (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          placeholder="Taxable Making Chargers %"
                          value={vatPercent}
                          onChange={e => setVatPercent(e.target.value)}
                          onFocus={e => e.target.select()}
                          style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '11px', backgroundColor: 'var(--surface-bg)', color: 'var(--text-main)' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

              {/* Right Side: Detailed Bill Summary Card */}
              <div style={{
                flex: '0 0 340px',
                minWidth: '300px',
                backgroundColor: 'var(--hover-bg)',
                border: '1.5px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '16px',
                color: 'var(--text-main)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <h3 style={{ fontSize: '12px', fontWeight: '700', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px', color: 'var(--primary-gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Detailed Bill Summary
                </h3>
                
                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontWeight: '600' }}>
                      <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Particulars</th>
                      <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Qty / Weight</th>
                      <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px dashed var(--glass-border)' }}>
                      <td style={{ padding: '6px 0', fontWeight: '500' }}>Net Weight (Gold)</td>
                      <td style={{ padding: '6px 0', textAlign: 'right' }}>{totalNet.toFixed(3)} g</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600' }}>
                        ₹{items.reduce((sum, item) => sum + Math.round(item.netWeight * 6200), 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px dashed var(--glass-border)' }}>
                      <td style={{ padding: '6px 0', fontWeight: '500' }}>Stone Weight</td>
                      <td style={{ padding: '6px 0', textAlign: 'right' }}>{totalStone.toFixed(3)} g</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600' }}>
                        ₹{items.reduce((sum, item) => sum + (item.stones || []).reduce((sSum, s) => sSum + (parseFloat(s.weight) || 0) * (parseFloat(s.rate) || 0), 0), 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px dashed var(--glass-border)' }}>
                      <td style={{ padding: '6px 0', fontWeight: '500' }}>Wastage</td>
                      <td style={{ padding: '6px 0', textAlign: 'right' }}>
                        {items.reduce((sum, item) => sum + (item.netWeight * (parseFloat(item.wastage) || 0) / 100), 0).toFixed(3)} g
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600' }}>
                        ₹{items.reduce((sum, item) => sum + Math.round((item.netWeight * (parseFloat(item.wastage) || 0) / 100) * 6200), 0).toLocaleString()}
                      </td>
                    </tr>
                    {(parseFloat(hallmarkCharges) || 0) > 0 && (
                      <tr style={{ borderBottom: '1px dashed var(--glass-border)' }}>
                        <td style={{ padding: '6px 0', fontWeight: '500' }}>Hallmark Charges</td>
                        <td style={{ padding: '6px 0', textAlign: 'right' }}>{items.length} items</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600' }}>
                          ₹{(parseFloat(hallmarkCharges) || 0).toLocaleString()}
                        </td>
                      </tr>
                    )}
                    {applyTax && (
                      <>
                        <tr style={{ borderBottom: '1px dashed var(--glass-border)' }}>
                          <td style={{ padding: '6px 0', fontWeight: '500' }}>Tax on Gold ({taxGoldPercent}%)</td>
                          <td style={{ padding: '6px 0', textAlign: 'right' }}></td>
                          <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600' }}>
                            ₹{taxGoldValue.toLocaleString()}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px dashed var(--glass-border)' }}>
                          <td style={{ padding: '6px 0', fontWeight: '500' }}>Tax on Stones ({taxStonePercent}%)</td>
                          <td style={{ padding: '6px 0', textAlign: 'right' }}></td>
                          <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600' }}>
                            ₹{taxStoneValue.toLocaleString()}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px dashed var(--glass-border)' }}>
                          <td style={{ padding: '6px 0', fontWeight: '500' }}>Taxable Making Chargers ({vatPercent}%)</td>
                          <td style={{ padding: '6px 0', textAlign: 'right' }}></td>
                          <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600' }}>
                            ₹{vatValue.toLocaleString()}
                          </td>
                        </tr>
                      </>
                    )}
                    {makeDiscount && (
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--danger)' }}>
                        <td style={{ padding: '6px 0', fontWeight: '500' }}>Discount Applied</td>
                        <td style={{ padding: '6px 0', textAlign: 'right' }}>
                          {subtotal > 0 ? ((finalDiscount / subtotal) * 100).toFixed(1) + '%' : '0.0%'}
                        </td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600' }}>
                          - ₹{finalDiscount.toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr style={{ borderTop: '1.5px solid var(--glass-border)', fontWeight: '800', fontSize: '12px', color: 'var(--success)' }}>
                      <td style={{ paddingTop: '8px' }}>Total Amount</td>
                      <td style={{ paddingTop: '8px' }}></td>
                      <td style={{ paddingTop: '8px', textAlign: 'right', fontSize: '13px' }}>
                        ₹{Math.round(balanceCash).toLocaleString()}.00
                      </td>
                    </tr>
                  </tbody>
                </table>
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
                const nextSeq = invoiceSeq + 1;
                setInvoiceSeq(nextSeq);
                localStorage.setItem('nextInvoiceSeq', nextSeq.toString());
                
                setItems([]);
                setBarcode('');
                setGrossWt('');
                setStoneWt('0');
                setNetWt('');
                setCustomerName('');
                setCustomerPhone('');
                setSelectedCustomer(null);
                setDescription('');
                setTotalTagWeight('');
              }} 
              style={{ 
                padding: '10px 24px', 
                background: 'var(--success)', 
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
                background: 'var(--danger)', 
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
                  background: 'var(--primary-gold)', 
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
                    { key: 'bill1', label: '📄 Bill Format 1 (Basic)' },
                    { key: 'bill2', label: '🧾 Bill Format 2 (With Stone Cost)' },
                    { key: 'bill3', label: '📋 Bill Format 3 (With Stone Details)' },
                    { key: 'bill4', label: '📋 Bill Format 4 (Live Settings Layout)' },
                    { key: 'invoice', label: '📄 Tax Invoice' },
                    { key: 'estimation', label: '🧾 Estimation Bill' },
                    { key: 'detailed', label: '📋 Detailed Bill' }
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

        {/* Customer Search Modal */}
        {showCustomerSearch && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'var(--surface-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid var(--glass-border)' }}>
                <h3 style={{ margin: 0, color: 'var(--primary-gold)', fontSize: '16px', fontWeight: '700' }}>👥 Search Customers</h3>
                <button onClick={() => setShowCustomerSearch(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>
              <div style={{ padding: '20px' }}>
                <input 
                  type="text" 
                  placeholder="Search by name or phone..." 
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--dark-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '13px', marginBottom: '15px' }}
                />
                <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customers
                    .filter(c => 
                      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
                      (c.phone && c.phone.includes(customerSearchQuery)) ||
                      (c.contact && c.contact.includes(customerSearchQuery))
                    )
                    .map(c => (
                    <div 
                      key={c._id || c.id} 
                      onClick={() => {
                        setCustomerName(c.name);
                        setCustomerPhone(c.contact || c.phone || '');
                        setSelectedCustomer(c);
                        setShowCustomerSearch(false);
                      }}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--dark-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontWeight: '600' }}>{c.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{c.contact || c.phone}</span>
                    </div>
                  ))}
                  {customers.length === 0 && (
                    <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>No customers found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Search Modal */}
        {showProductSearch && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'var(--surface-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '700px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid var(--glass-border)' }}>
                <h3 style={{ margin: 0, color: 'var(--primary-gold)', fontSize: '16px', fontWeight: '700' }}>📦 Completed Stock / Products</h3>
                <button onClick={() => setShowProductSearch(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>
              <div style={{ padding: '20px' }}>
                <input 
                  type="text" 
                  placeholder="Search products by design, ID or category..." 
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--dark-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-main)', fontSize: '13px', marginBottom: '15px' }}
                />
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: 'var(--dark-bg)', borderBottom: '1.5px solid var(--glass-border)' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Product ID</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Design Name</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Category</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Gross Wt.</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Stone Wt.</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Net Wt.</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Select</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableProducts
                        .filter(p => !items.some(item => item.barcode === p.productId))
                        .filter(p => 
                          (p.productId && p.productId.toLowerCase().includes(productSearchQuery.toLowerCase())) ||
                          (p.designName && p.designName.toLowerCase().includes(productSearchQuery.toLowerCase())) ||
                          (p.category && p.category.toLowerCase().includes(productSearchQuery.toLowerCase()))
                        )
                        .map(p => {
                          const stoneWtFromStones = (p.stones || []).reduce((acc, s) => acc + (parseFloat(s.stoneWeight) || 0), 0);
                          const totalStWt = p.totalStoneWeight || stoneWtFromStones || 0;
                          return (
                        <tr key={p._id || p.productId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '8px', fontWeight: '600' }}>{p.productId}</td>
                          <td style={{ padding: '8px' }}>{p.designName}</td>
                          <td style={{ padding: '8px' }}>{p.category}</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>{(p.grossWeight || 0).toFixed(3)}g</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: totalStWt > 0 ? 'var(--primary-gold)' : 'var(--text-muted)' }}>{totalStWt.toFixed(3)}g</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>{(p.netWeight || 0).toFixed(3)}g</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button 
                              onClick={() => {
                                setBarcode(p.productId);
                                setGrossWt(p.grossWeight || p.netWeight || '');
                                setNetWt(p.netWeight || '');
                                setCategory(p.category || 'Gold');
                                setStoneWt(totalStWt.toString());
                                setHuid(p.huid || '');
                                // Populate individual stone rows if product has stones
                                if (p.stones && p.stones.length > 0) {
                                  setItemStones(p.stones.map(s => {
                                    const matchedStone = companyStones.find(cs => cs.stoneName.toLowerCase().trim() === s.stoneName.toLowerCase().trim());
                                    return {
                                      stoneName: s.stoneName || '',
                                      weight: s.stoneWeight || '',
                                      rate: matchedStone ? matchedStone.rate || '' : ''
                                    };
                                  }));
                                  setShowStoneDetail(true);
                                } else {
                                  setItemStones([]);
                                }
                                setShowProductSearch(false);
                              }}
                              style={{ background: '#0059a8', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
                            >
                              Choose
                            </button>
                          </td>
                        </tr>
                          );
                        })
                      }
                      {availableProducts.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-muted)' }}>No completed products in stock.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shortcuts Help Modal */}
        {showShortcutsHelp && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'var(--surface-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '450px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid var(--glass-border)' }}>
                <h3 style={{ margin: 0, color: 'var(--primary-gold)', fontSize: '16px', fontWeight: '700' }}>⌨ Keyboard Shortcuts</h3>
                <button onClick={() => setShowShortcutsHelp(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <kbd style={{ background: 'var(--dark-bg)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--glass-border)', fontWeight: 'bold' }}>F1</kbd>
                  <span>Show Shortcuts Help</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <kbd style={{ background: 'var(--dark-bg)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--glass-border)', fontWeight: 'bold' }}>F2</kbd>
                  <span>Search Customers Modal</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <kbd style={{ background: 'var(--dark-bg)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--glass-border)', fontWeight: 'bold' }}>F4</kbd>
                  <span>Search Products / Stock Modal</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <kbd style={{ background: 'var(--dark-bg)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--glass-border)', fontWeight: 'bold' }}>F9</kbd>
                  <span>Edit Stone Rates Modal</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <kbd style={{ background: 'var(--dark-bg)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--glass-border)', fontWeight: 'bold' }}>F8</kbd>
                  <span>Trigger Print Options</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stone Rates Modal */}
        {showStoneRatesModal && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'var(--surface-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '450px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid var(--glass-border)' }}>
                <h3 style={{ margin: 0, color: 'var(--primary-gold)', fontSize: '16px', fontWeight: '700' }}>💎 Configure Stone Rates</h3>
                <button onClick={() => setShowStoneRatesModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {companyStones.map((stone, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{stone.stoneName} ({stone.stoneType})</span>
                      <input 
                        type="number"
                        value={stone.rate || ''}
                        onChange={(e) => {
                          const updated = [...companyStones];
                          updated[idx].rate = parseFloat(e.target.value) || 0;
                          setCompanyStones(updated);
                        }}
                        style={{ width: '120px', padding: '6px 8px', background: 'var(--dark-bg)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--text-main)', fontSize: '12px', textAlign: 'right' }}
                      />
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setShowStoneRatesModal(false)}
                  style={{ marginTop: '10px', padding: '10px', background: '#0059a8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        )}

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
            
            const isWorker = activePrintFormat === 'worker';
            const isTag = activePrintFormat === 'tag';
            const isJobCard = activePrintFormat === 'jobcard';
            const isInvoice = activePrintFormat === 'invoice';
            const isDelivery = activePrintFormat === 'delivery';
            const isOrder = activePrintFormat === 'order';
            const isEstimation = activePrintFormat === 'estimation';
            const isDetailed = activePrintFormat === 'detailed';
            const isBill1 = activePrintFormat === 'bill1';
            const isBill2 = activePrintFormat === 'bill2';
            const isBill3 = activePrintFormat === 'bill3';
            const isBill4 = activePrintFormat === 'bill4';

            const theme = (isWorker || isJobCard) ? workerTheme : customerTheme;

            // Document Title
            let docTitle = "ESTIMATION BILL";
            if (isInvoice) docTitle = "TAX INVOICE";
            if (isDetailed) docTitle = "DETAILED BILL";
            if (isWorker) docTitle = "WORKER RECEIPT";
            if (isTag) docTitle = "PRODUCT TAG";
            if (isDelivery) docTitle = "DELIVERY RECEIPT";
            if (isJobCard) docTitle = "JOB CARD";
            if (isOrder) docTitle = "ORDER RECEIPT";
            if (isBill1) docTitle = "INVOICE";
            if (isBill2) docTitle = "INVOICE";
            if (isBill3) docTitle = "INVOICE";
            if (isBill4) docTitle = "INVOICE";

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

            const isA5 = (printSettings.defaultPageSize === 'a5' && activePrintFormat !== 'bill3') || activePrintFormat === 'worker' || activePrintFormat === 'jobcard';
            const containerMinHeight = isA5 ? '148mm' : '297mm';
            return (
              <div key={copyIdx} style={{
                boxSizing: 'border-box',
                fontFamily: theme.fontFamily,
                backgroundColor: theme.bgColor,
                padding: '20px',
                minHeight: containerMinHeight,
                position: 'relative',
                border: copyIdx > 0 ? '1px dashed #cbd5e1' : 'none',
                marginTop: copyIdx > 0 ? '40px' : '0',
                pageBreakAfter: isLast ? 'auto' : 'always'
              }}>
                {/* Logo Watermark overlay */}
                {company?.logo ? (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '300px',
                    height: '300px',
                    opacity: 0.06,
                    backgroundImage: `url(${company.logo})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    pointerEvents: 'none',
                    zIndex: 0
                  }} />
                ) : (
                  ((isEstimation && printSettings.watermark !== 'none') || (isInvoice && printSettings.watermark === 'none' ? false : printSettings.watermark !== 'none')) && (
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
                  )
                )}

                {/* Copy title Badge */}
                {!(isBill1 || isBill2 || isBill3) && (
                  <div style={{ position: 'absolute', top: '10px', right: '20px', fontSize: '9px', fontWeight: 'bold', color: '#64748b', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '4px' }}>
                    {copyTitle}
                  </div>
                )}

                {/* Invoice Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Logo */}
                    <div style={{ width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'transparent' }}>
                      {company?.logo ? (
                        <img src={company.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontWeight: 'bold', fontSize: '36px', color: '#d97706' }}>
                          {(company?.name || 'M')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0', letterSpacing: '0.5px', fontFamily: 'Inter, sans-serif' }}>
                        {company?.name ? company.name.toUpperCase() : 'MAHA LAKSHMI JEWELER\'S'}
                      </h1>
                      <p style={{ fontSize: '11px', fontWeight: '600', color: '#d97706', margin: '4px 0 0 0', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        {company?.address || 'RAJENDHRA NACAR, NELLORE'}
                      </p>
                      <div style={{ fontSize: '9px', color: '#475569', marginTop: '4px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {company?.phone && <div>PH: {company.phone}</div>}
                        {company?.email && <div>EMAIL: {company.email}</div>}
                        {company?.taxId && <div style={{ fontWeight: 'bold' }}>GSTIN: {company.taxId.toUpperCase()}</div>}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Header Section */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', fontSize: '10px', minWidth: '150px' }}>
                      <div>DATE: {new Date(billDate).toLocaleDateString('en-GB')}</div>
                      {/* Barcode representation */}
                      <div style={{ display: 'flex', gap: '1.5px', marginTop: '2px', height: '14px', alignItems: 'center' }}>
                        {[1,3,1,2,4,1,3,2,1,4,2,1,3,1,2].map((w, idx) => (
                          <div key={idx} style={{ width: `${w}px`, height: '100%', backgroundColor: '#000' }}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', color: '#0f172a' }}>
                  {docTitle}
                </div>

                {/* Horizontal Gold Line */}
                <div style={{ height: '2.5px', backgroundColor: '#d97706', marginBottom: '10px' }}></div>

                {/* Customer Details rounded light grey box */}
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', marginBottom: '2px' }}>CUSTOMER DETAILS:</div>
                    
                    <div style={{ display: 'flex', fontSize: '11px', lineHeight: '16px' }}>
                      <span style={{ fontWeight: '700', color: '#0f172a', width: '70px', display: 'inline-block', textAlign: 'right', marginRight: '8px' }}>NAME:</span>
                      <span style={{ fontWeight: 'normal', color: '#334155', flex: 1 }}>{customerName || 'Walk-in Customer'}</span>
                    </div>

                    {customerPhone && (
                      <div style={{ display: 'flex', fontSize: '11px', lineHeight: '16px' }}>
                        <span style={{ fontWeight: '700', color: '#0f172a', width: '70px', display: 'inline-block', textAlign: 'right', marginRight: '8px' }}>PHONE:</span>
                        <span style={{ fontWeight: 'normal', color: '#334155', flex: 1 }}>{customerPhone}</span>
                      </div>
                    )}
                    
                    {selectedCustomer && (
                      <>
                        {selectedCustomer.address && (
                          <div style={{ display: 'flex', fontSize: '11px', lineHeight: '16px' }}>
                            <span style={{ fontWeight: '700', color: '#0f172a', width: '70px', display: 'inline-block', textAlign: 'right', marginRight: '8px' }}>ADDRESS:</span>
                            <span style={{ fontWeight: 'normal', color: '#334155', flex: 1 }}>{selectedCustomer.address}</span>
                          </div>
                        )}
                        {selectedCustomer.email && (
                          <div style={{ display: 'flex', fontSize: '11px', lineHeight: '16px' }}>
                            <span style={{ fontWeight: '700', color: '#0f172a', width: '70px', display: 'inline-block', textAlign: 'right', marginRight: '8px' }}>EMAIL:</span>
                            <span style={{ fontWeight: 'normal', color: '#334155', flex: 1 }}>{selectedCustomer.email}</span>
                          </div>
                        )}
                        {selectedCustomer.gstNumber && (
                          <div style={{ display: 'flex', fontSize: '11px', lineHeight: '16px' }}>
                            <span style={{ fontWeight: '700', color: '#0f172a', width: '70px', display: 'inline-block', textAlign: 'right', marginRight: '8px' }}>GSTIN:</span>
                            <span style={{ fontWeight: 'normal', color: '#334155', flex: 1 }}>{selectedCustomer.gstNumber.toUpperCase()}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Middle separator inside box */}
                  <div style={{ width: '1px', height: '45px', backgroundColor: '#cbd5e1', margin: '0 20px' }}></div>
                  
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#475569', marginRight: '5px' }}>INVOICE NO.:</span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{String(invoiceSeq).padStart(2, '0')}</span>
                  </div>
                </div>

                {/* Items Grid Table */}
                {(isBill1 || isBill2 || isBill3) ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isBill3 ? '7px' : '9px', marginBottom: '15px' }}>
                    <thead>
                      <tr style={{ backgroundColor: theme.headingColor, color: '#ffffff', textAlign: 'left', fontWeight: 'bold' }}>
                        <th style={{ padding: isBill3 ? '3px 2px' : '6px', border: '1px solid #334155' }}>S.No</th>
                        <th style={{ padding: isBill3 ? '3px 2px' : '6px', border: '1px solid #334155' }}>Product Code</th>
                        {hasHUID && <th style={{ padding: isBill3 ? '3px 2px' : '6px', border: '1px solid #334155' }}>HUID</th>}
                        <th style={{ padding: isBill3 ? '3px 2px' : '6px', border: '1px solid #334155' }}>Description</th>
                        <th style={{ padding: isBill3 ? '3px 2px' : '6px', border: '1px solid #334155', textAlign: 'right' }}>Gross Weight</th>
                        <th style={{ padding: isBill3 ? '3px 2px' : '6px', border: '1px solid #334155', textAlign: 'right' }}>Net Weight</th>
                        {isBill3 ? (
                          <>
                            <th style={{ padding: '3px 2px', border: '1px solid #334155', textAlign: 'right' }}>Ruby</th>
                            <th style={{ padding: '3px 2px', border: '1px solid #334155', textAlign: 'right' }}>Ruby Rate</th>
                            <th style={{ padding: '3px 2px', border: '1px solid #334155', textAlign: 'right' }}>Ruby Cost</th>
                            <th style={{ padding: '3px 2px', border: '1px solid #334155', textAlign: 'right' }}>Emrald</th>
                            <th style={{ padding: '3px 2px', border: '1px solid #334155', textAlign: 'right' }}>Emrald Rate</th>
                            <th style={{ padding: '3px 2px', border: '1px solid #334155', textAlign: 'right' }}>Emrald Cost</th>
                            <th style={{ padding: '3px 2px', border: '1px solid #334155', textAlign: 'right' }}>AD</th>
                            <th style={{ padding: '3px 2px', border: '1px solid #334155', textAlign: 'right' }}>AD Rate</th>
                            <th style={{ padding: '3px 2px', border: '1px solid #334155', textAlign: 'right' }}>AD Cost</th>
                            <th style={{ padding: '3px 2px', border: '1px solid #334155', textAlign: 'right' }}>Moti</th>
                            <th style={{ padding: '3px 2px', border: '1px solid #334155', textAlign: 'right' }}>Moti Rate</th>
                            <th style={{ padding: '3px 2px', border: '1px solid #334155', textAlign: 'right' }}>Moti Cost</th>
                          </>
                        ) : (
                          <th style={{ padding: '6px', border: '1px solid #334155', textAlign: 'right' }}>Stone Weight</th>
                        )}
                        {isBill2 && <th style={{ padding: isBill3 ? '3px 2px' : '6px', border: '1px solid #334155', textAlign: 'right' }}>Stone Cost</th>}
                        <th style={{ padding: isBill3 ? '3px 2px' : '6px', border: '1px solid #334155', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const stoneCost = (item.stones || []).reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseFloat(s.rate) || 0), 0);
                        
                        // Extract stone parameters
                        const getStoneData = (stonesList, key) => {
                          if (!stonesList || !Array.isArray(stonesList)) return { weight: 0, rate: 0, cost: 0 };
                          const found = stonesList.find(s => {
                            const name = (s.stoneName || '').toLowerCase().trim();
                            if (key === 'emrald') {
                              return name === 'emrald' || name === 'emerald';
                            }
                            return name === key;
                          });
                          if (!found) return { weight: 0, rate: 0, cost: 0 };
                          const weight = parseFloat(found.weight) || 0;
                          const rate = parseFloat(found.rate) || 0;
                          return { weight, rate, cost: weight * rate };
                        };

                        const ruby = getStoneData(item.stones, 'ruby');
                        const emrald = getStoneData(item.stones, 'emrald');
                        const ad = getStoneData(item.stones, 'ad');
                        const moti = getStoneData(item.stones, 'moti');

                        const cellPadding = isBill3 ? '3px 2px' : '6px';

                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                            <td style={{ padding: cellPadding, border: '1px solid #cbd5e1', textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ padding: cellPadding, border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{item.barcode}</td>
                            {hasHUID && <td style={{ padding: cellPadding, border: '1px solid #cbd5e1' }}>{item.huid || '—'}</td>}
                            <td style={{ padding: cellPadding, border: '1px solid #cbd5e1' }}>{item.name}</td>
                            <td style={{ padding: cellPadding, border: '1px solid #cbd5e1', textAlign: 'right' }}>{item.grossWt.toFixed(3)}g</td>
                            <td style={{ padding: cellPadding, border: '1px solid #cbd5e1', textAlign: 'right' }}>{item.netWeight.toFixed(3)}g</td>
                            {isBill3 ? (
                              <>
                                {/* Ruby */}
                                <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{ruby.weight.toFixed(3)}g</td>
                                <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#475569' }}>₹{ruby.rate.toLocaleString()}</td>
                                <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold' }}>₹{ruby.cost.toLocaleString()}</td>
                                
                                {/* Emrald */}
                                <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{emrald.weight.toFixed(3)}g</td>
                                <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#475569' }}>₹{emrald.rate.toLocaleString()}</td>
                                <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold' }}>₹{emrald.cost.toLocaleString()}</td>
                                
                                {/* AD */}
                                <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{ad.weight.toFixed(3)}g</td>
                                <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#475569' }}>₹{ad.rate.toLocaleString()}</td>
                                <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold' }}>₹{ad.cost.toLocaleString()}</td>
                                
                                {/* Moti */}
                                <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{moti.weight.toFixed(3)}g</td>
                                <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#475569' }}>₹{moti.rate.toLocaleString()}</td>
                                <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold' }}>₹{moti.cost.toLocaleString()}</td>
                              </>
                            ) : (
                              <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                                {item.stoneWt.toFixed(3)}g
                              </td>
                            )}
                            {isBill2 && <td style={{ padding: cellPadding, border: '1px solid #cbd5e1', textAlign: 'right' }}>₹{stoneCost.toLocaleString()}.00</td>}
                            <td style={{ padding: cellPadding, border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold' }}>₹{item.amount.toLocaleString()}.00</td>
                          </tr>
                        );
                      })}
                      {/* Total Row */}
                      <tr style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                        <td colSpan={hasHUID ? 4 : 3} style={{ padding: isBill3 ? '3px 2px' : '6px', border: '1px solid #cbd5e1' }}>TOTAL</td>
                        <td style={{ padding: isBill3 ? '3px 2px' : '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{totalGross.toFixed(3)}g</td>
                        <td style={{ padding: isBill3 ? '3px 2px' : '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{totalNet.toFixed(3)}g</td>
                        {isBill3 ? (
                          <>
                            {/* Ruby Totals */}
                            <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                              {items.reduce((sum, item) => {
                                const found = (item.stones || []).find(s => (s.stoneName || '').toLowerCase().trim() === 'ruby');
                                return sum + (found ? (parseFloat(found.weight) || 0) : 0);
                              }, 0).toFixed(3)}g
                            </td>
                            <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1' }}></td>
                            <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                              ₹{items.reduce((sum, item) => {
                                const found = (item.stones || []).find(s => (s.stoneName || '').toLowerCase().trim() === 'ruby');
                                return sum + (found ? (parseFloat(found.weight) || 0) * (parseFloat(found.rate) || 0) : 0);
                              }, 0).toLocaleString()}
                            </td>

                            {/* Emrald Totals */}
                            <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                              {items.reduce((sum, item) => {
                                const found = (item.stones || []).find(s => {
                                  const name = (s.stoneName || '').toLowerCase().trim();
                                  return name === 'emrald' || name === 'emerald';
                                });
                                return sum + (found ? (parseFloat(found.weight) || 0) : 0);
                              }, 0).toFixed(3)}g
                            </td>
                            <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1' }}></td>
                            <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                              ₹{items.reduce((sum, item) => {
                                const found = (item.stones || []).find(s => {
                                  const name = (s.stoneName || '').toLowerCase().trim();
                                  return name === 'emrald' || name === 'emerald';
                                });
                                return sum + (found ? (parseFloat(found.weight) || 0) * (parseFloat(found.rate) || 0) : 0);
                              }, 0).toLocaleString()}
                            </td>

                            {/* AD Totals */}
                            <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                              {items.reduce((sum, item) => {
                                const found = (item.stones || []).find(s => (s.stoneName || '').toLowerCase().trim() === 'ad');
                                return sum + (found ? (parseFloat(found.weight) || 0) : 0);
                              }, 0).toFixed(3)}g
                            </td>
                            <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1' }}></td>
                            <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                              ₹{items.reduce((sum, item) => {
                                const found = (item.stones || []).find(s => (s.stoneName || '').toLowerCase().trim() === 'ad');
                                return sum + (found ? (parseFloat(found.weight) || 0) * (parseFloat(found.rate) || 0) : 0);
                              }, 0).toLocaleString()}
                            </td>

                            {/* Moti Totals */}
                            <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                              {items.reduce((sum, item) => {
                                const found = (item.stones || []).find(s => (s.stoneName || '').toLowerCase().trim() === 'moti');
                                return sum + (found ? (parseFloat(found.weight) || 0) : 0);
                              }, 0).toFixed(3)}g
                            </td>
                            <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1' }}></td>
                            <td style={{ padding: '3px 2px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                              ₹{items.reduce((sum, item) => {
                                const found = (item.stones || []).find(s => (s.stoneName || '').toLowerCase().trim() === 'moti');
                                return sum + (found ? (parseFloat(found.weight) || 0) * (parseFloat(found.rate) || 0) : 0);
                              }, 0).toLocaleString()}
                            </td>
                          </>
                        ) : (
                          <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{totalStone.toFixed(3)}g</td>
                        )}
                        {isBill2 && (
                          <td style={{ padding: isBill3 ? '3px 2px' : '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                            ₹{items.reduce((sum, item) => sum + (item.stones || []).reduce((sSum, s) => sSum + (parseFloat(s.weight) || 0) * (parseFloat(s.rate) || 0), 0), 0).toLocaleString()}.00
                          </td>
                        )}
                        <td style={{ padding: isBill3 ? '3px 2px' : '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>₹{cashTotal.toLocaleString()}.00</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
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
                        {printSettings.showItemStoneWeight && <th style={{ padding: '6px', border: '1px solid #334155', textAlign: 'right' }}>STONE WT</th>}
                        {printSettings.showItemNetWeight && <th style={{ padding: '6px', border: '1px solid #334155', textAlign: 'right' }}>NET WT</th>}
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
                            {item.stones && item.stones.length > 0 ? (
                              <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'normal', fontStyle: 'italic', marginTop: '2px' }}>
                                Stone Details: {item.stones.map(s => `${s.stoneName} (${s.weight}g @ ₹${s.rate})`).join(', ')}
                              </div>
                            ) : (
                              printSettings.showItemStoneDetails && printSettings.groupStoneDetails && (
                                <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 'normal', fontStyle: 'italic', marginTop: '2px' }}>
                                  Stone Details: {companyStones.map((stone, sidx) => `${stone.stoneName} ${(item.stoneWt > 0 ? (item.stoneWt / companyStones.length) : 0).toFixed(2)}g`).join(', ')}
                                </div>
                              )
                            )}
                          </td>
                          {printSettings.showItemBarcode && <td style={{ padding: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{item.barcode}</td>}
                          {printSettings.showItemHUID && <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}>{item.huid || '—'}</td>}
                          <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{item.grossWt.toFixed(3)}g</td>
                          {printSettings.showItemStoneDetails && !printSettings.groupStoneDetails && companyStones.map(stone => {
                            const matchedStoneWeight = (item.stones || [])
                              .filter(s => s.stoneName && s.stoneName.toLowerCase().trim() === stone.stoneName.toLowerCase().trim())
                              .reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0);
                            return (
                              <td key={stone.stoneName} style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                                {matchedStoneWeight > 0 ? matchedStoneWeight.toFixed(3) : '0.000'}
                              </td>
                            );
                          })}
                          {printSettings.showItemStoneWeight && <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{(parseFloat(item.stoneWt) || 0).toFixed(3)}g</td>}
                          {printSettings.showItemNetWeight && <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold' }}>{item.netWeight.toFixed(3)}g</td>}
                          <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{item.purity}%</td>
                          <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold' }}>₹{item.amount.toLocaleString()}.00</td>
                        </tr>
                      ))}
                      {/* Total Row */}
                      <tr style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                        <td colSpan={printSettings.showItemBarcode ? (printSettings.showItemHUID ? 4 : 3) : (printSettings.showItemHUID ? 3 : 2)} style={{ padding: '6px', border: '1px solid #cbd5e1' }}>TOTAL</td>
                        <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{totalGross.toFixed(3)}g</td>
                        {printSettings.showItemStoneDetails && !printSettings.groupStoneDetails && companyStones.map(stone => {
                          const totalForStone = items.reduce((acc, item) => {
                            const matchedStoneWeight = (item.stones || [])
                              .filter(s => s.stoneName && s.stoneName.toLowerCase().trim() === stone.stoneName.toLowerCase().trim())
                              .reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0);
                            return acc + matchedStoneWeight;
                          }, 0);
                          return (
                            <td key={stone.stoneName} style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{totalForStone.toFixed(3)}</td>
                          );
                        })}
                        {printSettings.showItemStoneWeight && <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{totalStone.toFixed(3)}g</td>}
                        {printSettings.showItemNetWeight && <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{totalNet.toFixed(3)}g</td>}
                        <td style={{ padding: '6px', border: '1px solid #cbd5e1' }}></td>
                        <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}>₹{cashTotal.toLocaleString()}.00</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {/* Estimation / Invoice Summaries */}
                <div style={{ display: 'grid', gridTemplateColumns: (isBill1 || isBill2 || isBill3) ? '1fr 1fr' : '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  
                  {/* Weight Summary placeholder to preserve grid position */}
                  <div></div>

                  {/* Rate & Value Summary */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px' }}>
                    <h4 style={{ margin: '0 0 8px 0', borderBottom: `1.5px solid ${theme.borderColor}`, paddingBottom: '4px', color: '#1e293b', fontSize: '11px', fontWeight: '700' }}>BILL SUMMARY</h4>
                    <table style={{ width: '100%', fontSize: '9px' }}>
                      <tbody>
                        {printSettings.showAmountGoldRate && <tr><td style={{ padding: '2px 0', color: '#475569' }}>Gold Rate (₹/g)</td><td style={{ padding: '2px 0', textAlign: 'right' }}>: {goldRate.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>}
                        {printSettings.showAmountGoldRate && <tr><td style={{ padding: '2px 0', color: '#475569' }}>Gold Value</td><td style={{ padding: '2px 0', textAlign: 'right' }}>: {totalBaseGoldCost.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>}
                        {printSettings.showAmountStoneCharges && <tr><td style={{ padding: '2px 0', color: '#475569' }}>Stone Charges</td><td style={{ padding: '2px 0', textAlign: 'right' }}>: {totalStoneCost.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>}
                        {printSettings.showAmountMakingCharges && <tr><td style={{ padding: '2px 0', color: '#475569' }}>Making Charges</td><td style={{ padding: '2px 0', textAlign: 'right' }}>: {totalWastageCost.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>}
                        
                        {/* Dynamic Discount row based on user selection */}
                        {(makeDiscount || finalDiscount > 0) && (
                          <tr>
                            <td style={{ padding: '2px 0', color: '#475569' }}>Discount</td>
                            <td style={{ padding: '2px 0', textAlign: 'right', color: 'red' }}>: - ₹{finalDiscount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                          </tr>
                        )}
                        
                        {/* Dynamic Tax / VAT rows based on user selection */}
                        {applyTax ? (
                          <>
                            {(parseFloat(taxGoldPercent) || 0) > 0 && (
                              <tr>
                                <td style={{ padding: '2px 0', color: '#475569' }}>Tax on Gold ({taxGoldPercent}%)</td>
                                <td style={{ padding: '2px 0', textAlign: 'right' }}>: ₹{taxGoldValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                              </tr>
                            )}
                            {(parseFloat(taxStonePercent) || 0) > 0 && (
                              <tr>
                                <td style={{ padding: '2px 0', color: '#475569' }}>Tax on Stones ({taxStonePercent}%)</td>
                                <td style={{ padding: '2px 0', textAlign: 'right' }}>: ₹{taxStoneValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                              </tr>
                            )}
                            {(parseFloat(vatPercent) || 0) > 0 && (
                              <tr>
                                <td style={{ padding: '2px 0', color: '#475569' }}>VAT on Making ({vatPercent}%)</td>
                                <td style={{ padding: '2px 0', textAlign: 'right' }}>: ₹{vatValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                              </tr>
                            )}
                          </>
                        ) : (
                          printSettings.showAmountGST && isInvoice && <tr><td style={{ padding: '2px 0', color: '#475569' }}>GST (3%)</td><td style={{ padding: '2px 0', textAlign: 'right' }}>: {(balanceCash * 0.03).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
                        )}

                        <tr style={{ borderTop: '1px solid #cbd5e1', fontWeight: 'bold' }}><td style={{ padding: '4px 0', color: '#000' }}>Sub Total</td><td style={{ padding: '4px 0', textAlign: 'right' }}>: {(balanceCash * (!applyTax && isInvoice ? 1.03 : 1)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Estimation Total Badge */}
                  {!(isBill1 || isBill2 || isBill3) && (
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
                  )}

                </div>

                {/* Terms & Conditions & Signatory */}
                {!(isBill1 || isBill2 || isBill3) && (
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
                )}

                {/* Footer Badges bar */}
                {!(isBill1 || isBill2 || isBill3) && (
                  <div style={{ borderTop: '2.5px solid #cbd5e1', borderBottom: '2.5px solid #cbd5e1', padding: '6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', fontWeight: 'bold', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: theme.accentColor }}>
                      💎 THANK YOU FOR CHOOSING US!
                    </div>
                    <div style={{ width: '1px', height: '10px', backgroundColor: '#cbd5e1' }} />
                    <div>Purity You Can Trust, Elegance You Deserve.</div>
                    <div style={{ width: '1px', height: '10px', backgroundColor: '#cbd5e1' }} />
                    <div>🎗 916 BIS Hallmarked</div>
                  </div>
                )}
              </div>
          );
        });
      })()}

      </div>

    </div>
  );
};

export default Billing;
