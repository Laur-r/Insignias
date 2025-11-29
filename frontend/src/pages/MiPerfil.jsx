import React, { useEffect, useState } from "react";
import "../styles/MiPerfil.css";
import defaultBanner from "../assets/banner.png";
import defaultAvatar from "../assets/user.png";
import { useUser } from "../components/Context/UserContext"; 

const MiPerfil = () => {
  const { usuario } = useUser();
  const [insignias, setInsignias] = useState([
    { id: 1, nombre: "Ahorrista Inicial", icono: "savings", desbloqueada: true },
    { id: 2, nombre: "Finanzas Estables", icono: "trending_up", desbloqueada: true },
    { id: 3, nombre: "Control Total", icono: "account_balance_wallet", desbloqueada: true },
    { id: 4, nombre: "Planificador", icono: "schedule", desbloqueada: false },
    { id: 5, nombre: "Maestro del Ahorro", icono: "diamond", desbloqueada: false },
    { id: 6, nombre: "Inversor Pro", icono: "show_chart", desbloqueada: false },
  ]);

  const [actividad, setActividad] = useState([
    { texto: "Registraste un nuevo gasto en Transporte.", tiempo: "Hace 2 horas", icono: "directions_car", color: "#f59e0b" },
    { texto: "Alcanzaste tu meta de ahorro mensual.", tiempo: "Hace 1 día", icono: "celebration", color: "#10b981" },
    { texto: "Actualizaste tu información de cuenta.", tiempo: "Hace 3 días", icono: "settings", color: "#6366f1" },
  ]);

  // === Datos del nivel ===
  const [xpActual, setXpActual] = useState(250);
  const [xpNecesaria, setXpNecesaria] = useState(500);
  const [nivel, setNivel] = useState(3);
  const [tituloNivel, setTituloNivel] = useState("Explorador financiero");

  // === Stats adicionales ===
  const [stats, setStats] = useState({
    racha: 12,
    metasCompletadas: 8,
    totalAhorrado: 2450,
  });

  const [comentario, setComentario] = useState("");


  const handleAgregarInsignia = () => {
    alert("Funcionalidad próximamente disponible");
  };

  const handleEditarPerfil = () => {
    alert("Editar perfil próximamente");
  };

  const handleGuardarComentario = () => {
    if (comentario.trim() === "") return;
    alert("Comentario guardado correctamente 🎉");
    setComentario("");
  };

  const progreso = (xpActual / xpNecesaria) * 100;
  const insigniasDesbloqueadas = insignias.filter((i) => i.desbloqueada).length;

  return (
    <div className="perfil-container">
      {/* === Banner === */}
      <div className="perfil-banner">
        <div className="banner-overlay"></div>
        <img src={defaultBanner} alt="Banner" className="perfil-banner-img" />

        <div className="banner-actions">
          <button className="banner-btn" onClick={handleEditarPerfil}>
            <span className="material-icons">edit</span>
          </button>
        </div>

        {/* === Avatar y datos del usuario === */}
        <div className="perfil-user-info">
          <div className="avatar-wrapper">
            <img
              src={usuario.foto_perfil || defaultAvatar}
              alt="avatar"
              className="perfil-avatar"
              onError={(e) => (e.target.src = defaultAvatar)} // Fallback si la imagen falla
            />
            <div className="avatar-status"></div>
          </div>
          <div className="perfil-datos">
            <h2>{usuario.nombre || "Usuario"}</h2>
            <p className="user-email">{usuario.email || "usuario@fintrax.com"}</p>
          </div>
        </div>

        {/* === Nivel === */}
        <div className="perfil-nivel-banner">
          <div className="nivel-badge">
            <div className="nivel-icon-wrapper">
              <span className="material-icons">military_tech</span>
              <div className="nivel-shine"></div>
            </div>
            <span className="nivel-numero">Nivel {nivel}</span>
          </div>
          <div className="nivel-info">
            <h4>{tituloNivel}</h4>
            <div className="nivel-barra-mini">
              <div
                className="nivel-progreso-mini"
                style={{ width: `${progreso}%` }}
              >
                <div className="progreso-shine"></div>
              </div>
            </div>
            <p className="nivel-xp">
              {xpActual} / {xpNecesaria} XP
              <span className="xp-restante"> • {xpNecesaria - xpActual} XP para subir</span>
            </p>
          </div>
        </div>
      </div>

      {/* === Insignias === */}
      <section className="perfil-section insignias-section">
        <div className="section-header">
          <h3>
            <span className="material-icons">workspace_premium</span>
            Colección de Insignias
          </h3>
          <span className="insignias-count">
            {insigniasDesbloqueadas}/{insignias.length}
          </span>
        </div>
        <div className="perfil-insignias">
          {insignias.map((item) => (
            <div
              key={item.id}
              className={`insignia-card ${
                item.desbloqueada ? "desbloqueada" : "bloqueada"
              }`}
            >
              <div className="insignia-glow"></div>
              <span className="material-icons">{item.icono}</span>
              <p className="insignia-nombre">{item.nombre}</p>
            </div>
          ))}
          <div className="insignia-add" onClick={handleAgregarInsignia}>
            <span className="material-icons">add</span>
            <p className="insignia-nombre">Explorar más</p>
          </div>
        </div>
      </section>

      {/* === Actividad === */}
      <section className="perfil-section">
        <div className="section-header">
          <h3>
            <span className="material-icons">history</span>
            Timeline de Actividad
          </h3>
        </div>
        <div className="actividad-timeline">
          {actividad.map((item, index) => (
            <div key={index} className="actividad-item">
              <div
                className="actividad-icon"
                style={{
                  backgroundColor: `${item.color}20`,
                  borderColor: item.color,
                }}
              >
                <span className="material-icons" style={{ color: item.color }}>
                  {item.icono}
                </span>
              </div>
              <div className="actividad-content">
                <p className="actividad-texto">{item.texto}</p>
                <span className="actividad-tiempo">{item.tiempo}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === Comentario === */}
      <section className="perfil-section comentario-section">
        <div className="section-header">
          <h3>
            <span className="material-icons">edit_note</span>
            Nota Personal
          </h3>
        </div>
        <div className="comentario-wrapper">
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="💭 Escribe tus reflexiones financieras, metas o recordatorios personales..."
            maxLength={500}
          />
          <div className="comentario-footer">
            <span className="char-count">{comentario.length}/500</span>
            <button onClick={handleGuardarComentario} disabled={!comentario.trim()}>
              <span className="material-icons">save</span>
              Guardar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MiPerfil;
