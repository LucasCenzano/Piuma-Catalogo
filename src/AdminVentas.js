// src/AdminVentas.js - Panel de Ventas completo e independiente
import React, { useState, useEffect, useCallback } from 'react';
import authService from './authService';
const API_BASE_URL = process.env.REACT_APP_API_URL || '';


const AdminVentas = () => {
  const [activeTab, setActiveTab] = useState('new-sale');
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Estados para nueva venta
  const [newSale, setNewSale] = useState({

    customer_fullname: '',
    customer_phone: '',
    customer_email: '',
    payment_method: 'efectivo',
    payment_status: 'paid', // 'paid' or 'pending'
    amount_paid: '',
    notes: '',
    items: []
  });

  // Estado para búsqueda de productos
  const [searchTerm, setSearchTerm] = useState('');



  // Estados para filtros y estadísticas
  const [stats, setStats] = useState(null);
  const [salesFilter, setSalesFilter] = useState({
    page: 1,
    limit: 10,
    start_date: '',
    end_date: '',
    payment_method: ''
  });

  // Variant Modal State
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);

  // ===== FUNCIONES DE CARGA DE DATOS =====

  const loadProducts = async () => {
    try {
      const productsData = await authService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setError('Error al cargar productos');
    }
  };

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authService.authenticatedFetch(
        `${API_BASE_URL}/api/sales?page=${salesFilter.page}&limit=${salesFilter.limit}` + // 👈 Corregido
        `${salesFilter.start_date ? '&start_date=' + salesFilter.start_date : ''}` +
        `${salesFilter.end_date ? '&end_date=' + salesFilter.end_date : ''}` +
        `${salesFilter.payment_method ? '&payment_method=' + salesFilter.payment_method : ''}`
      );

      if (response.ok) {
        const data = await response.json();
        setSales(data.sales || data);
      } else {
        throw new Error('Error al obtener ventas');
      }
    } catch (error) {
      console.error('Error cargando ventas:', error);
      setError('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  }, [salesFilter]);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/api/sales-stats`); // 👈 Corregido

      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      } else {
        throw new Error('Error al obtener estadísticas');
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    if (activeTab === 'sales-list') {
      loadSales();
    } else if (activeTab === 'statistics') {
      loadStats();
    }
  }, [activeTab, loadSales, loadStats]);

  // ===== FUNCIONES DE MANEJO DE ESTADO =====
  // ===== ESTADO DEL MODAL DE EDICIÓN =====
  const [editingSale, setEditingSale] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Funciones para Editar Venta
  const startEditingSale = (sale) => {
    setEditingSale({ ...sale });
    setShowEditModal(true);
  };

  const handleEditSaleChange = (field, value) => {
    setEditingSale(prev => {
      const updates = { ...prev, [field]: value };

      // Auto-fill amount if status becomes 'paid'
      if (field === 'status' && value === 'paid') {
        updates.amount_paid = prev.total_amount;
      }

      // Sanitize numeric input for amount_paid if typed manually
      if (field === 'amount_paid') {
        // Remove non-numeric chars except dot/comma, but simplify to clean numbers
        const cleanValue = value.replace(/[^0-9]/g, '');
        updates.amount_paid = cleanValue;
      }

      return updates;
    });
  };

  // ===== BÚSQUEDA DE CLIENTES =====
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerResults, setShowCustomerResults] = useState(false);

  const searchCustomers = async (term) => {
    if (term.length < 2) {
      setCustomerResults([]);
      return;
    }
    try {
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/api/customers?search=${term}`);
      if (response.ok) {
        const data = await response.json();
        setCustomerResults(data);
        setShowCustomerResults(true);
      }
    } catch (err) {
      console.error("Error buscando clientes", err);
    }
  };

  const selectCustomer = (customer) => {
    setNewSale(prev => ({
      ...prev,
      customer_id: customer.id,
      customer_fullname: `${customer.first_name} ${customer.last_name}`,
      customer_phone: customer.phone || '',
      customer_email: customer.email || ''
    }));
    setShowCustomerResults(false);
  };

  const handleUpdateSale = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const response = await authService.authenticatedFetch(`${API_BASE_URL}/api/sales`, {
        method: 'PUT',
        body: JSON.stringify(editingSale)
      });

      if (!response.ok) throw new Error('Error actualizando venta');

      setSuccessMessage('Venta actualizada correctamente');
      setShowEditModal(false);
      loadSales(); // Recargar lista
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSalesFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewSaleChange = (field, value) => {
    setNewSale(prev => {
      const updates = { ...prev, [field]: value };

      // Limpieza de monto abonado igual que en edición
      if (field === 'amount_paid') {
        const cleanValue = value.replace(/[^0-9]/g, '');
        updates.amount_paid = cleanValue;
      }

      // Si el usuario cambia el nombre manualmente, reseteamos el ID del cliente seleccionado
      // para evitar asociar un nombre nuevo con un ID viejo por error
      if (field === 'customer_fullname' && prev.customer_id) {
        updates.customer_id = null;
      }

      return updates;
    });
  };

  const clearFilters = () => {
    setSalesFilter({
      page: 1,
      limit: 10,
      start_date: '',
      end_date: '',
      payment_method: ''
    });
    // loadSales() se disparará automáticamente por el cambio en el estado
  };

  // Función simplificada para agregar desde el grid
  const addProductToSale = (product) => {
    if (!product) return;

    // Check for variants
    if (product.variants && product.variants.length > 0) {
      setSelectedProductForVariant(product);
      setShowVariantModal(true);
      return;
    }

    addToCart(product, null);
  };

  const addToCart = (product, variant) => {
    // Extraer precio numérico
    let numericPrice = 0;
    if (product.price) {
      // Lógica corregida para precio argentino
      let cleanPrice = product.price.toString().replace(/[^0-9,.-]/g, '');
      cleanPrice = cleanPrice.replace(/\./g, '');
      cleanPrice = cleanPrice.replace(',', '.');
      numericPrice = parseFloat(cleanPrice) || 0;
    }

    // Validar stock disponible
    const availableStock = variant ? variant.quantity : (product.stock || 0);

    const existingItemIndex = newSale.items.findIndex(item =>
      item.product_id === product.id &&
      (variant ? item.variant_id === variant.id : !item.variant_id)
    );

    if (existingItemIndex >= 0) {
      // Incrementar cantidad si no supera el stock
      const currentItem = newSale.items[existingItemIndex];
      const maxStock = currentItem.max_stock;

      if (maxStock !== undefined && currentItem.quantity >= maxStock) {
        alert(`No puedes agregar más unidades. Stock disponible: ${maxStock}`);
        return;
      }

      const updatedItems = [...newSale.items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].subtotal = updatedItems[existingItemIndex].quantity * numericPrice;

      setNewSale(prev => ({ ...prev, items: updatedItems }));
    } else {
      // Agregar nuevo item con validación de stock
      if (availableStock < 1) {
        alert('Producto sin stock disponible');
        return;
      }

      const newItem = {
        product_id: product.id,
        product_name: product.name,
        variant_id: variant ? variant.id : null,
        variant_name: variant ? variant.color_name : null,
        image_url: Array.isArray(product.images_url) && product.images_url.length > 0 ? product.images_url[0] : (typeof product.images_url === 'string' ? JSON.parse(product.images_url || '[]')[0] : null),
        unit_price: numericPrice,
        quantity: 1,
        subtotal: numericPrice,
        max_stock: availableStock
      };

      setNewSale(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }

    // Close modal if open
    setShowVariantModal(false);
    setSelectedProductForVariant(null);
  };

  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;

    const item = newSale.items[index];
    if (item.max_stock !== undefined && newQuantity > item.max_stock) {
      alert(`La cantidad no puede superar el stock disponible (${item.max_stock})`);
      return;
    }

    const updatedItems = [...newSale.items];
    updatedItems[index].quantity = parseInt(newQuantity);
    updatedItems[index].subtotal = updatedItems[index].quantity * updatedItems[index].unit_price;
    setNewSale(prev => ({ ...prev, items: updatedItems }));
  };

  const removeItemFromSale = (index) => {
    setNewSale(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return newSale.items.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleSubmitSale = async (e) => {
    e.preventDefault();

    if (!newSale.customer_fullname.trim() || newSale.items.length === 0) {
      alert('Por favor completa el nombre del cliente y agrega al menos un producto');
      return;
    }

    // Dividir nombre completo
    const nameParts = newSale.customer_fullname.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '-';

    try {
      setLoading(true);

      const total = calculateTotal();
      const amountPaid = newSale.payment_status === 'paid'
        ? total
        : (parseFloat(newSale.amount_paid) || 0);

      const saleData = {
        ...newSale,
        customer_name: firstName,
        customer_lastname: lastName,
        total_amount: total,
        amount_paid: amountPaid,
        status: newSale.payment_status
      };

      const response = await authService.authenticatedFetch(`${API_BASE_URL}/api/sales`, { // 👈 Corregido
        method: 'POST',
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        await response.json();
        setSuccessMessage('¡Venta registrada exitosamente!');

        // Resetear formulario
        setNewSale({
          customer_fullname: '',
          customer_phone: '',
          customer_email: '',
          payment_method: 'efectivo',
          payment_status: 'paid',
          amount_paid: '',
          notes: '',
          items: []
        });
        setSearchTerm('');

        // Cambiar a la pestaña de ventas
        setTimeout(() => {
          setActiveTab('sales-list');
          setSuccessMessage('');
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar venta');
      }
    } catch (error) {
      console.error('Error registrando venta:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Función para eliminar venta
  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await authService.authenticatedFetch(`${API_BASE_URL}/api/sales?id=${saleId}`, { // 👈 Corregido
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccessMessage('Venta eliminada exitosamente');
        loadSales(); // Recargar la lista
      } else {
        throw new Error('Error al eliminar venta');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleLogout = () => {
    authService.logout();
    window.location.href = '/admin';
  };

  // ===== FUNCIONES DE UTILIDAD =====

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ===== COMPONENTES DE RENDERIZADO =====

  const renderTabNavigation = () => (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap', // Habilitar wrap
      gap: '1rem',      // Espacio entre botones
      justifyContent: 'center',
      marginBottom: '2rem',
      background: 'white',
      borderRadius: '16px',
      padding: '0.5rem',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(230, 227, 212, 0.5)'
    }}>
      {[
        { key: 'new-sale', label: 'Nueva Venta', icon: '📝' },
        { key: 'sales-list', label: 'Lista de Ventas', icon: '📊' },
        { key: 'statistics', label: 'Estadísticas', icon: '📈' },
        { key: 'customers', label: 'Clientes', icon: '👥' }
      ].map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          style={{
            flex: '1 1 auto', // Flexible size
            padding: '1rem',  // Reduced padding for mobile
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem', // Slightly smaller font
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center', // Center content
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            background: activeTab === tab.key
              ? 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)'
              : 'transparent',
            color: activeTab === tab.key ? 'white' : '#333',
            minWidth: '120px' // Minimum width
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderNewSaleForm = () => (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2.5rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(230, 227, 212, 0.5)'
    }}>
      <h3 style={{
        fontFamily: 'Didot, serif',
        fontSize: '1.8rem',
        color: '#333',
        textAlign: 'center',
        marginBottom: '2rem',
        fontWeight: '400'
      }}>
        Nueva Venta
      </h3>

      <form onSubmit={handleSubmitSale}>
        {/* Datos del Cliente */}
        <div style={{
          background: 'linear-gradient(135deg, #f3f1eb 0%, #f8f6f0 100%)',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '1px solid rgba(230, 227, 212, 0.8)'
        }}>
          <h4 style={{
            fontFamily: 'Montserrat, sans-serif',
            color: '#333',
            marginBottom: '1.5rem',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            👤 Datos del Cliente
          </h4>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}>
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Buscar o Ingresar Nombre Cliente *"
                  value={newSale.customer_fullname}
                  onChange={(e) => {
                    handleNewSaleChange('customer_fullname', e.target.value);
                    searchCustomers(e.target.value);
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '1rem',
                    paddingRight: newSale.customer_id ? '2.5rem' : '1rem', // Espacio para el icono
                    border: newSale.customer_id ? '2px solid #6b7c59' : '2px solid #e9ecef', // Borde verde si está seleccionado
                    borderRadius: '12px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = newSale.customer_id ? '#6b7c59' : '#d4af37'}
                  onBlur={(e) => {
                    e.target.style.borderColor = newSale.customer_id ? '#6b7c59' : '#e9ecef';
                    setTimeout(() => setShowCustomerResults(false), 200);
                  }}
                />
                {newSale.customer_id && (
                  <span style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7c59',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    pointerEvents: 'none'
                  }}>✓</span>
                )}
                {showCustomerResults && customerResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {customerResults.map(c => (
                      <div
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        style={{
                          padding: '0.8rem',
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                        onMouseLeave={(e) => e.target.style.background = 'white'}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{c.first_name} {c.last_name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{c.phone}</div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7c59', fontWeight: 'bold' }}>
                          {c.total_purchases} compras
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <input
                type="tel"
                placeholder="Teléfono (opcional)"
                value={newSale.customer_phone}
                onChange={(e) => handleNewSaleChange('customer_phone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#d4af37'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
              />
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <input
                type="email"
                placeholder="Email (opcional)"
                value={newSale.customer_email}
                onChange={(e) => handleNewSaleChange('customer_email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#d4af37'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
              />
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginTop: '1.5rem'
          }}>
            {/* Método de Pago */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#666' }}>Método</label>
              <select
                value={newSale.payment_method}
                onChange={(e) => handleNewSaleChange('payment_method', e.target.value)}
                style={{
                  padding: '1rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  outline: 'none',
                  width: '100%'
                }}
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">🏦 Transferencia</option>
              </select>
            </div>

            {/* Estado del Pago */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#666' }}>Estado</label>
              <select
                value={newSale.payment_status}
                onChange={(e) => handleNewSaleChange('payment_status', e.target.value)}
                style={{
                  padding: '1rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  outline: 'none',
                  width: '100%'
                }}
              >
                <option value="paid">✅ Pagado</option>
                <option value="pending">⏳ Pendiente</option>
              </select>
            </div>

            {/* Monto Abonado (solo si es pendiente) */}
            {newSale.payment_status === 'pending' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#666' }}>Monto Total Abonado ($)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Monto abonado ($)"
                  value={newSale.amount_paid}
                  onChange={(e) => handleNewSaleChange('amount_paid', e.target.value)}
                  style={{
                    padding: '1rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
                {newSale.amount_paid && (
                  <span style={{ fontSize: '0.8rem', color: '#a85751', fontWeight: 'bold' }}>
                    Debe: {formatCurrency(calculateTotal() - (parseFloat(newSale.amount_paid) || 0))}
                  </span>
                )}
              </div>
            )}

            <textarea
              placeholder="Notas (opcional)"
              value={newSale.notes}
              onChange={(e) => handleNewSaleChange('notes', e.target.value)}
              rows={3}
              style={{
                padding: '1rem',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                fontSize: '1rem',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                gridColumn: '1 / -1',
                width: '100%',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#d4af37'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>
        </div>

        {/* Agregar Productos */}
        <div style={{
          background: 'linear-gradient(135deg, #e8f4fd 0%, #f0f8ff 100%)',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <h4 style={{
            fontFamily: 'Montserrat, sans-serif',
            color: '#1e40af',
            marginBottom: '1.5rem',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            🛍️ Agregar Productos
          </h4>

          {/* Búsqueda de Productos */}
          <input
            type="text"
            placeholder="🔍 Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem',
              border: '2px solid #d4af37',
              borderRadius: '12px',
              fontSize: '1rem',
              marginBottom: '1.5rem',
              boxSizing: 'border-box'
            }}
          />

          {/* Modal de Selección de Variante */}
          {showVariantModal && selectedProductForVariant && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 10000,
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }} onClick={() => setShowVariantModal(false)}>
              <div style={{
                background: 'white', padding: '2rem', borderRadius: '16px',
                width: '90%', maxWidth: '400px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }} onClick={e => e.stopPropagation()}>
                <h4 style={{ margin: '0 0 1.5rem 0', textAlign: 'center' }}>Selecciona un Color</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                  {selectedProductForVariant.variants.map((variant, idx) => (
                    <button
                      key={idx}
                      onClick={() => addToCart(selectedProductForVariant, variant)}
                      disabled={!variant.in_stock}
                      style={{
                        padding: '1rem 1.5rem',
                        border: '2px solid',
                        borderColor: variant.in_stock ? '#6b7c59' : '#a85751',
                        borderRadius: '12px',
                        background: 'white',
                        color: variant.in_stock ? '#333' : '#999',
                        cursor: variant.in_stock ? 'pointer' : 'not-allowed',
                        opacity: variant.in_stock ? 1 : 0.6,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                      }}
                    >
                      <span style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: variant.in_stock ? '#6b7c59' : '#a85751'
                      }}></span>
                      <span style={{ fontWeight: '600' }}>{variant.color_name}</span>
                      <span style={{ fontSize: '0.8rem' }}>{variant.in_stock ? 'En Stock' : 'Agotado'}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowVariantModal(false)}
                  style={{
                    width: '100%', marginTop: '2rem', padding: '1rem',
                    background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Grid de Productos */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '1rem',
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: '0.5rem'
          }}>
            {products
              .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(product => (
                <div
                  key={product.id}
                  onClick={() => addProductToSale(product)}
                  style={{
                    border: '1px solid #e9ecef',
                    borderRadius: '12px',
                    padding: '0.8rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    height: '80px',
                    marginBottom: '0.5rem',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {/* Intento de mostrar imagen si existe */}
                    <img
                      src={Array.isArray(product.images_url) && product.images_url.length > 0 ? product.images_url[0] : (typeof product.images_url === 'string' && product.images_url.includes('[') ? JSON.parse(product.images_url)[0] : '')}
                      alt={product.name}
                      onError={(e) => { e.target.style.display = 'none'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {!product.images_url || (Array.isArray(product.images_url) && product.images_url.length === 0) ? <span style={{ fontSize: '2rem' }}>📦</span> : null}
                  </div>
                  <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#333' }}>{product.name}</h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', color: '#2c3e50' }}>{product.price}</p>

                  {/* Badge de stock */}
                  <div style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: product.in_stock ? '#6b7c59' : '#a85751'
                  }} />
                </div>
              ))}
          </div>
        </div>

        {/* Lista de Items Agregados */}
        {newSale.items.length > 0 && (
          <div style={{
            background: 'white',
            border: '2px solid #d4af37',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h4 style={{
              fontFamily: 'Montserrat, sans-serif',
              color: '#333',
              marginBottom: '1.5rem',
              fontSize: '1.2rem',
              fontWeight: '600'
            }}>
              🛒 Productos Agregados ({newSale.items.length})
            </h4>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Producto</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Cantidad</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Precio Unit.</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Subtotal</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {newSale.items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {item.image_url && <img src={item.image_url} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                          <div>
                            <div>{item.product_name}</div>
                            {item.variant_name && (
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>Color: {item.variant_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                          <button type="button" onClick={() => updateItemQuantity(index, item.quantity - 1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #ccc', background: 'white' }}>-</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => updateItemQuantity(index, item.quantity + 1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #ccc', background: 'white' }}>+</button>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeItemFromSale(index)}
                          style={{
                            background: 'linear-gradient(135deg, #a85751 0%, #8b4640 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}
                        >
                          🗑️ Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
              borderRadius: '12px',
              color: 'white',
              textAlign: 'right'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '700'
              }}>
                💰 Total: {formatCurrency(calculateTotal())}
              </h3>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          paddingTop: '1rem'
        }}>
          <button
            type="submit"
            disabled={loading || newSale.items.length === 0}
            style={{
              background: loading || newSale.items.length === 0
                ? '#6c757d'
                : 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
              color: 'white',
              border: 'none',
              padding: '1rem 3rem',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading || newSale.items.length === 0
                ? 'not-allowed'
                : 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              minWidth: '200px'
            }}
          >
            {loading ? '⏳ Registrando...' : '✅ Registrar Venta'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderSalesList = () => (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2.5rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(230, 227, 212, 0.5)'
    }}>
      <h3 style={{
        fontFamily: 'Didot, serif',
        fontSize: '1.8rem',
        color: '#333',
        textAlign: 'center',
        marginBottom: '2rem',
        fontWeight: '400'
      }}>
        📊 Lista de Ventas
      </h3>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap', // Responsive wrapping
        gap: '1rem',
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1.5rem',
        background: '#f8f9fa',
        borderRadius: '12px'
      }}>
        <input
          type="date"
          name="start_date"
          value={salesFilter.start_date}
          onChange={handleFilterChange}
          style={{ flex: '1 1 150px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <input
          type="date"
          name="end_date"
          value={salesFilter.end_date}
          onChange={handleFilterChange}
          style={{ flex: '1 1 150px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <select
          name="payment_method"
          value={salesFilter.payment_method}
          onChange={handleFilterChange}
          style={{ flex: '1 1 150px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          <option value="">Todos los métodos</option>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
        </select>
        <button
          onClick={clearFilters}
          style={{
            padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
            background: '#6c757d', color: 'white', cursor: 'pointer'
          }}
        >
          Limpiar Filtros
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #2c3e50',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          Cargando ventas...
        </div>
      ) : sales.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📊</div>
          <p>No hay ventas registradas</p>
          <button
            onClick={() => setActiveTab('new-sale')}
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              marginTop: '1rem'
            }}
          >
            📝 Registrar Primera Venta
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {sales.map(sale => {
            const isPending = sale.status === 'pending' || (sale.amount_paid < sale.total_amount);
            const pendingAmount = sale.total_amount - (sale.amount_paid || 0);

            return (
              <div key={sale.id} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                border: '1px solid #e9ecef',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {/* Header Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333' }}>
                      #{sale.id} - {sale.customer_name} {sale.customer_lastname}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      {formatDate(sale.created_at)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: isPending ? '#a85751' : '#6b7c59' }}>
                      {formatCurrency(sale.total_amount)}
                    </div>
                    {isPending && (
                      <div style={{ fontSize: '0.85rem', color: '#a85751', fontWeight: 'bold' }}>
                        Debe: {formatCurrency(pendingAmount)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Cliente */}
                <div style={{ fontSize: '0.9rem', color: '#555', background: '#f8f9fa', padding: '0.8rem', borderRadius: '8px' }}>
                  {sale.customer_phone && <div>📞 {sale.customer_phone}</div>}
                  {sale.customer_email && <div>✉️ {sale.customer_email}</div>}
                  {sale.notes && <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>💬 "{sale.notes}"</div>}
                </div>

                {/* Métodos de Pago y Estado */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    background: sale.payment_method === 'efectivo' ? '#d4edda' : '#cce5ff',
                    color: sale.payment_method === 'efectivo' ? '#155724' : '#004085'
                  }}>
                    {sale.payment_method === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}
                  </span>

                  <span style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    background: isPending ? '#f8d7da' : '#d4edda',
                    color: isPending ? '#721c24' : '#155724'
                  }}>
                    {isPending ? '⏳ Pendiente' : '✅ Pagado'}
                  </span>
                </div>


                {/* Productos Vendidos */}
                {sale.items && sale.items.length > 0 && (
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ 
                      fontWeight: '600', 
                      marginBottom: '0.75rem', 
                      color: '#333',
                      fontSize: '0.9rem'
                    }}>
                      📦 Productos ({sale.items.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {sale.items.map((item, idx) => (
                        <div key={idx} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem',
                          background: 'white',
                          borderRadius: '6px',
                          fontSize: '0.85rem'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', color: '#333' }}>
                              {item.product_name}
                            </div>
                            {item.variant_name && (
                              <div style={{ color: '#666', fontSize: '0.8rem' }}>
                                🎨 {item.variant_name}
                              </div>
                            )}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem',
                            fontSize: '0.85rem'
                          }}>
                            <span style={{ color: '#666' }}>
                              x{item.quantity}
                            </span>
                            <span style={{ fontWeight: '600', color: '#6b7c59' }}>
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Acciones */}
                <div style={{ paddingTop: '1rem', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    onClick={() => startEditingSale(sale)}
                    style={{
                      background: 'none',
                      color: '#2c3e50',
                      border: '1px solid #2c3e50',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    ✏️ Editar
                  </button>

                  <button
                    onClick={() => handleDeleteSale(sale.id)}
                    style={{
                      background: 'none',
                      color: '#a85751',
                      border: '1px solid #a85751',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderStatistics = () => (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2.5rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(230, 227, 212, 0.5)'
    }}>
      <h3 style={{
        fontFamily: 'Didot, serif',
        fontSize: '1.8rem',
        color: '#333',
        textAlign: 'center',
        marginBottom: '2rem',
        fontWeight: '400'
      }}>
        📈 Estadísticas de Ventas
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #d4af37',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          Cargando estadísticas...
        </div>
      ) : !stats ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📈</div>
          <p>No hay datos de estadísticas disponibles</p>
          <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
            Las estadísticas aparecerán una vez que registres algunas ventas
          </p>
        </div>
      ) : (
        <div>
          {/* Estadísticas Generales */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💰</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {formatCurrency(stats.general?.total_revenue || 0)}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Total Vendido</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #6b7c59 0%, #8b9a7a 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(40, 167, 69, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {formatCurrency(stats.general?.total_collected || 0)}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Total Cobrado</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #a85751 0%, #8b4640 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(220, 53, 69, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⏳</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {formatCurrency(stats.general?.total_pending || 0)}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Total Por Cobrar</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #6b7c59 0%, #8b9a7a 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(40, 167, 69, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📊</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {stats.general?.total_sales || 0}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Total de Ventas</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #2c3e50 0%, #1a252f 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 123, 255, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📈</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {formatCurrency(stats.general?.average_sale || 0)}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Venta Promedio</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #6f42c1 0%, #5a3a9a 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(111, 66, 193, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🛍️</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {stats.general?.total_items_sold || 0}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>Items Vendidos</div>
            </div>
          </div>

          {/* Métodos de Pago */}
          {stats.payment_methods && (
            <div style={{
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              padding: '2rem',
              borderRadius: '16px',
              marginBottom: '2rem',
              border: '1px solid rgba(230, 227, 212, 0.8)'
            }}>
              <h4 style={{
                fontFamily: 'Montserrat, sans-serif',
                color: '#333',
                marginBottom: '1.5rem',
                fontSize: '1.3rem',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                💳 Ventas por Método de Pago
              </h4>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {stats.payment_methods.map((method) => (
                  <div key={method.payment_method} style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #dee2e6',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{
                      fontSize: '2rem',
                      marginBottom: '1rem'
                    }}>
                      {method.payment_method === 'efectivo' ? '💵' : '🏦'}
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: method.payment_method === 'efectivo' ? '#6b7c59' : '#2c3e50',
                      marginBottom: '0.5rem'
                    }}>
                      {formatCurrency(method.revenue || 0)}
                    </div>
                    <div style={{ color: '#666', fontSize: '1rem', marginBottom: '0.5rem' }}>
                      {method.count || 0} ventas ({method.percentage || 0}%)
                    </div>
                    <div style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      background: method.payment_method === 'efectivo' ? '#d4edda' : '#cce5ff',
                      color: method.payment_method === 'efectivo' ? '#155724' : '#004085',
                      display: 'inline-block'
                    }}>
                      {method.payment_method === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Productos Más Vendidos */}
          {stats.top_products && stats.top_products.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
              padding: '2rem',
              borderRadius: '16px',
              marginBottom: '2rem',
              border: '1px solid rgba(255, 152, 0, 0.2)'
            }}>
              <h4 style={{
                fontFamily: 'Montserrat, sans-serif',
                color: '#e65100',
                marginBottom: '1.5rem',
                fontSize: '1.3rem',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                🏆 Productos Más Vendidos
              </h4>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 152, 0, 0.1)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>🏅</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Producto</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Cantidad Vendida</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_products.slice(0, 5).map((product, index) => (
                      <tr key={index} style={{
                        background: 'white',
                        borderBottom: '1px solid rgba(255, 152, 0, 0.1)'
                      }}>
                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '1.2rem' }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '600', fontSize: '1rem' }}>{product.name}</div>
                          {product.category && (
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                              📂 {product.category}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '1.1rem' }}>
                          {product.total_quantity_sold || product.total_quantity || 0} unidades
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#e65100', fontSize: '1.1rem' }}>
                          {formatCurrency(product.total_revenue || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ventas Recientes */}
          {stats.daily_sales && stats.daily_sales.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid rgba(76, 175, 80, 0.2)'
            }}>
              <h4 style={{
                fontFamily: 'Montserrat, sans-serif',
                color: '#2e7d32',
                marginBottom: '1.5rem',
                fontSize: '1.3rem',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                📅 Ventas por Día (Últimos 7 días)
              </h4>

              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {stats.daily_sales.slice(0, 7).map((day, index) => (
                  <div key={index} style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid rgba(76, 175, 80, 0.1)',
                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.1)'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1rem', color: '#2e7d32' }}>
                        📅 {formatDate(day.date)}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                        {day.sales_count || 0} ventas realizadas
                      </div>
                    </div>
                    <div style={{
                      fontWeight: '700',
                      color: '#2e7d32',
                      fontSize: '1.3rem'
                    }}>
                      {formatCurrency(day.daily_revenue || 0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ===== RENDER PRINCIPAL =====

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f9f7f4 0%, #f5f3ee 100%)',
      fontFamily: 'Montserrat, sans-serif'
    }}>
      {/* Header */}
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
          {/* Logo y Título */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => window.location.href = '/admin'}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#333',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Volver al Panel Principal"
            >
              ←
            </button>
            <h1 style={{
              fontFamily: 'Didot, serif',
              fontSize: '2rem',
              fontStyle: 'italic',
              color: '#333',
              margin: 0,
              fontWeight: '400'
            }}>
              Piuma Ventas
            </h1>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => window.location.href = '/admin'}
              style={{
                background: 'linear-gradient(135deg, #2c3e50 0%, #1a252f 100%)',
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
                gap: '0.5rem'
              }}
            >
              <span>🏠</span>
              <span>Panel Principal</span>
            </button>

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
                gap: '0.5rem'
              }}
            >
              <span>🚪</span>
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Mensajes de Estado */}
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
            color: '#721c24',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #f1aeb5',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <strong>Error:</strong> {error}
            </div>
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#721c24',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0.25rem'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div style={{
            background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
            color: '#155724',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #c6e2c7',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            <div>
              <strong>Éxito:</strong> {successMessage}
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#155724',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0.25rem'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Navegación de Pestañas */}
        {renderTabNavigation()}

        {/* Contenido de la Pestaña Activa */}
        {activeTab === 'new-sale' && renderNewSaleForm()}
        {activeTab === 'sales-list' && renderSalesList()}
        {activeTab === 'statistics' && renderStatistics()}
        {activeTab === 'customers' && <CustomersListAPI authService={authService} API_BASE_URL={API_BASE_URL} formatCurrency={formatCurrency} formatDate={formatDate} />}
      </main>

      {/* Modal de Edición de Venta */}
      {showEditModal && editingSale && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center' }}>✏️ Editar Venta #{editingSale.id}</h3>

            <form onSubmit={handleUpdateSale}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nombre Cliente</label>
                <div style={{ padding: '0.8rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  {editingSale.customer_name} {editingSale.customer_lastname}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Total Venta</label>
                <div style={{ padding: '0.8rem', background: '#f8f9fa', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {formatCurrency(editingSale.total_amount)}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Estado del Pago</label>
                <select
                  value={editingSale.status}
                  onChange={(e) => handleEditSaleChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #ced4da',
                    fontSize: '1rem'
                  }}
                >
                  <option value="pending">⏳ Pendiente</option>
                  <option value="paid">✅ Pagado</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Monto Total Abonado ($)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editingSale.amount_paid}
                  onChange={(e) => handleEditSaleChange('amount_paid', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #ced4da',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />

                {editingSale.status === 'pending' && (
                  <div style={{ marginTop: '0.5rem', color: '#a85751', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    Debe: {formatCurrency(editingSale.total_amount - (parseFloat(editingSale.amount_paid) || 0))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Notas</label>
                <textarea
                  value={editingSale.notes || ''}
                  onChange={(e) => handleEditSaleChange('notes', e.target.value)}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #ced4da',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '0.8rem 1.5rem',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.8rem 2rem',
                    background: 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
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
          
          @media (max-width: 768px) {
            main {
              padding: 1rem !important;
            }
            
            .grid-responsive {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
};

// Subcomponente simple para listar clientes
const CustomersListAPI = ({ authService, API_BASE_URL, formatCurrency, formatDate }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [sortBy, setSortBy] = useState('spent');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadCustomers = useCallback(async (searchTerm = '', sort = 'spent', order = 'desc') => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/customers?sortBy=${sort}&sortOrder=${order}`;
      if (searchTerm) url += `&search=${searchTerm}`;

      const res = await authService.authenticatedFetch(url);
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
        setError(null);
      } else {
        setError('Error cargando clientes');
      }
    } catch (e) {
      console.error(e);
      setError('Error de conexión');
    } finally { setLoading(false); }
  }, [authService, API_BASE_URL]);

  useEffect(() => { loadCustomers(search, sortBy, sortOrder); }, [loadCustomers, sortBy, sortOrder, search]); // Auto-reload on filters change


  /* Edit Customer Logic */
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm] = useState({});

  const startEdit = (customer) => {
    setEditingCustomer(customer);
    setEditForm({ ...customer });
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    try {
      const res = await authService.authenticatedFetch(`${API_BASE_URL}/api/customers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        loadCustomers(search, sortBy, sortOrder);
        setEditingCustomer(null);
      } else {
        alert('Error guardando cambios');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      minHeight: '400px'
    }}>
      <h3 style={{ textAlign: 'center', marginBottom: '2rem', fontFamily: 'Didot, serif', fontSize: '1.8rem' }}>👥 Lista de Clientes</h3>


      {/* Edit Modal */}
      {editingCustomer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 10000,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '16px',
            width: '90%', maxWidth: '400px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <h4 style={{ margin: '0 0 1.5rem 0', textAlign: 'center' }}>Editar Cliente</h4>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <input
                value={editForm.first_name || ''}
                onChange={e => handleEditChange('first_name', e.target.value)}
                placeholder="Nombre"
                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', flex: 1 }}
              />
              <input
                value={editForm.last_name || ''}
                onChange={e => handleEditChange('last_name', e.target.value)}
                placeholder="Apellido"
                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', flex: 1 }}
              />
            </div>

            <input
              value={editForm.phone || ''}
              onChange={e => handleEditChange('phone', e.target.value)}
              placeholder="Teléfono"
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem', boxSizing: 'border-box' }}
            />

            <input
              value={editForm.email || ''}
              onChange={e => handleEditChange('email', e.target.value)}
              placeholder="Email"
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem', boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingCustomer(null)}
                style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', border: 'none', background: '#ccc', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', border: 'none', background: '#6b7c59', color: 'white', cursor: 'pointer' }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
          />
          <button
            onClick={() => loadCustomers(search, sortBy, sortOrder)}
            style={{
              background: '#333', color: 'white', border: 'none',
              padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer'
            }}>
            Buscar
          </button>
        </div>

        {/* Sort Controls */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end' }}>
          <label style={{ fontWeight: 'bold', color: '#666' }}>Ordenar por:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
          >
            <option value="spent">💰 Mayor Gasto</option>
            <option value="debt">🚩 Mayor Deuda</option>
            <option value="purchases">🛒 Más Compras</option>
            <option value="recent">📅 Más Recientes</option>
            <option value="name">🔤 Alfabético</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #ddd',
              background: 'white', cursor: 'pointer'
            }}
          >
            {sortOrder === 'asc' ? '⬆️ Asc' : '⬇️ Desc'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <span style={{ fontSize: '2rem' }}>⏳</span>
          <div>Cargando clientes...</div>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', color: '#a85751', padding: '2rem' }}>
          {error}
        </div>
      ) : customers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#999', background: '#f8f9fa', borderRadius: '12px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h3>No se encontraron clientes</h3>
          <p>Intenta ajustar la búsqueda o registra una venta nueva.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {customers.map(c => (
            <div key={c.id} style={{
              padding: '1.5rem', border: '1px solid #eee', borderRadius: '12px',
              background: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative'
            }}>
              <button
                onClick={() => startEdit(c)}
                style={{
                  position: 'absolute', top: '10px', right: '10px',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem'
                }}
                title="Editar Cliente"
              >
                ✏️
              </button>

              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', paddingRight: '30px' }}>{c.first_name} {c.last_name}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>📞 {c.phone || '-'}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>✉️ {c.email || '-'}</div>
              <div style={{
                marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.9rem', background: '#e9ecef', padding: '0.3rem 0.8rem', borderRadius: '12px' }}>
                  🛒 {c.total_purchases} ventas
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#6b7c59' }}>
                    {formatCurrency(c.total_spent)}
                  </div>
                  {Number(c.total_debt) > 0 && (
                    <div style={{ color: '#a85751', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                      Debe: {formatCurrency(c.total_debt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVentas;