const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { authenticate } = require('../middleware/auth');

// Configurar multer para almacenar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
    },
    fileFilter: (req, file, cb) => {
        // Aceptar solo imágenes
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'), false);
        }
    }
});

// Ruta para subir una imagen
router.post('/upload', authenticate, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
        }

        // Subir a Cloudinary usando un stream
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'piuma-shop', // Carpeta en Cloudinary
                resource_type: 'image',
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' }, // Limitar tamaño máximo
                    { quality: 'auto:good' }, // Optimización automática
                    { fetch_format: 'auto' } // Formato automático (WebP si es soportado)
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('Error subiendo a Cloudinary:', error);
                    return res.status(500).json({ error: 'Error al subir la imagen' });
                }

                // Devolver la URL de la imagen subida
                res.json({
                    success: true,
                    url: result.secure_url,
                    publicId: result.public_id
                });
            }
        );

        // Escribir el buffer al stream
        uploadStream.end(req.file.buffer);

    } catch (error) {
        console.error('Error en upload:', error);
        res.status(500).json({ error: 'Error al procesar la imagen' });
    }
});

// Ruta para subir múltiples imágenes
router.post('/upload-multiple', authenticate, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron imágenes' });
        }

        const uploadPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'piuma-shop',
                        resource_type: 'image',
                        transformation: [
                            { width: 1200, height: 1200, crop: 'limit' },
                            { quality: 'auto:good' },
                            { fetch_format: 'auto' }
                        ]
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                url: result.secure_url,
                                publicId: result.public_id
                            });
                        }
                    }
                );
                uploadStream.end(file.buffer);
            });
        });

        const results = await Promise.all(uploadPromises);

        res.json({
            success: true,
            images: results
        });

    } catch (error) {
        console.error('Error en upload-multiple:', error);
        res.status(500).json({ error: 'Error al procesar las imágenes' });
    }
});

// Ruta para eliminar una imagen de Cloudinary
router.delete('/delete/:publicId', authenticate, async (req, res) => {
    try {
        const publicId = req.params.publicId.replace(/_/g, '/'); // Decodificar el publicId

        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok') {
            res.json({ success: true, message: 'Imagen eliminada correctamente' });
        } else {
            res.status(400).json({ error: 'No se pudo eliminar la imagen' });
        }
    } catch (error) {
        console.error('Error eliminando imagen:', error);
        res.status(500).json({ error: 'Error al eliminar la imagen' });
    }
});

module.exports = router;
