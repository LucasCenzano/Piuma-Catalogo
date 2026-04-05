import React from 'react';
import { FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* Columna marca */}
        <div className="footer-col footer-brand">
          <span className="footer-logo">Piuma</span>
          <p className="footer-tagline">
            Carteras y accesorios. Salta, Argentina.
          </p>
          <div className="footer-social">
            <a
              href="https://www.instagram.com/piuma_carteras?igsh=c3dpdWtycndleTYx"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="Instagram de Piuma"
            >
              <FaInstagram />
            </a>
            <a
              href="https://wa.me/5493874423595"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="WhatsApp de Piuma"
            >
              <FaWhatsapp />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="TikTok de Piuma"
            >
              <FaTiktok />
            </a>
          </div>
        </div>

        {/* Columna contacto */}
        <div className="footer-col">
          <h3 className="footer-col-title">Contacto</h3>
          <ul className="footer-links">
            <li>
              <a
                href="https://wa.me/5493874423595?text=Hola!%20Vengo%20del%20cat%C3%A1logo%20y%20quiero%20consultar."
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href="https://www.instagram.com/piuma_carteras/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            </li>
            <li>
              <span className="footer-text">Salta, Argentina</span>
            </li>
          </ul>
        </div>

        {/* Columna catálogo */}
        <div className="footer-col">
          <h3 className="footer-col-title">Catálogo</h3>
          <ul className="footer-links">
            <li><span className="footer-text">Carteras</span></li>
            <li><span className="footer-text">Bandoleras</span></li>
            <li><span className="footer-text">Billeteras</span></li>
            <li><span className="footer-text">Riñoneras</span></li>
            <li><span className="footer-text">Porta Celulares</span></li>
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p>
          © {currentYear} Piuma · Todos los derechos reservados ·{' '}
          <Link to="/admin" style={{ color: 'inherit', textDecoration: 'none' }}>
            Admin
          </Link>
        </p>
        <p className="footer-credits">
          Diseño y desarrollo por Lucas Cenzano
        </p>
      </div>
    </footer>
  );
}

export default Footer;