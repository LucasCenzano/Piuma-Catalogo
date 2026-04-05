// MainApp.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Catalog from './Catalog';
import ImageModal from './ImageModal';
import Cart from './Cart'; // ✅
import './App.css';
import './styles.css';
import dataService from './dataService';
import Footer from './Footer';
import HeroBanner from './HeroBanner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faShoppingCart } from '@fortawesome/free-solid-svg-icons'; // ✅
import Pagination from './Pagination';
import ContactBanner from './ContactBanner';

function MainApp() {
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [modalImage, setModalImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // ✅ Estados del carrito
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Estados para manejar datos de la DB
    const [bagsData, setBagsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9; // Muestra 9 productos por página
    // ✅ Estado para el progreso de carga
    const [loadingProgress, setLoadingProgress] = useState(0);

    const searchRef = useRef(null);

    const [categories, setCategories] = useState(['Todos']);

    const loadData = useCallback(async () => {
        await Promise.all([loadProducts(), loadCategories()]);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ✅ Cargar datos inmediatamente al montar el componente
    useEffect(() => {
        loadData();
    }, [loadData]);

    const loadCategories = async () => {
        try {
            const cats = await dataService.getCategories();
            if (cats && cats.length > 0) {
                setCategories(['Todos', ...cats.map(c => c.name)]);
            } else {
                setCategories(['Todos', 'Bandoleras', 'Carteras', 'Billeteras', 'Riñoneras', 'Mochilas', 'Porta Celulares']);
            }
        } catch (e) {
            console.error('Error loading categories in MainApp:', e);
            setCategories(['Todos', 'Bandoleras', 'Carteras', 'Billeteras', 'Riñoneras', 'Mochilas', 'Porta Celulares']);
        }
    };

    // ✅ Función CORREGIDA para cargar productos
    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            setLoadingProgress(10); // Inicio

            console.log('🚀 Iniciando carga de productos...');
            setLoadingProgress(30);

            // Crear una promesa con timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Tiempo de espera agotado. Tu conexión parece lenta o el servidor está tardando mucho.')), 15000)
            );

            // Obtener productos de la API con carrera contra el timeout
            const products = await Promise.race([
                dataService.getAllProducts(),
                timeoutPromise
            ]);
            setLoadingProgress(60);

            console.log(`📦 ${products.length} productos obtenidos de la API`);

            // ✅ CORRECCIÓN IMPORTANTE: Transformar productos para adaptar estructura
            const transformedProducts = products.map(product => {
                // Log para debugging
                console.log(`Producto ${product.name}: in_stock = ${product.in_stock}`);

                return {
                    ...product,
                    images: product.images_url || [],     // Crear 'images' desde 'images_url'
                    inStock: Boolean(product.in_stock)    // ✅ CORRECCIÓN SIMPLE: Convertir directamente a booleano
                };
            });

            setLoadingProgress(80);
            setBagsData(transformedProducts);
            setLoadingProgress(100);

            console.log('✅ Productos cargados y transformados exitosamente');

            // Log para verificar transformación
            console.log('🔍 Verificación de stock:');
            transformedProducts.forEach(p => {
                console.log(`- ${p.name}: inStock = ${p.inStock} (original: ${p.in_stock})`);
            });

        } catch (err) {
            console.error('❌ Error cargando productos:', err);
            setError(err.message || 'Error al cargar productos. Por favor, intenta recargar la página.');
        } finally {
            // ✅ Pequeño delay para que el usuario vea el 100%
            setTimeout(() => {
                setLoading(false);
                setLoadingProgress(0);
            }, 300);
        }
    };
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchTerm]);

    // Scroll al cambiar de página
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);

        if (value.length > 0) {
            const lowercasedValue = value.toLowerCase();
            const uniqueResults = new Set();

            // Añadir sugerencias de productos por nombre, categoría o descripción
            bagsData.forEach(bag => {
                const nameMatch = bag.name.toLowerCase().includes(lowercasedValue);
                const categoryMatch = bag.category.toLowerCase().includes(lowercasedValue);
                const descriptionMatch = bag.description && bag.description.toLowerCase().includes(lowercasedValue);

                if (nameMatch || categoryMatch || descriptionMatch) {
                    uniqueResults.add(JSON.stringify(bag));
                }
            });

            // Añadir sugerencias de categorías
            categories.forEach(category => {
                if (category !== 'Todos' && category.toLowerCase().includes(lowercasedValue)) {
                    uniqueResults.add(JSON.stringify({
                        id: category,
                        name: category + " (Categoría)",
                        isCategory: true,
                        category: category
                    }));
                }
            });

            const resultsArray = Array.from(uniqueResults).map(item => JSON.parse(item));
            resultsArray.sort((a, b) => a.name.localeCompare(b.name));

            setSearchResults(resultsArray);
            setShowSuggestions(true);
        } else {
            setSearchResults([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (item) => {
        if (item.isCategory) {
            setSelectedCategory(item.category);
            setSearchTerm('');
        } else {
            setSearchTerm(item.name);
        }
        setShowSuggestions(false);
        setSearchResults([]);
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setIsMenuOpen(false);
        setSearchTerm('');
        setSearchResults([]);
        setShowSuggestions(false);
    };

    const openModal = (imageSrc, altText, images = [], index = 0) => {
        setModalImage({ src: imageSrc, alt: altText, images, index });
    };

    const closeModal = () => {
        setModalImage(null);
    };

    // ✅ Funciones del Carrito
    const addToCart = (product) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                // Si ya está, aumentamos la cantidad (puedes limitar al stock si lo necesitas)
                return prev.map(item => item.id === product.id 
                    ? { ...item, cartQuantity: item.cartQuantity + 1 } 
                    : item);
            } else {
                // Si es nuevo, lo agregamos
                return [...prev, { ...product, cartQuantity: 1 }];
            }
        });
        setIsCartOpen(true); // Opcional: abrir el carrito automáticamente al agregar algo
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => prev.filter(item => item.id !== productId));
    };

    const updateCartQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }
        setCartItems(prev => prev.map(item => item.id === productId ? { ...item, cartQuantity: newQuantity } : item));
    };

    const getCartTotalItems = () => {
        return cartItems.reduce((acc, item) => acc + item.cartQuantity, 0);
    };

    // Lógica de filtrado del catálogo
    const filteredBags = bagsData.filter(bag => {
        const matchesCategory = selectedCategory === 'Todos' || bag.category === selectedCategory;
        if (searchTerm === '') {
            return matchesCategory;
        }
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        const matchesName = bag.name.toLowerCase().includes(lowercasedSearchTerm);
        const matchesDescription = bag.description && bag.description.toLowerCase().includes(lowercasedSearchTerm);
        const matchesSearchTerm = matchesName || matchesDescription;
        return matchesSearchTerm;
    });

    // Segundo, calculamos la paginación a partir de los productos ya filtrados
    const totalPages = Math.ceil(filteredBags.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItemsOnPage = filteredBags.slice(indexOfFirstItem, indexOfLastItem);

    const handleRefresh = () => {
        dataService.invalidateCache();
        loadProducts();
    };

    if (loading) {
        return (
            <div className="App">
                <header className="App-header">
                    <h1>Piuma</h1>
                </header>
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh'
                }}>
                    {/* Spinner on-brand con colores Piuma */}
                    <div style={{
                        width: '72px',
                        height: '72px',
                        border: '5px solid #e6e3d4',
                        borderTop: '5px solid #c4a265',
                        borderRadius: '50%',
                        animation: 'spin 0.9s linear infinite',
                        marginBottom: '2rem'
                    }}></div>

                    <p style={{
                        fontFamily: "'Playfair Display', serif",
                        fontStyle: 'italic',
                        fontSize: '1.4rem',
                        color: '#5a4a3a',
                        marginBottom: '1.5rem',
                        fontWeight: '400'
                    }}>
                        Cargando colección...
                    </p>

                    {/* Barra de progreso on-brand */}
                    <div style={{
                        width: '260px',
                        height: '4px',
                        backgroundColor: '#e6e3d4',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '1rem'
                    }}>
                        <div style={{
                            width: `${loadingProgress}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #c4a265, #d4af37)',
                            transition: 'width 0.4s ease',
                            borderRadius: '4px'
                        }} />
                    </div>

                    <p style={{
                        fontSize: '0.85rem',
                        color: '#9a8a7a',
                        margin: 0,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                    }}>
                        {loadingProgress < 30 && 'Conectando...'}
                        {loadingProgress >= 30 && loadingProgress < 60 && 'Obteniendo productos...'}
                        {loadingProgress >= 60 && loadingProgress < 80 && 'Preparando catálogo...'}
                        {loadingProgress >= 80 && 'Casi listo...'}
                    </p>

                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>Piuma</h1>
            </header>

            <nav className="main-nav">
                <div className="nav-content">
                    {/* Botón hamburguesa — solo visible en mobile */}
                    <button
                        className="hamburger-menu-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Abrir menú de categorías"
                        aria-expanded={isMenuOpen}
                    >
                        <div className={`bar ${isMenuOpen ? 'open' : ''}`}></div>
                        <div className={`bar ${isMenuOpen ? 'open' : ''}`}></div>
                        <div className={`bar ${isMenuOpen ? 'open' : ''}`}></div>
                    </button>

                    {/* Lista de categorías: pills en desktop, dropdown en mobile */}
                    <ul className={`menu-list ${isMenuOpen ? 'open' : ''}`}>
                        {categories.map(category => (
                            <li key={category} className="menu-item">
                                <button
                                    onClick={() => handleCategoryClick(category)}
                                    className={selectedCategory === category ? 'active' : ''}
                                >
                                    {category}
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="search-container" ref={searchRef}>
                        <input
                            type="text"
                            placeholder="Buscar productos"
                            className="search-input"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => searchTerm.length > 0 && setShowSuggestions(true)}
                        />
                        <span className="search-icon">
                            <FontAwesomeIcon icon={faSearch} />
                        </span>

                        {showSuggestions && searchResults.length > 0 && (
                            <ul className="suggestions-list">
                                {searchResults.slice(0, 8).map(item => (
                                    <li
                                        key={item.id}
                                        onClick={() => handleSuggestionClick(item)}
                                        className={`suggestion-item ${item.isCategory ? 'suggestion-category' : ''}`}
                                    >
                                        <div>
                                            <strong>{item.name}</strong>
                                            {item.description && !item.isCategory && (
                                                <div style={{
                                                    fontSize: '0.8rem',
                                                    color: '#666',
                                                    marginTop: '0.25rem',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {item.description.length > 60
                                                        ? item.description.substring(0, 60) + '...'
                                                        : item.description}
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* ✅ Botón del carrito */}
                    <button 
                        className="cart-nav-btn" 
                        onClick={() => setIsCartOpen(true)}
                        aria-label="Abrir carrito"
                    >
                        <FontAwesomeIcon icon={faShoppingCart} />
                        {getCartTotalItems() > 0 && (
                            <span className="cart-badge">{getCartTotalItems()}</span>
                        )}
                    </button>
                </div>
            </nav>

            {error && (
                <div style={{
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    padding: '1rem',
                    margin: '1rem',
                    border: '1px solid #ffeaa7',
                    borderRadius: '8px',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <strong>⚠️ {error}</strong>
                    <button
                        onClick={handleRefresh}
                        style={{
                            marginLeft: '1rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#f39c12',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🔄 Reintentar
                    </button>
                </div>
            )}



            <HeroBanner
                onCTAClick={() => {
                    const catalog = document.querySelector('.catalog-container');
                    if (catalog) catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
            />

            <main>
                <Catalog
                    bags={currentItemsOnPage}
                    openModal={openModal}
                    selectedCategory={selectedCategory}
                    addToCart={addToCart} // ✅ Pasar función
                />

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                />
                <ContactBanner />
            </main>

            {modalImage && <ImageModal src={modalImage.src} alt={modalImage.alt} images={modalImage.images} initialIndex={modalImage.index} closeModal={closeModal} />}

            {/* ✅ Componente del Carrito */}
            <Cart 
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cartItems={cartItems}
                removeFromCart={removeFromCart}
                updateQuantity={updateCartQuantity}
            />

            <Footer />
        </div>
    );
}

export default MainApp;