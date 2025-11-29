import React from "react";
import Logo from "../assets/logo.png"; 
import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Logo y tagline */}
        <div className="footer-logo">
          <img src={Logo} alt="Fintrax Logo" />
          <div className="footer-tagline">Controla tus gastos, domina tus metas</div>
        </div>

        {/* Links legales */}
        <div className="footer-links">
          <a href="#">Política de Privacidad</a>
          <a href="#">Términos y Condiciones</a>
          <a href="#">Contacto</a>
        </div>
      </div>

      {/* Copy */}
      <div className="footer-copy">
        © 2025 FintraX. Todos los derechos reservados.
      </div>
    </footer>
  );
}
