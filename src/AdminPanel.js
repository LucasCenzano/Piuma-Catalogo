import React, { useState, useEffect, useMemo } from 'react';
import authService from './authService';
import './AdminPanel.css';
import './AdminPanelResponsive.css';
import { Link } from 'react-router-dom';

// Categorías válidas con íconos
const ADMIN_SECTIONS = [
  { id: 'sales', name: 'Ventas', icon: '💰', path: '/admin/ventas' },
  { id: 'dashboard', name: 'Tablero', icon: '📊' },
  { id: 'products', name: 'Productos', icon: '🛍️' },
  { id: 'reports', name: 'Informes', icon: '📋' },
  { id: 'settings', name: 'Configuración', icon: '⚙️' }
];

// NOTE: VALID_CATEGORIES replaced by dynamic state

// Componente para imagen segura
const SafeImage = ({ src, alt, style, ...props }) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          border: '2px dashed #dee2e6',
          color: '#6c757d',
          fontSize: '0.8rem',
          textAlign: 'center',
          borderRadius: '8px'
        }}
        {...props}
      >
        📷 Sin imagen
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={() => setImageError(true)}
      {...props}
    />
  );
};

// Componente Dashboard Stats
const DashboardStats = ({ products, categoriesCount }) => {
  const stats = {
    total: products.length,
    inStock: products.filter(p => p.in_stock).length,
    outStock: products.filter(p => !p.in_stock).length,
    categories: categoriesCount || [...new Set(products.map(p => p.category))].length
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem',
      marginBottom: '3rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📦</div>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: '700' }}>{stats.total}</h3>
        <p style={{ margin: 0, opacity: 0.9 }}>Total Productos</p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #2ed573 0%, #3742fa 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(46, 213, 115, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: '700' }}>{stats.inStock}</h3>
        <p style={{ margin: 0, opacity: 0.9 }}>En Stock</p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(255, 107, 107, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>❌</div>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: '700' }}>{stats.outStock}</h3>
        <p style={{ margin: 0, opacity: 0.9 }}>Sin Stock</p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(255, 167, 38, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📂</div>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: '700' }}>{stats.categories}</h3>
        <p style={{ margin: 0, opacity: 0.9 }}>Categorías</p>
      </div>
    </div>
  );
};

