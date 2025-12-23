import React, { useState } from 'react';
import SafeImage from './SafeImage';

const DraggableImageList = ({ images, onReorder, onRemove }) => {
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Hacer el elemento arrastrado semi-transparente
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e, index) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = (e) => {
        // Solo limpiar si realmente salimos del contenedor
        if (e.currentTarget === e.target) {
            setDragOverIndex(null);
        }
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDragOverIndex(null);
            return;
        }

        const newImages = [...images];
        const draggedImage = newImages[draggedIndex];

        // Remover el elemento arrastrado
        newImages.splice(draggedIndex, 1);

        // Insertar en la nueva posición
        newImages.splice(dropIndex, 0, draggedImage);

        onReorder(newImages);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    if (!images || images.length === 0) {
        return null;
    }

    return (
        <div>
            <p style={{
                marginBottom: '1rem',
                fontWeight: '500',
                fontSize: '0.95rem',
                color: '#333'
            }}>
                📸 Imágenes ({images.length}/10) - Arrastra para reordenar:
            </p>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
            }}>
                {images.map((url, index) => (
                    <div
                        key={`${url}-${index}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        style={{
                            position: 'relative',
                            cursor: 'move',
                            transition: 'all 0.2s ease',
                            transform: dragOverIndex === index && draggedIndex !== index
                                ? 'scale(1.05)'
                                : 'scale(1)',
                            opacity: draggedIndex === index ? 0.5 : 1,
                            border: dragOverIndex === index && draggedIndex !== index
                                ? '3px dashed #d4af37'
                                : '2px solid #dee2e6',
                            borderRadius: '12px',
                            padding: '4px',
                            background: dragOverIndex === index && draggedIndex !== index
                                ? 'rgba(212, 175, 55, 0.1)'
                                : 'white',
                            boxShadow: draggedIndex === index
                                ? '0 4px 12px rgba(0,0,0,0.15)'
                                : '0 2px 4px rgba(0,0,0,0.08)'
                        }}
                    >
                        {/* Indicador de posición */}
                        <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: index === 0 ? '#d4af37' : 'rgba(0,0,0,0.6)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            zIndex: 2,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                            {index + 1}
                        </div>

                        {/* Etiqueta "Principal" para la primera imagen */}
                        {index === 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: '#d4af37',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.65rem',
                                fontWeight: 'bold',
                                zIndex: 2,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                ★ Principal
                            </div>
                        )}

                        {/* Imagen */}
                        <SafeImage
                            src={url}
                            alt={`Imagen ${index + 1}`}
                            style={{
                                width: '100%',
                                height: '100px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                display: 'block'
                            }}
                        />

                        {/* Botón de eliminar */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(index);
                            }}
                            style={{
                                position: 'absolute',
                                bottom: '8px',
                                right: '8px',
                                background: '#a85751',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                transition: 'all 0.2s ease',
                                zIndex: 2
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.background = '#8b3a35';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.background = '#a85751';
                            }}
                        >
                            ×
                        </button>

                        {/* Icono de arrastre */}
                        <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '8px',
                            background: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            zIndex: 2,
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            ⋮⋮
                        </div>
                    </div>
                ))}
            </div>
            <p style={{
                fontSize: '0.85rem',
                color: '#666',
                fontStyle: 'italic',
                marginTop: '0.5rem'
            }}>
                💡 Tip: La primera imagen será la imagen principal del producto
            </p>
        </div>
    );
};

export default DraggableImageList;
