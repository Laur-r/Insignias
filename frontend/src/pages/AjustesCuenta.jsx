import { useState, useEffect } from 'react';
import '../styles/AjustesCuenta.css';
import { useUser } from '../components/Context/UserContext';

const AjustesCuenta = () => {
  const { actualizarUsuario } = useUser();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    pais: '',
    passwordActual: '',
    passwordNueva: '',
    passwordConfirmar: ''
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [mostrarPassword, setMostrarPassword] = useState({
    passwordActual: false,
    passwordNueva: false,
    passwordConfirmar: false
  });

  const paises = [
    'Colombia', 'México', 'Argentina', 'España', 'Chile', 'Perú',
    'Venezuela', 'Ecuador', 'Guatemala', 'Bolivia'
  ];

  useEffect(() => {
    cargarDatosUsuario();
  }, []);

  const cargarDatosUsuario = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMensaje({ tipo: 'error', texto: 'No hay sesión activa' });
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3000/api/usuarios/perfil', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al cargar datos del usuario');

      const data = await response.json();

      setFormData(prev => ({
        ...prev,
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        telefono: data.telefono || '',
        email: data.email || '',
        pais: data.pais || 'Colombia'
      }));

      if (data.foto_perfil) {
        const baseURL = "http://localhost:3000";
        setAvatarPreview(
          data.foto_perfil.startsWith("http")
            ? data.foto_perfil
            : `${baseURL}${data.foto_perfil}`
        );
      } else {
        setAvatarPreview(null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar datos del usuario' });
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    document.getElementById('avatarInput')?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        setMensaje({ tipo: 'error', texto: 'Formato no válido. Usa JPG, PNG o WEBP.' });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setMensaje({ tipo: 'error', texto: 'La imagen debe pesar menos de 2MB.' });
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const subirAvatar = async () => {
    if (!avatarFile) return null;
    const token = localStorage.getItem('token');

    try {
      const form = new FormData();
      form.append('avatar', avatarFile);

      const res = await fetch('http://localhost:3000/api/usuarios/perfil/avatar', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir avatar');

      const foto = data.usuario?.foto_perfil;
      if (foto) {
        const baseURL = "http://localhost:3000";
        setAvatarPreview(foto.startsWith("http") ? foto : `${baseURL}${foto}`);
      }

      setAvatarFile(null);
      return data.usuario;
    } catch (error) {
      console.error('Error al subir avatar:', error);
      throw error;
    }
  };

  const handleSubmitPerfil = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMensaje({ tipo: 'error', texto: 'No hay sesión activa' });
        return;
      }

      // ✅ Variable para guardar la URL completa de la foto
      let fotoPerfilActualizada = null;

      // 1. Subir avatar primero si hay uno seleccionado
      if (avatarFile) {
        try {
          const avatarData = await subirAvatar();

          // ✅ CONSTRUIR URL COMPLETA AQUÍ
          const baseURL = "http://localhost:3000";
          if (avatarData?.foto_perfil) {
            fotoPerfilActualizada = avatarData.foto_perfil.startsWith("http")
              ? avatarData.foto_perfil
              : `${baseURL}${avatarData.foto_perfil}`;
          }

        } catch (err) {
          setMensaje({ tipo: 'error', texto: err.message || 'Error al subir avatar' });
          return;
        }
      }

      // 2. Actualizar perfil
      const response = await fetch('http://localhost:3000/api/usuarios/perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono,
          email: formData.email,
          pais: formData.pais
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al actualizar perfil');

      // ✅ ACTUALIZAR CONTEXTO CON LA FOTO CORRECTA
      actualizarUsuario({
        nombre: data.usuario.nombre,
        email: data.usuario.email,
        foto_perfil: fotoPerfilActualizada || avatarPreview // Usa la nueva foto o la que ya estaba
      });

      // ✅ ACTUALIZAR LOCALSTORAGE
      try {
        const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');
        localStorage.setItem('usuario', JSON.stringify({
          ...usuarioActual,
          nombre: data.usuario.nombre,
          apellido: data.usuario.apellido,
          email: data.usuario.email,
          telefono: data.usuario.telefono,
          pais: data.usuario.pais,
          foto_perfil: fotoPerfilActualizada || usuarioActual.foto_perfil
        }));
      } catch (e) {
        console.error('Error al actualizar localStorage:', e);
      }

      setMensaje({ tipo: 'success', texto: 'Perfil actualizado exitosamente' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);

    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: error.message || 'Error al actualizar perfil' });
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    if (!formData.passwordActual || !formData.passwordNueva || !formData.passwordConfirmar) {
      setMensaje({ tipo: 'error', texto: 'Todos los campos de contraseña son requeridos' });
      return;
    }

    if (formData.passwordNueva !== formData.passwordConfirmar) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden' });
      return;
    }

    if (formData.passwordNueva.length < 6) {
      setMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/usuarios/cambiar-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          passwordActual: formData.passwordActual,
          passwordNueva: formData.passwordNueva,
          passwordConfirmar: formData.passwordConfirmar
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al cambiar contraseña');

      setMensaje({ tipo: 'success', texto: 'Contraseña actualizada exitosamente' });
      setFormData(prev => ({
        ...prev,
        passwordActual: '',
        passwordNueva: '',
        passwordConfirmar: ''
      }));
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: error.message || 'Error al cambiar contraseña' });
    }
  };

  const handleCancel = () => {
    cargarDatosUsuario();
    setFormData(prev => ({
      ...prev,
      passwordActual: '',
      passwordNueva: '',
      passwordConfirmar: ''
    }));
    setAvatarFile(null);
    setMensaje({ tipo: '', texto: '' });
  };

  const togglePassword = (campo) => {
    setMostrarPassword(prev => ({ ...prev, [campo]: !prev[campo] }));
  };

  if (loading) {
    return (
      <div className="ajustes-wrapper">
        <div className="ajustes-card">
          <p style={{ textAlign: 'center', color: '#e0e7ff' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ajustes-wrapper">
      <div className="ajustes-card">
        <h1 className="ajustes-title">Ajustes de cuenta</h1>

        {mensaje.texto && (
          <div className={`mensaje ${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        {/* Sección Perfil */}
        <form onSubmit={handleSubmitPerfil}>
          <section className="ajustes-section">
            <h2 className="section-title">Perfil</h2>

            <div className="avatar-section">
              <div className="avatar-container" onClick={handleAvatarClick}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="avatar-image" />
                ) : (
                  <div className="avatar-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="avatarInput"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              <div className="avatar-info">
                <p className="avatar-text">Actualiza tu foto de perfil</p>
                {avatarFile && (
                  <span className="avatar-badge">✓ Imagen seleccionada</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  name="nombre"
                  placeholder="Tu nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  name="apellido"
                  placeholder="Tu apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <input
                  type="tel"
                  name="telefono"
                  placeholder="Teléfono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row two-columns">
              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">País</label>
                <select
                  name="pais"
                  value={formData.pais}
                  onChange={handleChange}
                  className="form-input form-select"
                >
                  <option value="">Selecciona el país</option>
                  {paises.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="btn-cancel">
                Cancelar
              </button>
              <button type="submit" className="btn-submit">
                Guardar Perfil
              </button>
            </div>
          </section>
        </form>

        {/* Sección Seguridad */}
        <form onSubmit={handleSubmitPassword}>
          <section className="ajustes-section">
            <h2 className="section-title">Seguridad</h2>

            {['passwordActual', 'passwordNueva', 'passwordConfirmar'].map((campo) => (
              <div className="form-row" key={campo}>
                <div className="form-group">
                  <div className="password-input-wrapper">
                    <input
                      type={mostrarPassword[campo] ? 'text' : 'password'}
                      name={campo}
                      placeholder={
                        campo === 'passwordActual' ? 'Contraseña actual' :
                          campo === 'passwordNueva' ? 'Contraseña nueva' :
                            'Confirma la nueva contraseña'
                      }
                      value={formData[campo]}
                      onChange={handleChange}
                      className="form-input"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => togglePassword(campo)}
                      aria-label="Mostrar/Ocultar contraseña"
                    >
                      {mostrarPassword[campo] ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="btn-cancel">
                Cancelar
              </button>
              <button type="submit" className="btn-submit">
                Cambiar Contraseña
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
};

export default AjustesCuenta;