import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import api from '../api';
import { Printer, Settings, X, RotateCcw } from 'lucide-react';

const PrintQR = () => {
    const [product, setProduct] = useState(null);
    const [companySettings, setCompanySettings] = useState(null);

    // Configuration states
    const [barcodeType, setBarcodeType] = useState('qr'); // 'qr', 'barcode_128', 'none'
    const [showName, setShowName] = useState(true);
    const [showWeight, setShowWeight] = useState(true);
    const [showStoneWeight, setShowStoneWeight] = useState(true);
    const [showStones, setShowStones] = useState(true);

    const [overflowScale, setOverflowScale] = useState(1);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const labelContainerRef = React.useRef(null);
    const contentWrapperRef = React.useRef(null);

    const labelWidth = companySettings?.labelWidth || '';
    const labelHeight = companySettings?.labelHeight || '';

    useEffect(() => {
        if (barcodeType === 'jewelry_tag') return;
        
        setOverflowScale(1);
        setIsOverflowing(false);
        
        const timer = setTimeout(() => {
            if (!labelContainerRef.current || !contentWrapperRef.current) return;
            
            // Allow container to define boundary
            const containerW = labelContainerRef.current.clientWidth;
            const containerH = labelContainerRef.current.clientHeight;
            
            // Measure actual content size
            const contentW = contentWrapperRef.current.scrollWidth;
            const contentH = contentWrapperRef.current.scrollHeight;
            
            const paddingBuffer = 4;
            let scaleX = containerW > 0 ? (containerW - paddingBuffer) / contentW : 1;
            let scaleY = containerH > 0 ? (containerH - paddingBuffer) / contentH : 1;
            
            let neededScale = Math.min(scaleX, scaleY, 1);
            
            if (neededScale < 0.6) {
                setOverflowScale(0.6);
                setIsOverflowing(true);
            } else {
                setOverflowScale(neededScale);
                setIsOverflowing(false);
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [barcodeType, showName, showWeight, showStoneWeight, showStones, product, companySettings]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/company');
                setCompanySettings(res.data);
            } catch(e) {
                console.error(e);
            }
        };

        const prod = localStorage.getItem('printProduct');
        if (prod) {
            setProduct(JSON.parse(prod));
        }
        
        fetchSettings();
    }, []);

    useEffect(() => {
        if (companySettings) {
            const format = companySettings.qrFormat || 'qr';
            applyFormatPreset(format);
        }
    }, [companySettings]);

    const applyFormatPreset = (preset) => {
        if (preset === 'barcode_128') {
            setBarcodeType('barcode_128');
            setShowName(false);
            setShowWeight(false);
            setShowStoneWeight(false);
            setShowStones(false);
        } else if (preset === 'qr') {
            setBarcodeType('qr');
            setShowName(false);
            setShowWeight(false);
            setShowStoneWeight(false);
            setShowStones(false);
        } else if (preset === 'qr_name_wt' || preset === 'preset_2') {
            setBarcodeType('qr');
            setShowName(true);
            setShowWeight(true);
            setShowStoneWeight(false);
            setShowStones(false);
        } else if (preset === 'qr_name_wt_stone' || preset === 'preset_3') {
            setBarcodeType('qr');
            setShowName(true);
            setShowWeight(true);
            setShowStoneWeight(true);
            setShowStones(false);
        } else if (preset === 'qr_name_wt_stonewt_details' || preset === 'preset_4') {
            setBarcodeType('qr');
            setShowName(true);
            setShowWeight(true);
            setShowStoneWeight(true);
            setShowStones(true);
        } else if (preset === 'jewelry_tag') {
            setBarcodeType('jewelry_tag');
            setShowName(false);
            setShowWeight(false);
            setShowStoneWeight(false);
            setShowStones(false);
        }
    };

    if (!product || !companySettings) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading...</div>;

    const calculateTotalStoneWeight = (stones) => {
        if (!stones || stones.length === 0) return 0;
        return stones.reduce((acc, current) => acc + (parseFloat(current.stoneWeight) || 0), 0);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--dark-bg)', color: 'var(--text-main)', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
            
            {/* Options Panel (Hidden during Print) */}
            <div className="no-print" style={{ 
                maxWidth: '800px', 
                margin: '0 auto 30px', 
                background: 'var(--glass-bg)', 
                border: '1px solid var(--glass-border)', 
                borderRadius: '16px', 
                padding: '24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Settings size={22} color="var(--primary-gold)" />
                        <h2 style={{ fontSize: '1.4rem', margin: 0 }} className="gold-gradient">Label Print Customizer</h2>
                    </div>
                    <button 
                        onClick={() => window.close()} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <X size={18} /> Close
                    </button>
                </div>

                {/* Quick Presets */}
                <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>QUICK PRESETS</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <button onClick={() => applyFormatPreset('qr')} style={presetBtnStyle}>
                            1. QR / Barcode Only
                        </button>
                        <button onClick={() => applyFormatPreset('preset_2')} style={presetBtnStyle}>
                            2. Barcode + Weight
                        </button>
                        <button onClick={() => applyFormatPreset('preset_3')} style={presetBtnStyle}>
                            3. Barcode + Weight + Stone Wt
                        </button>
                        <button onClick={() => applyFormatPreset('preset_4')} style={presetBtnStyle}>
                            4. Barcode + Weight + Stone Wt + Stones
                        </button>
                        <button onClick={() => applyFormatPreset('jewelry_tag')} style={{...presetBtnStyle, background: 'var(--primary-gold)', color: 'white', border: 'none'}}>
                            5. Jewelry Tag (Vertical)
                        </button>
                    </div>
                </div>

                {/* Manual Options Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                    <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>BARCODE TYPE</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={checkboxLabelStyle}>
                                <input 
                                    type="radio" 
                                    name="barcodeType" 
                                    checked={barcodeType === 'qr'} 
                                    onChange={() => setBarcodeType('qr')}
                                    style={radioStyle}
                                />
                                QR Code
                            </label>
                            <label style={checkboxLabelStyle}>
                                <input 
                                    type="radio" 
                                    name="barcodeType" 
                                    checked={barcodeType === 'barcode_128'} 
                                    onChange={() => setBarcodeType('barcode_128')}
                                    style={radioStyle}
                                />
                                Barcode (1D)
                            </label>
                            <label style={checkboxLabelStyle}>
                                <input 
                                    type="radio" 
                                    name="barcodeType" 
                                    checked={barcodeType === 'none'} 
                                    onChange={() => setBarcodeType('none')}
                                    style={radioStyle}
                                />
                                None
                            </label>
                            <label style={checkboxLabelStyle}>
                                <input 
                                    type="radio" 
                                    name="barcodeType" 
                                    checked={barcodeType === 'jewelry_tag'} 
                                    onChange={() => setBarcodeType('jewelry_tag')}
                                    style={radioStyle}
                                />
                                Jewelry Tag
                            </label>
                        </div>
                    </div>

                    <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>CONTENT FIELDS</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={checkboxLabelStyle}>
                                <input 
                                    type="checkbox" 
                                    checked={showName} 
                                    onChange={(e) => setShowName(e.target.checked)}
                                    style={checkboxStyle}
                                />
                                Show Product Name & Category
                            </label>
                            <label style={checkboxLabelStyle}>
                                <input 
                                    type="checkbox" 
                                    checked={showWeight} 
                                    onChange={(e) => setShowWeight(e.target.checked)}
                                    style={checkboxStyle}
                                />
                                Show Net Weight (NW)
                            </label>
                            <label style={checkboxLabelStyle}>
                                <input 
                                    type="checkbox" 
                                    checked={showStoneWeight} 
                                    onChange={(e) => setShowStoneWeight(e.target.checked)}
                                    style={checkboxStyle}
                                />
                                Show Stone & Gross Wt
                            </label>
                            <label style={checkboxLabelStyle}>
                                <input 
                                    type="checkbox" 
                                    checked={showStones} 
                                    onChange={(e) => setShowStones(e.target.checked)}
                                    style={checkboxStyle}
                                />
                                Show Individual Stone Details
                            </label>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                    <button 
                        onClick={() => {
                            if (companySettings) {
                                applyFormatPreset(companySettings.qrFormat || 'qr');
                            }
                        }} 
                        style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
                    >
                        <RotateCcw size={16} /> Reset to Default
                    </button>
                    <button 
                        onClick={handlePrint} 
                        style={{ padding: '10px 24px', background: 'linear-gradient(135deg, var(--secondary-gold), var(--primary-gold))', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem' }}
                    >
                        <Printer size={18} /> Print Label
                    </button>
                </div>
            </div>

            {/* Print Area Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <span className="no-print" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PRINT PREVIEW</span>
                
                {isOverflowing && (
                    <div className="no-print" style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '400px', textAlign: 'center' }}>
                        Selected content exceeds the printable label size. Increase label dimensions or deselect some fields.
                    </div>
                )}
                
                {/* Physical Tag Representation */}
                <div ref={labelContainerRef} style={{ 
                    width: labelWidth ? `${labelWidth}mm` : 'auto',
                    height: labelHeight ? `${labelHeight}mm` : 'auto',
                    minWidth: '40mm',
                    background: 'white',
                    color: 'black',
                    padding: barcodeType === 'jewelry_tag' ? '4px' : '5px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #ddd',
                    textAlign: 'left',
                    fontFamily: "'Inter', sans-serif",
                    overflow: 'hidden',
                    display: barcodeType === 'jewelry_tag' ? 'block' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start'
                }} className="print-label-container">
                    
                    {barcodeType !== 'jewelry_tag' && (
                        <div 
                            ref={contentWrapperRef} 
                            style={{ 
                                display: 'flex', 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                gap: '8px', 
                                transform: `scale(${overflowScale})`,
                                transformOrigin: 'left center',
                                whiteSpace: 'nowrap'
                            }}>
                            {/* Barcode Side */}
                            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {barcodeType === 'barcode_128' && (
                                    <Barcode value={product.productId} width={1.2} height={35} fontSize={10} margin={0} displayValue={false} />
                                )}
                                {barcodeType === 'qr' && (
                                    <QRCodeSVG value={product.productId} size={50} level="H" />
                                )}
                            </div>

                            {/* Text Side */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', fontWeight: '600' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', columnGap: '6px', rowGap: '2px' }}>
                                    {showName && (
                                        <>
                                            <span>Item</span><span>:</span><span>{product.productId}</span>
                                            <span>Name</span><span>:</span><span style={{ textTransform: 'uppercase' }}>{product.designName}</span>
                                        </>
                                    )}
                                    {showWeight && (
                                        <><span>NW</span><span>:</span><span>{product.netWeight?.toFixed(3)} g</span></>
                                    )}
                                    {showStoneWeight && (
                                        <>
                                            <span>GW</span><span>:</span><span>{product.grossWeight?.toFixed(3)} g</span>
                                            <span>ST</span><span>:</span><span>{calculateTotalStoneWeight(product.stones).toFixed(3)} g</span>
                                        </>
                                    )}
                                </div>
                                {showStones && product.stones && product.stones.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', columnGap: '6px', rowGap: '2px', marginTop: '2px', borderTop: '1px dashed #ccc', paddingTop: '2px' }}>
                                        {(() => {
                                            const agg = {};
                                            product.stones.forEach(st => {
                                                const name = st.stoneName;
                                                const weight = parseFloat(st.stoneWeight) || 0;
                                                agg[name] = (agg[name] || 0) + weight;
                                            });
                                            return Object.entries(agg).map(([name, weight]) => (
                                                <React.Fragment key={name}>
                                                    <span>{name}</span><span>:</span><span>{weight.toFixed(3)} g</span>
                                                </React.Fragment>
                                            ));
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <style>
                {`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0 !important; padding: 0 !important; color: black !important; }
                    .print-label-container { 
                        box-shadow: none !important; 
                        border: none !important; 
                        padding: 0 !important;
                        margin: 0 auto !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                }
                `}
            </style>
        </div>
    );
};

const presetBtnStyle = {
    padding: '8px 14px',
    background: 'var(--hover-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    color: 'var(--text-main)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 500,
    transition: 'var(--transition)'
};

const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    color: 'var(--text-main)'
};

const checkboxStyle = {
    width: '18px',
    height: '18px',
    accentColor: 'var(--primary-gold)',
    cursor: 'pointer'
};

const radioStyle = {
    width: '18px',
    height: '18px',
    accentColor: 'var(--primary-gold)',
    cursor: 'pointer'
};

export default PrintQR;
