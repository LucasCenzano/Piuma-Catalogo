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
    <div style={{
      position: 'relative', width: 'calc(100% + 4rem)',
      marginLeft: '-2rem',
      marginRight: '-2rem', height: '100%'
    }}>
      {loading && (
        <div
          className={className}
          style={{
            ...style,
            position: 'absolute',
            top: 0,
            left: 0,
            width: 'calc(100% + 4rem)',
            marginLeft: '-2rem',
            marginRight: '-2rem',
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
function Catalog({ bags, openModal, selectedCategory, addToCart }) {
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  /* const { preloadProgress } = useImagePreloader(bags); - Removed for performance */
  const [sortOrder, setSortOrder] = useState('default');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]); // List of available filters
  const [selectedFilter, setSelectedFilter] = useState(null); // Currently selected filter key
  const [changingImages, setChangingImages] = useState({}); // Track which images are changing
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);


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

  // Touch handlers for swipe
  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (productId, totalImages) => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      const fakeEvent = { stopPropagation: () => { } };
      handleNextImage(fakeEvent, productId, totalImages);
    } else if (isRightSwipe) {
      const fakeEvent = { stopPropagation: () => { } };
      handlePrevImage(fakeEvent, productId, totalImages);
    }
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
        <div style={{
          textAlign: 'center',
          padding: '5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          {/* Ilustración SVG minimalista */}
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.35 }}>
            <circle cx="60" cy="60" r="56" stroke="#c4a265" strokeWidth="2" strokeDasharray="8 4"/>
            <path d="M38 48h44l-6 34H44L38 48z" stroke="#c4a265" strokeWidth="2" strokeLinejoin="round" fill="none"/>
            <path d="M48 48c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#c4a265" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <circle cx="52" cy="68" r="2.5" fill="#c4a265"/>
            <circle cx="68" cy="68" r="2.5" fill="#c4a265"/>
          </svg>
          <div>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: '1.6rem',
              color: '#5a4a3a',
              margin: '0 0 0.5rem 0',
              fontWeight: '400'
            }}>
              Sin productos disponibles
            </p>
            <p style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '0.9rem',
              color: '#9a8a7a',
              margin: 0,
              letterSpacing: '0.3px'
            }}>
              Probá cambiando la categoría o el filtro seleccionado.
            </p>
          </div>
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
                <div
                  className="product-image-container"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(bag.id, allImages.length)}
                >
                  <SafeProductImage
                    src={currentImage}
                    alt={bag.name}
                    className={`product-image ${changingImages[bag.id] ? 'changing' : ''}`}
                    loading={index < 4 ? "eager" : "lazy"}
                    onClick={() => currentImage && openModal(currentImage, bag.name, allImages, currentIndex)}
                  />

                  {/* Categoria como badge flotante abajo-izquierda */}
                  {bag.category && (
                    <span className="product-category-badge">
                      {bag.category}
                    </span>
                  )}

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
                            borderRadius: '0 0 12px 12px',
                            boxSizing: 'border-box',
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

                  {/* Botón Añadir al carrito */}
                  <button
                    onClick={() => addToCart(bag)}
                    disabled={!isInStock}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: 'calc(100% + 4rem)',
                      marginLeft: '-2rem',
                      marginRight: '-2rem',
                      marginTop: '1.5rem',
                      padding: '0.8rem 2rem',
                      background: isInStock ? 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' : '#e0e0e0',
                      color: isInStock ? 'white' : '#999',
                      border: 'none',
                      textAlign: 'center',
                      borderRadius: '0 0 12px 12px',
                      boxSizing: 'border-box',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      cursor: isInStock ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                      boxShadow: isInStock ? '0 2px 8px rgba(37, 211, 102, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (isInStock) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isInStock) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 211, 102, 0.3)';
                      }
                    }}
                  >
                    🛒 {isInStock ? 'Agregar al carrito' : 'Sin stock'}
                  </button>
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