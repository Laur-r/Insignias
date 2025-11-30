import { useState, useEffect } from 'react';
import '../styles/MisLogros.css';

const MisLogros = () => {
  const [loading, setLoading] = useState(true);
  const [todasInsignias, setTodasInsignias] = useState([]);
  const [insigniasFiltradas, setInsigniasFiltradas] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todas');
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

  const obtenerRutaImagen = (imagenUrl) => {
    if (!imagenUrl) return '/assets/badges/default-badge.png';
    const nombreArchivo = imagenUrl.split('/').pop();
    return `/assets/badges/${nombreArchivo}`;
  };

  const identificarSerie = (nombre) => {
    const nombreBase = nombre.replace(/Nivel \d+/i, '').trim();
    
    if (nombre.includes('Maratonista')) return 'maratonista';
    if (nombre.includes('Rutina Financiera')) return 'rutina';
    
    return null;
  };

  const obtenerInsigniasRelevantes = (insignias) => {
    const grupos = {};
    const insigniasSinSerie = [];

    insignias.forEach(insignia => {
      const serie = identificarSerie(insignia.nombre);
      
      if (serie) {
        if (!grupos[serie]) {
          grupos[serie] = [];
        }
        grupos[serie].push(insignia);
      } else {
        insigniasSinSerie.push(insignia);
      }
    });

    const insigniasRelevantes = [];

    Object.keys(grupos).forEach(serieKey => {
      const serie = grupos[serieKey];
      serie.sort((a, b) => a.valor_requerido - b.valor_requerido);

      let insigniaRelevante = null;

      for (let i = 0; i < serie.length; i++) {
        if (!serie[i].completada) {
          insigniaRelevante = serie[i];
          break;
        }
      }

      if (!insigniaRelevante) {
        insigniaRelevante = serie[serie.length - 1];
      }

      insigniasRelevantes.push(insigniaRelevante);
    });

    return [...insigniasRelevantes, ...insigniasSinSerie];
  };

  useEffect(() => {
    cargarDatos();
    
    const handleRecargarLogros = () => {
      console.log('🔄 Recargando logros...');
      cargarDatos();
    };
    
    window.addEventListener('recargarLogros', handleRecargarLogros);
    
    return () => {
      window.removeEventListener('recargarLogros', handleRecargarLogros);
    };
  }, []);
  
  useEffect(() => {
    aplicarFiltros();
  }, [filtroTipo, filtroEstado, todasInsignias]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const usuarioDocumento = getUsuarioDocumento();
      
      if (!usuarioDocumento) {
        console.error('No se encontró documento de usuario');
        setLoading(false);
        return;
      }

      try {
        const verificarResponse = await fetch(`${API_URL}/verificar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuarioDocumento })
        });

        if (verificarResponse.ok) {
          const verificarData = await verificarResponse.json();
          if (verificarData.data?.insigniasDesbloqueadas?.length > 0) {
            console.log('🎉 Nuevas insignias desbloqueadas:', verificarData.data.insigniasDesbloqueadas);
          }
        } else {
          console.warn('Verificación falló, pero continuando...');
        }
      } catch (verificarError) {
        console.warn('Error en verificación:', verificarError);
      }

      const response = await fetch(`${API_URL}/${usuarioDocumento}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const todasLasInsignias = [
          ...(data.data.insigniasPorTipo?.educacion || []),
          ...(data.data.insigniasPorTipo?.ahorro || []),
          ...(data.data.insigniasPorTipo?.habitos || []),
          ...(data.data.insigniasPorTipo?.transacciones || [])
        ];
        
        const insigniasRelevantes = obtenerInsigniasRelevantes(todasLasInsignias);
        
        setTodasInsignias(insigniasRelevantes);
        
        const totalDesbloqueadas = todasLasInsignias.filter(i => i.completada).length;
        
        setStats({
          xp_total: data.data.stats?.xp_total || 0,
          insignias_desbloqueadas: totalDesbloqueadas,
          total_insignias: todasLasInsignias.length
        });
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let insigniasFiltradas = [...todasInsignias];

    // Filtro por tipo
    if (filtroTipo !== 'todas') {
      insigniasFiltradas = insigniasFiltradas.filter(i => i.tipo === filtroTipo);
    }

    // Filtro por estado
    if (filtroEstado === 'desbloqueadas') {
      insigniasFiltradas = insigniasFiltradas.filter(i => i.completada);
    } else if (filtroEstado === 'bloqueadas') {
      insigniasFiltradas = insigniasFiltradas.filter(i => !i.completada);
    }

    // ✅ ORDENAR: Desbloqueadas primero, bloqueadas después
    insigniasFiltradas.sort((a, b) => {
      if (a.completada && !b.completada) return -1;
      if (!a.completada && b.completada) return 1;
      return 0;
    });

    setInsigniasFiltradas(insigniasFiltradas);
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

  const estadosFiltro = [
    { id: 'todas', nombre: 'Todas' },
    { id: 'desbloqueadas', nombre: 'Desbloqueadas' },
    { id: 'bloqueadas', nombre: 'Bloqueadas' }
  ];

  const obtenerMensajeProgreso = (insignia) => {
    const restante = Math.max(0, insignia.valor_requerido - insignia.progreso_actual);
    
    if (insignia.completada) {
      return `¡Insignia desbloqueada el ${new Date(insignia.desbloqueada_en).toLocaleDateString('es-CO')}!`;
    }

    switch (insignia.condicion_tipo) {
      case 'cursos_completados':
        return restante === 0 ? '¡Completa!' : `Completa ${restante} curso${restante > 1 ? 's' : ''} más`;
      case 'metas_activas':
        return restante === 0 ? '¡Completa!' : `Crea ${restante} meta${restante > 1 ? 's' : ''} activa${restante > 1 ? 's' : ''} más`;
      case 'metas_completadas':
        return restante === 0 ? '¡Completa!' : `Completa ${restante} meta${restante > 1 ? 's' : ''} más`;
      case 'metas_largo_plazo_completadas':
        return restante === 0 ? '¡Completa!' : `Completa ${restante} meta${restante > 1 ? 's' : ''} de largo plazo (6+ meses)`;
      case 'metas_activas_consecutivas':
        return restante === 0 ? '¡Completa!' : `Mantén metas activas durante ${restante} mes${restante > 1 ? 'es' : ''} más consecutivos`;
      case 'uso_semanal':
        return restante === 0 ? '¡Completa!' : `Usa FintraX ${restante} semana${restante > 1 ? 's' : ''} más (3+ días por semana)`;
      case 'resumen_mensual':
        return restante === 0 ? '¡Completa!' : `Cierra ${restante} resumen${restante > 1 ? 'es' : ''} mensual${restante > 1 ? 'es' : ''} más`;
      case 'transacciones_registradas':
        return restante === 0 ? '¡Completa!' : `Registra ${restante} transacción${restante > 1 ? 'es' : ''} más`;
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

  // ✅ CALCULAR PORCENTAJE LIMITADO A 100%
  const calcularPorcentajeLimitado = (progreso, requerido) => {
    const porcentaje = (progreso / requerido) * 100;
    return Math.min(porcentaje, 100);
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
      <div className="logros-header">
        <h1 className="logros-title">Mis Logros</h1>
        <p className="logros-subtitle">Desbloquea insignias y gana experiencia</p>
      </div>

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

      <div className="filtros-categorias">
        {categorias.map(cat => (
          <button
            key={cat.id}
            className={`filtro-btn ${filtroTipo === cat.id ? 'activo' : ''}`}
            onClick={() => setFiltroTipo(cat.id)}
          >
            <span className="material-icons">{cat.icono}</span>
            {cat.nombre}
          </button>
        ))}
      </div>

      <div className="filtros-estado">
        {estadosFiltro.map(estado => (
          <button
            key={estado.id}
            className={`filtro-estado-btn ${filtroEstado === estado.id ? 'activo' : ''}`}
            onClick={() => setFiltroEstado(estado.id)}
          >
            {estado.nombre}
          </button>
        ))}
      </div>

      <div className="insignias-grid-grande">
        {insigniasFiltradas.length === 0 ? (
          <p className="no-insignias">No hay insignias en esta categoría</p>
        ) : (
          insigniasFiltradas.map(insignia => {
            // ✅ Calcular porcentaje limitado a 100%
            const porcentajeLimitado = calcularPorcentajeLimitado(insignia.progreso_actual, insignia.valor_requerido);
            
            return (
              <div
                key={insignia.id}
                className={`insignia-card-grande ${insignia.completada ? 'desbloqueada' : 'bloqueada'}`}
                onClick={() => abrirDetalleInsignia(insignia)}
              >
                {/* ✅ SIN BADGE DE NIVEL */}
                <div className="insignia-badge-grande">
                  <img
                    src={obtenerRutaImagen(insignia.imagen_url)}
                    alt={insignia.nombre}
                    className="insignia-img-grande"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="insignia-placeholder-grande" style={{ display: 'none' }}>
                    <span className="material-icons">workspace_premium</span>
                  </div>
                </div>

                <div className="insignia-info-grande">
                  <span className="insignia-tipo-badge">{getNombreTipo(insignia.tipo)}</span>
                  <h3 className="insignia-nombre-grande">{insignia.nombre}</h3>
                  <p className="insignia-descripcion-corta">{insignia.descripcion}</p>
                  
                  <div className="progreso-mini">
                    <div className="progreso-barra-mini">
                      <div
                        className="progreso-fill-mini"
                        style={{ width: `${porcentajeLimitado}%` }}
                      />
                    </div>
                    <span className="progreso-texto-mini">
                      {Math.min(insignia.progreso_actual, insignia.valor_requerido)}/{insignia.valor_requerido}
                    </span>
                  </div>

                  <span className="insignia-xp-badge">
                    <span className="material-icons">star</span>
                    {insignia.xp_reward} XP
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {mostrarModal && insigniaSeleccionada && (
        <div className="modal-overlay-logros" onClick={() => setMostrarModal(false)}>
          <div className="modal-logros-detalle" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setMostrarModal(false)}>
              <span className="material-icons">close</span>
            </button>

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

            <div className="modal-body-logros">
              <div className="modal-descripcion-section">
                <h3>Descripción</h3>
                <p>{insigniaSeleccionada.descripcion}</p>
              </div>

              <div className="modal-progreso-section">
                <div className="progreso-header-modal">
                  <h3>Tu Progreso</h3>
                  <span className="progreso-porcentaje-modal">
                    {calcularPorcentajeLimitado(insigniaSeleccionada.progreso_actual, insigniaSeleccionada.valor_requerido).toFixed(1)}%
                  </span>
                </div>
                <div className="progreso-barra-modal">
                  <div
                    className="progreso-fill-modal"
                    style={{ width: `${calcularPorcentajeLimitado(insigniaSeleccionada.progreso_actual, insigniaSeleccionada.valor_requerido)}%` }}
                  />
                </div>
                <div className="progreso-numeros-modal">
                  <span>{Math.min(insigniaSeleccionada.progreso_actual, insigniaSeleccionada.valor_requerido)} / {insigniaSeleccionada.valor_requerido}</span>
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