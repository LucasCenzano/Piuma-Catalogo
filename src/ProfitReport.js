// src/ProfitReport.js - Componente de Reporte de Ganancias
import React from 'react';

const ProfitReport = ({ profitData, profitByProduct, profitByCategory, formatCurrency }) => {
    if (!profitData) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}>💰</div>
                <p>No hay datos de ganancias disponibles</p>
            </div>
        );
    }

    const profitMargin = parseFloat(profitData.profit_margin_percentage) || 0;

    return (
        <div style={{ marginTop: '3rem' }}>
            <h4 style={{
                fontFamily: 'Didot, serif',
                fontSize: '1.6rem',
                color: '#333',
                marginBottom: '2rem',
                fontWeight: '400',
                borderBottom: '2px solid #f0f0f0',
                paddingBottom: '1rem'
            }}>
                💵 Análisis de Ganancias
            </h4>

            {/* Resumen de Ganancias */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {/* Ingresos Totales */}
                <div style={{
                    background: 'linear-gradient(135deg, #6b7c59 0%, #8b9a7a 100%)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(107, 124, 89, 0.3)'
                }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                        Ingresos Totales
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>
                        {formatCurrency(parseFloat(profitData.total_revenue) || 0)}
                    </div>
                </div>

                {/* Costos Totales */}
                <div style={{
                    background: 'linear-gradient(135deg, #a85751 0%, #c97168 100%)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(168, 87, 81, 0.3)'
                }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                        Costos Totales
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>
                        {formatCurrency(parseFloat(profitData.total_cost) || 0)}
                    </div>
                </div>

                {/* Ganancia Neta */}
                <div style={{
                    background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)'
                }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                        Ganancia Neta
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>
                        {formatCurrency(parseFloat(profitData.total_profit) || 0)}
                    </div>
                </div>

                {/* Margen de Ganancia */}
                <div style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
                }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                        Margen de Ganancia
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>
                        {profitMargin.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Ganancias por Producto */}
            {profitByProduct && profitByProduct.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h5 style={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '1.2rem',
                        color: '#333',
                        marginBottom: '1rem',
                        fontWeight: '600'
                    }}>
                        📊 Top Productos por Ganancia
                    </h5>
                    <div style={{
                        background: '#f8f9fa',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid #dee2e6'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#e9ecef' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Producto</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem' }}>Vendidos</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem' }}>Ingresos</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem' }}>Costos</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem' }}>Ganancia</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem' }}>Margen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profitByProduct.slice(0, 10).map((product, index) => (
                                    <tr key={product.id} style={{
                                        borderBottom: '1px solid #dee2e6',
                                        background: index % 2 === 0 ? 'white' : '#f8f9fa'
                                    }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600', color: '#333' }}>{product.name}</div>
                                            {product.product_code && (
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>Código: {product.product_code}</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '500' }}>
                                            {product.units_sold}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: '#6b7c59', fontWeight: '500' }}>
                                            {formatCurrency(parseFloat(product.revenue) || 0)}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: '#a85751', fontWeight: '500' }}>
                                            {formatCurrency(parseFloat(product.cost) || 0)}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: '#d4af37', fontWeight: '700' }}>
                                            {formatCurrency(parseFloat(product.profit) || 0)}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                background: parseFloat(product.margin_percentage) > 30 ? '#d4edda' : '#fff3cd',
                                                color: parseFloat(product.margin_percentage) > 30 ? '#155724' : '#856404',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem',
                                                fontWeight: '600'
                                            }}>
                                                {parseFloat(product.margin_percentage).toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Ganancias por Categoría */}
            {profitByCategory && profitByCategory.length > 0 && (
                <div>
                    <h5 style={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '1.2rem',
                        color: '#333',
                        marginBottom: '1rem',
                        fontWeight: '600'
                    }}>
                        📂 Ganancias por Categoría
                    </h5>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1rem'
                    }}>
                        {profitByCategory.map((category, index) => {
                            const margin = parseFloat(category.margin_percentage) || 0;
                            return (
                                <div key={index} style={{
                                    background: 'white',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <div style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '600',
                                        color: '#333',
                                        marginBottom: '1rem'
                                    }}>
                                        {category.category}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#666' }}>Ganancia:</span>
                                        <span style={{ fontWeight: '700', color: '#d4af37' }}>
                                            {formatCurrency(parseFloat(category.profit) || 0)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#666' }}>Margen:</span>
                                        <span style={{
                                            fontWeight: '600',
                                            color: margin > 30 ? '#6b7c59' : '#856404'
                                        }}>
                                            {margin.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#666' }}>Unidades:</span>
                                        <span style={{ fontWeight: '500' }}>{category.units_sold}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfitReport;
