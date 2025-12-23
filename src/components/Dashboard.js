// components/Dashboard.js
import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, Users, AlertCircle, Star, Sparkles, FileText, Tag, Plus } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = ({ productos, clientes, ventas, onCreateProduct }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Estadísticas básicas
  const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
  const ventasHoy = ventas.filter(v => v.fecha === new Date().toISOString().split('T')[0]).reduce((sum, v) => sum + v.total, 0);
  const productosStockBajo = productos.filter(p => !p.in_stock).length;

  // Nuevas métricas
  const productosConDescuento = useMemo(() => {
    return productos.filter(p => p.discount_percentage && p.discount_percentage > 0);
  }, [productos]);

  const productosDestacados = useMemo(() => {
    return productos.filter(p => p.is_featured);
  }, [productos]);

  const productosNuevos = useMemo(() => {
    return productos.filter(p => p.is_new);
  }, [productos]);

  const productosSinDescripcion = useMemo(() => {
    return productos.filter(p => !p.description || p.description.trim() === '');
  }, [productos]);

  const variantesSinCodigo = useMemo(() => {
    let count = 0;
    productos.forEach(p => {
      if (p.variants && Array.isArray(p.variants)) {
        p.variants.forEach(v => {
          if (!v.product_code || v.product_code.trim() === '') {
            count++;
          }
        });
      }
    });
    return count;
  }, [productos]);

  // Distribución de precios
  const distribucionPrecios = useMemo(() => {
    const rangos = [
      { nombre: '$0-5k', min: 0, max: 5000, count: 0 },
      { nombre: '$5k-10k', min: 5000, max: 10000, count: 0 },
      { nombre: '$10k-20k', min: 10000, max: 20000, count: 0 },
      { nombre: '$20k-50k', min: 20000, max: 50000, count: 0 },
      { nombre: '$50k+', min: 50000, max: Infinity, count: 0 }
    ];

    productos.forEach(p => {
      const precio = parseFloat(p.price) || 0;
      const rango = rangos.find(r => precio >= r.min && precio < r.max);
      if (rango) rango.count++;
    });

    return rangos.filter(r => r.count > 0);
  }, [productos]);

  // Datos para gráficos
  const ventasUltimos7Dias = useMemo(() => {
    const dias = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      const ventasDia = ventas.filter(v => v.fecha === fechaStr);
      dias.push({
        fecha: fechaStr.slice(5),
        total: ventasDia.reduce((sum, v) => sum + v.total, 0)
      });
    }
    return dias;
  }, [ventas]);

  const productosPorCategoria = useMemo(() => {
    const categorias = {};
    productos.forEach(p => {
      categorias[p.category] = (categorias[p.category] || 0) + 1;
    });
    return Object.entries(categorias).map(([nombre, cantidad]) => ({ nombre, cantidad }));
  }, [productos]);

  // Estilos comunes
  const cardStyle = {
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    marginBottom: '1.5rem'
  };

  const gridStyle = {
    display: 'grid',
    gap: '1.5rem',
    marginBottom: '2rem'
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* Título */}
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

      {/* Tarjetas de Estadísticas Principales */}
      <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <DollarSign size={32} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '8px' }}>Total</span>
          </div>
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>${totalVentas.toLocaleString()}</h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>Ventas totales</p>
        </div>

        <div style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <TrendingUp size={32} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '8px' }}>Hoy</span>
          </div>
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>${ventasHoy.toLocaleString()}</h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>Ventas de hoy</p>
        </div>

        <div style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <Users size={32} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '8px' }}>Activos</span>
          </div>
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{clientes.length}</h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>Clientes totales</p>
        </div>

        <div style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <AlertCircle size={32} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '8px' }}>Alerta</span>
          </div>
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{productosStockBajo}</h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>Sin stock</p>
        </div>
      </div>

      {/* Métricas de Productos */}
      <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <Tag size={32} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '8px' }}>Ofertas</span>
          </div>
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{productosConDescuento.length}</h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>Con descuento activo</p>
        </div>

        <div style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <Star size={32} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '8px' }}>Premium</span>
          </div>
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{productosDestacados.length}</h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>Productos destacados</p>
        </div>

        <div style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <Sparkles size={32} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '8px' }}>Nuevo</span>
          </div>
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{productosNuevos.length}</h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>Productos nuevos</p>
        </div>
      </div>

      {/* Alertas y Acciones */}
      <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Alerta: Productos sin descripción */}
        {productosSinDescripcion.length > 0 && (
          <div style={{
            ...cardStyle,
            background: '#fef3c7',
            borderLeft: '4px solid #f59e0b',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <FileText size={24} style={{ color: '#d97706', marginRight: '1rem', marginTop: '0.25rem', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ color: '#92400e', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>⚠️ Productos sin descripción</h4>
                <p style={{ color: '#b45309', fontSize: '0.9rem', margin: '0 0 0.75rem 0' }}>
                  {productosSinDescripcion.length} producto{productosSinDescripcion.length !== 1 ? 's' : ''} sin descripción
                </p>
                <div style={{ fontSize: '0.8rem', color: '#d97706' }}>
                  {productosSinDescripcion.slice(0, 3).map(p => (
                    <div key={p.id} style={{ marginBottom: '0.25rem' }}>• {p.name}</div>
                  ))}
                  {productosSinDescripcion.length > 3 && (
                    <div style={{ marginTop: '0.5rem', fontWeight: '600' }}>... y {productosSinDescripcion.length - 3} más</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerta: Variantes sin código */}
        {variantesSinCodigo > 0 && (
          <div style={{
            ...cardStyle,
            background: '#fee2e2',
            borderLeft: '4px solid #ef4444',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <Tag size={24} style={{ color: '#dc2626', marginRight: '1rem', marginTop: '0.25rem', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ color: '#991b1b', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>⚠️ Variantes sin código</h4>
                <p style={{ color: '#b91c1c', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
                  {variantesSinCodigo} variante{variantesSinCodigo !== 1 ? 's' : ''} sin código de producto
                </p>
                <p style={{ fontSize: '0.8rem', color: '#dc2626', margin: 0 }}>
                  Revisa las variantes para asignar códigos únicos
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botón de acción rápida: Crear producto */}
        <div
          onClick={onCreateProduct}
          style={{
            ...cardStyle,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <Plus size={32} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '8px' }}>Acción</span>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>Crear Producto</h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>Agregar nuevo producto al catálogo</p>
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        <div style={{ ...cardStyle, background: 'white' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#333' }}>📈 Ventas - Últimos 7 días</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ventasUltimos7Dias}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...cardStyle, background: 'white' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#333' }}>📦 Productos por Categoría</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={productosPorCategoria}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...cardStyle, background: 'white' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#333' }}>💰 Distribución de Precios</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={distribucionPrecios}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...cardStyle, background: 'white' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#333' }}>📊 Estado de Productos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'En Stock', value: productos.filter(p => p.in_stock).length },
                  { name: 'Sin Stock', value: productosStockBajo },
                  { name: 'Con Descuento', value: productosConDescuento.length },
                  { name: 'Destacados', value: productosDestacados.length },
                  { name: 'Nuevos', value: productosNuevos.length }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Acceso rápido a Ventas */}
      <div style={{
        ...cardStyle,
        background: 'linear-gradient(135deg, #6b7c59 0%, #8b9a7a 100%)',
        color: 'white',
        textAlign: 'center',
        padding: '2.5rem'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
        <h3 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', fontFamily: 'Didot, serif' }}>
          Módulo de Ventas
        </h3>
        <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '2rem' }}>
          Gestiona ventas, clientes y visualiza estadísticas
        </p>
        <button
          onClick={() => window.location.href = '/admin/ventas'}
          style={{
            background: 'white',
            color: '#6b7c59',
            border: 'none',
            padding: '1rem 2.5rem',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
          onMouseLeave={(e) => e.target.style.background = 'white'}
        >
          🚀 Ir a Ventas
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
