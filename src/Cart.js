import React from 'react';
import './Cart.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp as fabWhatsapp } from '@fortawesome/free-brands-svg-icons';

function Cart({ isOpen, onClose, cartItems, removeFromCart, updateQuantity }) {
    if (!isOpen) return null;

    // Calcular el total de la compra sumando precio final (con descuento si aplica) * cantidad
    const calculateTotal = () => {
        let total = 0;
        cartItems.forEach(item => {
            let itemPrice = 0;
            // Si el precio es string formato $10.000,00
            if (item.price && typeof item.price === 'string') {
                let cleanPrice = item.price.replace(/[^0-9,.-]/g, '');
                cleanPrice = cleanPrice.replace(/\./g, '');
                cleanPrice = cleanPrice.replace(',', '.');
                itemPrice = parseFloat(cleanPrice) || 0;
            } else if (typeof item.price === 'number') {
                itemPrice = item.price;
            }
            
            // Aplicar descuento si lo hay
            if (item.discount_percentage > 0) {
                itemPrice = itemPrice - (itemPrice * (item.discount_percentage / 100));
            }
            total += itemPrice * item.cartQuantity;
        });
        return total;
    };

    const formatPrice = (price) => {
        return `$${price.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    };

    const handleCheckout = () => {
        if (cartItems.length === 0) return;

        const whatsappNumber = '5493874423595'; // ✅ Tu número
        let message = `¡Hola! Me gustaría hacer un pedido del catálogo:\n\n`;
        
        cartItems.forEach((item, index) => {
            message += `${index + 1}. *${item.name}* (Cant: ${item.cartQuantity})\n`;
            if (item.category) message += `   - Categoría: ${item.category}\n`;
        });

        const total = calculateTotal();
        if (total > 0) {
            message += `\n*Total estimado:* ${formatPrice(total)}\n`;
        }
        
        message += `\n¿A qué cuenta puedo transferir? ¡Gracias!`;

        const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappLink, '_blank');
    };

    const handleBackdropClick = (e) => {
        if (e.target.className === 'cart-overlay') {
            onClose();
        }
    };

    return (
        <div className="cart-overlay" onClick={handleBackdropClick}>
            <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h2>Tu Carrito</h2>
                    <button className="cart-close-btn" onClick={onClose} aria-label="Cerrar carrito">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="cart-body">
                    {cartItems.length === 0 ? (
                        <div className="cart-empty">
                            <p className="cart-empty-icon">🛍️</p>
                            <p>Tu carrito está vacío.</p>
                            <button className="cart-continue-btn" onClick={onClose}>
                                Continuar comprando
                            </button>
                        </div>
                    ) : (
                        <div className="cart-items-list">
                            {cartItems.map((item) => (
                                <div key={item.id} className="cart-item">
                                    <div className="cart-item-image-wrapper">
                                        <img 
                                            src={item.images && item.images.length > 0 ? item.images[0] : ''} 
                                            alt={item.name} 
                                            className="cart-item-img"
                                            onError={(e) => { e.target.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; e.target.style.background = '#f0f0f0'; }}
                                        />
                                    </div>
                                    <div className="cart-item-details">
                                        <h4 className="cart-item-title">{item.name}</h4>
                                        <div className="cart-item-quantity">
                                            <button onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}>-</button>
                                            <span>{item.cartQuantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}>+</button>
                                        </div>
                                    </div>
                                    <button 
                                        className="cart-item-remove" 
                                        onClick={() => removeFromCart(item.id)}
                                        aria-label="Remove item"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-total">
                            <span>Total estimado:</span>
                            <span className="cart-total-price">{formatPrice(calculateTotal())}</span>
                        </div>
                        <button className="cart-checkout-btn" onClick={handleCheckout}>
                            <FontAwesomeIcon icon={fabWhatsapp} style={{ marginRight: '8px' }} />
                            Enviar pedido
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Cart;
