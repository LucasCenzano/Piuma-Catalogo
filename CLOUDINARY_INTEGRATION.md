# Integración de Cloudinary para Subida de Imágenes

## ✅ Cambios Implementados

Se ha integrado Cloudinary para facilitar la subida de imágenes directamente desde archivos JPG (y otros formatos) en lugar de usar solo URLs.

### 1. Backend

#### Archivos Creados:
- **`config/cloudinary.js`**: Configuración de Cloudinary con tus credenciales
- **`api/upload.js`**: Rutas API para subir, gestionar y eliminar imágenes

#### Rutas API Disponibles:
- `POST /api/upload/upload` - Subir una imagen
- `POST /api/upload/upload-multiple` - Subir múltiples imágenes (hasta 10)
- `DELETE /api/upload/delete/:publicId` - Eliminar una imagen de Cloudinary

#### Características:
- ✅ Autenticación requerida (solo admins)
- ✅ Validación de tipo de archivo (solo imágenes)
- ✅ Límite de tamaño: 5MB por imagen
- ✅ Optimización automática (calidad, formato WebP si es soportado)
- ✅ Redimensionamiento automático (máximo 1200x1200px)
- ✅ Almacenamiento en carpeta `piuma-shop` en Cloudinary

### 2. Frontend

#### Componentes Creados:
- **`src/ImageUploader.js`**: Componente para subir imágenes
- **`src/ImageSection.js`**: Componente completo de sección de imágenes (opcional)

#### Modificaciones:
- **`src/authService.js`**: Actualizado para soportar FormData (necesario para subir archivos)
- **`src/AdminPanel.js`**: Importa ImageUploader (listo para usar)

## 📝 Cómo Usar

### Opción 1: Usar el Componente ImageSection (Recomendado)

En `AdminPanel.js`, reemplaza la sección de imágenes actual con:

\`\`\`javascript
import ImageSection from './ImageSection';

// Dentro del formulario de crear producto:
\u003cImageSection
  images={newImages}
  setImages={setNewImages}
  imageUrl={newImageUrl}
  setImageUrl={setNewImageUrl}
  onAddImage={addNewImage}
  onRemoveImage={removeNewImage}
/\u003e

// Para el formulario de editar producto:
\u003cImageSection
  images={editImages}
  setImages={setEditImages}
  imageUrl={editImageUrl}
  setImageUrl={setEditImageUrl}
  onAddImage={addEditImage}
  onRemoveImage={removeEditImage}
/\u003e
\`\`\`

### Opción 2: Usar Solo el ImageUploader

Si prefieres mantener tu diseño actual y solo agregar el botón de subida:

\`\`\`javascript
\u003cImageUploader
  multiple={true}
  onImageUploaded={(urls) =\u003e {
    if (Array.isArray(urls)) {
      setNewImages([...newImages, ...urls]);
    } else {
      setNewImages([...newImages, urls]);
    }
  }}
/\u003e
\`\`\`

## 🚀 Ventajas

1. **Más Rápido**: No necesitas buscar URLs de imágenes, solo subes el archivo
2. **Más Confiable**: Las imágenes se almacenan en Cloudinary (CDN global)
3. **Optimización Automática**: Las imágenes se optimizan automáticamente
4. **Mejor UX**: Indicador de progreso y manejo de errores

## 🔧 Configuración de Cloudinary

Las credenciales ya están configuradas en `config/cloudinary.js`:
- Cloud Name: dqzxpqmwu
- API Key: 974126791788868
- API Secret: BucjGgkF8FTitu9eR9n3-8-9L2U

**IMPORTANTE**: Para producción, mueve estas credenciales a variables de entorno (.env.local):

\`\`\`
CLOUDINARY_CLOUD_NAME=dqzxpqmwu
CLOUDINARY_API_KEY=974126791788868
CLOUDINARY_API_SECRET=BucjGgkF8FTitu9eR9n3-8-9L2U
\`\`\`

Y actualiza `config/cloudinary.js`:

\`\`\`javascript
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
\`\`\`

## 🧪 Pruebas

1. Inicia el servidor: `npm run dev-server`
2. Inicia el frontend: `npm start`
3. Ve al panel de admin
4. Intenta crear un producto y sube una imagen desde tu computadora
5. Verifica que la imagen se suba correctamente y aparezca en la vista previa

## 📦 Dependencias Instaladas

- `multer`: Para manejar la subida de archivos en el servidor

## ❓ Solución de Problemas

### Error: "No se proporcionó ninguna imagen"
- Verifica que el input de archivo esté funcionando correctamente
- Asegúrate de que el archivo sea una imagen válida

### Error: "Error al subir la imagen"
- Verifica las credenciales de Cloudinary
- Revisa los logs del servidor para más detalles
- Asegúrate de que el servidor esté ejecutándose

### Las imágenes no se muestran
- Verifica que las URLs de Cloudinary sean accesibles
- Revisa la consola del navegador para errores de CORS

## 🎯 Próximos Pasos

1. Integra el componente en el AdminPanel (reemplaza la sección de imágenes actual)
2. Prueba subiendo varias imágenes
3. (Opcional) Implementa la funcionalidad de eliminar imágenes de Cloudinary cuando se elimina un producto
4. (Opcional) Agrega un límite de imágenes por producto en el frontend

## 📸 Ejemplo de Uso

\`\`\`javascript
// En el formulario de crear producto, busca la sección de imágenes
// y reemplázala con:

\u003cdiv style={{
  background: 'linear-gradient(135deg, #f3f1eb 0%, #f8f6f0 100%)',
  padding: '1.5rem',
  borderRadius: '12px',
  marginBottom: '2rem',
  border: '1px solid rgba(230, 227, 212, 0.8)'
}}\u003e
  \u003ch4\u003e🖼️ Agregar Imágenes\u003c/h4\u003e
  
  {/* Uploader de Cloudinary */}
  \u003cImageUploader
    multiple={true}
    onImageUploaded={(urls) =\u003e {
      if (Array.isArray(urls)) {
        setNewImages([...newImages, ...urls]);
      } else {
        setNewImages([...newImages, urls]);
      }
    }}
  /\u003e
  
  {/* El resto de tu código de vista previa de imágenes */}
\u003c/div\u003e
\`\`\`
