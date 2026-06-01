import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Plus, Trash2, Printer, Check, X, FileText, Edit, Barcode } from 'lucide-react';

const WorkerReceipt = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const parseStones = (description) => {
        const stoneMatch = (description || '').match(/^\(([^)]+)\)/);
        if (!stoneMatch) return [];
        return stoneMatch[1].split(',').map(pair => {
            const parts = pair.split(':');
            return { name: parts[0]?.trim() || '', weight: parts[1]?.trim() || '' };
        });
    };
    
    // Dropdown Data
    const [workers, setWorkers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [companyStones, setCompanyStones] = useState([]);
    const [showStoneModal, setShowStoneModal] = useState(false);
    const [modalStones, setModalStones] = useState([]);
    const [tempStone, setTempStone] = useState({ stoneName: '', weight: '' });
    
    // Form States
    const [selectedWorker, setSelectedWorker] = useState('');
    const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Ornament Form State
    const [ornament, setOrnament] = useState({
        product: '',
        grossWeight: '',
        stoneWeight: '',
        netWeight: '',
        purity: '92',
        huid: '',
        description: ''
    });
    
    // Added Ornaments Grid State
    const [items, setItems] = useState([]);

    // Focus Refs
    const purityInputRef = useRef(null);
    const modalWeightInputRef = useRef(null);
    const modalStoneSelectRef = useRef(null);
    const modalDoneBtnRef = useRef(null);

    // Auto-focus Weight input when Stone Modal opens
    useEffect(() => {
        if (showStoneModal) {
            const timer = setTimeout(() => {
                modalWeightInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showStoneModal]);

    // Fetch Workers and Categories on mount
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [workersRes, companyRes] = await Promise.all([
                    api.get('/workers').catch(() => ({ data: [] })),
                    api.get('/company').catch(() => ({ data: {} }))
                ]);
                setWorkers(workersRes.data || []);
                
                if (companyRes.data && companyRes.data.categories) {
                    const activeCategories = companyRes.data.categories.filter(c => c.status !== 'Inactive');
                    setCategories(activeCategories);
                    if (activeCategories.length > 0) {
                        setOrnament(prev => ({ ...prev, product: activeCategories[0].name }));
                    }
                } else {
                    const fallbackCats = [
                        { name: 'Necklace', code: 'NE' },
                        { name: 'Rings', code: 'RI' },
                        { name: 'Bangles', code: 'BA' },
                        { name: 'Chains', code: 'CH' }
                    ];
                    setCategories(fallbackCats);
                    setOrnament(prev => ({ ...prev, product: fallbackCats[0].name }));
                }
                if (companyRes.data && companyRes.data.stones) {
                    const activeStones = companyRes.data.stones.filter(s => s.status !== 'Inactive');
                    setCompanyStones(activeStones);
                    if (activeStones.length > 0) {
                        setTempStone({ stoneName: activeStones[0].stoneName, weight: '' });
                    }
                }
            } catch (err) {
                console.error('Failed to load initial data', err);
            }
        };
        loadInitialData();
    }, []);

    // Calculate Net Weight dynamically
    const computedNetWeight = (() => {
        const gross = parseFloat(ornament.grossWeight) || 0;
        const stone = parseFloat(ornament.stoneWeight) || 0;
        return gross > 0 ? Math.max(0, gross - stone).toFixed(3) : '';
    })();

    // Handle adding item to grid
    const handleAddItem = (e) => {
        e.preventDefault();
        if (!ornament.product) {
            alert('Please select a product.');
            return;
        }
        if (!ornament.grossWeight) {
            alert('Please enter ornament gross weight.');
            return;
        }
        if (!ornament.purity) {
            alert('Please enter purity.');
            return;
        }

        const stoneBreakdown = modalStones.length > 0
            ? `(${modalStones.map(s => `${s.stoneName}: ${s.weight}g`).join(', ')}) `
            : '';

        // Generate unique barcode based on worker selection, date, and sequence (numbers only, no alphabets or hyphens)
        const rawWorkerId = selectedWorker ? (workers.find(w => w._id === selectedWorker)?.workerID || '0') : '0';
        const workerNumeric = rawWorkerId.replace(/\D/g, '') || '0';
        const dateNumeric = receiptDate.replace(/-/g, '');
        const sequenceNum = items.length + 1;
        const generatedBarcode = `${workerNumeric}${dateNumeric}${sequenceNum}`;

        const newItem = {
            id: Date.now(),
            barcode: generatedBarcode,
            product: ornament.product,
            grossWeight: parseFloat(ornament.grossWeight),
            stoneWeight: parseFloat(ornament.stoneWeight) || 0,
            netWeight: parseFloat(computedNetWeight) || 0,
            purity: ornament.purity,
            huid: ornament.huid || '—',
            description: (stoneBreakdown + (ornament.description || '')).trim() || '—'
        };

        setItems([...items, newItem]);
        
        // Reset only numeric weights, huid, and description
        setOrnament(prev => ({
            ...prev,
            grossWeight: '',
            stoneWeight: '',
            netWeight: '',
            huid: '',
            description: ''
        }));
        setModalStones([]);
    };

    // Edit item from grid
    const handleEditItem = (item) => {
        // Parse stones breakdown back into modalStones
        const parsed = parseStones(item.description);
        setModalStones(parsed.map(s => ({ stoneName: s.name, weight: parseFloat(s.weight) || 0 })));
        
        // Extract original description without stone text
        const plainDesc = (item.description || '').replace(/^\([^)]+\)\s*/, '');
        
        setOrnament({
            product: item.product,
            grossWeight: item.grossWeight.toString(),
            stoneWeight: item.stoneWeight > 0 ? item.stoneWeight.toString() : '',
            netWeight: item.netWeight.toString(),
            purity: item.purity,
            huid: item.huid === '—' ? '' : item.huid,
            description: plainDesc === '—' ? '' : plainDesc
        });
        
        // Remove from list so it can be re-added
        setItems(items.filter(i => i.id !== item.id));
    };

    // Remove item from grid
    const handleRemoveItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    // Clear all items and form
    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to clear all added ornaments?')) {
            setItems([]);
            setSelectedWorker('');
            setReceiptDate(new Date().toISOString().split('T')[0]);
        }
    };

    // Calculate totals
    const totalWeight = items.reduce((acc, item) => acc + item.grossWeight, 0);
    const totalStoneWeight = items.reduce((acc, item) => acc + item.stoneWeight, 0);
    const totalItems = items.length;

    // Submit Receipt to Backend
    const handleSubmit = async () => {
        if (!selectedWorker) {
            alert('Please select a worker.');
            return;
        }
        if (items.length === 0) {
            alert('Please add at least one ornament.');
            return;
        }

        try {
            const payload = {
                date: receiptDate,
                workerId: selectedWorker,
                items: items.map(item => ({
                    barcode: item.barcode,
                    product: item.product,
                    grossWeight: item.grossWeight,
                    stoneWeight: item.stoneWeight,
                    netWeight: item.netWeight,
                    purity: item.purity,
                    huid: item.huid,
                    description: item.description
                })),
                totalWeight,
                totalStoneWeight,
                totalItems
            };

            const response = await api.post('/mgmt/worker-receipts', payload);
            alert(`Receipt submitted successfully! Number: ${response.data.receiptNumber}`);
            
            // Auto print after successful submission
            handlePrintReceipt(response.data);
            
            // Clear grid
            setItems([]);
            setSelectedWorker('');
        } catch (err) {
            console.error('Failed to submit receipt', err);
            alert('Error submitting receipt: ' + (err.response?.data?.message || err.message));
        }
    };

    // Print Receipt Layout
    const handlePrintReceipt = (receiptData) => {
        const data = receiptData || {
            receiptNumber: 'WR-TEMP-' + receiptDate,
            date: receiptDate,
            workerId: workers.find(w => w._id === selectedWorker) || { name: 'Walk-in Worker', workerID: '—' },
            items,
            totalWeight,
            totalStoneWeight,
            totalItems
        };

        const workerName = data.workerId?.name || workers.find(w => w._id === selectedWorker)?.name || 'N/A';
        const workerID = data.workerId?.workerID || workers.find(w => w._id === selectedWorker)?.workerID || 'N/A';

        const printWindow = window.open('', '_blank', 'width=800,height=900');

        const dateStr = new Date(data.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).split(' ').join(' - ');

        const activeStones = companyStones.length > 0 ? companyStones : [{ stoneName: 'AD' }, { stoneName: 'RUBY' }, { stoneName: 'EMERALD' }, { stoneName: 'SAPPHIRE' }, { stoneName: 'PEARL' }];

        const rows = data.items.map((item, idx) => {
            const parsedStones = parseStones(item.description);
            const displayDesc = (item.description || '').replace(/^\([^)]+\)\s*/, '');
            
            const stoneCellsHtml = activeStones.map(stone => {
                const match = parsedStones.find(s => s.name.toLowerCase() === stone.stoneName.toLowerCase());
                return `<td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-family: monospace;">${match ? match.weight : '—'}</td>`;
            }).join('');
            
            return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">${idx + 1}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; font-family: monospace; font-weight: bold;">${item.barcode || '—'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; font-size: 12px;">${item.product}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px;">${item.grossWeight.toFixed(3)}g</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px;">${item.stoneWeight.toFixed(3)}g</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: 600; font-size: 12px;">${item.netWeight.toFixed(3)}g</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">${item.purity}%</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-family: monospace; font-size: 12px;">${item.huid}</td>
                    ${stoneCellsHtml}
                    <td style="border: 1px solid #ddd; padding: 8px; color: #333; font-size: 12px;">${displayDesc || '—'}</td>
                </tr>
            `;
        }).join('');

        const content = `
            <html>
                <head>
                    <title>Worker Receipt - ${data.receiptNumber}</title>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
                        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        .company-name { font-size: 24px; font-weight: 800; color: #6405FF; letter-spacing: -0.5px; }
                        .receipt-title { font-size: 20px; font-weight: 700; text-align: right; color: #333; }
                        .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        .info-cell { padding: 10px; background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; font-size: 14px; }
                        .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        .items-th { background: #6405FF; color: white; padding: 12px 10px; font-weight: 600; text-align: left; font-size: 13px; }
                        .summary-box { width: 100%; border-collapse: collapse; margin-top: 30px; }
                        .summary-label { text-align: right; padding: 10px; font-size: 14px; color: #666; }
                        .summary-value { text-align: right; padding: 10px; font-size: 16px; font-weight: 700; width: 150px; border-bottom: 2px double #333; }
                        .signature-section { margin-top: 60px; width: 100%; }
                        .sig-line { border-top: 1px solid #ccc; width: 200px; margin-top: 40px; text-align: center; font-size: 13px; color: #666; }
                        @media print {
                            body { margin: 20px; }
                            .items-th { background: #f2f2f2 !important; color: #000 !important; border: 1px solid #ccc !important; }
                        }
                    </style>
                </head>
                <body>
                    <table class="header-table">
                        <tr>
                            <td class="company-name">MAHALAKSHMI JEWELLERY</td>
                            <td class="receipt-title">WORKER RECEIPT</td>
                        </tr>
                    </table>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin-bottom: 20px;" />

                    <table class="info-grid">
                        <tr>
                            <td class="info-cell" style="width: 50%;">
                                <strong>Craftsman / Worker Details:</strong><br />
                                Name: ${workerName}<br />
                                ID: ${workerID}
                            </td>
                            <td class="info-cell" style="width: 50%; text-align: right;">
                                <strong>Receipt Info:</strong><br />
                                Receipt #: ${data.receiptNumber}<br />
                                Date: ${dateStr}
                            </td>
                        </tr>
                    </table>

                    <table class="items-table">
                        <thead>
                            <tr>
                                <th class="items-th" rowspan="2" style="text-align: center; width: 50px; vertical-align: middle;">#</th>
                                <th class="items-th" rowspan="2" style="text-align: center; vertical-align: middle;">Barcode</th>
                                <th class="items-th" rowspan="2" style="vertical-align: middle;">Product</th>
                                <th class="items-th" rowspan="2" style="text-align: right; width: 100px; vertical-align: middle;">Gross Wt</th>
                                <th class="items-th" rowspan="2" style="text-align: right; width: 100px; vertical-align: middle;">Stone Wt</th>
                                <th class="items-th" rowspan="2" style="text-align: right; width: 100px; vertical-align: middle;">Net Wt</th>
                                <th class="items-th" rowspan="2" style="text-align: center; width: 60px; vertical-align: middle;">Purity</th>
                                <th class="items-th" rowspan="2" style="text-align: center; width: 100px; vertical-align: middle;">HUID</th>
                                <th class="items-th" colspan="${activeStones.length}" style="text-align: center; padding: 4px;">STONE DETAILS (g)</th>
                                <th class="items-th" rowspan="2" style="vertical-align: middle;">Description</th>
                            </tr>
                            <tr>
                                ${activeStones.map(s => `<th class="items-th" style="text-align: center; font-size: 10px; padding: 4px; border-top: 1px solid #ddd;">${s.stoneName.toUpperCase()}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>

                    <table class="summary-box">
                        <tr>
                            <td class="summary-label">Total Ornaments:</td>
                            <td class="summary-value" style="border-bottom: 1px solid #eee;">${data.totalItems}</td>
                        </tr>
                        <tr>
                            <td class="summary-label">Total Stone Weight:</td>
                            <td class="summary-value" style="border-bottom: 1px solid #eee;">${data.totalStoneWeight.toFixed(3)}g</td>
                        </tr>
                        <tr>
                            <td class="summary-label" style="font-size: 16px; font-weight: bold; color: #000;">Total Net Weight:</td>
                            <td class="summary-value" style="font-size: 18px; color: #6405FF;">${(data.totalWeight - data.totalStoneWeight).toFixed(3)}g</td>
                        </tr>
                        <tr>
                            <td class="summary-label" style="font-size: 16px; font-weight: bold; color: #000;">Total Gross Weight:</td>
                            <td class="summary-value" style="font-size: 18px; color: #000; border-bottom: 3px double #333;">${data.totalWeight.toFixed(3)}g</td>
                        </tr>
                    </table>

                    <table class="signature-section">
                        <tr>
                            <td>
                                <div class="sig-line">Worker's Signature</div>
                            </td>
                            <td style="text-align: right;">
                                <div class="sig-line" style="margin-left: auto;">Authorized Signature</div>
                            </td>
                        </tr>
                    </table>

                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 500);
                        }
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
    };

    return (
        <div className="glass" style={{ padding: '24px', background: 'var(--surface-bg)', minHeight: '80vh' }}>
            {/* Header section matching mockup exactly */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={28} color="var(--primary-gold)" />
                    <h2 className="gold-gradient" style={{ fontSize: '1.8rem', margin: 0, fontWeight: 800 }}>Worker Receipt</h2>
                </div>
                
                {/* Header Action buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => navigate('/products')} className="glass" style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <button onClick={() => navigate('/products')} className="glass" style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                        <Plus size={16} /> New Assignment
                    </button>
                    <button className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                        <FileText size={16} /> Worker Receipt
                    </button>
                </div>
            </div>
            {/* Ornament Details Form Panel */}
            <div className="glass" style={{ padding: '16px 20px', background: 'var(--dark-bg)', borderRadius: '16px', marginBottom: '25px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: 'var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    💎 ORNAMENT DETAILS
                </h3>
                <form onSubmit={handleAddItem}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
                        <div style={{ width: '120px' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Product *</label>
                            <select 
                                value={ornament.product} 
                                onChange={e => setOrnament({ ...ornament, product: e.target.value })} 
                                style={{ width: '100%', padding: '8px 10px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                            >
                                {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div style={{ width: '130px' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Ornament Wt *</label>
                            <input 
                                required
                                type="number" 
                                step="0.001" 
                                placeholder="0.000g"
                                value={ornament.grossWeight} 
                                onChange={e => setOrnament({ ...ornament, grossWeight: e.target.value })} 
                                style={{ width: '100%', padding: '8px 10px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.85rem' }} 
                            />
                        </div>
                        <div style={{ width: '160px' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Stone Wt (g)</label>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <input 
                                    type="number" 
                                    step="0.001" 
                                    placeholder="0.000g"
                                    value={ornament.stoneWeight} 
                                    onChange={e => setOrnament({ ...ornament, stoneWeight: e.target.value })} 
                                    style={{ width: '100%', padding: '8px 10px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.85rem' }} 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowStoneModal(true)} 
                                    className="glass" 
                                    style={{ padding: '0 10px', borderRadius: '8px', color: 'var(--primary-gold)', border: '1px solid var(--glass-border)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Add Stone Details Applet"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        <div style={{ width: '80px' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Purity *</label>
                            <input 
                                ref={purityInputRef}
                                required
                                type="text"
                                placeholder="%"
                                value={ornament.purity} 
                                onChange={e => setOrnament({ ...ornament, purity: e.target.value })} 
                                style={{ width: '100%', padding: '8px 10px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.85rem' }} 
                            />
                        </div>
                        <div style={{ width: '120px' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Net Wt (g)</label>
                            <input 
                                readOnly
                                type="number" 
                                placeholder="0.000"
                                value={computedNetWeight} 
                                style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-muted)', outline: 'none', fontSize: '0.85rem' }} 
                            />
                        </div>
                        <div style={{ width: '110px' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>HUID</label>
                            <input 
                                type="text"
                                placeholder="HUID"
                                value={ornament.huid} 
                                onChange={e => setOrnament({ ...ornament, huid: e.target.value })} 
                                style={{ width: '100%', padding: '8px 10px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.85rem' }} 
                            />
                        </div>
                        <div style={{ width: '160px' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Description</label>
                            <input 
                                type="text"
                                placeholder="Description"
                                value={ornament.description} 
                                onChange={e => setOrnament({ ...ornament, description: e.target.value })} 
                                style={{ width: '100%', padding: '8px 10px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.85rem' }} 
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: '8px 20px', height: '36px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                            Add Item <Plus size={16} />
                        </button>
                    </div>
                </form>
            </div>

            {/* Added Items Grid Section */}
            <div className="glass" style={{ padding: '24px', borderRadius: '16px', marginBottom: '25px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: 'var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    📋 ADDED ITEMS
                </h3>
                <div className="table-container" style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
                        <thead style={{ background: 'var(--dark-bg)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'center', width: '60px', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>#</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>Barcode</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'left', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>Item</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'right', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>Gross Wt</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'right', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>Stone Wt</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'right', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>Net Wt</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>Purity (%)</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>HUID</th>
                                <th colSpan={companyStones.length || 5} style={{ padding: '4px 10px', textAlign: 'center', borderBottom: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)' }}>STONE DETAILS (g)</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'left', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>Description</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'center', width: '100px', verticalAlign: 'middle' }}>Action</th>
                            </tr>
                            <tr>
                                {(companyStones.length > 0 ? companyStones : [{ stoneName: 'AD' }, { stoneName: 'RUBY' }, { stoneName: 'EMERALD' }, { stoneName: 'SAPPHIRE' }, { stoneName: 'PEARL' }]).map((stone, i, arr) => (
                                    <th key={stone.stoneName} style={{ padding: '4px 10px', textAlign: 'center', borderRight: i < arr.length - 1 || companyStones.length > 0 ? '1px solid var(--glass-border)' : 'none', fontSize: '0.68rem', fontWeight: 700 }}>
                                        {stone.stoneName}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={item.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)' }}>{idx + 1}</td>
                                    <td style={{ padding: '6px 10px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-gold)', fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)' }}>{item.barcode}</td>
                                    <td style={{ padding: '6px 10px', fontWeight: 600, fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)' }}>{item.product}</td>
                                    <td style={{ padding: '6px 10px', textAlign: 'right', fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)' }}>{item.grossWeight.toFixed(3)}g</td>
                                    <td style={{ padding: '6px 10px', textAlign: 'right', fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)' }}>{item.stoneWeight.toFixed(3)}g</td>
                                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--success)', fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)' }}>{item.netWeight.toFixed(3)}g</td>
                                    <td style={{ padding: '6px 10px', textAlign: 'center', fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)' }}>{item.purity}%</td>
                                    <td style={{ padding: '6px 10px', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)' }}>{item.huid}</td>
                                    {(companyStones.length > 0 ? companyStones : [{ stoneName: 'AD' }, { stoneName: 'RUBY' }, { stoneName: 'EMERALD' }, { stoneName: 'SAPPHIRE' }, { stoneName: 'PEARL' }]).map((stone) => {
                                        const parsedStones = parseStones(item.description);
                                        const match = parsedStones.find(s => s.name.toLowerCase() === stone.stoneName.toLowerCase());
                                        return (
                                            <td key={stone.stoneName} style={{ padding: '6px 10px', textAlign: 'center', fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)', fontFamily: 'monospace', color: match ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                                {match ? match.weight : '—'}
                                            </td>
                                        );
                                    })}
                                    <td style={{ padding: '6px 10px', fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)' }}>
                                        {(() => {
                                            const stoneMatch = (item.description || '').match(/^\(([^)]+)\)/);
                                            return stoneMatch 
                                                ? (item.description || '').replace(/^\([^)]+\)\s*/, '') || '—' 
                                                : (item.description || '—');
                                        })()}
                                    </td>
                                    <td style={{ padding: '6px 10px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                        <button onClick={() => handleEditItem(item)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-gold)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Edit Item">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => alert(`Barcode generated & printed for ${item.product}: HN-${item.id}`)} style={{ background: 'transparent', border: 'none', color: '#2ec4b6', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Print Barcode">
                                            <Barcode size={16} />
                                        </button>
                                        <button onClick={() => handleRemoveItem(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Remove Item">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={10 + (companyStones.length || 5)} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                            <FileText size={40} style={{ opacity: 0.15 }} />
                                            <strong>No items added yet.</strong>
                                            <span style={{ fontSize: '0.8rem' }}>Add ornament details above and click "Add Item" to see them here.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {items.length > 0 && (
                            <tfoot style={{ background: 'var(--dark-bg)' }}>
                                {/* Separator spacing row to place total somewhat below the items */}
                                <tr style={{ height: '16px', background: 'transparent' }}>
                                    <td colSpan={10 + (companyStones.length || 5)} style={{ border: 'none', height: '16px' }}></td>
                                </tr>
                                <tr style={{ borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'center', fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)', color: 'var(--primary-gold)' }}>Total</td>
                                    <td style={{ padding: '8px 10px', borderRight: '1px solid var(--glass-border)' }}></td>
                                    <td style={{ padding: '8px 10px', fontWeight: 800, fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)', color: 'var(--primary-gold)' }}>{items.length} Ornaments</td>
                                    <td style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'right', fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)', color: 'var(--text-main)' }}>{items.reduce((sum, item) => sum + item.grossWeight, 0).toFixed(3)}g</td>
                                    <td style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'right', fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)', color: 'var(--text-main)' }}>{items.reduce((sum, item) => sum + item.stoneWeight, 0).toFixed(3)}g</td>
                                    <td style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'right', fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)', color: 'var(--success)' }}>{items.reduce((sum, item) => sum + item.netWeight, 0).toFixed(3)}g</td>
                                    <td style={{ padding: '8px 10px', borderRight: '1px solid var(--glass-border)' }}></td>
                                    <td style={{ padding: '8px 10px', borderRight: '1px solid var(--glass-border)' }}></td>
                                    {(companyStones.length > 0 ? companyStones : [{ stoneName: 'AD' }, { stoneName: 'RUBY' }, { stoneName: 'EMERALD' }, { stoneName: 'SAPPHIRE' }, { stoneName: 'PEARL' }]).map((stone) => {
                                        const totalStoneWeightForCol = items.reduce((sum, item) => {
                                            const parsedStones = parseStones(item.description);
                                            const match = parsedStones.find(s => s.name.toLowerCase() === stone.stoneName.toLowerCase());
                                            return sum + (match ? parseFloat(match.weight) || 0 : 0);
                                        }, 0);
                                        return (
                                            <td key={stone.stoneName} style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'center', fontSize: '0.82rem', borderRight: '1px solid var(--glass-border)', color: 'var(--primary-gold)', fontFamily: 'monospace' }}>
                                                {totalStoneWeightForCol > 0 ? totalStoneWeightForCol.toFixed(3) : '—'}
                                            </td>
                                        );
                                    })}
                                    <td style={{ padding: '8px 10px', borderRight: '1px solid var(--glass-border)' }}></td>
                                    <td style={{ padding: '8px 10px' }}></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Receipt Summary Form Section */}
            <div className="glass" style={{ padding: '24px', background: 'var(--dark-bg)', borderRadius: '16px', marginBottom: '30px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: 'var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    📝 RECEIPT SUMMARY
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                    <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Date *</label>
                        <input 
                            required
                            type="date"
                            value={receiptDate} 
                            onChange={e => setReceiptDate(e.target.value)} 
                            style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.85rem', height: '38px' }} 
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Worker *</label>
                        <select 
                            required
                            value={selectedWorker} 
                            onChange={e => setSelectedWorker(e.target.value)} 
                            style={{ width: '100%', padding: '8px 12px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.85rem', height: '38px' }}
                        >
                            <option value="">Select Worker</option>
                            {workers.map(w => <option key={w._id} value={w._id}>{w.name} ({w.workerID})</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Total Weight</label>
                        <input 
                            readOnly
                            type="text"
                            value={totalWeight.toFixed(3) + ' g'} 
                            style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-muted)', outline: 'none', fontWeight: 700, fontSize: '0.85rem', height: '38px' }} 
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Total Stone Weight</label>
                        <input 
                            readOnly
                            type="text"
                            value={totalStoneWeight.toFixed(3) + ' g'} 
                            style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-muted)', outline: 'none', fontWeight: 700, fontSize: '0.85rem', height: '38px' }} 
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Total Net Weight</label>
                        <input 
                            readOnly
                            type="text"
                            value={(totalWeight - totalStoneWeight).toFixed(3) + ' g'} 
                            style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--success)', outline: 'none', fontWeight: 700, fontSize: '0.85rem', height: '38px' }} 
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Total Items</label>
                        <input 
                            readOnly
                            type="text"
                            value={totalItems} 
                            style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-muted)', outline: 'none', fontWeight: 700, fontSize: '0.85rem', height: '38px' }} 
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Actions section aligned to the right */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button onClick={handleSubmit} className="btn-primary" style={{ padding: '14px 40px', borderRadius: '8px', fontWeight: 700, background: '#2ec4b6', display: 'flex', alignItems: 'center', gap: '8px', border: 'none' }}>
                    <Check size={18} /> SUBMIT
                </button>
                <button onClick={handleClearAll} className="glass" style={{ padding: '14px 30px', borderRadius: '8px', fontWeight: 700, color: 'white', background: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}>
                    <X size={18} /> Clear All
                </button>
                <button onClick={() => handlePrintReceipt(null)} className="glass" style={{ padding: '14px 30px', borderRadius: '8px', fontWeight: 700, color: '#000', background: 'var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}>
                    <Printer size={18} /> Print Receipt
                </button>
            </div>

            {showStoneModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
                    <div className="glass" style={{ width: '450px', padding: '24px', background: 'var(--surface-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ color: 'var(--primary-gold)', margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>💎 Add Stone Details</h3>
                            <button type="button" onClick={() => { setShowStoneModal(false); setTimeout(() => { purityInputRef.current?.focus(); }, 50); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Stone Type</label>
                                <select 
                                    ref={modalStoneSelectRef}
                                    value={tempStone.stoneName} 
                                    onChange={e => setTempStone({ ...tempStone, stoneName: e.target.value })}
                                    style={{ width: '100%', padding: '10px', background: 'var(--dark-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)' }}
                                >
                                    {companyStones.map(s => <option key={s.stoneName} value={s.stoneName}>{s.stoneName}</option>)}
                                    {companyStones.length === 0 && <option value="AD">AD</option>}
                                    {companyStones.length === 0 && <option value="Ruby">Ruby</option>}
                                </select>
                            </div>
                            <div style={{ width: '120px' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Weight (g)</label>
                                <input 
                                    ref={modalWeightInputRef}
                                    type="number" 
                                    step="0.001" 
                                    placeholder="0.000" 
                                    value={tempStone.weight} 
                                    onChange={e => setTempStone({ ...tempStone, weight: e.target.value })}
                                    onKeyDown={e => {
                                        if (e.key === 'Tab' && !e.shiftKey && !tempStone.weight) {
                                            e.preventDefault();
                                            modalDoneBtnRef.current?.focus();
                                        }
                                    }}
                                    style={{ width: '100%', padding: '10px', background: 'var(--dark-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)' }}
                                />
                            </div>
                            <button 
                                type="button" 
                                className="btn-primary" 
                                onClick={() => {
                                    if (!tempStone.weight) return;
                                    setModalStones([...modalStones, { stoneName: tempStone.stoneName || 'AD', weight: parseFloat(tempStone.weight) || 0 }]);
                                    setTempStone(prev => ({ ...prev, weight: '' }));
                                    setTimeout(() => { modalStoneSelectRef.current?.focus(); }, 50);
                                }}
                                style={{ padding: '10px 15px', borderRadius: '8px', fontWeight: 700 }}
                            >
                                Add
                            </button>
                        </div>

                        <div className="table-container" style={{ border: '1px solid var(--glass-border)', maxHeight: '180px', overflowY: 'auto', marginBottom: '20px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--dark-bg)' }}>
                                    <tr style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'left' }}>
                                        <th style={{ padding: '8px' }}>Stone</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>Weight (g)</th>
                                        <th style={{ padding: '8px', textAlign: 'center', width: '50px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modalStones.map((st, idx) => (
                                        <tr key={idx} style={{ borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                                            <td style={{ padding: '8px', fontWeight: 600 }}>{st.stoneName}</td>
                                            <td style={{ padding: '8px', textAlign: 'right' }}>{st.weight.toFixed(3)}g</td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        setModalStones(modalStones.filter((_, i) => i !== idx));
                                                        setTimeout(() => { modalWeightInputRef.current?.focus(); }, 50);
                                                    }}
                                                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {modalStones.length === 0 && (
                                        <tr><td colSpan="3" style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>No stones added.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" className="glass" onClick={() => { setShowStoneModal(false); setTimeout(() => { purityInputRef.current?.focus(); }, 50); }} style={{ padding: '10px 20px', borderRadius: '8px', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>Cancel</button>
                            <button 
                                ref={modalDoneBtnRef}
                                type="button" 
                                className="btn-primary" 
                                onClick={() => {
                                    const total = modalStones.reduce((sum, s) => sum + s.weight, 0);
                                    setOrnament(prev => ({ ...prev, stoneWeight: total > 0 ? total.toFixed(3) : '' }));
                                    setShowStoneModal(false);
                                    setTimeout(() => { purityInputRef.current?.focus(); }, 50);
                                }}
                                style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: 700 }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkerReceipt;
