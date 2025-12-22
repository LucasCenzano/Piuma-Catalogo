import React, { useState, useEffect, useRef } from 'react';
import './styles.css';

function ImageGallery({ images, name }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const pauseTimeoutRef = useRef(null);

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    // Pause auto-play for 10 seconds when user interacts
    const pauseAutoPlay = () => {
        setIsPaused(true);

        // Clear any existing timeout
        if (pauseTimeoutRef.current) {
            clearTimeout(pauseTimeoutRef.current);
        }

        // Resume auto-play after 10 seconds
        pauseTimeoutRef.current = setTimeout(() => {
            setIsPaused(false);
        }, 10000);
    };

    const handleNext = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        pauseAutoPlay();
    };

    const handlePrevious = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
        pauseAutoPlay();
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

    const handleDotClick = (index) => {
        setCurrentImageIndex(index);
        pauseAutoPlay();
    };

    useEffect(() => {
        if (!images || images.length <= 1 || isPaused) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [images, isPaused]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (pauseTimeoutRef.current) {
                clearTimeout(pauseTimeoutRef.current);
            }
        };
    }, []);

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
                                onClick={() => handleDotClick(index)}
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