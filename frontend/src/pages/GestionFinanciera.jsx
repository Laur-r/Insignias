import { useState, useEffect } from 'react';
import '../styles/GestionFinanciera.css';
import { useTransaccion } from '../components/Context/TransaccionContext';

function GestionFinanciera() {
  const [activeTab, setActiveTab] = useState('ingreso');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [todasCategorias, setTodasCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState(null);
  const { notificarCambio } = useTransaccion();

  // ✅ FUNCIÓN MEJORADA para notificar cambios
  const notificarCambioDashboard = () => {
    notificarCambio(); // Context normal

    // ✅ DISPARAR evento personalizado para el Dashboard en la MISMA pestaña
    window.dispatchEvent(new Event('dashboardUpdate'));

    // ✅ FORZAR actualización en localStorage para otras pestañas
    const current = Number(localStorage.getItem('dashboard_actualizar') || '0');
    localStorage.setItem('dashboard_actualizar', (current + 1).toString());
  };

  const [formDataTransaccion, setFormDataTransaccion] = useState({
    categoria_id: '',
    descripcion: '',
    monto: '',
    fecha: ''
  });

  const [formDataCategoria, setFormDataCategoria] = useState({
    nombre: '',
    tipo: 'ingreso'
  });

  const colores = ['green', 'blue', 'orange', 'purple', 'red'];

  const asignarColor = (index) => {
    return colores[index % colores.length];
  };

  const getUsuarioDocumento = () => {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      const usuarioObj = JSON.parse(usuario);
      return usuarioObj.documento;
    }
    return null;
  };

  const cargarCategorias = async (tipo) => {
    try {
      const usuarioDocumento = getUsuarioDocumento();
      const response = await fetch(
        `http://localhost:3000/api/categorias/${tipo}?usuario_documento=${usuarioDocumento}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const data = await response.json();

      if (Array.isArray(data)) {
        setCategorias(data);
      } else {
        setCategorias([]);
      }
    } catch (err) {
      console.error('Error al cargar categorías:', err);
      setCategorias([]);
    }
  };

  const cargarTodasCategorias = async () => {
    setLoading(true);
    try {
      const usuarioDocumento = getUsuarioDocumento();

      const [ingresosRes, gastosRes] = await Promise.all([
        fetch(`http://localhost:3000/api/categorias/ingreso?usuario_documento=${usuarioDocumento}`),
        fetch(`http://localhost:3000/api/categorias/gasto?usuario_documento=${usuarioDocumento}`)
      ]);

      const ingresos = await ingresosRes.json();
      const gastos = await gastosRes.json();

      const todas = [...(Array.isArray(ingresos) ? ingresos : []), ...(Array.isArray(gastos) ? gastos : [])];

      setTodasCategorias(todas);
    } catch (err) {
      console.error('Error al cargar todas las categorías:', err);
      setTodasCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarTransacciones = async () => {

    setLoading(true);
    setError(null);

    try {
      const usuarioDocumento = getUsuarioDocumento();

      if (!usuarioDocumento) {
        setError('No se encontró el documento del usuario');
        setLoading(false);
        return;
      }

      const url = `http://localhost:3000/api/transacciones/${usuarioDocumento}/${activeTab}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar transacciones');
      }

      if (Array.isArray(data)) {
        setTransactions(data);
      } else if (data.success && data.data) {
        setTransactions(data.data);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error('❌ Error al cargar transacciones:', err);
      setError(err.message || 'Error al cargar las transacciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'categorias') {
      cargarTodasCategorias();
    } else {
      cargarTransacciones();
      cargarCategorias(activeTab);
    }
  }, [activeTab]);

  // ✅ MODIFICADO: Eliminar transacción
  const handleDeleteTransaccion = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este registro?')) {
      try {
        const response = await fetch(
          `http://localhost:3000/api/transacciones/${id}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error al eliminar');
        }

        alert('Transacción eliminada exitosamente');
        cargarTransacciones();
        notificarCambioDashboard(); // ✅ USAR LA NUEVA FUNCIÓN
      } catch (err) {
        console.error('Error al eliminar:', err);
        alert(err.message || 'Error al eliminar la transacción');
      }
    }
  };

  const handleEditTransaccion = (transaction) => {
    setEditingItem({ ...transaction, tipo: 'transaccion' });
    setFormDataTransaccion({
      categoria_id: transaction.categoria_id,
      descripcion: transaction.descripcion,
      monto: transaction.monto,
      fecha: transaction.fecha.split('T')[0]
    });
    setShowModal(true);
  };

  const handleAgregarNuevoTransaccion = () => {
    setEditingItem({ tipo: 'transaccion' });
    setFormDataTransaccion({
      categoria_id: '',
      descripcion: '',
      monto: '',
      fecha: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  // ✅ MODIFICADO: Enviar formulario de transacción
  const handleSubmitTransaccion = async (e) => {
    e.preventDefault();
    setLoadingForm(true);

    try {
      const usuarioDocumento = getUsuarioDocumento();

      if (!usuarioDocumento) {
        alert('No se encontró el documento del usuario');
        return;
      }

      if (!formDataTransaccion.categoria_id) {
        alert('Por favor selecciona una categoría');
        setLoadingForm(false);
        return;
      }

      const body = {
        usuario_documento: usuarioDocumento,
        categoria_id: parseInt(formDataTransaccion.categoria_id),
        tipo: activeTab,
        monto: parseFloat(formDataTransaccion.monto),
        descripcion: formDataTransaccion.descripcion,
        fecha: formDataTransaccion.fecha
      };

      let url, method;

      if (editingItem && editingItem.id) {
        url = `http://localhost:3000/api/transacciones/${editingItem.id}`;
        method = 'PUT';
      } else {
        url = 'http://localhost:3000/api/transacciones';
        method = 'POST';
      }

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al guardar');
      }

      alert(editingItem && editingItem.id ? 'Transacción actualizada exitosamente' : 'Transacción creada exitosamente');
      closeModal();
      cargarTransacciones();
      notificarCambioDashboard(); // ✅ USAR LA NUEVA FUNCIÓN

    } catch (err) {
      console.error('Error al guardar:', err);
      alert(err.message || 'Error al guardar la transacción');
    } finally {
      setLoadingForm(false);
    }
  };

  const handleDeleteCategoria = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar la categoría "${nombre}"?`)) {
      try {
        const response = await fetch(
          `http://localhost:3000/api/categorias/${id}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error al eliminar');
        }

        alert(data.message || 'Categoría eliminada exitosamente');
        cargarTodasCategorias();
      } catch (err) {
        console.error('Error al eliminar:', err);
        alert(err.message || 'Error al eliminar la categoría');
      }
    }
  };

  const handleEditCategoria = (categoria) => {
    setEditingItem({ ...categoria, tipo: 'categoria' });
    setFormDataCategoria({
      nombre: categoria.nombre,
      tipo: categoria.tipo
    });
    setShowModal(true);
  };

  const handleAgregarNuevoCategoria = () => {
    setEditingItem({ tipo: 'categoria' });
    setFormDataCategoria({
      nombre: '',
      tipo: 'ingreso'
    });
    setShowModal(true);
  };

  const handleSubmitCategoria = async (e) => {
    e.preventDefault();
    setLoadingForm(true);

    try {
      const usuarioDocumento = getUsuarioDocumento();

      if (!usuarioDocumento) {
        alert('No se encontró el documento del usuario');
        return;
      }

      if (!formDataCategoria.nombre.trim()) {
        alert('Por favor ingresa un nombre para la categoría');
        setLoadingForm(false);
        return;
      }

      let url, method, body;

      if (editingItem && editingItem.id) {
        url = `http://localhost:3000/api/categorias/${editingItem.id}`;
        method = 'PUT';
        body = {
          nombre: formDataCategoria.nombre.trim()
        };
      } else {
        url = 'http://localhost:3000/api/categorias';
        method = 'POST';
        body = {
          usuario_documento: usuarioDocumento,
          nombre: formDataCategoria.nombre.trim(),
          tipo: formDataCategoria.tipo
        };
      }

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al guardar');
      }

      alert(data.message || (editingItem && editingItem.id ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente'));
      closeModal();
      cargarTodasCategorias();

    } catch (err) {
      console.error('Error al guardar:', err);
      alert(err.message || 'Error al guardar la categoría');
    } finally {
      setLoadingForm(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormDataTransaccion({
      categoria_id: '',
      descripcion: '',
      monto: '',
      fecha: ''
    });
    setFormDataCategoria({
      nombre: '',
      tipo: 'ingreso'
    });
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const filteredTransactions = transactions.filter(t =>
    t.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategorias = todasCategorias.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isCategoriasTab = activeTab === 'categorias';
  const isEditingCategoria = editingItem && editingItem.tipo === 'categoria';

  return (
    <div className="gf-container">
      <h1 className="gestion-header">Gestión Financiera</h1>
      <p className="gestion-subtitle">Administra tus ingresos, gastos y categorías</p>

      <div className="tabs">
        <button
          className={activeTab === 'ingreso' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('ingreso')}
        >
          Ingresos
        </button>
        <button
          className={activeTab === 'gasto' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('gasto')}
        >
          Gastos
        </button>
        <button
          className={activeTab === 'categorias' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('categorias')}
        >
          Categorías
        </button>
      </div>

      <div className="gestion-actions">
        <button
          className="btn-add"
          onClick={isCategoriasTab ? handleAgregarNuevoCategoria : handleAgregarNuevoTransaccion}
        >
          + Agregar Nuevo
        </button>
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div style={{
          color: '#ff4444',
          background: '#ffe6e6',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          fontSize: '18px',
          color: '#666'
        }}>
          Cargando...
        </div>
      ) : (
        <div className="table-container">
          {!isCategoriasTab && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>CATEGORÍA</th>
                  <th>DESCRIPCIÓN</th>
                  <th>MONTO</th>
                  <th>FECHA</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                      {searchTerm
                        ? 'No se encontraron resultados para tu búsqueda'
                        : 'No hay registros para mostrar'}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction, index) => (
                    <tr key={transaction.id}>
                      <td>
                        <div className="category-cell">
                          <span className={`category-dot ${asignarColor(index)}`}></span>
                          <span>{transaction.categoria}</span>
                        </div>
                      </td>
                      <td>{transaction.descripcion}</td>
                      <td className="monto">
                        ${parseFloat(transaction.monto).toFixed(2)}
                      </td>
                      <td>{formatearFecha(transaction.fecha)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon edit"
                            onClick={() => handleEditTransaccion(transaction)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDeleteTransaccion(transaction.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {isCategoriasTab && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>NOMBRE</th>
                  <th>TIPO</th>
                  <th>ORIGEN</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategorias.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                      {searchTerm
                        ? 'No se encontraron resultados para tu búsqueda'
                        : 'No hay categorías para mostrar'}
                    </td>
                  </tr>
                ) : (
                  filteredCategorias.map((categoria, index) => (
                    <tr key={categoria.id}>
                      <td>
                        <div className="category-cell">
                          <span className={`category-dot ${asignarColor(index)}`}></span>
                          <span>{categoria.nombre}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${categoria.tipo === 'ingreso' ? 'badge-success' : 'badge-danger'}`}>
                          {categoria.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                        </span>
                      </td>
                      <td>
                        {categoria.es_sistema ? (
                          <span className="badge badge-system">🔒 Sistema</span>
                        ) : (
                          <span className="badge badge-personal">👤 Personal</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {categoria.es_sistema ? (
                            <span style={{ color: '#999', fontSize: '12px' }}>No editable</span>
                          ) : (
                            <>
                              <button
                                className="btn-icon edit"
                                onClick={() => handleEditCategoria(categoria)}
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-icon delete"
                                onClick={() => handleDeleteCategoria(categoria.id, categoria.nombre)}
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && !isEditingCategoria && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem && editingItem.id ? 'Editar Registro' : 'Agregar Nuevo Registro'}</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmitTransaccion}>
              <div className="form-group">
                <label>Categoría *</label>
                <select
                  value={formDataTransaccion.categoria_id}
                  onChange={(e) => setFormDataTransaccion({ ...formDataTransaccion, categoria_id: e.target.value })}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Descripción *</label>
                <input
                  type="text"
                  value={formDataTransaccion.descripcion}
                  onChange={(e) => setFormDataTransaccion({ ...formDataTransaccion, descripcion: e.target.value })}
                  placeholder="Ej: Pago de electricidad"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Monto *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formDataTransaccion.monto}
                    onChange={(e) => setFormDataTransaccion({ ...formDataTransaccion, monto: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fecha *</label>
                  <input
                    type="date"
                    value={formDataTransaccion.fecha}
                    onChange={(e) => setFormDataTransaccion({ ...formDataTransaccion, fecha: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                  disabled={loadingForm}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loadingForm}
                >
                  {loadingForm ? 'Guardando...' : (editingItem && editingItem.id ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && isEditingCategoria && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem && editingItem.id ? 'Editar Categoría' : 'Agregar Nueva Categoría'}</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmitCategoria}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formDataCategoria.nombre}
                  onChange={(e) => setFormDataCategoria({ ...formDataCategoria, nombre: e.target.value })}
                  placeholder="Ej: Mascotas, Gimnasio, etc."
                  required
                />
              </div>

              {!editingItem || !editingItem.id ? (
                <div className="form-group">
                  <label>Tipo *</label>
                  <select
                    value={formDataCategoria.tipo}
                    onChange={(e) => setFormDataCategoria({ ...formDataCategoria, tipo: e.target.value })}
                    required
                  >
                    <option value="ingreso">Ingreso</option>
                    <option value="gasto">Gasto</option>
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label>Tipo</label>
                  <input
                    type="text"
                    value={formDataCategoria.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                    disabled
                    style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    No puedes cambiar el tipo de una categoría existente
                  </small>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                  disabled={loadingForm}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loadingForm}
                >
                  {loadingForm ? 'Guardando...' : (editingItem && editingItem.id ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionFinanciera;