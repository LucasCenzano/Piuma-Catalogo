import React from 'react';
import './HeroBanner.css';

function HeroBanner({ onCTAClick }) {
  return (
    <section className="hero-banner" aria-label="Banner principal Piuma">
      {/* Fondo decorativo con patrón */}
      <div className="hero-bg-pattern" aria-hidden="true" />

      <div className="hero-content">
        {/* Línea decorativa */}
        <div className="hero-line" aria-hidden="true" />

        <p className="hero-eyebrow">Nueva colección · 2026</p>

        <h2 className="hero-title">
          Estilo y calidad,<br />
          <em>al mejor precio.</em>
        </h2>

        <p className="hero-subtitle">
          Carteras, mochilas, billeteras y mucho más.
          Encontrá lo que buscás en nuestra colección.
        </p>

        <div className="hero-actions">
          <button
            className="hero-cta-primary"
            onClick={onCTAClick}
            aria-label="Ver colección completa"
          >
            Ver colección
          </button>
          <a
            href="https://www.instagram.com/piuma_carteras/"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-cta-secondary"
          >
            Seguinos en Instagram
          </a>
        </div>
      </div>

      {/* Elementos decorativos flotantes */}
      <div className="hero-deco hero-deco-1" aria-hidden="true" />
      <div className="hero-deco hero-deco-2" aria-hidden="true" />
      <div className="hero-deco hero-deco-3" aria-hidden="true" />
    </section>
  );
}

export default HeroBanner;
