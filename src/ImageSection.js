// Componente de sección de imágenes mejorado para AdminPanel
// Incluye tanto el uploader de Cloudinary como la opción de URL manual

import React from 'react';
import ImageUploader from './ImageUploader';
import SafeImage from './SafeImage'; // Asumiendo que existe

const ImageSection = ({
    images,
    setImages,
    imageUrl,
    setImageUrl,
    onAddImage,
    onRemoveImage
}) => {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #f3f1eb 0%, #f8f6f0 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid rgba(230, 227, 212, 0.8)'
        }}>
            <h4 style={{
                fontFamily: 'Didot, serif',
                color: '#333',
                marginBottom: '1rem',
                fontSize: '1.3rem',
                fontWeight: '400'
            }}>
                🖼️ Agregar Imágenes
            </h4>

            {/* Uploader de Cloudinary */}
            <div style={{ marginBottom: '1.5rem' }}>
                <p style={{
                    marginBottom: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7c59',
                    fontSize: '0.95rem'
                }}>
                    📤 Subir desde tu computadora (Recomendado):
                </p>
                <ImageUploader
                    multiple={true}
                    onImageUploaded={(urls) => {
                        if (Array.isArray(urls)) {
                            setImages([...images, ...urls]);
                        } else {
                            setImages([...images, urls]);
                        }
                    }}
                />
            </div>

            {/* Separador */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '1.5rem 0',
                gap: '1rem'
            }}>
                <div style={{ flex: 1, height: '1px', background: '#dee2e6' }} />
                <span style={{ color: '#6c757d', fontSize: '0.9rem', fontWeight: '500' }}>O</span>
                <div style={{ flex: 1, height: '1px', background: '#dee2e6' }} />
            </div>

            {/* Input de URL manual */}
            <div>
                <p style={{
                    marginBottom: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7c59',
                    fontSize: '0.95rem'
                }}>
                    🔗 Agregar desde URL:
                </p>
                <div style={{
                    display: 'flex',
                    flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                    gap: '1rem',
                    flexWrap: 'wrap'
                }}>
                    <input
                        type="url"
                        placeholder="URL de la imagen (ej: https://...)"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        style={{
                            flex: 1,
                            minWidth: window.innerWidth < 768 ? '100%' : '300px',
                            padding: '1rem',
                            border: '2px solid #e9ecef',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />

                    <button
                        type="button"
                        onClick={onAddImage}
                        disabled={!imageUrl}
                        style={{
                            background: imageUrl ? 'linear-gradient(135deg, #6b7c59 0%, #8b9a7a 100%)' : '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '1rem 2rem',
                            borderRadius: '12px',
                            cursor: imageUrl ? 'pointer' : 'not-allowed',
                            fontWeight: '600',
                            width: window.innerWidth < 768 ? '100%' : 'auto',
                            transition: 'all 0.3s ease',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        ➕ Agregar
                    </button>
                </div>
            </div>

            {/* Vista previa de imágenes agregadas */}
            {images.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                    <p style={{ marginBottom: '1rem', fontWeight: '500' }}>
                        Imágenes agregadas ({images.length}/10):
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {images.map((url, index) => (
                            <div key={index} style={{ position: 'relative' }}>
                                <img
                                    src={url}
                                    alt={`Imagen ${index + 1}`}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        border: '2px solid #dee2e6'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => onRemoveImage(index)}
                                    style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '-8px',
                                        background: '#a85751',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageSection;
