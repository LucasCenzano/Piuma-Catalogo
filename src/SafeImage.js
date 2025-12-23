import React, { useState } from 'react';

// Componente para imagen segura
const SafeImage = ({ src, alt, style, ...props }) => {
    const [imageError, setImageError] = useState(false);

    if (!src || imageError) {
        return (
            <div
                style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa',
                    border: '2px dashed #dee2e6',
                    color: '#6c757d',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    borderRadius: '8px'
                }}
                {...props}
            >
                📷 Sin imagen
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            style={style}
            onError={() => setImageError(true)}
            {...props}
        />
    );
};

export default SafeImage;
