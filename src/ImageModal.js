import React, { useState, useEffect } from 'react';
import './styles.css';

function ImageModal({ src, images, initialIndex = 0, alt, closeModal }) {
    // Si pasamos una lista de imágenes, usamos esa. Si no, usamos 'src' como única imagen.
    const imageList = images && images.length > 0 ? images : [src];
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Si cambia el array de imágenes o el índice inicial (por ejemplo al abrir otro modal), reseteamos/actualizamos
    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex, images]);

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % imageList.length);
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
    };

    const currentSrc = imageList[currentIndex];

    // Manejo de teclas flecha izquierda/derecha
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') {
                setCurrentIndex((prev) => (prev + 1) % imageList.length);
            } else if (e.key === 'ArrowLeft') {
                setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
            } else if (e.key === 'Escape') {
                closeModal();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [imageList, closeModal]);

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={closeModal}>×</button>

                <div className="modal-image-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {imageList.length > 1 && (
                        <button
                            className="modal-nav-btn prev"
                            onClick={handlePrev}
                            style={{
                                position: 'absolute',
                                left: '10px',
                                background: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                fontSize: '20px',
                                cursor: 'pointer',
                                zIndex: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ‹
                        </button>
                    )}

                    <img src={currentSrc} alt={alt} className="modal-image" style={{ maxHeight: '90vh', maxWidth: '100%', objectFit: 'contain' }} />

                    {imageList.length > 1 && (
                        <button
                            className="modal-nav-btn next"
                            onClick={handleNext}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                background: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                fontSize: '20px',
                                cursor: 'pointer',
                                zIndex: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ›
                        </button>
                    )}
                </div>

                {imageList.length > 1 && (
                    <div style={{ textAlign: 'center', marginTop: '10px', color: 'white' }}>
                        {currentIndex + 1} / {imageList.length}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ImageModal;