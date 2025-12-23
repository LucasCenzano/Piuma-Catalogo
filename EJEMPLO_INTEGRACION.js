/**
 * EJEMPLO DE INTEGRACIÓN - AdminPanel.js
 * 
 * Este archivo muestra cómo integrar el uploader de Cloudinary
 * en la sección de imágenes del AdminPanel.
 * 
 * PASO 1: Importar el componente (YA HECHO en AdminPanel.js línea 7)
 */

// import ImageUploader from './ImageUploader';

/**
 * PASO 2: Agregar el componente en la sección de imágenes
 * 
 * Busca en AdminPanel.js la línea ~1290 donde dice "🖼️ Agregar Imágenes"
 * y agrega ANTES del input de URL:
 */

const ejemploSeccionImagenes = () => {
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

            {/* ========== NUEVO: Uploader de Cloudinary ========== */}
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
                        // Si se suben múltiples imágenes, urls será un array
                        if (Array.isArray(urls)) {
                            setNewImages([...newImages, ...urls]);
                        } else {
                            // Si es una sola imagen, urls será un string
                            setNewImages([...newImages, urls]);
                        }
                    }}
                />
            </div>

            {/* Separador visual */}
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
            {/* ========== FIN NUEVO ========== */}

            {/* Input de URL (código existente) */}
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
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
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
                        onClick={addNewImage}
                        disabled={!newImageUrl}
                        style={{
                            background: newImageUrl ? 'linear-gradient(135deg, #6b7c59 0%, #8b9a7a 100%)' : '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '1rem 2rem',
                            borderRadius: '12px',
                            cursor: newImageUrl ? 'pointer' : 'not-allowed',
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

            {/* Vista previa de imágenes (código existente) */}
            {newImages.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                    <p style={{ marginBottom: '1rem', fontWeight: '500' }}>
                        Imágenes agregadas ({newImages.length}/10):
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {newImages.map((url, index) => (
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
                                />
                                <button
                                    type="button"
                                    onClick={() => removeNewImage(index)}
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

/**
 * PASO 3: Hacer lo mismo para el formulario de EDICIÓN
 * 
 * Busca la sección de edición (alrededor de la línea 2000+)
 * y reemplaza setNewImages con setEditImages, etc.
 */

const ejemploSeccionImagenesEdicion = () => {
    return (
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
                        setEditImages([...editImages, ...urls]); // ← Cambiar a editImages
                    } else {
                        setEditImages([...editImages, urls]); // ← Cambiar a editImages
                    }
                }}
            />
        </div>
    );
};

/**
 * NOTAS IMPORTANTES:
 * 
 * 1. El componente ImageUploader ya está importado en AdminPanel.js
 * 2. Solo necesitas copiar el código de ejemplo y pegarlo en las secciones correctas
 * 3. Para el formulario de creación: usa newImages/setNewImages
 * 4. Para el formulario de edición: usa editImages/setEditImages
 * 5. El resto del código (vista previa, etc.) permanece igual
 */

export { ejemploSeccionImagenes, ejemploSeccionImagenesEdicion };
