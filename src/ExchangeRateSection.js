import React from 'react';

const ExchangeRateSection = ({
    exchangeRate,
    tempExchangeRate,
    setTempExchangeRate,
    handleUpdateExchangeRate,
    loading
}) => {
    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: window.innerWidth < 768 ? '1.5rem' : '2rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            maxWidth: '800px',
            margin: window.innerWidth < 768 ? '1rem' : '2rem auto',
            border: '1px solid rgba(230, 227, 212, 0.5)'
        }}>
            <h3 style={{
                fontFamily: 'Didot, serif',
                fontSize: '1.8rem',
                color: '#333',
                marginBottom: '1.5rem',
                fontWeight: '400',
                borderBottom: '2px solid #f0f0f0',
                paddingBottom: '1rem'
            }}>
                💵 Tipo de Cambio USD → ARS
            </h3>

            <div style={{
                background: 'linear-gradient(135deg, #6b7c59 0%, #8b9a7a 100%)',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                color: 'white',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                    Tipo de Cambio Actual
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Montserrat, sans-serif' }}>
                    ${exchangeRate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem' }}>
                    ARS por cada 1 USD
                </div>
            </div>

            <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                Este tipo de cambio se usa para convertir automáticamente los costos en USD a pesos argentinos
                y calcular los márgenes de ganancia en los productos.
            </p>

            <form onSubmit={handleUpdateExchangeRate} style={{
                display: 'flex',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                gap: '1rem',
                alignItems: window.innerWidth < 768 ? 'stretch' : 'flex-end'
            }}>
                <div style={{ flex: 1 }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: '600',
                        color: '#333',
                        fontSize: '0.95rem'
                    }}>
                        Nuevo Tipo de Cambio
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder={`Actual: ${exchangeRate}`}
                        value={tempExchangeRate}
                        onChange={(e) => setTempExchangeRate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '2px solid #e9ecef',
                            fontSize: '1rem',
                            boxSizing: 'border-box',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                        }}
                    />
                    {tempExchangeRate && (
                        <div style={{
                            fontSize: '0.85rem',
                            color: '#6b7c59',
                            marginTop: '0.5rem',
                            fontWeight: '500'
                        }}>
                            📊 Ejemplo: USD 100 = ARS ${(parseFloat(tempExchangeRate) * 100).toLocaleString('es-AR')}
                        </div>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={loading || !tempExchangeRate}
                    style={{
                        background: (loading || !tempExchangeRate)
                            ? '#ccc'
                            : 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '1rem 2rem',
                        borderRadius: '12px',
                        cursor: (loading || !tempExchangeRate) ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        minWidth: window.innerWidth < 768 ? '100%' : '150px',
                        transition: 'all 0.3s ease',
                        boxShadow: (loading || !tempExchangeRate) ? 'none' : '0 4px 15px rgba(212, 175, 55, 0.3)'
                    }}
                >
                    {loading ? '⏳ Actualizando...' : '💾 Actualizar'}
                </button>
            </form>

            <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#fff3cd',
                borderRadius: '8px',
                border: '1px solid #ffc107',
                fontSize: '0.9rem',
                color: '#856404'
            }}>
                <strong>⚠️ Importante:</strong> Al actualizar el tipo de cambio, todos los cálculos de
                margen de ganancia se recalcularán automáticamente con el nuevo valor.
            </div>
        </div>
    );
};

export default ExchangeRateSection;
