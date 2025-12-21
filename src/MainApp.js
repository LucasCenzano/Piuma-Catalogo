// MainApp.js - SOLUCIÓN ACTUALIZADA
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Catalog from './Catalog';
import ImageModal from './ImageModal';
import './styles.css';
import dataService from './dataService';
import Footer from './Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import Pagination from './Pagination';
import ContactBanner from './ContactBanner';

function MainApp() {
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [modalImage, setModalImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

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

            // Obtener productos de la API
            const products = await dataService.getAllProducts();
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
            setError('Error al cargar productos. Por favor, intenta recargar la página.');
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

    // ✅ Pantalla de carga optimizada con progreso
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
                    minHeight: '50vh'
                }}>
                    {/* ✅ Indicador de progreso visual */}
                    <div style={{
                        width: '80px',
                        height: '80px',
                        border: '6px solid #f3f3f3',
                        borderTop: '6px solid #007bff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '2rem'
                    }}></div>

                    <p style={{
                        fontSize: '1.3rem',
                        color: '#333',
                        marginBottom: '1rem',
                        fontWeight: '600'
                    }}>
                        Cargando productos...
                    </p>

                    {/* ✅ Barra de progreso */}
                    <div style={{
                        width: '300px',
                        height: '8px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '1rem'
                    }}>
                        <div style={{
                            width: `${loadingProgress}%`,
                            height: '100%',
                            backgroundColor: '#007bff',
                            transition: 'width 0.3s ease',
                            borderRadius: '4px'
                        }} />
                    </div>

                    <p style={{
                        fontSize: '1rem',
                        color: '#666',
                        margin: 0
                    }}>
                        {loadingProgress < 30 && 'Conectando con la base de datos...'}
                        {loadingProgress >= 30 && loadingProgress < 60 && 'Obteniendo productos...'}
                        {loadingProgress >= 60 && loadingProgress < 80 && 'Procesando imágenes...'}
                        {loadingProgress >= 80 && 'Finalizando...'}
                    </p>

                    <style>
                        {`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}
                    </style>
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
                    <button
                        className="hamburger-menu-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <div className="bar"></div>
                        <div className="bar"></div>
                        <div className="bar"></div>
                    </button>

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



            <main>
                <Catalog
                    bags={currentItemsOnPage} // ✅ PASO 5: PASAR SOLO LOS ITEMS DE LA PÁGINA ACTUAL
                    openModal={openModal}
                    selectedCategory={selectedCategory}
                />

                {/* ✅ PASO 6: AÑADIR EL COMPONENTE DE PAGINACIÓN */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                />
                <ContactBanner />
            </main>

            {modalImage && <ImageModal src={modalImage.src} alt={modalImage.alt} images={modalImage.images} initialIndex={modalImage.index} closeModal={closeModal} />}

            <Footer />
        </div>
    );
}

export default MainApp;