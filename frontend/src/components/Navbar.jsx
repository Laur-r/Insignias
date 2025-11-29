import { useState } from "react";
import { Link } from "react-router-dom"; // Importar Link
import "../styles/Navbar.css";
import "../styles/Responsive.css";
import logo from "../assets/logo.png";
import Button from "./Button";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="logo">
        <img src={logo} alt="FintraX logo" />
      </div>

      {/* Botón hamburguesa */}
      <button
        className={`menu-toggle ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Links */}
      <ul className={`nav-links ${menuOpen ? "active" : ""}`}>
        <li><Link to="/">Inicio</Link></li>
        <li><a href="#">¿Por qué FintraX?</a></li>
        <li><a href="#">¿Cómo funciona?</a></li>
        <li><a href="#">Ayuda</a></li>

        {/* Botones en móvil */}
        <div className="nav-buttons mobile-only">
          <Link to="/login">
            <Button text="Iniciar sesión" variant="secondary" />
          </Link>
          <Link to="/register">
            <Button text="Registrarse" variant="primary" />
          </Link>
        </div>
      </ul>

      {/* Botones en desktop */}
      <div className="nav-buttons desktop-only">
        <Link to="/login">
          <Button text="Iniciar sesión" variant="secondary" />
        </Link>
        <Link to="/register">
          <Button text="Registrarse" variant="primary" />
        </Link>
      </div>
    </nav>
  );
}
