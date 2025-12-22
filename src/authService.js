// authService.js - Versión corregida para desarrollo y producción
import dataService from './dataService'; // 👈 1. Importa el dataService

// ✅ CÓDIGO CORRECTO
// ✅ DYNAMIC API CONFIGURATION FOR MOBILE TESTING
let API_BASE_URL = process.env.REACT_APP_API_URL || '';

// If running in development and accessed via IP (not localhost), point to the IP:3001
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    API_BASE_URL = `http://${hostname}:3001`;
    console.log('📱 Mobile Debugging Detected: Using API at', API_BASE_URL);
  } else if (!API_BASE_URL) {
    // Fallback for localhost if env var is missing
    API_BASE_URL = 'http://localhost:3001';
  }
}


class AuthService {
  constructor() {
    this.token = this.getToken();
    this.user = this.getUser();
  }

  // Obtener token del localStorage
  getToken() {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      console.warn('Error accediendo a localStorage:', error);
      return null;
    }
  }

  // Obtener usuario del localStorage
  getUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.warn('Error parseando usuario:', error);
      return null;
    }
  }

  // Verificar si está autenticado
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!token && !!user && !this.isTokenExpired();
  }

  // Login con mejor manejo de errores y headers optimizados
  async login(username, password) {
    try {
      console.log('🔐 Intentando login...');
      console.log('🌐 URL de API:', `${API_BASE_URL}/api/auth`);

      // Limpiar posibles tokens anteriores para evitar headers grandes
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      const response = await fetch(`${API_BASE_URL}/api/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Headers mínimos para evitar error 431
        },
        body: JSON.stringify({ username, password }),
        // Configuración adicional para evitar cache
        cache: 'no-cache',
      });

      console.log('📡 Respuesta recibida:', response.status, response.statusText);

      // Verificar si la respuesta es JSON válido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Respuesta no es JSON:', contentType);
        const textResponse = await response.text();
        console.error('📄 Contenido de respuesta:', textResponse.substring(0, 500));

        throw new Error(`Servidor devolvió respuesta inválida (${response.status}). Verifica que las APIs estén funcionando.`);
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Error API Login:', data); // Log full error object
        throw new Error(data.details || data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.success && data.token && data.user) {
        // Guardar en localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Actualizar instancia
        this.token = data.token;
        this.user = data.user;

        console.log('✅ Login exitoso');
        return { success: true, user: data.user };
      } else {
        throw new Error('Respuesta de login inválida');
      }
    } catch (error) {
      console.error('❌ Error en login:', error);

      // Mensajes de error más específicos
      if (error.message.includes('Failed to fetch')) {
        throw new Error('No se puede conectar al servidor. Verifica que esté ejecutándose.');
      } else if (error.message.includes('Unexpected token')) {
        throw new Error('Error de servidor. Revisa la configuración de las APIs.');
      } else {
        throw error;
      }
    }
  }

  // Logout
  logout() {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      this.token = null;
      this.user = null;
      console.log('🚪 Logout exitoso');
    } catch (error) {
      console.error('❌ Error en logout:', error);
    }
  }

  // ✅ CÓDIGO CORRECTO
  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;

    try {
      // 1. Separar el token en sus 3 partes
      const payloadBase64 = token.split('.')[1];

      // 2. Si no tiene una parte de payload, es inválido
      if (!payloadBase64) {
        return true;
      }

      // 3. Decodificar SOLO la parte del payload
      const decodedJson = atob(payloadBase64);

      // 4. Convertir el JSON decodificado en un objeto
      const decodedPayload = JSON.parse(decodedJson);

      // 5. Comparar la fecha de expiración (exp) con la fecha actual
      // La fecha 'exp' está en segundos, Date.now() en milisegundos.
      if (decodedPayload.exp * 1000 < Date.now()) {
        console.log('⏰ Token expirado');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error verificando token:', error);
      return true; // Si hay error al decodificar, se asume que es inválido
    }
  }

  // Realizar petición autenticada con mejor manejo de errores
  async authenticatedFetch(url, options = {}) {
    const currentToken = this.getToken();

    if (!currentToken) {
      console.error('❌ No hay token disponible');
      throw new Error('No autorizado - Sin token');
    }

    if (this.isTokenExpired()) {
      this.logout();
      throw new Error('Sesión expirada');
    }

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...options.headers,
      },
      cache: 'no-store',
    };

    console.log('📡 Petición autenticada a:', url);

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        console.log('🔒 Respuesta 401 - Token inválido');
        this.logout();
        throw new Error('Sesión expirada');
      }

      // Verificar contenido JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ Respuesta no JSON:', textResponse.substring(0, 200));
        throw new Error('Respuesta inválida del servidor');
      }

      return response;
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Error de conexión con el servidor');
      }
      throw error;
    }
  }

  // Métodos para productos (con mejor manejo de errores)
  async getProducts() {
    try {
      console.log('📦 Obteniendo productos...');
      const response = await this.authenticatedFetch(`${API_BASE_URL}/api/admin/products`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const products = await response.json();
      console.log(`✅ ${products.length} productos obtenidos`);
      return products;
    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
      throw error;
    }
  }

  async createProduct(productData) {
    try {
      const response = await this.authenticatedFetch(`${API_BASE_URL}/api/admin/products`, {
        method: 'POST',
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Include details in error message for debugging
        const combinedError = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : (errorData.error || `HTTP error! status: ${response.status}`);

        console.error('SERVER ERROR DETAILS:', JSON.stringify(errorData, null, 2));
        alert(`Error del servidor: ${JSON.stringify(errorData, null, 2)}`); // Mostrar alerta visible
        throw new Error(combinedError);
      }

      dataService.invalidateCache();
      return await response.json();
    } catch (error) {
      console.error('❌ Error creando producto:', error);
      throw error;
    }
  }

  async updateProduct(productData) {
    try {
      if (!productData.id) {
        throw new Error('ID del producto es requerido');
      }
      const response = await this.authenticatedFetch(`${API_BASE_URL}/api/admin/products/${productData.id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      dataService.invalidateCache(); // 👈 3. Invalida la caché aquí también
      return await response.json();
    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
      throw error;
    }
  }

  async deleteProduct(productId) {
    try {
      const response = await this.authenticatedFetch(`${API_BASE_URL}/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      dataService.invalidateCache(); // 👈 4. Y aquí también
      return await response.json();
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      throw error;
    }
  }

  // Verificar conexión con el servidor
  async testConnection() {
    try {
      console.log('🔍 Probando conexión...');
      const response = await fetch(`${API_BASE_URL}/api/test-auth`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('📡 Estado de conexión:', response.status);
      return response.ok;
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
  }

  // ✅ Métodos para Categorías
  async getCategories() {
    try {
      // Esta API es pública, así que usamos fetch normal (aunque authenticatedFetch tmb funcionaría)
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (!response.ok) {
        throw new Error('Error al obtener categorías');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  async createCategory(name) {
    try {
      const response = await this.authenticatedFetch(`${API_BASE_URL}/api/admin/categories`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async deleteCategory(id) {
    try {
      const response = await this.authenticatedFetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // ✅ Methods for Shop Filters (Admin)
  async getAdminFilters() {
    try {
      const response = await this.authenticatedFetch(`${API_BASE_URL}/api/admin/filters`);
      if (!response.ok) throw new Error('Error fetching admin filters');
      return await response.json();
    } catch (error) {
      console.error('Error fetching admin filters:', error);
      throw error;
    }
  }

  async updateFilter(id, data) {
    try {
      const response = await this.authenticatedFetch(`${API_BASE_URL}/api/admin/filters/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Error updating filter');
      return await response.json();
    } catch (error) {
      console.error('Error updating filter:', error);
      throw error;
    }
  }

  // Métodos de utilidad
  getCurrentUser() {
    return this.user;
  }

  isAdmin() {
    return this.user && this.user.role === 'admin';
  }


  // Agregar esta nueva función
  async verifyToken() {
    try {
      const token = this.getToken();
      const user = this.getUser();

      if (!token || !user) {
        return false;
      }

      if (this.isTokenExpired()) {
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verificando token:', error);
      this.logout();
      return false;
    }
  }
}


const authService = new AuthService();
export default authService;