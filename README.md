# Piuma — Catálogo Digital con Panel de Administración

> Plataforma e-commerce fullstack para una marca de carteras artesanales, con catálogo público, gestión de ventas y panel de administración protegido.

🟢 **Live demo:** [piuma-catalogo.vercel.app](https://piuma-catalogo.vercel.app)

---

## 📌 Visión del Producto

Piuma es una marca de carteras artesanales que operaba exclusivamente por WhatsApp y redes sociales, sin una presencia digital estructurada. El objetivo fue transformar ese modelo en una **plataforma digital autosustentable**: catálogo navegable, sistema de ventas con seguimiento de stock y deuda, y un panel de administración completo accesible desde cualquier dispositivo.

La solución debía ser **simple de operar por personas no técnicas**, **robusta en producción** y **escalable a futuro** sin necesidad de reescribir el núcleo.

---

## 🎯 Alcance del MVP

El MVP se definió con criterios de negocio claros: lanzar en el menor tiempo posible con las funcionalidades que generaban el mayor valor al equipo de Piuma.

| Feature | Estado | Prioridad |
|---|---|---|
| Catálogo público con filtros y búsqueda | ✅ Entregado | Alta |
| Galería de imágenes por producto (swipe móvil) | ✅ Entregado | Alta |
| Panel de administración con autenticación JWT | ✅ Entregado | Alta |
| Gestión de productos: alta, edición, variantes y stock | ✅ Entregado | Alta |
| Sistema de ventas con estado de cobro y deuda | ✅ Entregado | Media |
| Dashboard con métricas de rentabilidad y margen | ✅ Entregado | Media |
| Subida de imágenes a Cloudinary (sin servidor propio) | ✅ Entregado | Media |
| Gestión de categorías y filtros desde el admin | ✅ Entregado | Media |
| Drag & drop para reordenar imágenes | ✅ Entregado | Baja |
| Reporte de ganancias por producto y categoría | ✅ Entregado | Baja |

---

## 👤 Historias de Usuario

Las funcionalidades fueron priorizadas a partir de las necesidades reales del negocio:

**Como clienta del catálogo, quiero...**
- Navegar productos por categoría y filtros para encontrar lo que busco sin scrollear todo.
- Ver múltiples fotos de un producto deslizando en el celular.
- Contactar directamente por WhatsApp con un botón pre-cargado.

**Como administradora de Piuma, quiero...**
- Agregar y editar productos con variantes de color, talla y código, sin depender de un desarrollador.
- Registrar ventas al contado o en cuotas y ver quién me debe dinero.
- Ver en el dashboard cuánto gané esta semana, cuál es mi producto más rentable y qué stock me queda.
- Subir fotos desde el celular y que se guarden automáticamente en la nube.

**Como líder del negocio, quiero...**
- Que el sistema funcione sin que yo lo administre (zero-ops) usando Vercel + Neon PostgreSQL.
- Que el panel sea seguro y no accesible sin login.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────┐
│                   Cliente (React)                │
│  Catálogo público  │  Panel Admin (ruta protegida)│
└────────────┬────────────────────┬────────────────┘
             │ REST API           │ JWT Auth
┌────────────▼────────────────────▼────────────────┐
│              Express.js (Node)                    │
│  /api/products  /api/sales  /api/customers  ...  │
└────────────┬─────────────────────────────────────┘
             │
┌────────────▼──────────────┐   ┌──────────────────┐
│   Neon PostgreSQL (cloud)  │   │ Cloudinary (imgs) │
└───────────────────────────┘   └──────────────────┘

Deploy: Vercel (frontend + serverless API)
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Decisión |
|---|---|---|
| Frontend | React 18, React Router v6 | SPA con rutas protegidas |
| Estilos | CSS puro (sin framework) | Control total, sin overhead |
| Backend | Node.js + Express | API REST propia |
| Base de datos | PostgreSQL (Neon) | Relacional, serverless-friendly |
| Autenticación | JWT + bcryptjs | Stateless, sin sesiones en servidor |
| Imágenes | Cloudinary | CDN sin costo para MVP, sin deploy de storage propio |
| Deploy | Vercel | CI/CD automático desde GitHub |
| Charts | Recharts | Dashboard de métricas |

---

## 🗂️ Estructura del Proyecto

```
src/
├── AdminApp.js          # Punto de entrada del panel admin
├── MainApp.js           # Punto de entrada del catálogo público
├── AdminPanel.js        # Gestión de productos
├── AdminVentas.js       # Gestión de ventas y clientes
├── components/
│   └── Dashboard.js     # Métricas y reportes
├── Catalog.js           # Catálogo público con filtros
├── ImageGallery.js      # Galería con swipe y autoplay
├── DraggableImageList.js# Reordenamiento de imágenes
├── ProductWizard.js     # Wizard de alta de productos
├── authService.js       # Lógica de autenticación
└── dataService.js       # Capa de acceso a datos

api/                     # Handlers de Vercel (serverless)
├── products.js
├── sales.js
├── customers.js
├── categories.js
└── auth.js
```

---

## 🚀 Correr el proyecto localmente

### Requisitos

- Node.js >= 18
- PostgreSQL (local o Neon)
- Cuenta de Cloudinary (para subida de imágenes)

### Setup

```bash
# 1. Clonar el repo
git clone https://github.com/LucasCenzano/Piuma-Catalogo.git
cd Piuma-Catalogo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Completar DATABASE_URL, JWT_SECRET, CLOUDINARY_* en .env.local

# 4. Correr en modo desarrollo
npm run dev
# → React en http://localhost:3000
# → API Express en http://localhost:3001
```

---

## 🔐 Variables de entorno

Ver `.env.example` para la lista completa. Las claves necesarias son:

```env
DATABASE_URL=           # URL de conexión a PostgreSQL
JWT_SECRET=             # Clave secreta para firma de tokens
REACT_APP_API_URL=      # URL base de la API
CLOUDINARY_CLOUD_NAME=  # Credenciales de Cloudinary
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

> ⚠️ Nunca commitear `.env.local`. Está en `.gitignore`.

---

## 📋 Backlog (próximas iteraciones)

Las siguientes funcionalidades fueron identificadas pero priorizadas fuera del MVP inicial:

- [ ] **Búsqueda fulltext** en catálogo público (por nombre, categoría o código)
- [ ] **Carrito de compras** con selección de variante y pedido por WhatsApp
- [ ] **Historial de precios** por producto para análisis de rentabilidad
- [ ] **Notificaciones de stock bajo** desde el dashboard
- [ ] **Multi-admin** con roles (vendedor / administrador)
- [ ] **Export a CSV/PDF** del reporte de ventas mensual

---

## 👨‍💻 Autor

**Lucas Cenzano**  
[github.com/LucasCenzano](https://github.com/LucasCenzano)

---

*Proyecto real en producción. Desarrollado desde el diseño de la base de datos hasta el deploy en Vercel.*
