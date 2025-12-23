import React, { useState } from 'react';
import authService from './authService';


// Configuración de API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

const ImageUploader = ({ onImageUploaded, multiple = false }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const handleFileChange = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setError(null);
        setProgress(0);

        try {
            if (multiple) {
                // Subir múltiples imágenes
                const formData = new FormData();
                Array.from(files).forEach(file => {
                    formData.append('images', file);
                });

                const response = await authService.authenticatedFetch(`${API_BASE_URL}/api/upload/upload-multiple`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        // No establecer Content-Type, el navegador lo hará automáticamente con el boundary correcto
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al subir las imágenes');
                }

                const data = await response.json();

                if (data.success && data.images) {
                    // Devolver array de URLs
                    onImageUploaded(data.images.map(img => img.url));
                }
            } else {
                // Subir una sola imagen
                const formData = new FormData();
                formData.append('image', files[0]);

                const response = await authService.authenticatedFetch(`${API_BASE_URL}/api/upload/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al subir la imagen');
                }

                const data = await response.json();

                if (data.success && data.url) {
                    onImageUploaded(data.url);
                }
            }

            setProgress(100);
        } catch (err) {
            console.error('Error subiendo imagen:', err);
            setError(err.message || 'Error al subir la imagen');
        } finally {
            setUploading(false);
            // Limpiar el input
            e.target.value = '';
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <label
                htmlFor="image-upload"
                style={{
                    display: 'inline-block',
                    padding: '1rem 2rem',
                    background: uploading
                        ? 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)'
                        : 'linear-gradient(135deg, #6b7c59 0%, #8b9a7a 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    width: '100%',
                    boxSizing: 'border-box'
                }}
            >
                {uploading ? (
                    <>
                        <span style={{ marginRight: '0.5rem' }}>⏳</span>
                        Subiendo... {progress}%
                    </>
                ) : (
                    <>
                        <span style={{ marginRight: '0.5rem' }}>📤</span>
                        {multiple ? 'Subir Imágenes' : 'Subir Imagen'}
                    </>
                )}
            </label>

            <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple={multiple}
                onChange={handleFileChange}
                disabled={uploading}
                style={{ display: 'none' }}
            />

            {error && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#f8d7da',
                    color: '#721c24',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    border: '1px solid #f5c6cb'
                }}>
                    ❌ {error}
                </div>
            )}

            {uploading && (
                <div style={{
                    marginTop: '1rem',
                    width: '100%',
                    height: '4px',
                    background: '#e9ecef',
                    borderRadius: '2px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #6b7c59 0%, #8b9a7a 100%)',
                        transition: 'width 0.3s ease',
                        borderRadius: '2px'
                    }} />
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