// Componente principal del Admin Panel
const AdminPanel = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Categories State
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Filters State
  const [filters, setFilters] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');

  // ✅ 1. ESTADO PARA GUARDAR EL ORDEN
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });
  const [productSearch, setProductSearch] = useState('');

  // Estados para nuevo producto
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newInStock, setNewInStock] = useState(true);
  const [newImages, setNewImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  const [newIsFeatured, setNewIsFeatured] = useState(false);
  const [newIsNew, setNewIsNew] = useState(false);
  const [newDiscountPercentage, setNewDiscountPercentage] = useState(0);
  const [newTags, setNewTags] = useState([]); // Array of strings

  // Estados para variantes (colores) - Creación
  const [newVariants, setNewVariants] = useState([]); // [{color_name, in_stock, quantity}]
  const [tempVariantName, setTempVariantName] = useState('');
  const [tempVariantStock, setTempVariantStock] = useState(true);
  const [tempVariantQuantity, setTempVariantQuantity] = useState(0);

  // Estados para edición
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editInStock, setEditInStock] = useState(true);
  const [editImages, setEditImages] = useState([]);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsNew, setEditIsNew] = useState(false);
  const [editDiscountPercentage, setEditDiscountPercentage] = useState(0);
  const [editTags, setEditTags] = useState([]); // Array of strings

  // Estados para variantes (colores) - Edición
  const [editVariants, setEditVariants] = useState([]); // [{id, color_name, in_stock, quantity}]
  const [tempEditVariantName, setTempEditVariantName] = useState('');
  const [tempEditVariantStock, setTempEditVariantStock] = useState(true);
  const [tempEditVariantQuantity, setTempEditVariantQuantity] = useState(0);

  // ✅ 2. FUNCIÓN PARA ORDENAR (corregida)
  const requestSort = (key) => {
    let direction = 'ascending';
    // Si ya está ordenando por esta columna, invierte la dirección
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // ✅ 3. useMemo PARA ORDENAR Y FILTRAR LOS PRODUCTOS
  const sortedProducts = useMemo(() => {
    let sortableProducts = [...products];

    // Filtrar por búsqueda
    if (productSearch.trim()) {
      const searchLower = productSearch.toLowerCase();
      sortableProducts = sortableProducts.filter(product =>
        product.name?.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar
    if (sortConfig.key) {
      sortableProducts.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Manejar valores null/undefined
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        // SI ES PRECIO, CONVERTIR A NÚMERO
        if (sortConfig.key === 'price') {
          aValue = parseFloat(String(aValue).replace(/[^0-9.-]/g, '')) || 0;
          bValue = parseFloat(String(bValue).replace(/[^0-9.-]/g, '')) || 0;
        }

        // SI ES NOMBRE, CONVERTIR A MINÚSCULAS
        if (sortConfig.key === 'name') {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        // ✅ SI ES STOCK (BOOLEANO)
        if (sortConfig.key === 'in_stock') {
          // Convertir booleano a número: true = 1, false = 0
          aValue = aValue ? 1 : 0;
          bValue = bValue ? 1 : 0;
        }

        // Comparación
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProducts;
  }, [products, sortConfig, productSearch]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setError('No tienes permisos para acceder a esta página');
      setLoading(false);
      return;
    }
    loadProducts();
    loadCategories();
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      setLoadingFilters(true);
      const data = await authService.getAdminFilters();
      setFilters(data);
    } catch (e) {
      console.error('Error loading filters:', e);
    } finally {
      setLoadingFilters(false);
    }
  };

  const handleUpdateFilterLabel = async (filterId, newLabel) => {
    const label = prompt('Nuevo nombre para el filtro:', newLabel);
    if (!label || label === newLabel) return;
    try {
      await authService.updateFilter(filterId, { label });
      loadFilters();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFilter = async (filterId, currentState) => {
    try {
      await authService.updateFilter(filterId, { is_active: !currentState });
      loadFilters();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateFilter = async (e) => {
    e.preventDefault();
    if (!newFilterName.trim()) return;
    try {
      const res = await authService.authenticatedFetch('/api/admin/filters', {
        method: 'POST',
        body: JSON.stringify({ label: newFilterName })
      });
      if (res.ok) {
        setNewFilterName('');
        loadFilters();
      } else {
        const d = await res.json();
        alert(d.error || 'Error creando filtro');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFilter = async (id) => {
    if (!window.confirm('¿Eliminar este filtro?')) return;
    try {
      const res = await authService.authenticatedFetch(`/api/admin/filters/${id}`, { method: 'DELETE' });
      if (res.ok) loadFilters();
    } catch (e) { console.error(e); }
  };



  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const cats = await authService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setLoading(true);
      await authService.createCategory(newCategoryName);
      setNewCategoryName('');
      await loadCategories();
      alert('Categoría creada exitosamente');
    } catch (error) {
      console.error('Error creando categoría:', error);
      setError(`Error creando categoría: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta categoría?')) return;

    try {
      setLoading(true);
      await authService.deleteCategory(id);
      await loadCategories();
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      alert(error.message); // Mostrar error (ej: si hay productos usándola)
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const productsData = await authService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setError(`Error cargando productos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();

    if (!newName.trim()) {
      alert('El nombre es requerido');
      return;
    }

    if (!newCategory) {
      alert('La categoría es requerida');
      return;
    }

    try {
      setLoading(true);

      await authService.createProduct({
        name: newName.trim(),
        price: newPrice.trim(),
        category: newCategory,
        description: newDescription.trim(),
        inStock: newInStock,
        imagesUrl: newImages,
        isFeatured: newIsFeatured,
        isNew: newIsNew,
        discountPercentage: parseInt(newDiscountPercentage) || 0,
        variants: newVariants, // Enviar variantes
        tags: newTags // Send tags
      });

      // Limpiar formulario
      setNewName('');
      setNewPrice('');
      setNewCategory('');
      setNewDescription('');
      setNewInStock(true);
      setNewImages([]);
      setNewImageUrl('');
      setNewIsFeatured(false);
      setNewIsNew(false);
      setNewDiscountPercentage(0);
      setNewVariants([]); // Reset variants
      setTempVariantName('');
      setTempVariantStock(true);
      setNewTags([]); // Reset tags
      setNewTags([]); // Reset tags
      setShowAddForm(false);

      await loadProducts();
      alert('Producto creado exitosamente');
    } catch (error) {
      console.error('Error creando producto:', error);
      setError(`Error creando producto: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    if (!editName.trim()) {
      alert('El nombre es requerido');
      return;
    }

    if (!editCategory) {
      alert('La categoría es requerida');
      return;
    }

    try {
      setLoading(true);

      await authService.updateProduct({
        id: editingProductId,
        name: editName.trim(),
        price: editPrice.trim(),
        category: editCategory,
        description: editDescription.trim(),
        inStock: editInStock,
        imagesUrl: editImages,
        isFeatured: editIsFeatured,
        isNew: editIsNew,
        discountPercentage: parseInt(editDiscountPercentage) || 0,
        variants: editVariants, // Enviar variantes actualizadas
        tags: editTags
      });

      cancelEditing();
      await loadProducts();
      alert('Producto actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando producto:', error);
      setError(`Error actualizando producto: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de que quieres DESACTIVAR este producto? Ya no será visible en el catálogo.')) {
      return;
    }

    try {
      setLoading(true);
      await authService.deleteProduct(productId);
      await loadProducts();
      alert('Producto DESACTIVADO exitosamente');
    } catch (error) {
      console.error('Error desactivando  producto:', error);
      setError(`Error desactivando  producto: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStock = async (product) => {
    try {
      await authService.updateProduct({
        id: product.id,
        inStock: !product.in_stock
      });
      await loadProducts();
    } catch (error) {
      console.error('Error actualizando stock:', error);
      setError(`Error actualizando stock: ${error.message}`);
    }
  };

  const startEditing = (product) => {
    setEditingProductId(product.id);
    setEditName(product.name || '');
    setEditPrice(String(product.price || ''));
    setEditCategory(product.category || '');
    setEditDescription(product.description || '');
    setEditInStock(product.in_stock);
    setEditImages(Array.isArray(product.images_url) ? product.images_url : []);
    setEditImageUrl('');
    setEditIsFeatured(product.is_featured || false);
    setEditIsNew(product.is_new || false);
    setEditDiscountPercentage(product.discount_percentage || 0);
    setEditVariants(product.variants || []); // Load variants
    setEditTags(product.tags || []);
  };

  const cancelEditing = () => {
    setEditingProductId(null);
    setEditName('');
    setEditPrice('');
    setEditCategory('');
    setEditDescription('');
    setEditInStock(true);
    setEditImages([]);
    setEditImageUrl('');
    setEditIsFeatured(false);
    setEditIsNew(false);
    setEditDiscountPercentage(0);
    setEditVariants([]);
    setTempEditVariantName('');
    setTempEditVariantStock(true);
  };

  const addNewImage = () => {
    if (newImageUrl.trim()) {
      setNewImages([...newImages, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeNewImage = (index) => {
    const updated = newImages.filter((_, i) => i !== index);
    setNewImages(updated);
  };

  const addEditImage = () => {
    if (editImageUrl.trim()) {
      setEditImages([...editImages, editImageUrl.trim()]);
      setEditImageUrl('');
    }
  };

  const removeEditImage = (index) => {
    const updated = editImages.filter((_, i) => i !== index);
    setEditImages(updated);
  };

  const getProductImageUrl = (product) => {
    if (!product.images_url || !Array.isArray(product.images_url) || product.images_url.length === 0) {
      return null;
    }
    return product.images_url.find(url => url && url.trim().length > 0) || null;
  };

  const handleLogout = () => {
    authService.logout();
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  // Funciones para gestionar variantes (Create)
  const addVariant = () => {
    if (tempVariantName.trim()) {
      setNewVariants([...newVariants, {
        color_name: tempVariantName.trim(),
        in_stock: tempVariantStock,
        quantity: parseInt(tempVariantQuantity) || 0
      }]);
      setTempVariantName('');
      setTempVariantStock(true);
      setTempVariantQuantity(0);
    }
  };

  const removeVariant = (index) => {
    const updated = [...newVariants];
    updated.splice(index, 1);
    setNewVariants(updated);
  };

  const addEditVariant = () => {
    if (tempEditVariantName.trim()) {
      setEditVariants([...editVariants, {
        color_name: tempEditVariantName.trim(),
        in_stock: parseInt(tempEditVariantQuantity) > 0, // Auto logic
        quantity: parseInt(tempEditVariantQuantity) || 0
      }]);
      setTempEditVariantName('');
      setTempEditVariantStock(true);
      setTempEditVariantQuantity(0);
    }
  };

  const removeEditVariant = (index) => {
    setEditVariants(editVariants.filter((_, i) => i !== index));
  };

  // Renderizar contenido según la sección activa
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div>
            <h2 style={{
              fontFamily: 'Didot, serif',
              fontSize: '2.5rem',
              color: '#333',
              textAlign: 'center',
              marginBottom: '3rem',
              fontWeight: '400'
            }}>
              📊 Panel de Control
            </h2>
            <DashboardStats products={products} categoriesCount={categories.length} />

            {/* Productos recientes */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(230, 227, 212, 0.5)'
            }}>
              <h3 style={{
                fontFamily: 'Didot, serif',
                fontSize: '1.8rem',
                color: '#333',
                marginBottom: '1.5rem',
                fontWeight: '400'
              }}>
                📦 Productos Recientes
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1.5rem'
              }}>
                {products.slice(0, 6).map(product => (
                  <div key={product.id} style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRadius: '12px',
                    padding: '1rem',
                    textAlign: 'center',
                    border: '1px solid #dee2e6'
                  }}>
                    <SafeImage
                      src={getProductImageUrl(product)}
                      alt={product.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        margin: '0 auto 1rem'
                      }}
                    />
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>{product.name}</h4>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: product.in_stock ? '#d4edda' : '#f8d7da',
                      color: product.in_stock ? '#155724' : '#721c24'
                    }}>
                      {product.in_stock ? '✅ En Stock' : '❌ Sin Stock'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acceso directo al módulo de ventas */}
            <div style={{
              background: 'linear-gradient(135deg, #6b7c59 0%, #8b9a7a 100%)',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '3rem',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(40, 167, 69, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
              <h3 style={{
                color: 'white',
                fontSize: '1.8rem',
                marginBottom: '1rem',
                fontFamily: 'Didot, serif',
                fontWeight: '400'
              }}>
                Módulo de Ventas
              </h3>
              <p style={{ color: 'white', opacity: 0.9, marginBottom: '2rem', fontSize: '1.1rem' }}>
                Registra ventas, gestiona clientes y visualiza estadísticas
              </p>
              <Link to="/admin/ventas" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    background: 'white',
                    color: '#6b7c59',
                    // ... los mismos estilos que ya tenías
                    border: 'none',
                    padding: '1rem 2.5rem',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease'
                  }}
                // Ya no necesita el onClick
                >
                  🚀 Ir a Ventas
                </button>
              </Link>
            </div>
          </div>
        );

      case 'products':
        return (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <h2 style={{
                fontFamily: 'Didot, serif',
                fontSize: '2.5rem',
                color: '#333',
                margin: 0,
                fontWeight: '400'
              }}>
                🛍️ Gestión de Productos ({products.length})
              </h2>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(212, 175, 55, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.3)';
                }}
              >
                {showAddForm ? '❌ Cancelar' : '➕ Agregar Producto'}
              </button>
            </div>

            {/* Controles de ordenamiento */}
            <div style={{
              background: 'linear-gradient(135deg, #f3f1eb 0%, #f8f6f0 100%)',
              padding: '1.5rem',
              borderRadius: '16px',
              marginBottom: '2rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '2px solid rgba(212, 175, 55, 0.2)'
            }}>
              <label style={{
                display: 'block',
                fontWeight: '600',
                fontSize: '1rem',
                color: '#333',
                fontFamily: 'Montserrat, sans-serif',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🔍 Buscar Producto
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Escribí el nombre del producto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem 3rem 1rem 1rem',
                    borderRadius: '12px',
                    border: '2px solid #e9ecef',
                    fontSize: '1rem',
                    fontFamily: 'Montserrat, sans-serif',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#d4af37'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />

                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      color: '#999',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}
              </div>

              {productSearch && (
                <div style={{
                  marginTop: '0.75rem',
                  fontSize: '0.9rem',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  {sortedProducts.length === 0
                    ? '❌ No se encontraron productos'
                    : `✅ ${sortedProducts.length} producto${sortedProducts.length !== 1 ? 's' : ''} encontrado${sortedProducts.length !== 1 ? 's' : ''}`
                  }
                </div>
              )}
            </div>

            {/* Formulario de agregar producto */}
            {showAddForm && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: window.innerWidth < 768 ? '1.5rem' : '2.5rem',
                marginBottom: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(230, 227, 212, 0.5)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #d4af37 0%, #e6c757 50%, #d4af37 100%)'
                }} />

                <h3 style={{
                  fontFamily: 'Didot, serif',
                  fontSize: '1.8rem',
                  color: '#333',
                  textAlign: 'center',
                  marginBottom: '2rem',
                  fontWeight: '400'
                }}>
                  ✨ Nuevo Producto
                </h3>

                <form onSubmit={handleCreateProduct}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <input
                      type="text"
                      placeholder="Nombre del producto"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      style={{
                        padding: '1rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontFamily: 'Montserrat, sans-serif',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                    />

                    <input
                      type="text"
                      placeholder="Precio (ej: $25.000)"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      style={{
                        padding: '1rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontFamily: 'Montserrat, sans-serif',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      required
                      style={{
                        padding: '1rem',
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontFamily: 'Montserrat, sans-serif',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '1rem',
                      background: '#f8f9fa',
                      borderRadius: '12px',
                      border: '2px solid #e9ecef',
                      cursor: 'pointer',
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: '500'
                    }}>
                      <input
                        type="checkbox"
                        checked={newInStock}
                        onChange={(e) => setNewInStock(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#d4af37' }}
                      />
                      En Stock
                    </label>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    border: '1px solid #e9ecef'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
                      <input
                        type="checkbox"
                        checked={newIsNew}
                        onChange={(e) => setNewIsNew(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#6b7c59' }}
                      />
                      🆕 Nuevo
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
                      <input
                        type="checkbox"
                        checked={newIsFeatured}
                        onChange={(e) => setNewIsFeatured(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#ffc107' }}
                      />
                      ⭐ Destacado
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif' }}>🏷️ Oferta (%):</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={newDiscountPercentage}
                        onChange={(e) => setNewDiscountPercentage(e.target.value)}
                        style={{
                          width: '80px',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          border: '1px solid #ced4da',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <textarea
                    placeholder="Descripción del producto"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '2px solid #e9ecef',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontFamily: 'Montserrat, sans-serif',
                      resize: 'vertical',
                      marginBottom: '1.5rem',
                      outline: 'none'
                    }}
                  />

                  {/* Sección de Variantes (Colores) */}
                  <div style={{
                    background: '#f8f9fa',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    border: '1px solid #e9ecef'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1.1rem' }}>🎨 Colores / Variantes</h4>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      {newVariants.map((variant, idx) => (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.5rem 1rem', background: 'white', border: '1px solid #dee2e6', borderRadius: '20px'
                        }}>
                          <span style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: variant.in_stock ? '#6b7c59' : '#a85751'
                          }}></span>
                          <span style={{ fontWeight: '500' }}>{variant.color_name}</span>
                          <button type="button" onClick={() => removeVariant(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666' }}>✕</button>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                      gap: '1rem',
                      alignItems: window.innerWidth < 768 ? 'stretch' : 'center'
                    }}>
                      <input
                        type="text"
                        placeholder="Nombre del color (ej: Rojo)"
                        value={tempVariantName}
                        onChange={(e) => setTempVariantName(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #ced4da',
                          width: window.innerWidth < 768 ? '100%' : 'auto',
                          boxSizing: 'border-box'
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Cant."
                        value={tempVariantQuantity}
                        onChange={(e) => setTempVariantQuantity(e.target.value)}
                        style={{
                          width: window.innerWidth < 768 ? '100%' : '80px',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #ced4da',
                          boxSizing: 'border-box'
                        }}
                      />
                      <label style={{ display: 'none' }}>
                        <input
                          type="checkbox"
                          checked={tempVariantStock}
                          onChange={(e) => setTempVariantStock(e.target.checked)}
                        />
                        En Stock
                      </label>
                      <button
                        type="button"
                        onClick={addVariant}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: '#333',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          width: window.innerWidth < 768 ? '100%' : 'auto'
                        }}
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>

                  {/* Sección de imágenes */}
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

                    <div style={{
                      display: 'flex',
                      flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                      gap: '1rem',
                      marginBottom: '1rem',
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

                    {newImages.length > 0 && (
                      <div>
                        <p style={{ marginBottom: '1rem', fontWeight: '500' }}>
                          Imágenes agregadas ({newImages.length}/10):
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {newImages.map((url, index) => (
                            <div key={index} style={{ position: 'relative' }}>
                              <SafeImage
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

                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center',
                    paddingTop: '1rem',
                    borderTop: '2px solid rgba(230, 227, 212, 0.6)',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        background: loading ? '#6c757d' : 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '1rem 3rem',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
                        transition: 'all 0.3s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '180px'
                      }}
                    >
                      {loading ? '⏳ Creando...' : '✨ Crear Producto'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      style={{
                        background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '1rem 3rem',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '180px'
                      }}
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de productos */}
            {products.length === 0 ? (
              <div style={{
                background: 'white',
                padding: '4rem 2rem',
                textAlign: 'center',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(230, 227, 212, 0.5)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📦</div>
                <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
                  No hay productos cargados
                </p>
                <button
                  onClick={loadProducts}
                  style={{
                    background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  🔄 Recargar
                </button>
              </div>
            ) : (
              <>
                <div className="desktop-view" style={{
                  background: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(230, 227, 212, 0.5)'
                }}>
                  <div style={{
                    overflowX: 'auto',
                    minWidth: '100%'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      minWidth: '800px'
                    }}>
                      <thead>
                        <tr style={{
                          background: 'linear-gradient(135deg, #e6e3d4 0%, #ddd8c7 100%)'
                        }}>
                          <th style={{
                            padding: '1.5rem 1rem',
                            textAlign: 'left',
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            color: '#333',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '2px solid rgba(230, 227, 212, 0.8)'
                          }}>ID</th>

                          <th style={{
                            padding: '1.5rem 1rem',
                            textAlign: 'left',
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            color: '#333',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '2px solid rgba(230, 227, 212, 0.8)'
                          }}>Imagen</th>

                          <th style={{
                            padding: '1.5rem 1rem',
                            textAlign: 'left',
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            color: '#333',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '2px solid rgba(230, 227, 212, 0.8)'
                          }}>Nombre</th>

                          <th style={{
                            padding: '1.5rem 1rem',
                            textAlign: 'left',
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            color: '#333',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '2px solid rgba(230, 227, 212, 0.8)',
                            maxWidth: '200px'
                          }}>Descripción</th>

                          <th style={{
                            padding: '1.5rem 1rem',
                            textAlign: 'left',
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            color: '#333',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '2px solid rgba(230, 227, 212, 0.8)'
                          }}>Precio</th>

                          <th style={{
                            padding: '1.5rem 1rem',
                            textAlign: 'left',
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            color: '#333',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '2px solid rgba(230, 227, 212, 0.8)'
                          }}>Categoría</th>

                          <th style={{
                            padding: '1.5rem 1rem',
                            textAlign: 'left',
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            color: '#333',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '2px solid rgba(230, 227, 212, 0.8)'
                          }}>Stock</th>

                          <th style={{
                            padding: '1.5rem 1rem',
                            textAlign: 'left',
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            color: '#333',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '2px solid rgba(230, 227, 212, 0.8)'
                          }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedProducts.map(product => (
                          <React.Fragment key={product.id}>
                            <tr style={{
                              borderBottom: '1px solid rgba(230, 227, 212, 0.4)',
                              transition: 'all 0.3s ease',
                              backgroundColor: editingProductId === product.id ? 'rgba(212, 175, 55, 0.1)' : 'transparent'
                            }}>
                              <td style={{
                                padding: '1.25rem 1rem',
                                color: '#333',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                              }}>{product.id}</td>
                              <td style={{ padding: '1.25rem 1rem' }}>
                                <SafeImage
                                  src={getProductImageUrl(product)}
                                  alt={product.name}
                                  style={{
                                    width: '60px',
                                    height: '60px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    border: '2px solid #dee2e6'
                                  }}
                                />
                              </td>
                              <td style={{
                                padding: '1.25rem 1rem',
                                color: '#333',
                                fontSize: '0.9rem'
                              }}>
                                <strong>{product.name}</strong>
                                {(!product.images_url || product.images_url.length === 0) && (
                                  <div style={{
                                    fontSize: '0.7rem',
                                    color: '#e67e22',
                                    marginTop: '2px',
                                    fontWeight: '500'
                                  }}>
                                    ⚠️ Sin imágenes
                                  </div>
                                )}
                              </td>
                              <td style={{
                                padding: '1.25rem 1rem',
                                color: '#666',
                                fontSize: '0.85rem',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {product.description || '—'}
                              </td>
                              <td style={{
                                padding: '1.25rem 1rem',
                                color: '#333',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                              }}>{product.price}</td>
                              <td style={{
                                padding: '1.25rem 1rem',
                                color: '#666',
                                fontSize: '0.9rem'
                              }}>{product.category}</td>
                              <td style={{
                                padding: '1.25rem 1rem',
                                borderBottom: '1px solid rgba(230, 227, 212, 0.5)'
                              }}>
                                {product.variants && product.variants.length > 0 ? (
                                  <div style={{ fontSize: '0.85rem' }}>
                                    {product.variants.map((v, i) => (
                                      <div key={i} style={{ marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#333', fontWeight: '500' }}>{v.color_name}:</span>
                                        <span style={{ color: v.quantity > 0 ? '#6b7c59' : '#a85751' }}>{v.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleToggleStock(product)}
                                    disabled={loading}
                                    style={{
                                      padding: '0.6rem 1.2rem',
                                      borderRadius: '20px',
                                      fontSize: '0.8rem',
                                      fontWeight: '500',
                                      cursor: loading ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.3s ease',
                                      minWidth: '120px',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      background: product.in_stock
                                        ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'
                                        : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                                      color: product.in_stock ? '#155724' : '#721c24',
                                      border: `1px solid ${product.in_stock ? 'rgba(21, 87, 36, 0.2)' : 'rgba(114, 28, 36, 0.2)'}`,
                                      opacity: loading ? 0.5 : 1
                                    }}
                                  >
                                    {product.in_stock ? 'En Stock' : 'Sin Stock'}
                                  </button>
                                )}
                              </td>
                              <td style={{ padding: '1.25rem 1rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => editingProductId === product.id ? cancelEditing() : startEditing(product)}
                                    disabled={loading}
                                    style={{
                                      padding: '0.6rem 1rem',
                                      background: editingProductId === product.id
                                        ? 'linear-gradient(135deg, #a85751 0%, #8b4640 100%)'
                                        : 'linear-gradient(135deg, #2c3e50 0%, #1a252f 100%)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      fontSize: '0.8rem',
                                      cursor: loading ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.3s ease',
                                      fontWeight: '500',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      minWidth: '80px',
                                      opacity: loading ? 0.5 : 1
                                    }}
                                  >
                                    {editingProductId === product.id ? '❌ Cancelar' : '✏️ Editar'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    disabled={loading || editingProductId === product.id}
                                    style={{
                                      padding: '0.6rem 1rem',
                                      background: 'linear-gradient(135deg, #a85751 0%, #8b4640 100%)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      fontSize: '0.8rem',
                                      cursor: (loading || editingProductId === product.id) ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.3s ease',
                                      fontWeight: '500',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      minWidth: '80px',
                                      opacity: (loading || editingProductId === product.id) ? 0.5 : 1
                                    }}
                                  >
                                    🗑️ Desactivar
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Formulario de edición inline */}
                            {editingProductId === product.id && (
                              <tr style={{ background: 'white' }}>
                                <td colSpan="8">
                                  <div style={{
                                    padding: '2.5rem',
                                    border: '2px solid #d4af37',
                                    borderRadius: '16px',
                                    margin: '1rem',
                                    background: 'white',
                                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      height: '4px',
                                      background: 'linear-gradient(90deg, #d4af37 0%, #e6c757 50%, #d4af37 100%)'
                                    }} />

                                    <h4 style={{
                                      fontFamily: 'Didot, serif',
                                      color: '#333',
                                      margin: '0 0 2rem 0',
                                      fontSize: '1.4rem',
                                      fontWeight: '400',
                                      textAlign: 'center'
                                    }}>
                                      ✏️ Editando: {product.name}
                                    </h4>

                                    <form onSubmit={handleUpdateProduct}>
                                      <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                        gap: '2rem',
                                        marginBottom: '2rem'
                                      }}>
                                        <div>
                                          <h5 style={{
                                            margin: '0 0 1rem 0',
                                            color: '#333',
                                            fontSize: '1rem',
                                            fontWeight: '600'
                                          }}>
                                            📝 Información Básica
                                          </h5>

                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <input
                                              type="text"
                                              value={editName}
                                              onChange={(e) => setEditName(e.target.value)}
                                              placeholder="Nombre del producto"
                                              required
                                              style={{
                                                padding: '1rem',
                                                border: '2px solid #e9ecef',
                                                borderRadius: '12px',
                                                fontSize: '1rem',
                                                outline: 'none',
                                                transition: 'all 0.3s ease'
                                              }}
                                            />

                                            <input
                                              type="text"
                                              value={editPrice}
                                              onChange={(e) => setEditPrice(e.target.value)}
                                              placeholder="Precio (ej: $25.000)"
                                              style={{
                                                padding: '1rem',
                                                border: '2px solid #e9ecef',
                                                borderRadius: '12px',
                                                fontSize: '1rem',
                                                outline: 'none',
                                                transition: 'all 0.3s ease'
                                              }}
                                            />

                                            <select
                                              value={editCategory}
                                              onChange={(e) => setEditCategory(e.target.value)}
                                              required
                                              style={{
                                                padding: '1rem',
                                                border: '2px solid #e9ecef',
                                                borderRadius: '12px',
                                                fontSize: '1rem',
                                                backgroundColor: 'white',
                                                cursor: 'pointer',
                                                outline: 'none'
                                              }}
                                            >
                                              <option value="">Seleccionar categoría</option>
                                              {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                              ))}
                                            </select>

                                            <label style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '0.75rem',
                                              padding: '1rem',
                                              background: '#f8f9fa',
                                              borderRadius: '12px',
                                              border: '2px solid #e9ecef',
                                              cursor: 'pointer',
                                              fontWeight: '500'
                                            }}>
                                              <input
                                                type="checkbox"
                                                checked={editInStock}
                                                onChange={(e) => setEditInStock(e.target.checked)}
                                                style={{ width: '18px', height: '18px', accentColor: '#d4af37' }}
                                              />
                                              En Stock
                                            </label>

                                            <div style={{
                                              display: 'grid',
                                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                              gap: '1rem',
                                              padding: '1rem',
                                              background: '#fff',
                                              borderRadius: '12px',
                                              border: '1px solid #e9ecef',
                                              marginTop: '0.5rem'
                                            }}>
                                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
                                                <input
                                                  type="checkbox"
                                                  checked={editIsNew}
                                                  onChange={(e) => setEditIsNew(e.target.checked)}
                                                  style={{ width: '18px', height: '18px', accentColor: '#6b7c59' }}
                                                />
                                                🆕 Nuevo
                                              </label>

                                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
                                                <input
                                                  type="checkbox"
                                                  checked={editIsFeatured}
                                                  onChange={(e) => setEditIsFeatured(e.target.checked)}
                                                  style={{ width: '18px', height: '18px', accentColor: '#ffc107' }}
                                                />
                                                ⭐ Destacado
                                              </label>

                                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontFamily: 'Montserrat, sans-serif' }}>🏷️ Oferta (%):</span>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  max="100"
                                                  placeholder="0"
                                                  value={editDiscountPercentage}
                                                  onChange={(e) => setEditDiscountPercentage(e.target.value)}
                                                  style={{
                                                    width: '80px',
                                                    padding: '0.5rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid #ced4da',
                                                    outline: 'none'
                                                  }}
                                                />
                                              </div>
                                            </div>

                                            <textarea
                                              value={editDescription}
                                              onChange={(e) => setEditDescription(e.target.value)}
                                              placeholder="Descripción del producto"
                                              rows={3}
                                              style={{
                                                padding: '1rem',
                                                border: '2px solid #e9ecef',
                                                borderRadius: '12px',
                                                fontSize: '1rem',
                                                resize: 'vertical',
                                                outline: 'none',
                                                transition: 'all 0.3s ease'
                                              }}
                                            />
                                          </div>
                                        </div>

                                        <div>
                                          <h5 style={{
                                            margin: '0 0 1rem 0',
                                            color: '#333',
                                            fontSize: '1rem',
                                            fontWeight: '600'
                                          }}>
                                            🖼️ Gestión de Imágenes
                                          </h5>

                                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                            <input
                                              type="url"
                                              placeholder="URL de la imagen"
                                              value={editImageUrl}
                                              onChange={(e) => setEditImageUrl(e.target.value)}
                                              style={{
                                                flex: 1,
                                                padding: '1rem',
                                                border: '2px solid #e9ecef',
                                                borderRadius: '12px',
                                                fontSize: '1rem',
                                                outline: 'none'
                                              }}
                                            />

                                            <button
                                              type="button"
                                              onClick={addEditImage}
                                              disabled={!editImageUrl}
                                              style={{
                                                background: editImageUrl ? 'linear-gradient(135deg, #6b7c59 0%, #8b9a7a 100%)' : '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                padding: '1rem',
                                                borderRadius: '12px',
                                                cursor: editImageUrl ? 'pointer' : 'not-allowed',
                                                fontWeight: '600',
                                                minWidth: '80px'
                                              }}
                                            >
                                              ➕
                                            </button>
                                          </div>

                                          {editImages.length > 0 && (
                                            <div>
                                              <p style={{ marginBottom: '1rem', fontWeight: '500' }}>
                                                Imágenes ({editImages.length}/10):
                                              </p>
                                              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                {editImages.map((url, index) => (
                                                  <div key={index} style={{ position: 'relative' }}>
                                                    <SafeImage
                                                      src={url}
                                                      alt={`Imagen ${index + 1}`}
                                                      style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        objectFit: 'cover',
                                                        borderRadius: '8px',
                                                        border: '2px solid #dee2e6'
                                                      }}
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => removeEditImage(index)}
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
                                                        justifyContent: 'center'
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
                                      </div>

                                      {/* Sección de Variantes (Colores) - EDICIÓN (DESKTOP) */}
                                      <div style={{
                                        background: '#f8f9fa',
                                        padding: '1.5rem',
                                        borderRadius: '12px',
                                        marginBottom: '1.5rem',
                                        border: '1px solid #e9ecef'
                                      }}>
                                        <h5 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1rem', fontWeight: '600' }}>
                                          🎨 Gestión de Colores / Variantes ({editVariants.length})
                                        </h5>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.5rem' }}>
                                          {editVariants.map((variant, idx) => (
                                            <div key={idx} style={{
                                              display: 'flex', alignItems: 'center', gap: '0.5rem',
                                              padding: '0.5rem 1rem', background: 'white', border: '1px solid #dee2e6', borderRadius: '20px', fontSize: '0.9rem',
                                              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                            }}>
                                              <span style={{
                                                width: '12px', height: '12px', borderRadius: '50%',
                                                background: variant.in_stock ? '#6b7c59' : '#a85751'
                                              }}></span>
                                              <span style={{ fontWeight: '500' }}>{variant.color_name} : {variant.quantity || 0}</span>
                                              <button type="button" onClick={() => removeEditVariant(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666', padding: '0 0 0 5px' }}>✕</button>
                                            </div>
                                          ))}
                                          {editVariants.length === 0 && <span style={{ fontStyle: 'italic', color: '#999' }}>No hay variantes asignadas.</span>}
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'white', padding: '0.8rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                                          <input
                                            type="text"
                                            placeholder="Nombre del color (ej: Rojo)"
                                            value={tempEditVariantName}
                                            onChange={(e) => setTempEditVariantName(e.target.value)}
                                            style={{ flex: 1, padding: '0.8rem', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.95rem' }}
                                          />
                                          <input
                                            type="number"
                                            placeholder="Cant."
                                            value={tempEditVariantQuantity}
                                            onChange={(e) => setTempEditVariantQuantity(e.target.value)}
                                            style={{ width: '80px', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                                          />
                                          <label style={{ display: 'none' }}>
                                            <input
                                              type="checkbox"
                                              checked={tempEditVariantStock}
                                              onChange={(e) => setTempEditVariantStock(e.target.checked)}
                                              style={{ width: '18px', height: '18px', accentColor: '#6b7c59' }}
                                            />
                                            <span style={{ fontWeight: '500' }}>En Stock</span>
                                          </label>
                                          <button
                                            type="button"
                                            onClick={addEditVariant}
                                            style={{
                                              padding: '0.8rem 1.5rem', background: '#333', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600'
                                            }}
                                          >
                                            + Agregar Color
                                          </button>
                                        </div>
                                      </div>

                                      <div style={{
                                        display: 'flex',
                                        gap: '1rem',
                                        justifyContent: 'center',
                                        paddingTop: '2rem',
                                        borderTop: '2px solid rgba(230, 227, 212, 0.6)'
                                      }}>
                                        <button
                                          type="submit"
                                          disabled={loading}
                                          style={{
                                            background: loading ? '#6c757d' : 'linear-gradient(135deg, #6b7c59 0%, #8b9a7a 100%)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '1rem 2.5rem',
                                            borderRadius: '12px',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.3s ease',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            minWidth: '160px'
                                          }}
                                        >
                                          {loading ? '⏳ Guardando...' : '✅ Guardar Cambios'}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={cancelEditing}
                                          style={{
                                            background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '1rem 2.5rem',
                                            borderRadius: '12px',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            minWidth: '160px'
                                          }}
                                        >
                                          ❌ Cancelar
                                        </button>
                                      </div>
                                    </form>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mobile-view" style={{ display: 'none', flexDirection: 'column', gap: '1.5rem' }}>
                  {sortedProducts.map(product => (
                    <div key={product.id} style={{
                      background: 'white',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(230, 227, 212, 0.6)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {editingProductId === product.id ? (
                        <div style={{ padding: '1.5rem' }}>
                          <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>✏️ Editando {product.name}</h4>
                          <form onSubmit={handleUpdateProduct}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nombre" style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px', width: '100%', fontSize: '16px' }} />
                              <input type="text" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="Precio" style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px', width: '100%', fontSize: '16px' }} />
                              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px', width: '100%', fontSize: '16px', background: 'white' }}>
                                <option value="">Categoría</option>
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              </select>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
                                <input type="checkbox" checked={editInStock} onChange={(e) => setEditInStock(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#d4af37' }} />
                                <span>En Stock</span>
                              </div>

                              <div style={{ padding: '0.8rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <input type="checkbox" checked={editIsNew} onChange={(e) => setEditIsNew(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#6b7c59' }} />
                                  <span>🆕 Nuevo</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <input type="checkbox" checked={editIsFeatured} onChange={(e) => setEditIsFeatured(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#ffc107' }} />
                                  <span>⭐ Destacado</span>
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span>🏷️ Oferta (%):</span>
                                  <input type="number" value={editDiscountPercentage} onChange={(e) => setEditDiscountPercentage(e.target.value)} placeholder="0" style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', width: '60px' }} />
                                </div>
                              </div>

                              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Descripción" rows={3} style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px', width: '100%', fontSize: '16px' }} />

                              {/* Sección de Imágenes en Móvil */}
                              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                                <h5 style={{ margin: '0 0 0.8rem 0', fontSize: '0.95rem', color: '#666' }}>🖼️ Imágenes ({editImages.length})</h5>

                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                  <input
                                    type="url"
                                    placeholder="URL de imagen..."
                                    value={editImageUrl}
                                    onChange={(e) => setEditImageUrl(e.target.value)}
                                    style={{ flex: 1, padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={addEditImage}
                                    disabled={!editImageUrl}
                                    style={{
                                      background: editImageUrl ? '#6b7c59' : '#ccc',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      width: '50px',
                                      fontSize: '1.2rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    +
                                  </button>
                                </div>

                                {editImages.length > 0 ? (
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                                    gap: '0.8rem'
                                  }}>
                                    {editImages.map((url, i) => (
                                      <div key={i} style={{ position: 'relative', aspectRatio: '1' }}>
                                        <SafeImage
                                          src={url}
                                          alt={`Img ${i}`}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            border: '1px solid #dee2e6'
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeEditImage(i)}
                                          style={{
                                            position: 'absolute',
                                            top: '-5px',
                                            right: '-5px',
                                            background: '#a85751',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '22px',
                                            height: '22px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                          }}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p style={{ fontSize: '0.85rem', color: '#999', textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Sin imágenes</p>
                                )}
                              </div>



                              {/* Sección de Variantes (Colores) - EDICIÓN */}
                              <div style={{
                                background: '#f8f9fa',
                                padding: '1rem',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                border: '1px solid #e9ecef'
                              }}>
                                <h5 style={{ margin: '0 0 0.8rem 0', fontSize: '0.95rem', color: '#666' }}>🎨 Colores / Variantes ({editVariants.length})</h5>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                                  {editVariants.map((variant, idx) => (
                                    <div key={idx} style={{
                                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                                      padding: '0.4rem 0.8rem', background: 'white', border: '1px solid #dee2e6', borderRadius: '20px', fontSize: '0.85rem'
                                    }}>
                                      <span style={{
                                        width: '10px', height: '10px', borderRadius: '50%',
                                        background: variant.in_stock ? '#6b7c59' : '#a85751'
                                      }}></span>
                                      <span style={{ fontWeight: '500' }}>{variant.color_name}</span>
                                      <button type="button" onClick={() => removeEditVariant(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999', padding: '0 0 0 5px' }}>✕</button>
                                    </div>
                                  ))}
                                  {editVariants.length === 0 && <span style={{ fontStyle: 'italic', color: '#999', fontSize: '0.8rem' }}>Sin variantes</span>}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <input
                                    type="text"
                                    placeholder="Color (ej: Rojo)"
                                    value={tempEditVariantName}
                                    onChange={(e) => setTempEditVariantName(e.target.value)}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.9rem' }}
                                  />
                                  <input
                                    type="number"
                                    placeholder="Cant."
                                    value={tempEditVariantQuantity}
                                    onChange={(e) => setTempEditVariantQuantity(e.target.value)}
                                    style={{ width: '80px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ced4da' }}
                                  />
                                  <label style={{ display: 'none' }}>
                                    <input
                                      type="checkbox"
                                      checked={tempEditVariantStock}
                                      onChange={(e) => setTempEditVariantStock(e.target.checked)}
                                    />
                                    En Stock
                                  </label>
                                  <button
                                    type="button"
                                    onClick={addEditVariant}
                                    style={{
                                      padding: '0.5rem 1rem', background: '#333', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem'
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="submit" disabled={loading} style={{ flex: 1, padding: '1rem', background: '#6b7c59', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Guardar</button>
                                <button type="button" onClick={cancelEditing} style={{ flex: 1, padding: '1rem', background: '#666', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Cancelar</button>
                              </div>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <>
                          <div style={{
                            padding: '1.5rem',
                            background: 'linear-gradient(135deg, #fcfbf8 0%, #f3f1eb 100%)',
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center',
                            borderBottom: '1px solid rgba(0,0,0,0.05)'
                          }}>
                            <SafeImage src={getProductImageUrl(product)} alt={product.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px', border: '2px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                            <div style={{ flex: 1 }}>
                              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#333' }}>{product.name}</h3>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', color: '#666', background: 'white', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid #ddd' }}>{product.category}</span>
                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333' }}>{product.price}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', padding: '0.75rem', borderRadius: '10px' }}>
                              <span style={{ fontSize: '0.9rem', color: '#666' }}>Disponibilidad:</span>
                              <button onClick={() => handleToggleStock(product)} style={{ padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', border: 'none', background: product.in_stock ? '#d4edda' : '#f8d7da', color: product.in_stock ? '#155724' : '#721c24' }}>
                                {product.in_stock ? '✅ En Stock' : '❌ Agotado'}
                              </button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <button onClick={() => startEditing(product)} style={{ flex: 1, padding: '0.9rem', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>✏️ Editar</button>
                              <button onClick={() => handleDeleteProduct(product.id)} style={{ flex: 1, padding: '0.9rem', background: '#a85751', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>🗑️ Borrar</button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div >
        );

      case 'reports':
        return (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📋</div>
            <h2 style={{
              fontFamily: 'Didot, serif',
              fontSize: '2rem',
              color: '#333',
              marginBottom: '1rem',
              fontWeight: '400'
            }}>
              Informes
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: '500px', margin: '0 auto' }}>
              Próximamente podrás generar reportes de inventario, ventas por categoría,
              productos más populares y exportar datos en diferentes formatos.
            </p>
          </div>
        );

      case 'settings':
        return (
          <div style={{ padding: '2rem' }}>
            <h2 style={{
              fontFamily: 'Didot, serif',
              fontSize: '2.5rem',
              color: '#333',
              textAlign: 'center',
              marginBottom: '2rem',
              fontWeight: '400'
            }}>
              ⚙️ Configuración
            </h2>

            {/* Gestión de Categorías */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              maxWidth: '800px',
              margin: '0 auto',
              border: '1px solid rgba(230, 227, 212, 0.5)'
            }}>
              <h3 style={{
                fontFamily: 'Didot, serif',
                fontSize: '1.8rem',
                color: '#333',
                marginBottom: '1.5rem',
                fontWeight: '400',
                borderBottom: '2px solid #f0f0f0',
                paddingBottom: '1rem'
              }}>
                📂 Gestión de Categorías
              </h3>

              <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Nueva categoría (ej: Bolsos de Viaje)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    minWidth: '200px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !newCategoryName.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: (loading || !newCategoryName.trim()) ? 'not-allowed' : 'pointer',
                    minWidth: '150px'
                  }}
                >
                  {loading ? '⏳...' : '➕ Agregar'}
                </button>
              </form>

              {loadingCategories ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>⏳ Cargando categorías...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {categories.map(category => (
                    <div key={category.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      background: '#f8f9fa',
                      borderRadius: '12px',
                      border: '1px solid #dee2e6'
                    }}>
                      <span style={{ fontWeight: '500', color: '#333' }}>{category.name}</span>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={loading}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#a85751',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Eliminar categoría"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No hay categorías activas.</p>
                  )}
                </div>
              )}
            </div>

            {/* Gestión de Filtros */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: window.innerWidth < 768 ? '1.5rem' : '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              maxWidth: '800px',
              margin: window.innerWidth < 768 ? '1rem' : '2rem auto',
              border: '1px solid rgba(230, 227, 212, 0.5)'
            }}>
              <h3 style={{
                fontFamily: 'Didot, serif',
                fontSize: '1.8rem',
                color: '#333',
                marginBottom: '1.5rem',
                fontWeight: '400',
                borderBottom: '2px solid #f0f0f0',
                paddingBottom: '1rem'
              }}>
                🎯 Gestión de Filtros Rápidos
              </h3>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Activa o desactiva los filtros que quieres que aparezcan en la tienda.
                También puedes renombrarlos (ej: cambiar "Nuevos" por "Recién Llegados").
              </p>

              {/* Crear nuevo filtro */}
              <form onSubmit={handleCreateFilter} style={{
                display: 'flex',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <input
                  type="text"
                  placeholder="Nuevo filtro (ej: Liquidación)"
                  value={newFilterName}
                  onChange={e => setNewFilterName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    width: window.innerWidth < 768 ? '100%' : 'auto',
                    boxSizing: 'border-box'
                  }}
                />
                <button type="submit" disabled={!newFilterName.trim()}
                  style={{
                    background: '#333',
                    color: 'white',
                    border: 'none',
                    padding: '0.8rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    width: window.innerWidth < 768 ? '100%' : 'auto'
                  }}>
                  ➕ Crear
                </button>
              </form>

              {loadingFilters ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}>⏳ Cargando filtros...</div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {filters.map(filter => (
                    <div key={filter.id} style={{
                      display: 'flex',
                      flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                      justifyContent: 'space-between',
                      alignItems: window.innerWidth < 768 ? 'stretch' : 'center',
                      padding: '1rem',
                      background: '#f8f9fa',
                      borderRadius: '12px',
                      border: '1px solid #dee2e6',
                      gap: window.innerWidth < 768 ? '1rem' : '0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '12px', height: '12px', borderRadius: '50%',
                          background: filter.is_active ? '#6b7c59' : '#a85751'
                        }} />
                        <span style={{ fontWeight: '500', color: '#333', fontSize: '1.1rem' }}>
                          {filter.label}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#999', fontFamily: 'monospace' }}>
                          ({filter.key})
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        justifyContent: window.innerWidth < 768 ? 'stretch' : 'flex-start'
                      }}>
                        <button
                          onClick={() => handleUpdateFilterLabel(filter.id, filter.label)}
                          style={{
                            padding: '0.5rem 1rem',
                            border: '1px solid #ced4da',
                            borderRadius: '8px',
                            background: 'white',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            flex: window.innerWidth < 768 ? '1' : 'none'
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleToggleFilter(filter.id, filter.is_active)}
                          style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            borderRadius: '8px',
                            background: filter.is_active ? '#ffebee' : '#e8f5e9',
                            color: filter.is_active ? '#c62828' : '#2e7d32',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            flex: window.innerWidth < 768 ? '1' : 'none'
                          }}
                        >
                          {filter.is_active ? 'OFF' : 'ON'}
                        </button>
                        {filter.type === 'custom' && (
                          <button
                            onClick={() => handleDeleteFilter(filter.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                            title="Eliminar filtro"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <div>Sección no encontrada</div>;
    }
  };

  // Estados de error y loading
  if (error && error.includes('No tienes permisos')) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f9f7f4 0%, #f5f3ee 100%)',
        fontFamily: 'Montserrat, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          border: '1px solid rgba(230, 227, 212, 0.5)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>🔒</div>
          <h2 style={{
            fontFamily: 'Didot, serif',
            color: '#a85751',
            marginBottom: '1rem',
            fontSize: '2rem',
            fontWeight: '400'
          }}>
            Acceso Denegado
          </h2>
          <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}>
            {error}
          </p>
          <button
            onClick={() => window.location.href = '/admin'}
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            🔑 Ir al Login
          </button>
        </div>
      </div>
    );
  }

  if (loading && products.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f9f7f4 0%, #f5f3ee 100%)',
        fontFamily: 'Montserrat, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          border: '1px solid rgba(230, 227, 212, 0.5)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '6px solid #f3f3f3',
            borderTop: '6px solid #d4af37',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 2rem'
          }}></div>
          <h2 style={{
            fontFamily: 'Didot, serif',
            color: '#333',
            marginBottom: '1rem',
            fontSize: '1.6rem',
            fontWeight: '400'
          }}>
            Cargando panel de administración...
          </h2>
          <p style={{ color: '#666', fontSize: '1.1rem', margin: 0 }}>
            Obteniendo productos de la base de datos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f9f7f4 0%, #f5f3ee 100%)',
      fontFamily: 'Montserrat, sans-serif'
    }}>
      {/* Header con navegación */}
      <header style={{
        background: 'linear-gradient(135deg, #e6e3d4 0%, #ddd8c7 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Logo */}
          <h1 style={{
            fontFamily: 'Didot, serif',
            fontSize: '2rem',
            fontStyle: 'italic',
            color: '#333',
            margin: 0,
            fontWeight: '400'
          }}>
            Piuma Admin
          </h1>

          {/* Navegación desktop */}
          <nav style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            {ADMIN_SECTIONS.map(section => (
              <button
                key={section.id}
                onClick={() => {
                  if (section.path) {
                    window.location.href = section.path;
                  } else {
                    setActiveSection(section.id);
                  }
                }}
                style={{
                  background: activeSection === section.id
                    ? 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)'
                    : 'transparent',
                  color: activeSection === section.id ? 'white' : '#333',
                  border: activeSection === section.id ? 'none' : '2px solid rgba(51, 51, 51, 0.2)',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'Montserrat, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: activeSection === section.id
                    ? '0 4px 15px rgba(212, 175, 55, 0.3)'
                    : 'none'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{section.icon}</span>
                <span className="nav-text" style={{
                  display: window.innerWidth > 768 ? 'inline' : 'none'
                }}>
                  {section.name}
                </span>
              </button>
            ))}
          </nav>

          {/* Botón de menú móvil */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              display: window.innerWidth <= 768 ? 'flex' : 'none',
              flexDirection: 'column',
              justifyContent: 'space-around',
              width: '30px',
              height: '25px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <div style={{
              width: '100%',
              height: '3px',
              background: '#333',
              borderRadius: '5px',
              transition: 'all 0.3s ease'
            }}></div>
            <div style={{
              width: '100%',
              height: '3px',
              background: '#333',
              borderRadius: '5px',
              transition: 'all 0.3s ease'
            }}></div>
            <div style={{
              width: '100%',
              height: '3px',
              background: '#333',
              borderRadius: '5px',
              transition: 'all 0.3s ease'
            }}></div>
          </button>



          {/* Botón logout */}
          <button
            onClick={handleLogout}
            style={{
              background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            <span>🚪</span>
            <span>Salir</span>
          </button>
        </div>

        {/* Menú móvil desplegable */}
        {mobileMenuOpen && (
          <div style={{
            background: 'linear-gradient(135deg, #e6e3d4 0%, #ddd8c7 100%)',
            borderTop: '1px solid rgba(51, 51, 51, 0.1)',
            padding: '1rem 2rem'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {ADMIN_SECTIONS.map(section => (
                <button
                  key={section.id}
                  onClick={() => {
                    if (section.path) {
                      window.location.href = section.path;
                    } else {
                      setActiveSection(section.id);
                      setMobileMenuOpen(false);
                    }
                  }}
                  style={{
                    background: activeSection === section.id
                      ? 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)'
                      : 'transparent',
                    color: activeSection === section.id ? 'white' : '#333',
                    border: 'none',
                    padding: '1rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textAlign: 'left',
                    width: '100%'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{section.icon}</span>
                  <span>{section.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Contenido principal */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #fee 0%, #fdd 100%)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            color: '#721c24',
            padding: '1.5rem 2rem',
            margin: '0 0 2rem 0',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            fontWeight: '500',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <p style={{ margin: 0 }}>{error}</p>
            <button
              onClick={() => setError(null)}
              style={{
                background: 'linear-gradient(135deg, #a85751 0%, #8b4640 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
            >
              ✕ Cerrar
            </button>
          </div>
        )}

        {renderContent()}
      </main>

      {/* Loading overlay */}
      {loading && products.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'white',
            padding: '2.5rem 3rem',
            borderRadius: '16px',
            fontSize: '1.2rem',
            color: '#333',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(230, 227, 212, 0.5)',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #d4af37',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Procesando...
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @media (max-width: 1024px) {
            .nav-text {
              display: none !important;
            }
          }
          
          @media (max-width: 768px) {
            nav {
              display: none !important;
            }
            .mobile-menu-btn {
              display: flex !important;
            }
          }
          
          @media (max-width: 480px) {
            main {
              padding: 1rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AdminPanel;