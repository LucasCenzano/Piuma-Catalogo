# 🔍 Diagnóstico: Problema de Carga de Imágenes desde Otra PC

## 📋 Resumen del Problema
No se pueden subir imágenes cuando se accede al panel de administración desde otra PC en la página de Vercel.

## 🎯 Causas Potenciales Identificadas

### 1. **Configuración de Cloudinary** ⚠️
**Problema**: Las credenciales de Cloudinary estaban hardcodeadas en el código en lugar de usar variables de entorno.

**Solución Aplicada**:
- ✅ Actualizado `config/cloudinary.js` para usar variables de entorno
- ✅ Agregado fallback a las credenciales existentes para desarrollo local

**Acción Requerida en Vercel**:
```
1. Ve a: https://vercel.com/[tu-proyecto]/settings/environment-variables
2. Verifica que existan estas variables:
   - CLOUDINARY_CLOUD_NAME=dumhmn6xd
   - CLOUDINARY_API_KEY=974126791788868
   - CLOUDINARY_API_SECRET=BucjGgkF8FTitu9eR9n3-8-9L2U
3. Si no existen, agrégalas
4. Redeploy la aplicación
```

### 2. **Problemas de Autenticación/Token**
**Síntomas**:
- Token JWT expirado
- Token no se envía correctamente en los headers
- Sesión no persiste entre diferentes PCs

**Solución Aplicada**:
- ✅ Agregado verificación de token antes de subir imágenes
- ✅ Mejorado logging para identificar problemas de autenticación
- ✅ Mensajes de error más específicos

**Cómo Diagnosticar**:
1. Abre la consola del navegador (F12)
2. Intenta subir una imagen
3. Busca estos mensajes:
   - `📤 Iniciando carga de imágenes...`
   - `🔐 Token presente: Sí/No`
   - `🌐 API URL: [url]`

### 3. **Problemas de CORS**
**Síntomas**:
- Error "Not allowed by CORS"
- Peticiones bloqueadas desde diferentes dominios

**Configuración Actual**:
- ✅ CORS configurado para aceptar cualquier dominio `.vercel.app`
- ✅ Permite localhost y IPs locales

**Verificación**:
```javascript
// En config/security.js línea 27
if (origin &amp;&amp; origin.endsWith('.vercel.app')) {
    return callback(null, true);
}
```

### 4. **Configuración de API_BASE_URL**
**Problema Potencial**: El frontend podría estar apuntando a la URL incorrecta en producción.

**Configuración Actual**:
```javascript
// En ImageUploader.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');
```

**Acción Requerida**:
Verifica que en Vercel esté configurada la variable:
```
REACT_APP_API_URL=[URL de tu backend en Vercel]
```

## 🛠️ Pasos para Diagnosticar el Problema

### Paso 1: Verificar Variables de Entorno en Vercel
```bash
# Variables que DEBEN estar configuradas:
DATABASE_URL=postgres://...
NEON_DATABASE_URL=postgres://...
JWT_SECRET=[tu_secret]
CLOUDINARY_CLOUD_NAME=dumhmn6xd
CLOUDINARY_API_KEY=974126791788868
CLOUDINARY_API_SECRET=BucjGgkF8FTitu9eR9n3-8-9L2U
NODE_ENV=production
REACT_APP_API_URL=[URL de tu API]
```

### Paso 2: Verificar Logs en Tiempo Real
1. Desde otra PC, abre el panel de admin
2. Abre la consola del navegador (F12 → Console)
3. Intenta subir una imagen
4. Captura todos los mensajes que aparezcan

**Mensajes Esperados**:
```
📤 Iniciando carga de imágenes...
🔐 Token presente: Sí
🌐 API URL: https://[tu-app].vercel.app
📁 Archivos a subir: 1
📎 Subiendo archivo: imagen.jpg 123456 bytes
📡 Enviando petición a: https://[tu-app].vercel.app/api/upload/upload
📥 Respuesta recibida: 200 OK
✅ Imagen subida exitosamente: {...}
```

**Mensajes de Error Comunes**:
```
❌ No estás autenticado. Por favor, inicia sesión nuevamente.
   → Solución: Cerrar sesión y volver a iniciar sesión

❌ Error del servidor: No se proporcionó ninguna imagen
   → Solución: Verificar que el archivo se esté enviando correctamente

❌ Error del servidor: Error al subir la imagen
   → Solución: Verificar credenciales de Cloudinary en Vercel

🔒 Tu sesión ha expirado. Por favor, cierra sesión y vuelve a iniciar sesión.
   → Solución: Cerrar sesión y volver a iniciar sesión

🌐 Error de conexión. Verifica tu conexión a internet...
   → Solución: Verificar conexión y que el servidor esté funcionando
```

### Paso 3: Verificar Logs del Servidor en Vercel
1. Ve a: https://vercel.com/[tu-proyecto]/logs
2. Filtra por "Runtime Logs"
3. Busca errores relacionados con:
   - Cloudinary
   - Upload
   - Authentication

### Paso 4: Probar Autenticación
Desde otra PC:
1. Cierra sesión completamente
2. Borra cookies y localStorage (F12 → Application → Clear storage)
3. Vuelve a iniciar sesión
4. Intenta subir una imagen inmediatamente

## 🔧 Soluciones Rápidas

### Solución 1: Reconfigurar Variables de Entorno
```bash
# En Vercel Dashboard:
1. Settings → Environment Variables
2. Agregar/Verificar todas las variables listadas arriba
3. Redeploy
```

### Solución 2: Limpiar Sesión
```javascript
// En la consola del navegador (F12):
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Solución 3: Verificar Cloudinary
```bash
# Probar credenciales de Cloudinary manualmente:
curl -X POST \
  https://api.cloudinary.com/v1_1/dumhmn6xd/image/upload \
  -F "file=@test.jpg" \
  -F "api_key=974126791788868" \
  -F "timestamp=$(date +%s)" \
  -F "signature=[calcular_signature]"
```

## 📊 Checklist de Verificación

- [ ] Variables de entorno configuradas en Vercel
- [ ] Cloudinary credentials válidas
- [ ] JWT_SECRET configurado
- [ ] CORS permite dominios de Vercel
- [ ] Sesión activa y token válido
- [ ] Logs del navegador revisados
- [ ] Logs de Vercel revisados
- [ ] Probado cerrar sesión y volver a iniciar
- [ ] Verificado que funciona en local
- [ ] Verificado que funciona en producción desde tu PC
- [ ] Verificado que funciona en producción desde otra PC

## 🆘 Si Nada Funciona

1. **Captura de Pantalla**: Toma screenshots de:
   - Consola del navegador con errores
   - Network tab mostrando la petición fallida
   - Variables de entorno en Vercel (sin mostrar valores sensibles)

2. **Información a Recopilar**:
   - ¿Desde qué PC funciona y desde cuál no?
   - ¿Qué navegador estás usando?
   - ¿Aparece algún error en la consola?
   - ¿Qué código de respuesta HTTP recibes? (200, 401, 403, 500, etc.)

3. **Prueba de Aislamiento**:
   - Intenta subir desde la misma PC pero con otro navegador
   - Intenta desde modo incógnito
   - Intenta desde otra red (WiFi diferente, datos móviles)

## 📝 Próximos Pasos

1. Redeploy la aplicación en Vercel con los cambios aplicados
2. Verifica las variables de entorno
3. Prueba subir imágenes desde otra PC
4. Revisa los logs en la consola del navegador
5. Si persiste el problema, comparte los logs para análisis más profundo
