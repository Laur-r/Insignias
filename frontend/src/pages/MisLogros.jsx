import { useState, useEffect } from 'react';
import '../styles/MisLogros.css';

const MisLogros = () => {
  const [loading, setLoading] = useState(true);
  const [todasInsignias, setTodasInsignias] = useState([]);
  const [insigniasFiltradas, setInsigniasFiltradas] = useState([]);
  const [filtroActivo, setFiltroActivo] = useState('todas');
  const [stats, setStats] = useState({
    xp_total: 0,
    insignias_desbloqueadas: 0,
    total_insignias: 0
  });
  const [insigniaSeleccionada, setInsigniaSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const API_URL = 'http://localhost:3000/api/logros';

  const getUsuarioDocumento = () => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    return usuario.documento;
  };

  // Función para obtener la ruta correcta de la imagen
  const obtenerRutaImagen = (imagenUrl) => {
    if (!imagenUrl) return '/assets/badges/default-badge.png';
    
    // Extrae solo el nombre del archivo
    const nombreArchivo = imagenUrl.split('/').pop();
    return `/assets/badges/${nombreArchivo}`;
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const usuarioDocumento = getUsuarioDocumento();
      
      if (!usuarioDocumento) {
        console.error('No se encontró documento de usuario');
        setLoading(false);
        return;
      }

      // Intentar verificar progreso (pero continuar si falla)
      try {
        const verificarResponse = await fetch(`${API_URL}/verificar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuarioDocumento })
        });

        if (!verificarResponse.ok) {
          console.warn('Verificación falló, pero continuando...');
        }
      } catch (verificarError) {
        console.warn('Error en verificación:', verificarError);
      }

      // Obtener insignias
      const response = await fetch(`${API_URL}/${usuarioDocumento}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const todas = [
          ...(data.data.insigniasPorTipo?.educacion || []),
          ...(data.data.insigniasPorTipo?.ahorro || []),
          ...(data.data.insigniasPorTipo?.habitos || []),
          ...(data.data.insigniasPorTipo?.transacciones || [])
        ];
        
        setTodasInsignias(todas);
        setInsigniasFiltradas(todas);
        setStats(data.data.stats || {
          xp_total: 0,
          insignias_desbloqueadas: 0,
          total_insignias: todas.length
        });
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarInsignias = (tipo) => {
    setFiltroActivo(tipo);
    if (tipo === 'todas') {
      setInsigniasFiltradas(todasInsignias);
    } else {
      setInsigniasFiltradas(todasInsignias.filter(i => i.tipo === tipo));
    }
  };

  const abrirDetalleInsignia = (insignia) => {
    setInsigniaSeleccionada(insignia);
    setMostrarModal(true);
  };

  const categorias = [
    { id: 'todas', nombre: 'Todas', icono: 'grid_view' },
    { id: 'ahorro', nombre: 'Ahorro', icono: 'savings' },
    { id: 'educacion', nombre: 'Educación', icono: 'school' },
    { id: 'habitos', nombre: 'Hábitos', icono: 'event_available' },
    { id: 'transacciones', nombre: 'Registros', icono: 'receipt_long' }
  ];

  const obtenerMensajeProgreso = (insignia) => {
    const restante = insignia.valor_requerido - insignia.progreso_actual;
    
    if (insignia.completada) {
      return `¡Insignia desbloqueada el ${new Date(insignia.desbloqueada_en).toLocaleDateString('es-CO')}!`;
    }

    switch (insignia.condicion_tipo) {
      case 'cursos_completados':
        return `Completa ${restante} curso${restante > 1 ? 's' : ''} más`;
      case 'metas_activas':
        return `Crea ${restante} meta${restante > 1 ? 's' : ''} activa${restante > 1 ? 's' : ''} más`;
      case 'metas_completadas':
        return `Completa ${restante} meta${restante > 1 ? 's' : ''} más`;
      case 'login_streak':
        return `Inicia sesión ${restante} día${restante > 1 ? 's' : ''} más consecutivos`;
      case 'resumen_mensual':
        return `Cierra ${restante} resumen${restante > 1 ? 'es' : ''} mensual${restante > 1 ? 'es' : ''} más`;
      case 'transacciones_registradas':
        return `Registra ${restante} transacción${restante > 1 ? 'es' : ''} más`;
      default:
        return 'Sigue progresando';
    }
  };

  const getNombreTipo = (tipo) => {
    const tipos = {
      educacion: 'Educación',
      ahorro: 'Ahorro',
      habitos: 'Hábitos',
      transacciones: 'Registros'
    };
    return tipos[tipo] || tipo;
  };

  if (loading) {
    return (
      <div className="logros-container">
        <p style={{ color: 'white', textAlign: 'center' }}>Cargando logros...</p>
      </div>
    );
  }

  return (
    <div className="logros-container">
      {/* Header */}
      <div className="logros-header">
        <h1 className="logros-title">Mis Logros</h1>
        <p className="logros-subtitle">Desbloquea insignias y gana experiencia</p>
      </div>

      {/* Stats Cards */}
      <div className="logros-stats-cards">
        <div className="stat-card-logros">
          <div className="stat-icon-logros">
            <span className="material-icons">workspace_premium</span>
          </div>
          <div className="stat-info-logros">
            <span className="stat-label-logros">Logros Desbloqueados</span>
            <span className="stat-value-logros">{stats.insignias_desbloqueadas}</span>
          </div>
        </div>

        <div className="stat-card-logros">
          <div className="stat-icon-logros">
            <span className="material-icons">lock</span>
          </div>
          <div className="stat-info-logros">
            <span className="stat-label-logros">Por Desbloquear</span>
            <span className="stat-value-logros">{stats.total_insignias - stats.insignias_desbloqueadas}</span>
          </div>
        </div>

        <div className="stat-card-logros xp-card">
          <div className="stat-icon-logros">
            <span className="material-icons">star</span>
          </div>
          <div className="stat-info-logros">
            <span className="stat-label-logros">XP Total Ganada</span>
            <span className="stat-value-logros">{stats.xp_total} XP</span>
          </div>
        </div>
      </div>

      {/* Filtros por categoría */}
      <div className="filtros-categorias">
        {categorias.map(cat => (
          <button
            key={cat.id}
            className={`filtro-btn ${filtroActivo === cat.id ? 'activo' : ''}`}
            onClick={() => filtrarInsignias(cat.id)}
          >
            <span className="material-icons">{cat.icono}</span>
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Grid de insignias */}
      <div className="insignias-grid-simple">
        {insigniasFiltradas.length === 0 ? (
          <p className="no-insignias">No hay insignias en esta categoría</p>
        ) : (
          insigniasFiltradas.map(insignia => (
            <div
              key={insignia.id}
              className={`insignia-card-simple ${insignia.completada ? 'desbloqueada' : 'bloqueada'}`}
              onClick={() => abrirDetalleInsignia(insignia)}
            >
              {/* Badge de imagen */}
              <div className="insignia-badge">
                <img
                  src={obtenerRutaImagen(insignia.imagen_url)}
                  alt={insignia.nombre}
                  className="insignia-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="insignia-placeholder" style={{ display: 'none' }}>
                  <span className="material-icons">workspace_premium</span>
                </div>
              </div>

              {/* Información */}
              <div className="insignia-info-simple">
                <span className="insignia-tipo-badge">{getNombreTipo(insignia.tipo)}</span>
                <h3 className="insignia-nombre-simple">{insignia.nombre}</h3>
                <span className="insignia-xp-badge">
                  <span className="material-icons">star</span>
                  {insignia.xp_reward} XP
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de detalle */}
      {mostrarModal && insigniaSeleccionada && (
        <div className="modal-overlay-logros" onClick={() => setMostrarModal(false)}>
          <div className="modal-logros-detalle" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setMostrarModal(false)}>
              <span className="material-icons">close</span>
            </button>

            {/* Header con imagen */}
            <div className={`modal-header-logros ${insigniaSeleccionada.completada ? 'completada' : 'bloqueada'}`}>
              <div className="modal-badge-grande">
                <img
                  src={obtenerRutaImagen(insigniaSeleccionada.imagen_url)}
                  alt={insigniaSeleccionada.nombre}
                  className="modal-img-grande"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="modal-placeholder-grande" style={{ display: 'none' }}>
                  <span className="material-icons">workspace_premium</span>
                </div>
              </div>

              <div className="modal-titulo-info">
                <span className="modal-tipo-badge">{getNombreTipo(insigniaSeleccionada.tipo)}</span>
                <h2>{insigniaSeleccionada.nombre}</h2>
                {insigniaSeleccionada.completada && (
                  <div className="badge-desbloqueada">
                    <span className="material-icons">check_circle</span>
                    Desbloqueada
                  </div>
                )}
                {!insigniaSeleccionada.completada && (
                  <div className="badge-bloqueada">
                    <span className="material-icons">lock</span>
                    Bloqueada
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="modal-body-logros">
              <div className="modal-descripcion-section">
                <h3>Descripción</h3>
                <p>{insigniaSeleccionada.descripcion}</p>
              </div>

              {/* Progreso */}
              <div className="modal-progreso-section">
                <div className="progreso-header-modal">
                  <h3>Tu Progreso</h3>
                  <span className="progreso-porcentaje-modal">
                    {insigniaSeleccionada.porcentaje_progreso}%
                  </span>
                </div>
                <div className="progreso-barra-modal">
                  <div
                    className="progreso-fill-modal"
                    style={{ width: `${insigniaSeleccionada.porcentaje_progreso}%` }}
                  />
                </div>
                <div className="progreso-numeros-modal">
                  <span>{insigniaSeleccionada.progreso_actual} / {insigniaSeleccionada.valor_requerido}</span>
                  {insigniaSeleccionada.completada && (
                    <span className="fecha-desbloqueo">
                      Desbloqueada: {new Date(insigniaSeleccionada.desbloqueada_en).toLocaleDateString('es-CO')}
                    </span>
                  )}
                </div>
                <p className="progreso-mensaje-modal">
                  {obtenerMensajeProgreso(insigniaSeleccionada)}
                </p>
              </div>

              {/* Recompensa */}
              <div className="modal-recompensa-section">
                <span className="material-icons">star</span>
                <div>
                  <span className="recompensa-label">Recompensa</span>
                  <span className="recompensa-valor">+{insigniaSeleccionada.xp_reward} XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisLogros;