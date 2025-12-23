// Configuración de Cloudinary
const cloudinary = require('cloudinary').v2;

// Usar variables de entorno con fallback a las credenciales existentes
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dumhmn6xd',
    api_key: process.env.CLOUDINARY_API_KEY || '974126791788868',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'BucjGgkF8FTitu9eR9n3-8-9L2U'
});

// Log de configuración (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
    console.log('📸 Cloudinary configurado:', {
        cloud_name: cloudinary.config().cloud_name,
        api_key: cloudinary.config().api_key ? '✓ Configurado' : '✗ Falta'
    });
}

module.exports = cloudinary;
