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
    const [printDropdownOpen, setPrintDropdownOpen] = useState(false);
    const [companySettings, setCompanySettings] = useState(null);

    // Form States
    const [selectedWorker, setSelectedWorker] = useState(() => {
        return localStorage.getItem('worker_receipt_worker') || '';
    });
    const [receiptDate, setReceiptDate] = useState(() => {
        return localStorage.getItem('worker_receipt_date') || new Date().toISOString().split('T')[0];
    });
    
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
    const [items, setItems] = useState(() => {
        try {
            const saved = localStorage.getItem('worker_receipt_items');
            return saved ? JSON.parse(saved) : [];
        } catch (err) {
            console.error('Failed to load worker_receipt_items from localStorage', err);
            return [];
        }
    });

    // Sync to LocalStorage
    useEffect(() => {
        try {
            localStorage.setItem('worker_receipt_items', JSON.stringify(items));
        } catch (err) {
            console.error('Failed to save worker_receipt_items to localStorage', err);
        }
    }, [items]);

    useEffect(() => {
        localStorage.setItem('worker_receipt_worker', selectedWorker);
    }, [selectedWorker]);

    useEffect(() => {
        localStorage.setItem('worker_receipt_date', receiptDate);
    }, [receiptDate]);

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
                setCompanySettings(companyRes.data);
                
                if (companyRes.data && companyRes.data.categories) {
                    const activeCategories = companyRes.data.categories.filter(c => c.status !== 'Inactive');
                    setCategories(activeCategories);
                } else {
                    const fallbackCats = [
                        { name: 'Necklace', code: 'NE' },
                        { name: 'Rings', code: 'RI' },
                        { name: 'Bangles', code: 'BA' },
                        { name: 'Chains', code: 'CH' }
                    ];
                    setCategories(fallbackCats);
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

        const gross = parseFloat(ornament.grossWeight) || 0;
        const stone = parseFloat(ornament.stoneWeight) || 0;
        if (stone > gross) {
            alert('Stone weight cannot exceed the gross weight.');
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
    const handlePrintReceipt = (receiptData, format = 'receipt3') => {
        const data = receiptData || {
            receiptNumber: 'WR-TEMP-' + receiptDate,
            date: receiptDate,
            workerId: workers.find(w => w._id === selectedWorker) || { name: 'Walk-in Worker', workerID: '—', contact: '—' },
            items,
            totalWeight,
            totalStoneWeight,
            totalItems
        };

        const workerName = data.workerId?.name || workers.find(w => w._id === selectedWorker)?.name || 'Walk-in Worker';
        const workerID = data.workerId?.workerID || workers.find(w => w._id === selectedWorker)?.workerID || '—';
        const workerPhone = data.workerId?.contact || workers.find(w => w._id === selectedWorker)?.contact || '9876543210';

        const printWindow = window.open('', '_blank', 'width=800,height=900');

        const dateStr = new Date(data.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).replace(/\s+/g, '-');

        const activeStones = companyStones.length > 0 ? companyStones : [{ stoneName: 'AD' }, { stoneName: 'RUBY' }, { stoneName: 'EMERALD' }, { stoneName: 'SAPPHIRE' }, { stoneName: 'PEARL' }];

        const rows = data.items.map((item, idx) => {
            const parsedStones = parseStones(item.description);
            const displayDesc = (item.description || '').replace(/^\([^)]+\)\s*/, '');
            
            let stoneCellsHtml = '';
            if (format === 'receipt3') {
                stoneCellsHtml = activeStones.map(stone => {
                    const match = parsedStones.find(s => s.name.toLowerCase() === stone.stoneName.toLowerCase());
                    return `<td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 12px; font-family: monospace;">${match ? match.weight : '—'}</td>`;
                }).join('');
            }
            
            return `
                <tr>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 12px;">${idx + 1}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 12px; font-family: monospace; font-weight: bold;">${item.barcode || '—'}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 12px;">${item.product}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-size: 12px;">${item.grossWeight.toFixed(3)}g</td>
                    ${format === 'receipt2' ? `<td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-size: 12px;">${item.stoneWeight.toFixed(3)}g</td>` : ''}
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: 600; font-size: 12px;">${item.netWeight.toFixed(3)}g</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 12px;">${item.purity}%</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-family: monospace; font-size: 12px;">${item.huid}</td>
                    ${stoneCellsHtml}
                    <td style="border: 1px solid #cbd5e1; padding: 8px; color: #333; font-size: 12px;">${displayDesc || '—'}</td>
                </tr>
            `;
        }).join('');

        // Build headers dynamically based on layout format
        let tableHeaderHtml = '';
        if (format === 'receipt3') {
            tableHeaderHtml = `
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
                        ${activeStones.map(s => `<th class="items-th" style="text-align: center; font-size: 10px; padding: 4px; border-top: 1px solid #cbd5e1;">${s.stoneName.toUpperCase()}</th>`).join('')}
                    </tr>
                </thead>
            `;
        } else if (format === 'receipt2') {
            tableHeaderHtml = `
                <thead>
                    <tr>
                        <th class="items-th" style="text-align: center; width: 50px;">#</th>
                        <th class="items-th" style="text-align: center;">Barcode</th>
                        <th class="items-th">Product</th>
                        <th class="items-th" style="text-align: right; width: 100px;">Gross Wt</th>
                        <th class="items-th" style="text-align: right; width: 100px;">Stone Wt</th>
                        <th class="items-th" style="text-align: right; width: 100px;">Net Wt</th>
                        <th class="items-th" style="text-align: center; width: 60px;">Purity</th>
                        <th class="items-th" style="text-align: center; width: 100px;">HUID</th>
                        <th class="items-th">Description</th>
                    </tr>
                </thead>
            `;
        } else {
            // receipt1 (Basic)
            tableHeaderHtml = `
                <thead>
                    <tr>
                        <th class="items-th" style="text-align: center; width: 50px;">#</th>
                        <th class="items-th" style="text-align: center;">Barcode</th>
                        <th class="items-th">Product</th>
                        <th class="items-th" style="text-align: right; width: 100px;">Gross Wt</th>
                        <th class="items-th" style="text-align: right; width: 100px;">Net Wt</th>
                        <th class="items-th" style="text-align: center; width: 60px;">Purity</th>
                        <th class="items-th" style="text-align: center; width: 100px;">HUID</th>
                        <th class="items-th">Description</th>
                    </tr>
                </thead>
            `;
        }

        const getThemeStyles = (themeName) => {
            switch (themeName) {
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

        const printSettings = companySettings?.printSettings || {
            showHeaderLogo: true,
            showHeaderGSTIN: true,
            showHeaderAddress: true,
            showHeaderContact: true,
            showHallmarkLogo: true,
            showBISLogo: true,
            workerTemplate: 'corporate',
            watermark: 'none',
            defaultPageSize: 'a4'
        };
        const theme = getThemeStyles(printSettings.workerTemplate || 'corporate');

        const logoUrl = companySettings?.logo || '';
        const companyName = companySettings?.name || 'MAHALAKSHMI JEWELLERY';
        const companyAddress = companySettings?.address || 'RAJENDHRA NACAR, NELLORE';
        const companyPhone = companySettings?.phone || '';
        const companyEmail = companySettings?.email || '';
        const companyTaxId = companySettings?.taxId || '';

        const headerLogoHtml = (printSettings.showHeaderLogo !== false) ? (logoUrl ? `
            <div style="width: 90px; height: 90px; display: flex; align-items: center; justify-content: center; overflow: hidden; background-color: transparent;">
                <img src="${logoUrl}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
        ` : `
            <div style="width: 90px; height: 90px; display: flex; align-items: center; justify-content: center; overflow: hidden; background-color: transparent;">
                <span style="font-weight: bold; font-size: 36px; color: #d97706;">
                    ${(companyName || 'M')[0].toUpperCase()}
                </span>
            </div>
        `) : '';

        const companyDetailsHtml = `
            <div>
                <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: 0.5px; font-family: Inter, sans-serif;">
                    ${companyName.toUpperCase()}
                </h1>
                ${(printSettings.showHeaderAddress !== false) ? `
                <p style="font-size: 11px; font-weight: 600; color: #d97706; margin: 4px 0 0 0; letter-spacing: 0.5px; text-transform: uppercase;">
                    ${companyAddress}
                </p>` : ''}
                <div style="font-size: 9px; color: #475569; margin-top: 4px; display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                    ${(printSettings.showHeaderContact !== false && companyPhone) ? `<div>PH: ${companyPhone}</div>` : ''}
                    ${(printSettings.showHeaderContact !== false && companyEmail) ? `<div>EMAIL: ${companyEmail}</div>` : ''}
                    ${(printSettings.showHeaderGSTIN !== false && companyTaxId) ? `<div style="font-weight: bold;">GSTIN: ${companyTaxId.toUpperCase()}</div>` : ''}
                </div>
            </div>
        `;

        const headerHtml = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; margin-bottom: 4px; font-family: Inter, sans-serif;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    ${headerLogoHtml}
                    ${companyDetailsHtml}
                </div>
                <div style="display: flex; align-items: center;">
                    <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 2px; font-size: 10px; min-width: 150px;">
                        <div>DATE: ${dateStr}</div>
                        <div style="display: flex; gap: 1.5px; margin-top: 2px; height: 14px; align-items: center;">
                            ${[1,3,1,2,4,1,3,2,1,4,2,1,3,1,2].map((w) => `<div style="width: ${w}px; height: 100%; background-color: #000;"></div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        const separatorAndTitleHtml = `
            <div style="text-align: center; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; color: #0f172a;">
                WORKER RECEIPT
            </div>
            <div style="height: 2.5px; background-color: #d97706; margin-bottom: 10px;"></div>
        `;

        const workerDetailsHtml = `
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-family: Inter, sans-serif;">
                <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                    <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 2px;">WORKER DETAILS:</div>
                    
                    <div style="display: flex; font-size: 11px; line-height: 16px;">
                        <span style="font-weight: 700; color: #0f172a; width: 80px; display: inline-block; text-align: right; margin-right: 8px;">NAME:</span>
                        <span style="font-weight: normal; color: #334155; flex: 1;">${workerName}</span>
                    </div>
                    <div style="display: flex; font-size: 11px; line-height: 16px;">
                        <span style="font-weight: 700; color: #0f172a; width: 80px; display: inline-block; text-align: right; margin-right: 8px;">PHONE:</span>
                        <span style="font-weight: normal; color: #334155; flex: 1;">${workerPhone}</span>
                    </div>
                    <div style="display: flex; font-size: 11px; line-height: 16px;">
                        <span style="font-weight: 700; color: #0f172a; width: 80px; display: inline-block; text-align: right; margin-right: 8px;">WORKER ID:</span>
                        <span style="font-weight: normal; color: #334155; flex: 1;">${workerID}</span>
                    </div>
                </div>
                <div style="width: 1px; height: 45px; background-color: #cbd5e1; margin: 0 20px;"></div>
                <div style="text-align: right; white-space: nowrap;">
                    <span style="font-size: 10px; font-weight: bold; color: #475569; margin-right: 5px;">RECEIPT NO.:</span>
                    <span style="font-size: 14px; font-weight: 800; color: #0f172a;">${data.receiptNumber}</span>
                </div>
            </div>
        `;

        const summaryBoxHtml = `
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background-color: #ffffff; font-family: Inter, sans-serif; box-sizing: border-box; width: 100%;">
                <h4 style="margin: 0 0 8px 0; border-bottom: 1.5px solid ${theme.borderColor}; padding-bottom: 4px; color: #1e293b; font-size: 11px; font-weight: 700;">RECEIPT SUMMARY</h4>
                <table style="width: 100%; font-size: 9px; border-collapse: collapse;">
                    <tbody>
                        <tr>
                            <td style="padding: 4px 0; color: #475569;">Total Items</td>
                            <td style="padding: 4px 0; text-align: right; font-weight: bold;">: ${data.totalItems}</td>
                        </tr>
                        ${format !== 'receipt1' ? `
                        <tr>
                            <td style="padding: 4px 0; color: #475569;">Total Stone Weight</td>
                            <td style="padding: 4px 0; text-align: right;">: ${data.totalStoneWeight.toFixed(3)}g</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td style="padding: 4px 0; color: #475569;">Total Net Weight</td>
                            <td style="padding: 4px 0; text-align: right;">: ${(data.totalWeight - data.totalStoneWeight).toFixed(3)}g</td>
                        </tr>
                        <tr style="border-top: 1px solid #cbd5e1; font-weight: bold;">
                            <td style="padding: 6px 0; color: #000;">Total Gross Weight</td>
                            <td style="padding: 6px 0; text-align: right;">: ${data.totalWeight.toFixed(3)}g</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        const signaturesHtml = `
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; border-top: 1px solid #cbd5e1; padding-top: 12px; margin-bottom: 20px; font-family: Inter, sans-serif;">
                <div style="font-size: 8px; color: #475569;">
                    <strong style="font-size: 9px; color: #0f172a;">TERMS & CONDITIONS</strong>
                    <ul style="margin: 4px 0 0 12px; padding: 0;">
                        <li>Assigned gold ornaments remain the sole property of the company.</li>
                        <li>Workers must return equivalent weight or finish the task as agreed.</li>
                        <li>Any wastage exceeding limits will be charged as per standard rates.</li>
                        <li>This is a computer generated receipt.</li>
                    </ul>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 15px; margin-top: 20px;">
                    <div style="text-align: center;">
                        <div style="width: 80px; border-bottom: 1px solid #000; margin-bottom: 4px;"></div>
                        <span style="font-size: 8px; color: #475569; font-weight: bold;">Worker Sign</span>
                    </div>
                    <div style="text-align: center;">
                        <div style="width: 80px; border-bottom: 1px solid #000; margin-bottom: 4px;"></div>
                        <span style="font-size: 8px; color: #475569; font-weight: bold;">Manager Sign</span>
                    </div>
                </div>
            </div>
        `;

        const footerBarHtml = `
            <div style="border-top: 2.5px solid #cbd5e1; border-bottom: 2.5px solid #cbd5e1; padding: 6px 0; display: flex; justify-content: space-between; align-items: center; font-size: 8px; font-weight: bold; color: #475569; font-family: Inter, sans-serif;">
                <div style="display: flex; align-items: center; gap: 4px; color: ${theme.accentColor};">
                    💎 MAHALAKSHMI JEWELLERY - WORKER ASSIGNMENT LOG
                </div>
                <div style="width: 1px; height: 10px; background-color: #cbd5e1;"></div>
                <div>Purity You Can Trust, Elegance You Deserve.</div>
                <div style="width: 1px; height: 10px; background-color: #cbd5e1;"></div>
                <div>🎗 916 BIS Hallmarked</div>
            </div>
        `;

        const isA5 = printSettings.defaultPageSize === 'a5';
        const sizeCSS = isA5 ? `
            @page {
                size: A5 landscape;
                margin: 8mm;
            }
        ` : `
            @page {
                size: A4 portrait;
                margin: 12mm;
            }
        `;

        const watermarkHtml = (printSettings.watermark && printSettings.watermark !== 'none') ? `
            <div style="
                position: absolute;
                top: 40%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-30deg);
                font-size: 6rem;
                color: rgba(239, 68, 68, 0.08);
                font-weight: 900;
                pointer-events: none;
                border: 10px double rgba(239, 68, 68, 0.08);
                padding: 10px 40px;
                letter-spacing: 10px;
                z-index: 0;
            ">
                ${printSettings.watermark}
            </div>
        ` : '';

        const logoWatermarkHtml = logoUrl ? `
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 300px;
                height: 300px;
                opacity: 0.06;
                background-image: url('${logoUrl}');
                background-size: contain;
                background-position: center;
                background-repeat: no-repeat;
                pointer-events: none;
                z-index: 0;
            "></div>
        ` : watermarkHtml;

        const content = `
            <html>
                <head>
                    <title>Worker Receipt - ${data.receiptNumber}</title>
                    <style>
                        ${sizeCSS}
                        body { 
                            font-family: ${theme.fontFamily}; 
                            color: #1e293b; 
                            background-color: ${theme.bgColor};
                            margin: 20px; 
                            position: relative;
                        }
                        .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
                        .items-th { 
                            background: ${theme.headingColor}; 
                            color: ${theme.headingColor === '#ffffff' ? '#000000' : '#ffffff'}; 
                            padding: 8px 6px; 
                            font-weight: bold; 
                            text-align: center; 
                            font-size: 11px; 
                            border: 1px solid ${theme.borderColor};
                        }
                        .items-table td {
                            padding: 6px;
                            border: 1px solid #cbd5e1;
                        }
                        @media print {
                            body { margin: 0; }
                            .items-th { 
                                background: #f1f5f9 !important; 
                                color: #1e293b !important; 
                                border: 1px solid #cbd5e1 !important; 
                            }
                        }
                    </style>
                </head>
                <body>
                    ${logoWatermarkHtml}
                    ${headerHtml}
                    ${separatorAndTitleHtml}
                    ${workerDetailsHtml}

                    <table class="items-table">
                        ${tableHeaderHtml}
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>

                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px; align-items: start;">
                        <div></div>
                        ${summaryBoxHtml}
                    </div>

                    ${signaturesHtml}
                    ${footerBarHtml}

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
                            <input 
                                required
                                type="text"
                                list="receipt-products-datalist"
                                value={ornament.product} 
                                onChange={e => setOrnament({ ...ornament, product: e.target.value })} 
                                placeholder="Select or type..."
                                style={{ width: '100%', padding: '8px 10px', background: 'var(--surface-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}
                            />
                            <datalist id="receipt-products-datalist">
                                {categories.map(c => <option key={c.name} value={c.name} />)}
                            </datalist>
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
                <div className="table-container" style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', maxHeight: '400px', overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
                        <thead style={{ background: 'var(--dark-bg)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'center', width: '60px', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>#</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>Barcode</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>Item</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>Gross Wt</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>Stone Wt</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>Net Wt</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>Purity (%)</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>HUID</th>
                                <th colSpan={companyStones.length || 5} style={{ padding: '4px 10px', textAlign: 'center', borderBottom: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)' }}>STONE DETAILS (g)</th>
                                <th rowSpan={2} style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid var(--glass-border)', verticalAlign: 'middle' }}>Description</th>
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
                                        <button onClick={() => alert(`Barcode generated & printed for ${item.product}: ${item.barcode}`)} style={{ background: 'transparent', border: 'none', color: '#2ec4b6', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Print Barcode">
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
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '20px', position: 'relative' }}>
                <button onClick={handleSubmit} className="btn-primary" style={{ padding: '14px 40px', borderRadius: '8px', fontWeight: 700, background: '#2ec4b6', display: 'flex', alignItems: 'center', gap: '8px', border: 'none' }}>
                    <Check size={18} /> SUBMIT
                </button>
                <button onClick={handleClearAll} className="glass" style={{ padding: '14px 30px', borderRadius: '8px', fontWeight: 700, color: 'white', background: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}>
                    <X size={18} /> Clear All
                </button>
                <div style={{ position: 'relative' }}>
                    <button onClick={() => setPrintDropdownOpen(!printDropdownOpen)} className="glass" style={{ padding: '14px 30px', borderRadius: '8px', fontWeight: 700, color: '#000', background: 'var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}>
                        <Printer size={18} /> Print Receipt
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
                            minWidth: '240px',
                            padding: '8px 0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                        }}>
                            <div style={{ padding: '6px 12px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>Receipt Layouts</div>
                            {[
                                { key: 'receipt1', label: '📄 Receipt Format 1 (Basic)' },
                                { key: 'receipt2', label: '🧾 Receipt Format 2 (With Stone Weight)' },
                                { key: 'receipt3', label: '📋 Receipt Format 3 (With Stone Details)' }
                            ].map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => { setPrintDropdownOpen(false); handlePrintReceipt(null, opt.key); }}
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
                        </div>
                    )}
                </div>
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
                                    const gross = parseFloat(ornament.grossWeight) || 0;
                                    if (gross > 0 && total > gross) {
                                        alert('Total stone weight cannot exceed the gross weight.');
                                        return;
                                    }
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
