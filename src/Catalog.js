import React, { useState, useEffect, useMemo } from 'react';
import './Catalog.css';

// Componente para imagen con precarga mejorada
const SafeProductImage = ({ src, alt, className, style, onClick, onError, ...props }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(!!src);

  useEffect(() => {
    if (src) {
      setImageError(false);
      setLoading(true);
    } else {
      setLoading(false);
      setImageError(true);
    }
  }, [src]);

  const handleImageLoad = () => {
    setLoading(false);
    setImageError(false);
  };

  const handleImageError = (e) => {
    setLoading(false);
    setImageError(true);
    if (onError) onError(e);
  };

  if (!src || imageError) {
    return (
      <div
        className={`${className} product-image-placeholder`}
        style={{
          ...style,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          border: '2px dashed #e9ecef',
          color: '#adb5bd',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={onClick}
        {...props}
      >
        <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.6 }}>📷</div>
          <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#6c757d', letterSpacing: '0.5px' }}>Sin imagen</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <div
          className={className}
          style={{
            ...style,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'loading-shimmer 2s infinite',
            zIndex: 1
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ ...style, opacity: loading ? 0 : 1, transition: 'opacity 0.2s ease', objectFit: 'contain' }}
        onClick={onClick}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={props.loading || "lazy"}
        decoding="async"
        {...props}
      />
    </div>
  );
};




// --- Componente Catalog ---
function Catalog({ bags, openModal, selectedCategory }) {
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  /* const { preloadProgress } = useImagePreloader(bags); - Removed for performance */
  const [sortOrder, setSortOrder] = useState('default');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]); // List of available filters
  const [selectedFilter, setSelectedFilter] = useState(null); // Currently selected filter key
  const [changingImages, setChangingImages] = useState({}); // Track which images are changing


  // Use dataService instead of direct fetch
  useEffect(() => {
    import('./dataService').then(({ default: ds }) => {
      ds.getFilters().then(data => {
        if (Array.isArray(data)) {
          setActiveFilters(data);
        }
      });
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const sortedAndFilteredBags = useMemo(() => {
    let filtered = bags.filter(bag => selectedCategory === 'Todos' || bag.category === selectedCategory);

    // Apply dynamic filter
    if (selectedFilter) {
      if (selectedFilter === 'featured') {
        filtered = filtered.filter(bag => bag.is_featured);
      } else if (selectedFilter === 'new') {
        filtered = filtered.filter(bag => bag.is_new);
      } else if (selectedFilter === 'discount') {
        filtered = filtered.filter(bag => bag.discount_percentage > 0);
      }
    }

    const sorted = [...filtered].sort((a, b) => {
      const parsePrice = (priceStr) => {
        if (!priceStr) return 0;
        let clean = priceStr.toString().replace(/[^0-9,.-]/g, '');
        clean = clean.replace(/\./g, '');
        clean = clean.replace(',', '.');
        return parseFloat(clean) || 0;
      };

      switch (sortOrder) {
        case 'price-desc': return parsePrice(b.price) - parsePrice(a.price);
        case 'price-asc': return parsePrice(a.price) - parsePrice(b.price);
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        default: return 0;
      }
    });
    return sorted;
  }, [bags, selectedCategory, sortOrder, selectedFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndexes(prev => {
        const nextState = { ...prev };
        let hasChanges = false;
        sortedAndFilteredBags.forEach(bag => {
          const allImages = bag.images?.filter(img => img && img.trim().length > 0) || [];
          if (allImages.length > 1) {
            const currentIndex = prev[bag.id] || 0;
            nextState[bag.id] = (currentIndex + 1) % allImages.length;
            hasChanges = true;
          }
        });
        return hasChanges ? nextState : prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [sortedAndFilteredBags]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        } else {
          entry.target.classList.remove('is-visible');
        }
      });
    }, { threshold: 0.1 });

    // Small timeout to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      const cards = document.querySelectorAll('.product-card');
      cards.forEach(card => observer.observe(card));
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [sortedAndFilteredBags]);

  const getCurrentImageIndex = (productId) => currentImageIndexes[productId] || 0;

  const handleNextImage = (e, productId, totalImages) => {
    e.stopPropagation();
    setChangingImages(prev => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setCurrentImageIndexes(prev => ({ ...prev, [productId]: ((prev[productId] || 0) + 1) % totalImages }));
      setTimeout(() => setChangingImages(prev => ({ ...prev, [productId]: false })), 50);
    }, 200);
  };

  const handlePrevImage = (e, productId, totalImages) => {
    e.stopPropagation();
    setChangingImages(prev => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setCurrentImageIndexes(prev => ({ ...prev, [productId]: ((prev[productId] || 0) - 1 + totalImages) % totalImages }));
      setTimeout(() => setChangingImages(prev => ({ ...prev, [productId]: false })), 50);
    }, 200);
  };
  const getProductImage = (bag) => { const currentIndex = getCurrentImageIndex(bag.id); return bag.images?.[currentIndex] || bag.images?.[0] || null; };
  const getAllImages = (bag) => bag.images?.filter(img => img && img.trim().length > 0) || [];

  return (
    <div className="catalog-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="catalog-title" style={{ margin: 0, textAlign: 'left' }}>
          {selectedCategory === 'Todos' ? `Colección Piuma` : `${selectedCategory}`}
        </h2>

        <div style={{ minWidth: '180px', display: 'flex', gap: '1rem', alignItems: 'center' }}>

          {/* Ordenar por selector */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '0.9rem',
              borderRadius: '20px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              outline: 'none',
              minWidth: '140px'
            }}
          >
            <option value="default">Ordenar por</option>
            <option value="price-desc">Mayor precio</option>
            <option value="price-asc">Menor precio</option>
            <option value="name-asc">A-Z</option>
            <option value="name-desc">Z-A</option>
          </select>
        </div>
      </div>

      {/* Dynamic Filters Bar */}
      {activeFilters.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {activeFilters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(selectedFilter === filter.key ? null : filter.key)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: selectedFilter === filter.key ? 'none' : '1px solid #ddd',
                background: selectedFilter === filter.key
                  ? 'linear-gradient(135deg, #d4af37 0%, #c19b26 100%)'
                  : 'white',
                color: selectedFilter === filter.key ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                boxShadow: selectedFilter === filter.key ? '0 4px 10px rgba(212, 175, 55, 0.3)' : 'none',
                flexShrink: 0
              }}
            >
              {filter.label} {selectedFilter === filter.key && '✓'}
            </button>
          ))}
          {selectedFilter && (
            <button
              onClick={() => setSelectedFilter(null)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: 'none',
                background: '#f8f9fa',
                color: '#666',
                cursor: 'pointer',
                fontSize: '0.9rem',
                flexShrink: 0
              }}
            >
              Limpiar filtros ✕
            </button>
          )}
        </div>
      )}



      {sortedAndFilteredBags.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666', fontSize: '1.2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🛍️</div>
          <p>No hay productos disponibles para esta selección.</p>
        </div>
      ) : (
        <div className="catalog-grid">
          {sortedAndFilteredBags.map((bag, index) => {
            const allImages = getAllImages(bag);
            const currentImage = getProductImage(bag);
            const currentIndex = getCurrentImageIndex(bag.id);
            // API returns snake_case for DB columns, but verify if you use camelCase adapter.
            // Based on server.js, raw DB rows are returned. So it is in_stock, is_new, is_featured, discount_percentage.
            const isInStock = bag.in_stock !== false; // Default true if undefined, but explicit DB logic usually returns boolean

            const isNew = bag.is_new;
            const isFeatured = bag.is_featured;
            const discountPct = bag.discount_percentage || 0;
            const hasDiscount = discountPct > 0;

            // Price calculation logic
            let finalPrice = bag.price;
            let originalPrice = null;

            if (hasDiscount && bag.price) {
              // 1. Clean string: remove currency symbols, spaces, etc., but keep digits, commas, dots, minus
              // 2. Argentine format: "10.000,00". Remove dots (thousands), replace comma with dot (decimal).
              let cleanPrice = bag.price.toString().replace(/[^0-9,.-]/g, '');
              cleanPrice = cleanPrice.replace(/\./g, ''); // Remove thousands separator
              cleanPrice = cleanPrice.replace(',', '.'); // Replace decimal separator

              const numericPrice = parseFloat(cleanPrice) || 0;

              if (numericPrice > 0) {
                const discountAmount = numericPrice * (discountPct / 100);
                const newPriceVal = numericPrice - discountAmount;
                // Format back to currency string
                originalPrice = bag.price;
                finalPrice = `$${newPriceVal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
              }
            }

            return (
              <div key={bag.id} className="product-card">
                {/* Category above image */}
                {bag.category && (
                  <p className="product-category" style={{ marginTop: '0', marginBottom: '8px', textAlign: 'center' }}>
                    {bag.category}
                  </p>
                )}

                <div className="product-image-container">
                  <SafeProductImage
                    src={currentImage}
                    alt={bag.name}
                    className={`product-image ${changingImages[bag.id] ? 'changing' : ''}`}
                    loading={index < 4 ? "eager" : "lazy"}
                    onClick={() => currentImage && openModal(currentImage, bag.name, allImages, currentIndex)}
                  />

                  {/* Badges Overlay */}
                  <div className="product-badges" style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 2 }}>
                    {isNew && (
                      <span style={{ backgroundColor: '#28a745', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                        NUEVO
                      </span>
                    )}
                    {isFeatured && (
                      <span style={{ backgroundColor: '#ffc107', color: '#333', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                        DESTACADO
                      </span>
                    )}
                    {hasDiscount && (
                      <span style={{ backgroundColor: '#dc3545', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                        {discountPct}% OFF
                      </span>
                    )}
                  </div>

                  {allImages.length > 1 && (
                    <>
                      <button className="image-nav-btn prev-btn" onClick={(e) => handlePrevImage(e, bag.id, allImages.length)}>‹</button>
                      <button className="image-nav-btn next-btn" onClick={(e) => handleNextImage(e, bag.id, allImages.length)}>›</button>
                      <div className="image-counter">{currentIndex + 1} / {allImages.length}</div>
                    </>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-name">{bag.name}</h3>
                  {bag.description && <p className="product-description">{bag.description}</p>}
                  <div className="product-details" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>

                    <div className="price-container">
                      {hasDiscount ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.9rem' }}>{originalPrice}</span>
                          <span className="product-price" style={{ color: '#dc3545' }}>{finalPrice}</span>
                        </div>
                      ) : (
                        bag.price && <p className="product-price">{bag.price}</p>
                      )}
                    </div>

                    <span className={`stock-status ${isInStock ? 'in-stock' : 'out-of-stock'}`} style={{ marginTop: '5px' }}>
                      {isInStock ? '✓ En Stock' : '✗ Sin Stock'}
                    </span>
                  </div>
                  {/* Variantes / Colores - Mejorado */}
                  {bag.variants && bag.variants.length > 0 && (
                    <div className="product-variants" style={{ marginTop: '12px', width: '100%' }}>
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        color: '#333',
                        display: 'block',
                        marginBottom: '8px',
                        letterSpacing: '0.3px'
                      }}>Variantes:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {bag.variants.map((variant, vIdx) => (
                          <div key={vIdx} style={{
                            fontSize: '0.85rem',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid',
                            borderColor: variant.quantity > 0 ? '#28a745' : '#dc3545',
                            color: '#333',
                            backgroundColor: variant.quantity > 0 ? 'rgba(40, 167, 69, 0.08)' : 'rgba(220, 53, 69, 0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            minWidth: '80px'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: '600'
                            }}>
                              <span style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: variant.color_hex || (variant.quantity > 0 ? '#28a745' : '#dc3545'),
                                border: '1px solid rgba(0,0,0,0.1)'
                              }}></span>
                              {variant.color_name}
                            </div>
                            <span style={{
                              fontSize: '0.75rem',
                              color: variant.quantity > 0 ? '#28a745' : '#dc3545',
                              fontWeight: '600'
                            }}>
                              {variant.quantity > 0 ? `Stock: ${variant.quantity}` : 'Sin stock'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botón de Comprar por WhatsApp */}
                  <a
                    href={`https://wa.me/5493874423595?text=Hola!%20Me%20interesa%20comprar%20el%20producto:%20*${encodeURIComponent(bag.name)}*`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      width: '100%',
                      marginTop: '1rem',
                      padding: '0.8rem 1rem',
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                      color: 'white',
                      textAlign: 'center',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 211, 102, 0.3)';
                    }}
                  >
                    💬 Comprar por WhatsApp
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`
                @keyframes loading-shimmer {
                    0% { background-position: -200px 0; }
                    100% { background-position: calc(200px + 100%) 0; }
                }
            `}</style>
      <button
        onClick={scrollToTop}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: '#333',
          color: 'white',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          border: 'none',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          zIndex: 1000,
          opacity: showScrollTop ? 1 : 0,
          pointerEvents: showScrollTop ? 'all' : 'none',
          transform: showScrollTop ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        aria-label="Volver arriba"
      >
        ↑
      </button>
    </div>
  );
}

export default Catalog;