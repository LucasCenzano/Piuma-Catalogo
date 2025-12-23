import React, { useState, useEffect, useRef } from 'react';
import './styles.css';

function ImageGallery({ images, name }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const intervalRef = useRef(null);
    const lastInteractionRef = useRef(Date.now());

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;
    const AUTO_PLAY_DELAY = 5000; // 5 seconds
    const PAUSE_DURATION = 10000; // 10 seconds after user interaction

    // Clear and restart the auto-play interval
    const resetAutoPlay = () => {
        // Clear existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Only start auto-play if we have multiple images
        if (!images || images.length <= 1) return;

        // Start new interval
        intervalRef.current = setInterval(() => {
            const timeSinceLastInteraction = Date.now() - lastInteractionRef.current;

            // Only auto-advance if enough time has passed since last interaction
            if (timeSinceLastInteraction >= PAUSE_DURATION) {
                setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
            }
        }, AUTO_PLAY_DELAY);
    };

    // Mark user interaction
    const markInteraction = () => {
        lastInteractionRef.current = Date.now();
    };

    const handleNext = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        markInteraction();
    };

    const handlePrevious = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
        markInteraction();
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
        markInteraction();
    };

    // Setup auto-play on mount and when images change
    useEffect(() => {
        resetAutoPlay();

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
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