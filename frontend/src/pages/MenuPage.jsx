import React, { useState, useEffect } from "react";
import "../styles/MenuPage.css";
import logo from "../assets/logo.png";
import userIcon from "../assets/user.png";
import botImage from "../assets/bothome.png";
import { useNavigate } from "react-router-dom";
import GestionFinanciera from "../pages/GestionFinanciera";
import Dashboard from "../pages/Dashboard";
import AjustesCuenta from "../pages/AjustesCuenta";
import MetasAhorro from "../pages/MetasAhorro";
import MiPerfil from "../pages/MiPerfil";
import { useUser } from "../components/Context/UserContext"; // ✅ IMPORTAR useUser
import MisLogros from "../pages/MisLogros";

const sectionsData = [
  { id: "perfil", icon: "person", label: "Mi Perfil" },
  { id: "dashboard", icon: "dashboard", label: "Mis Finanzas" },
  { id: "registrar", icon: "app_registration", label: "Registrar" },
  { id: "educacion", icon: "school", label: "Educación" },
  { id: "logros", icon: "emoji_events", label: "Mis Logros" }, // ✅ NUEVO
  { id: "metas", icon: "savings", label: "Metas de Ahorro" },
  { id: "ajustes", icon: "settings", label: "Ajustes de Cuenta" },
];

const MenuPage = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [sectionTitle, setSectionTitle] = useState("Bienvenido");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  const { usuario, setUsuario } = useUser(); 
  const navigate = useNavigate();

  // 🔹 Cargar datos del usuario desde el backend
  useEffect(() => {
    const cargarUsuario = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/api/usuarios/perfil", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        // Construir URL de foto
        const baseURL = "http://localhost:3000";
        const fotoURL = data.foto_perfil
          ? data.foto_perfil.startsWith("http")
            ? data.foto_perfil
            : `${baseURL}${data.foto_perfil}`
          : "";

        const datosUsuario = {
          documento: data.documento,
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          telefono: data.telefono,
          pais: data.pais,
          foto_perfil: fotoURL
        };

        // ✅ ACTUALIZAR EL CONTEXTO
        setUsuario(datosUsuario);

        // ✅ GUARDAR EN LOCALSTORAGE
        localStorage.setItem("usuario", JSON.stringify(datosUsuario));


      } catch (error) {
        navigate("/login");
      }
    };

    cargarUsuario();
  }, [navigate, setUsuario]);

  const handleSectionChange = (id, label) => {
    setActiveSection(id);
    setSectionTitle(label);
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // 🔹 Render dinámico del contenido de secciones
  const renderSectionContent = (id, label) => {
    switch (id) {
      case "ajustes":
        return <AjustesCuenta />;
      case "registrar":
        return <GestionFinanciera />;
      case "dashboard":
        return <Dashboard />;
      case "metas":
        return <MetasAhorro />;
      case "perfil":
        return <MiPerfil />;
        case "logros":
        return <MisLogros />;
      default:
        return (
          <>
            <h2>{label}</h2>
            <p>Contenido de la sección {label}</p>
          </>
        );
    }
  };

  return (
    <div className="menu-wrapper">
      <div className="menu-container">
        {/* Sidebar */}
        <aside className="menu-sidebar">
          <div className="menu-logo">
            <img src={logo} alt="Fintrax Logo" className="menu-logo-img" />
          </div>

          <nav>
            <ul className="menu-list">
              {sectionsData.map(({ id, icon, label }) => (
                <li
                  key={id}
                  className={`menu-item ${activeSection === id ? "active" : ""}`}
                  onClick={() => handleSectionChange(id, label)}
                >
                  <span className="material-icons menu-icon">{icon}</span>
                  <span className="menu-item-label">{label}</span>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Contenido principal */}
        <div className="menu-main-content">
          {/* Navbar */}
          <header className="menu-navbar">
            <div className="menu-navbar-left">
              <div className="menu-navbar-title">{sectionTitle}</div>
            </div>

            <div className="menu-navbar-user">
              <div className="menu-notification-btn" title="Notificaciones">
                <span className="material-icons">notifications</span>
                <div className="menu-notification-badge">3</div>
              </div>

              <div className="menu-user-profile" onClick={toggleUserDropdown}>
                <img
                  src={usuario.foto_perfil || userIcon}
                  alt="User"
                  className="menu-avatar"
                  onError={(e) => {
                    console.error('❌ Error al cargar imagen:', usuario.foto_perfil);
                    e.target.src = userIcon;
                  }}
                />
                <div className="menu-user-info">
                  <p className="menu-user-name">{usuario.nombre || 'Usuario'}</p>
                  <p className="menu-user-email">{usuario.email || ''}</p>
                </div>

                {showUserDropdown && (
                  <div className="menu-user-dropdown">
                    <button className="menu-btn" onClick={handleLogout}>
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Secciones dinámicas */}
          <div className="menu-content-wrapper">
            {activeSection === null ? (
              <section className="menu-section active-section">
                <div className="menu-section-content">
                  <div className="welcome-container">
                    <div className="welcome-text">
                      <h2>Bienvenido, {usuario.nombre || 'Usuario'}!</h2>
                      <p>
                        Estamos encantados de tenerte con nosotros. ¿Qué te gustaría hacer hoy?
                      </p>
                    </div>
                    <div className="welcome-bot">
                      <img src={botImage} alt="Bot" className="bot-image" />
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              sectionsData.map(({ id, label }) => (
                <section
                  key={id}
                  id={id}
                  className={`menu-section ${activeSection === id ? "active-section" : ""}`}
                >
                  <div className="menu-section-content">
                    {renderSectionContent(id, label)}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;