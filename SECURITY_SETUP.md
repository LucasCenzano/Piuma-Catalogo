# 🔐 Instrucciones de Configuración de Seguridad

## ⚠️ ACCIÓN INMEDIATA REQUERIDA

### 1. Rotar Credenciales de Base de Datos

Las credenciales de tu base de datos Neon fueron expuestas en `.env.example`. Debes:

1. **Ir a Neon Dashboard:**
   - https://console.neon.tech/

2. **Rotar las credenciales:**
   - Ve a tu proyecto
   - Settings → Reset password
   - Genera una nueva contraseña

3. **Actualizar `.env.local`:**
   ```bash
   NEON_DATABASE_URL="nueva_connection_string_aqui"
   DATABASE_URL="nueva_connection_string_aqui"
   ```

4. **Actualizar en Vercel:**
   - Ve a tu proyecto en Vercel
   - Settings → Environment Variables
   - Actualiza `DATABASE_URL` y `NEON_DATABASE_URL`

---

### 2. Generar JWT_SECRET Fuerte

**Opción A: Usando Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Opción B: Usando OpenSSL**
```bash
openssl rand -hex 64
```

**Opción C: Online (solo si confías en el sitio)**
- https://generate-secret.vercel.app/64

**Resultado esperado:**
Un string largo como:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4
```

**Agregar a `.env.local`:**
```bash
JWT_SECRET="tu_string_generado_aqui"
```

**Agregar a Vercel:**
- Settings → Environment Variables
- Agregar `JWT_SECRET` con el valor generado

---

### 3. Verificar .gitignore

Asegúrate de que `.env.local` esté en `.gitignore`:

```bash
cat .gitignore | grep .env.local
```

Si no aparece, agrégalo:
```bash
echo ".env.local" >> .gitignore
```

---

### 4. Verificar que no se hayan subido credenciales a GitHub

**Revisar historial de commits:**
```bash
git log --all --full-history -- .env.example
```

**Si encontraste credenciales en commits anteriores:**

1. **Opción A: Reescribir historial (PELIGROSO)**
   ```bash
   # Solo si estás seguro y no hay otros colaboradores
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch .env.example" \
   --prune-empty --tag-name-filter cat -- --all
   
   git push origin --force --all
   ```

2. **Opción B: Rotar credenciales (RECOMENDADO)**
   - Simplemente rota las credenciales en Neon
   - Las credenciales antiguas quedarán en el historial pero serán inválidas

---

### 5. Configurar Variables de Entorno en Vercel

Ve a: https://vercel.com/[tu-usuario]/[tu-proyecto]/settings/environment-variables

**Variables requeridas:**
```
DATABASE_URL=postgres://...
NEON_DATABASE_URL=postgres://...
JWT_SECRET=tu_secret_generado
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
NODE_ENV=production
```

**Después de agregar:**
- Redeploy tu aplicación en Vercel

---

### 6. Probar la Configuración

**Local:**
```bash
npm start
```

**Producción:**
- Visita tu sitio en Vercel
- Intenta hacer login
- Verifica que todo funcione

---

## ✅ Checklist de Verificación

- [ ] Credenciales de Neon rotadas
- [ ] JWT_SECRET generado y configurado
- [ ] `.env.local` con todas las variables
- [ ] Variables configuradas en Vercel
- [ ] `.gitignore` incluye `.env.local`
- [ ] Aplicación funciona en local
- [ ] Aplicación funciona en producción
- [ ] Login funciona correctamente
- [ ] Rate limiting activo (máx 5 intentos de login)

---

## 🆘 Si Algo Sale Mal

1. **No puedes hacer login:**
   - Verifica que JWT_SECRET esté configurado
   - Revisa los logs de Vercel

2. **Error de base de datos:**
   - Verifica la connection string
   - Asegúrate de que SSL esté habilitado

3. **Rate limiting muy restrictivo:**
   - Espera 10 minutos
   - O ajusta en `config/security.js`

---

## 📞 Contacto

Si necesitas ayuda, revisa:
- Logs de Vercel: https://vercel.com/[tu-proyecto]/logs
- Neon Dashboard: https://console.neon.tech/
- Documentación: ./SECURITY_AUDIT.md
