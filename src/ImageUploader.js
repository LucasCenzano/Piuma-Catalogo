import React, { useState } from 'react';
import authService from './authService';


// Configuración de API URL
const API_BASE_URL = process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

const ImageUploader = ({ onImageUploaded, multiple = false }) =& gt; {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const handleFileChange = async(e) =& gt; {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setError(null);
        setProgress(0);

        try {
            // Verificar autenticación antes de subir
            const token = authService.getToken();
            if (!token) {
                throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.');
            }

            console.log('📤 Iniciando carga de imágenes...');
            console.log('🔐 Token presente:', token ? 'Sí' : 'No');
            console.log('🌐 API URL:', API_BASE_URL);
            console.log('📁 Archivos a subir:', files.length);

            if (multiple) {
                // Subir múltiples imágenes
                const formData = new FormData();
                Array.from(files).forEach(file =& gt; {
                    console.log('📎 Agregando archivo:', file.name, file.size, 'bytes');
                    formData.append('images', file);
                });

                console.log('📡 Enviando petición a:', `${API_BASE_URL}/api/upload/upload-multiple`);

                const response = await authService.authenticatedFetch(`${API_BASE_URL}/api/upload/upload-multiple`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        // No establecer Content-Type, el navegador lo hará automáticamente con el boundary correcto
                    }
                });

                console.log('📥 Respuesta recibida:', response.status, response.statusText);

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('❌ Error del servidor:', errorData);
                    throw new Error(errorData.error || 'Error al subir las imágenes');
                }

                const data = await response.json();
                console.log('✅ Imágenes subidas exitosamente:', data);

                if (data.success & amp;& amp; data.images) {
                    // Devolver array de URLs
                    onImageUploaded(data.images.map(img =& gt; img.url));
                }
            } else {
                // Subir una sola imagen
                const formData = new FormData();
                formData.append('image', files[0]);

                console.log('📎 Subiendo archivo:', files[0].name, files[0].size, 'bytes');
                console.log('📡 Enviando petición a:', `${API_BASE_URL}/api/upload/upload`);

                const response = await authService.authenticatedFetch(`${API_BASE_URL}/api/upload/upload`, {
                    method: 'POST',
                    body: formData
                });

                console.log('📥 Respuesta recibida:', response.status, response.statusText);

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('❌ Error del servidor:', errorData);
                    throw new Error(errorData.error || 'Error al subir la imagen');
                }

                const data = await response.json();
                console.log('✅ Imagen subida exitosamente:', data);

                if (data.success & amp;& amp; data.url) {
                    onImageUploaded(data.url);
                }
            }

            setProgress(100);
        } catch (err) {
            console.error('❌ Error completo subiendo imagen:', err);
            console.error('Stack trace:', err.stack);

            // Proporcionar mensajes de error más específicos
            let errorMessage = err.message || 'Error al subir la imagen';

            if (err.message.includes('Sesión expirada') || err.message.includes('No autorizado')) {
                errorMessage = '🔒 Tu sesión ha expirado. Por favor, cierra sesión y vuelve a iniciar sesión.';
            } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                errorMessage = '🌐 Error de conexión. Verifica tu conexión a internet y que el servidor esté funcionando.';
            }

            setError(errorMessage);
        } finally {
            setUploading(false);
            // Limpiar el input
            e.target.value = '';
        }
    };

    return (
        & lt;div style = {{ width: '100%' }
}& gt;
            & lt; label
htmlFor = "image-upload"
style = {{
    display: 'inline-block',
        padding: window.innerWidth & lt; 768 ? '0.875rem 1.5rem' : '1rem 2rem',
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
                                                    boxSizing: 'border-box',
                                                        fontSize: window.innerWidth & lt; 768 ? '0.9rem' : '1rem'
}}
            & gt;
{
    uploading ? (
                    & lt;& gt;
                        & lt;span style = {{ marginRight: '0.5rem' }
}& gt;⏳& lt;/span&gt;
                        Subiendo... { progress }%
                    & lt;/&gt;
                ) : (
                    & lt;& gt;
                        & lt;span style = {{ marginRight: '0.5rem' }}& gt;📤& lt;/span&gt;
{ multiple ? 'Subir Imágenes' : 'Subir Imagen' }
                    & lt;/&gt;
                )}
            & lt;/label&gt;

            & lt; input
id = "image-upload"
type = "file"
accept = "image/*"
multiple = { multiple }
onChange = { handleFileChange }
disabled = { uploading }
style = {{ display: 'none' }}
            /&gt;

{
    error & amp;& amp; (
                & lt;div style = {{
        marginTop: '1rem',
            padding: '0.75rem',
                background: '#f8d7da',
                    color: '#721c24',
                        borderRadius: '8px',
                            fontSize: '0.9rem',
                                border: '1px solid #f5c6cb'
    }
}& gt;
                    ❌ { error }
                & lt;/div&gt;
            )}

{
    uploading & amp;& amp; (
                & lt;div style = {{
        marginTop: '1rem',
            width: '100%',
                height: '4px',
                    background: '#e9ecef',
                        borderRadius: '2px',
                            overflow: 'hidden'
    }
}& gt;
                    & lt;div style = {{
    width: `${progress}%`,
        height: '100%',
            background: 'linear-gradient(90deg, #6b7c59 0%, #8b9a7a 100%)',
                transition: 'width 0.3s ease',
                    borderRadius: '2px'
}} /&gt;
                & lt;/div&gt;
            )}
        & lt;/div&gt;
    );
};

export default ImageUploader;
