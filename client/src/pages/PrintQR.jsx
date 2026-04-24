import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import api from '../api';

const PrintQR = () => {
    const [product, setProduct] = useState(null);
    const [companySettings, setCompanySettings] = useState(null);

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
        if (product && companySettings) {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [product, companySettings]);

    if (!product || !companySettings) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading...</div>;

    const calculateTotalStoneWeight = (stones) => {
        if (!stones || stones.length === 0) return 0;
        return stones.reduce((acc, current) => acc + (parseFloat(current.stoneWeight) || 0), 0);
    };

    return (
        <div style={{ textAlign: 'center', fontFamily: 'sans-serif', margin: '20px auto', maxWidth: '300px', background: 'white', color: 'black', padding: '20px' }}>
            
            {companySettings?.qrFormat === 'barcode_128' ? (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <Barcode value={product.productId} width={1.5} height={50} fontSize={14} margin={0} displayValue={true} />
                </div>
            ) : (
                <QRCodeSVG value={product.productId} size={120} level="H" style={{ margin: '0 auto', display: 'block' }} />
            )}
            
            {companySettings?.qrFormat !== 'qr' && companySettings?.qrFormat !== 'barcode_128' && (
                <div style={{ marginTop: '10px', fontSize: '12px' }}>
                    <p style={{ margin: '4px 0', fontWeight: 'bold', fontSize: '14px' }}>{product.designName}</p>
                    
                    {(companySettings?.qrFormat === 'qr_name_wt' || companySettings?.qrFormat === 'qr_name_wt_stone' || companySettings?.qrFormat === 'qr_name_wt_stonewt_details') && (
                        <p style={{ margin: '2px 0' }}>NW: {product.netWeight}g</p>
                    )}
                    
                    {(companySettings?.qrFormat === 'qr_name_wt_stone' || companySettings?.qrFormat === 'qr_name_wt_stonewt_details') && (
                        <p style={{ margin: '2px 0' }}>GN: {product.grossWeight}g | ST: {calculateTotalStoneWeight(product.stones).toFixed(2)}</p>
                    )}

                    {companySettings?.qrFormat === 'qr_name_wt_stonewt_details' && product.stones && product.stones.length > 0 && (
                        <div style={{ marginTop: '5px', borderTop: '1px dashed #ccc', paddingTop: '5px' }}>
                            {product.stones.map((st, idx) => (
                                <p key={idx} style={{ margin: '2px 0', fontSize: '10px' }}>{st.stoneName}: {st.stoneWeight} {st.stoneDetails}</p>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            <div className="no-print" style={{ marginTop: '30px' }}>
                <button 
                    onClick={() => window.close()} 
                    style={{ padding: '8px 16px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Close Window
                </button>
            </div>
            
            <style>
                {`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; margin: 0; padding: 0; color: black; }
                }
                `}
            </style>
        </div>
    );
};

export default PrintQR;
