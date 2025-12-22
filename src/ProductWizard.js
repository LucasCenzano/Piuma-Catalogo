import React, { useState } from 'react';

const ProductWizard = ({ onSubmit, onCancel, categories = [] }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: categories[0] || '',
        stock: '',
        is_featured: false,
        is_new: false,
        discount_percentage: '',
        tags: '',
        variants: []
    });

    const [variantInput, setVariantInput] = useState({
        color_name: '',
        color_hex: '#000000',
        quantity: ''
    });

    const totalSteps = 4;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleVariantChange = (e) => {
        const { name, value } = e.target;
        setVariantInput(prev => ({ ...prev, [name]: value }));
    };

    const addVariant = () => {
        if (variantInput.color_name && variantInput.quantity) {
            setFormData(prev => ({
                ...prev,
                variants: [...prev.variants, { ...variantInput }]
            }));
            setVariantInput({ color_name: '', color_hex: '#000000', quantity: '' });
        }
    };

    const removeVariant = (index) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                return formData.name && formData.category;
            case 2:
                return formData.price;
            case 3:
                return true; // Variants are optional
            case 4:
                return true; // Final review
            default:
                return false;
        }
    };

    const stepperStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        position: 'relative'
    };

    const stepStyle = (stepNumber) => ({
        flex: 1,
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
    });

    const stepCircleStyle = (stepNumber) => ({
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        marginBottom: '0.5rem',
        background: stepNumber === currentStep ? 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)' :
            stepNumber < currentStep ? '#28a745' : '#e9ecef',
        color: stepNumber <= currentStep ? 'white' : '#666',
        transition: 'all 0.3s ease'
    });

    const lineStyle = {
        position: 'absolute',
        top: '20px',
        left: '0',
        right: '0',
        height: '2px',
        background: '#e9ecef',
        zIndex: 0
    };

    const progressLineStyle = {
        ...lineStyle,
        background: 'linear-gradient(90deg, #28a745 0%, #d4af37 100%)',
        width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
        transition: 'width 0.3s ease'
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2.5rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            maxWidth: '800px',
            margin: '0 auto'
        }}>
            {/* Stepper */}
            <div style={stepperStyle}>
                <div style={lineStyle}></div>
                <div style={progressLineStyle}></div>

                {[
                    { num: 1, label: 'Información Básica', icon: '📝' },
                    { num: 2, label: 'Precio y Stock', icon: '💰' },
                    { num: 3, label: 'Variantes', icon: '🎨' },
                    { num: 4, label: 'Revisar', icon: '✅' }
                ].map(step => (
                    <div key={step.num} style={stepStyle(step.num)}>
                        <div style={stepCircleStyle(step.num)}>
                            {step.num < currentStep ? '✓' : step.icon}
                        </div>
                        <div style={{
                            fontSize: '0.85rem',
                            color: step.num === currentStep ? '#d4af37' : step.num < currentStep ? '#28a745' : '#666',
                            fontWeight: step.num === currentStep ? '600' : '400',
                            marginTop: '0.25rem'
                        }}>
                            {step.label}
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit}>
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: '#333', fontSize: '1.5rem' }}>
                            📝 Información Básica
                        </h3>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#333' }}>
                                Nombre del Producto *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Cartera Classic"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid #e1e1e1',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#333' }}>
                                Categoría *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid #e1e1e1',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#333' }}>
                                Descripción
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe el producto..."
                                rows="4"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid #e1e1e1',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Step 2: Price & Stock */}
                {currentStep === 2 && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: '#333', fontSize: '1.5rem' }}>
                            💰 Precio y Stock
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#333' }}>
                                    Precio *
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    placeholder="15000"
                                    min="0"
                                    step="0.01"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e1e1e1',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#333' }}>
                                    Stock (si no usa variantes)
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    placeholder="10"
                                    min="0"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e1e1e1',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#333' }}>
                                Descuento (%)
                            </label>
                            <input
                                type="number"
                                name="discount_percentage"
                                value={formData.discount_percentage}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                                max="100"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid #e1e1e1',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    name="is_featured"
                                    checked={formData.is_featured}
                                    onChange={handleChange}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontWeight: '600', color: '#333' }}>⭐ Producto Destacado</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    name="is_new"
                                    checked={formData.is_new}
                                    onChange={handleChange}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontWeight: '600', color: '#333' }}>✨ Producto Nuevo</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Step 3: Variants */}
                {currentStep === 3 && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: '#333', fontSize: '1.5rem' }}>
                            🎨 Variantes (Opcional)
                        </h3>

                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                            Agrega diferentes colores o versiones del producto
                        </p>

                        <div style={{
                            background: '#f8f9fa',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                                        Nombre del Color
                                    </label>
                                    <input
                                        type="text"
                                        name="color_name"
                                        value={variantInput.color_name}
                                        onChange={handleVariantChange}
                                        placeholder="Negro"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '2px solid #e1e1e1',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                                        Color
                                    </label>
                                    <input
                                        type="color"
                                        name="color_hex"
                                        value={variantInput.color_hex}
                                        onChange={handleVariantChange}
                                        style={{
                                            width: '100%',
                                            height: '46px',
                                            border: '2px solid #e1e1e1',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                                        Stock
                                    </label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={variantInput.quantity}
                                        onChange={handleVariantChange}
                                        placeholder="5"
                                        min="0"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '2px solid #e1e1e1',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={addVariant}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '1rem'
                                    }}
                                >
                                    ➕ Agregar
                                </button>
                            </div>
                        </div>

                        {formData.variants.length > 0 && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ marginBottom: '1rem', color: '#333' }}>Variantes agregadas:</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {formData.variants.map((variant, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            background: 'white',
                                            borderRadius: '8px',
                                            border: '2px solid #e1e1e1'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: '30px',
                                                    height: '30px',
                                                    borderRadius: '50%',
                                                    background: variant.color_hex,
                                                    border: '2px solid #ddd'
                                                }}></div>
                                                <span style={{ fontWeight: '600' }}>{variant.color_name}</span>
                                                <span style={{ color: '#666' }}>Stock: {variant.quantity}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeVariant(index)}
                                                style={{
                                                    background: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: '#333', fontSize: '1.5rem' }}>
                            ✅ Revisar Producto
                        </h3>

                        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Nombre:</strong> {formData.name}
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Categoría:</strong> {formData.category}
                            </div>
                            {formData.description && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <strong>Descripción:</strong> {formData.description}
                                </div>
                            )}
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Precio:</strong> ${formData.price}
                            </div>
                            {formData.stock && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <strong>Stock:</strong> {formData.stock}
                                </div>
                            )}
                            {formData.discount_percentage && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <strong>Descuento:</strong> {formData.discount_percentage}%
                                </div>
                            )}
                            {formData.variants.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <strong>Variantes:</strong> {formData.variants.length} colores
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                {formData.is_featured && <span style={{ padding: '0.5rem 1rem', background: '#ffc107', borderRadius: '20px', fontSize: '0.9rem' }}>⭐ Destacado</span>}
                                {formData.is_new && <span style={{ padding: '0.5rem 1rem', background: '#28a745', color: 'white', borderRadius: '20px', fontSize: '0.9rem' }}>✨ Nuevo</span>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '2rem',
                    paddingTop: '2rem',
                    borderTop: '2px solid #e9ecef'
                }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '1rem'
                            }}
                        >
                            ❌ Cancelar
                        </button>

                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={prevStep}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#e9ecef',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '1rem'
                                }}
                            >
                                ⬅️ Anterior
                            </button>
                        )}
                    </div>

                    {currentStep < totalSteps ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            disabled={!isStepValid()}
                            style={{
                                padding: '0.75rem 2rem',
                                background: isStepValid() ? 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)' : '#ccc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: isStepValid() ? 'pointer' : 'not-allowed',
                                fontWeight: '600',
                                fontSize: '1rem',
                                opacity: isStepValid() ? 1 : 0.6
                            }}
                        >
                            Siguiente ➡️
                        </button>
                    ) : (
                        <button
                            type="submit"
                            style={{
                                padding: '0.75rem 2rem',
                                background: 'linear-gradient(135deg, #28a745 0%, #218838 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '1rem'
                            }}
                        >
                            ✅ Crear Producto
                        </button>
                    )}
                </div>
            </form>

            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
};

export default ProductWizard;
