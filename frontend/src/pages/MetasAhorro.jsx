import { useState, useEffect } from 'react';
import '../styles/MetasAhorro.css';
import { useTransaccion } from '../components/Context/TransaccionContext';

const MetasAhorro = () => {
  const { notificarCambio } = useTransaccion();

  const notificarCambioDashboard = () => {
    notificarCambio();
    window.dispatchEvent(new Event('dashboardUpdate'));
    const current = Number(localStorage.getItem('dashboard_actualizar') || '0');
    localStorage.setItem('dashboard_actualizar', (current + 1).toString());
  };

  const [metas, setMetas] = useState([]);
  const [resumen, setResumen] = useState({
    metas_activas: 0,
    monto_total_ahorrado: 0,
    progreso_general: 0,
    monto_total_objetivos: 0
  });
  const [tabActiva, setTabActiva] = useState('activas');
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [metaEditando, setMetaEditando] = useState(null);
  const [mostrarModalAporte, setMostrarModalAporte] = useState(false);
  const [metaSeleccionada, setMetaSeleccionada] = useState(null);

  const [nuevaMeta, setNuevaMeta] = useState({
    nombre: '',
    descripcion: '',
    monto_objetivo: '',
    monto_actual: '0',
    fecha_objetivo: '',
    prioridad: '1'
  });

  const [aporte, setAporte] = useState({
    monto: '',
    nota: ''
  });

  const API_URL = 'http://localhost:3000/api/metas';

  const getUsuarioDocumento = () => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    return usuario.documento;
  };

  useEffect(() => {
    cargarDatos();
  }, [tabActiva]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const usuarioDocumento = getUsuarioDocumento();
      if (!usuarioDocumento) {
        console.error('No se encontró documento del usuario');
        return;
      }

      // Cargar resumen
      const resumenRes = await fetch(`${API_URL}/resumen/${usuarioDocumento}`);
      const resumenData = await resumenRes.json();
      if (resumenData.success) {
        setResumen(resumenData.data);
      }

      // Mapear el tab al estado correcto
      let estado = 'activa';
      if (tabActiva === 'completadas') {
        estado = 'completada';
      } else if (tabActiva === 'pausadas') {
        estado = 'pausada';
      } else if (tabActiva === 'todas') {
        estado = null;
      }

      // Cargar metas según tab
      const metasUrl = estado
        ? `${API_URL}/${usuarioDocumento}?estado=${estado}`
        : `${API_URL}/${usuarioDocumento}`;

      const metasRes = await fetch(metasUrl);
      const metasData = await metasRes.json();

      if (metasData.success) {
        setMetas(metasData.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearMeta = async () => {
    if (!nuevaMeta.nombre || !nuevaMeta.monto_objetivo) {
      alert('Por favor completa el nombre y el monto objetivo');
      return;
    }

    try {
      const usuarioDocumento = getUsuarioDocumento();

      const bodyData = {
        usuario_documento: usuarioDocumento,
        nombre: nuevaMeta.nombre,
        descripcion: nuevaMeta.descripcion || '',
        monto_objetivo: parseFloat(nuevaMeta.monto_objetivo),
        fecha_objetivo: nuevaMeta.fecha_objetivo || null,
        prioridad: parseInt(nuevaMeta.prioridad) || 1
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Meta creada exitosamente');
        setMostrarFormulario(false);
        limpiarFormulario();
        cargarDatos();
        notificarCambioDashboard();
      } else {
        alert(data.message || 'Error al crear la meta');
      }
    } catch (error) {
      console.error('Error al crear meta:', error);
      alert('Error al crear la meta: ' + error.message);
    }
  };

  const handleActualizarMeta = async () => {
    if (!nuevaMeta.nombre || !nuevaMeta.monto_objetivo) {
      alert('Por favor completa el nombre y el monto objetivo');
      return;
    }

    try {
      const usuarioDocumento = getUsuarioDocumento();

      const response = await fetch(`${API_URL}/${metaEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_documento: usuarioDocumento,
          nombre: nuevaMeta.nombre,
          descripcion: nuevaMeta.descripcion,
          monto_objetivo: parseFloat(nuevaMeta.monto_objetivo),
          fecha_objetivo: nuevaMeta.fecha_objetivo || null,
          prioridad: parseInt(nuevaMeta.prioridad) || 1
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Meta actualizada exitosamente');
        setMetaEditando(null);
        limpiarFormulario();
        cargarDatos();
        notificarCambioDashboard();
      } else {
        alert(data.message || 'Error al actualizar la meta');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar la meta');
    }
  };

  const handleEliminarMeta = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta meta? El dinero ahorrado volverá a tu balance.')) {
      return;
    }

    try {
      const usuarioDocumento = getUsuarioDocumento();

      const response = await fetch(`${API_URL}/${id}?usuario_documento=${usuarioDocumento}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        if (data.data.monto_devuelto > 0) {
          alert(
            `Meta eliminada exitosamente\n\n` +
            `Se eliminaron ${data.data.transacciones_eliminadas} transacción(es) de aportes.\n\n` +
            `Los ${formatearMoneda(data.data.monto_devuelto)} que tenías ahorrados ` +
            `han sido devueltos a tu balance disponible.`
          );
        } else {
          alert('Meta eliminada exitosamente');
        }

        cargarDatos();
        notificarCambioDashboard();
      } else {
        alert(data.message || 'Error al eliminar la meta');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la meta');
    }
  };

  const handleAportar = async () => {
    if (!aporte.monto || parseFloat(aporte.monto) <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${metaSeleccionada.id}/aportar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: parseFloat(aporte.monto),
          nota: aporte.nota || null,
          usuario_documento: getUsuarioDocumento()
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Aporte realizado exitosamente. Se creó una transacción de gasto.');
        setMostrarModalAporte(false);
        setAporte({ monto: '', nota: '' });
        cargarDatos();
        notificarCambioDashboard();
      } else {
        alert(data.message || 'Error al realizar el aporte');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al realizar el aporte');
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      const response = await fetch(`${API_URL}/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: nuevoEstado,
          usuario_documento: getUsuarioDocumento()
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        cargarDatos();
        notificarCambioDashboard();
      } else {
        alert(data.message || 'Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cambiar estado');
    }
  };

  const limpiarFormulario = () => {
    setNuevaMeta({
      nombre: '',
      descripcion: '',
      monto_objetivo: '',
      monto_actual: '0',
      fecha_objetivo: '',
      prioridad: '1'
    });
  };

  const handleEditarMeta = (meta) => {
    setMetaEditando(meta);
    setNuevaMeta({
      nombre: meta.nombre,
      descripcion: meta.descripcion || '',
      monto_objetivo: meta.monto_objetivo.toString(),
      monto_actual: meta.monto_actual.toString(),
      fecha_objetivo: meta.fecha_objetivo || '',
      prioridad: meta.prioridad.toString()
    });
  };

  const abrirModalAporte = (meta) => {
    setMetaSeleccionada(meta);
    setMostrarModalAporte(true);
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  if (loading) {
    return (
      <div className="metas-ahorro-container">
        <p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="metas-ahorro-container">
      <div className="metas-header">
        <h1 className="metas-title">Metas de Ahorro</h1>
        <p className="metas-subtitle">Define tus objetivos y alcanza tus sueños</p>
      </div>

      <div className="metas-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <span className="material-icons">track_changes</span>
          </div>
          <div className="stat-info">
            <p className="stat-label">Metas Activas</p>
            <p className="stat-value">{resumen.metas_activas || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #0088e1, #00c4ff)' }}>
            <span className="material-icons">attach_money</span>
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Ahorrado</p>
            <p className="stat-value">{formatearMoneda(resumen.monto_total_ahorrado || 0)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #a855f7, #9333ea)' }}>
            <span className="material-icons">trending_up</span>
          </div>
          <div className="stat-info">
            <p className="stat-label">Progreso General</p>
            <p className="stat-value">{resumen.progreso_general || 0}%</p>
          </div>
        </div>
      </div>

      <div className="progreso-total-card">
        <div className="progreso-total-header">
          <span className="progreso-total-title">Progreso Total</span>
          <span className="progreso-total-amount">
            {formatearMoneda(resumen.monto_total_ahorrado || 0)} / {formatearMoneda(resumen.monto_total_objetivos || 0)}
          </span>
        </div>
        <div className="progreso-total-bar">
          <div
            className="progreso-total-fill"
            style={{ width: `${Math.min(resumen.progreso_general || 0, 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="metas-tabs">
        <button
          className={`tab-btn ${tabActiva === 'activas' ? 'active' : ''}`}
          onClick={() => setTabActiva('activas')}
        >
          Activas
        </button>
        <button
          className={`tab-btn ${tabActiva === 'completadas' ? 'active' : ''}`}
          onClick={() => setTabActiva('completadas')}
        >
          Completadas
        </button>
        <button
          className="btn-nueva-meta"
          onClick={() => {
            limpiarFormulario();
            setMostrarFormulario(true);
          }}
        >
          + Nueva Meta de Ahorro
        </button>
      </div>

      <div className="metas-lista">
        {metas.length === 0 ? (
          <p style={{ color: '#8b92a7', textAlign: 'center', padding: '40px' }}>
            No tienes metas {tabActiva === 'todas' ? '' : tabActiva}
          </p>
        ) : (
          metas.map((meta) => (
            <div key={meta.id} className="meta-card">
              <div className="meta-card-header">
                <div className="meta-imagen">{meta.icono}</div>
                <div className="meta-info">
                  <h3 className="meta-titulo">{meta.nombre}</h3>
                  <p className="meta-dias">
                    <span className="material-icons">schedule</span>
                    {meta.dias_restantes !== null && meta.dias_restantes > 0
                      ? `${meta.dias_restantes} días restantes`
                      : 'Sin fecha límite'}
                  </p>
                </div>
              </div>

              <div className="meta-progreso-section">
                <div className="meta-progreso-label">
                  <span>Progreso</span>
                  <span className="meta-porcentaje">{meta.porcentaje_completado || 0}%</span>
                </div>
                <div className="meta-progreso-bar">
                  <div
                    className="meta-progreso-fill"
                    style={{ width: `${Math.min(meta.porcentaje_completado || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="meta-montos">
                <div className="meta-monto-item">
                  <span className="meta-monto-label">Ahorrado</span>
                  <span className="meta-monto-valor">{formatearMoneda(meta.monto_actual)}</span>
                </div>
                <div className="meta-monto-item">
                  <span className="meta-monto-label">Objetivo</span>
                  <span className="meta-monto-valor">{formatearMoneda(meta.monto_objetivo)}</span>
                </div>
              </div>

              <div className="meta-faltante">
                Faltan: {formatearMoneda(meta.monto_objetivo - meta.monto_actual)}
              </div>

              <button
                className="btn-editar-meta"
                onClick={() => handleEditarMeta(meta)}
              >
                Editar Meta de Ahorro
              </button>

              <div className="meta-acciones-adicionales">
                {meta.estado === 'activa' && (
                  <button
                    className="btn-aportar-meta"
                    onClick={() => abrirModalAporte(meta)}
                  >
                    Aportar
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {mostrarFormulario && (
          <div className="meta-card meta-form-card">
            <div className="meta-card-header">
              <div className="meta-imagen">
                <span className="material-icons">flag_circle</span>
              </div>
              <div className="meta-info">
                <h3 className="meta-titulo">Nueva Meta</h3>
                <p className="meta-dias">
                  <span className="material-icons">schedule</span>
                  0 días restantes
                </p>
              </div>
            </div>

            <div className="meta-form">
              <input
                type="text"
                placeholder="Nombre *"
                value={nuevaMeta.nombre}
                onChange={(e) => setNuevaMeta({ ...nuevaMeta, nombre: e.target.value })}
                className="meta-input"
              />

              <div className="meta-progreso-label">
                <span>Progreso</span>
                <span className="meta-porcentaje">0%</span>
              </div>
              <div className="meta-progreso-bar">
                <div className="meta-progreso-fill" style={{ width: '0%' }}></div>
              </div>

              <div className="meta-montos">
                <div className="meta-monto-item">
                  <span className="meta-monto-label">Objetivo</span>
                  <input
                    type="number"
                    placeholder="$"
                    value={nuevaMeta.monto_objetivo}
                    onChange={(e) => setNuevaMeta({ ...nuevaMeta, monto_objetivo: e.target.value })}
                    className="meta-input-small"
                  />
                </div>
              </div>

              <div className="meta-form-actions">
                <button
                  className="btn-agregar-meta"
                  onClick={handleCrearMeta}
                >
                  + Agregar Ahorro
                </button>
                <button
                  className="btn-eliminar-icon"
                  onClick={() => setMostrarFormulario(false)}
                >
                  <span className="material-icons">close</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {metaEditando && (
          <div className="modal-overlay" onClick={() => setMetaEditando(null)}>
            <div className="modal-edicion" onClick={(e) => e.stopPropagation()}>
              <h2>Editar Meta de Ahorro</h2>
              <input
                type="text"
                placeholder="Nombre"
                value={nuevaMeta.nombre}
                onChange={(e) => setNuevaMeta({ ...nuevaMeta, nombre: e.target.value })}
                className="meta-input"
              />
              <input
                type="number"
                placeholder="Objetivo"
                value={nuevaMeta.monto_objetivo}
                onChange={(e) => setNuevaMeta({ ...nuevaMeta, monto_objetivo: e.target.value })}
                className="meta-input"
              />
              <div className="modal-actions">
                <button className="btn-cancelar" onClick={() => setMetaEditando(null)}>
                  Cancelar
                </button>
                <button className="btn-guardar" onClick={handleActualizarMeta}>
                  Guardar
                </button>
                <button
                  className="btn-eliminar"
                  onClick={() => {
                    handleEliminarMeta(metaEditando.id);
                    setMetaEditando(null);
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {mostrarModalAporte && metaSeleccionada && (
          <div className="modal-overlay" onClick={() => setMostrarModalAporte(false)}>
            <div className="modal-edicion" onClick={(e) => e.stopPropagation()}>
              <h2>Aportar a: {metaSeleccionada.nombre}</h2>
              <input
                type="number"
                placeholder="Monto *"
                value={aporte.monto}
                onChange={(e) => setAporte({ ...aporte, monto: e.target.value })}
                className="meta-input"
              />
              <textarea
                placeholder="Nota (opcional)"
                value={aporte.nota}
                onChange={(e) => setAporte({ ...aporte, nota: e.target.value })}
                className="meta-input"
                rows="3"
              />
              <p style={{ color: '#8b92a7', fontSize: '14px', marginTop: '10px' }}>
                💡 Se creará automáticamente una transacción de gasto
              </p>
              <div className="modal-actions">
                <button className="btn-cancelar" onClick={() => setMostrarModalAporte(false)}>
                  Cancelar
                </button>
                <button className="btn-guardar" onClick={handleAportar}>
                  Confirmar Aporte
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetasAhorro;