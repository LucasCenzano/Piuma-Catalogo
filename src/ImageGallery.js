import React, { useState } from 'react';
import './styles.css';

function ImageGallery({ images, name }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    const handleNext = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const handlePrevious = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handleNext();
        } else if (isRightSwipe) {
            handlePrevious();
        }
    };

    React.useEffect(() => {
        if (!images || images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [images]);

    return (
        <div className="image-gallery">
            <div
                className="gallery-image-container"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <img
                    src={images[currentImageIndex]}
                    alt={`${name} - imagen ${currentImageIndex + 1}`}
                    className="bag-image"
                />
            </div>

            {images.length > 1 && (
                <>
                    {/* Arrows - hidden on mobile via CSS */}
                    <button className="gallery-btn prev-btn" onClick={handlePrevious}>
                        &lt;
                    </button>
                    <button className="gallery-btn next-btn" onClick={handleNext}>
                        &gt;
                    </button>

                    {/* Dot indicators */}
                    <div className="gallery-dots">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                                onClick={() => setCurrentImageIndex(index)}
                                aria-label={`Ver imagen ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default ImageGallery;