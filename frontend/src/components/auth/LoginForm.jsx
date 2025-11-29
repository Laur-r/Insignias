import React, { useState } from 'react';
import Input from '../common/input';
import Button from '../common/button';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../Context/UserContext'; // ✅ IMPORTAR useUser

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { setUsuario } = useUser(); // ✅ OBTENER setUsuario del contexto

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'El correo es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo no es válido';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.mensaje || 'Error al iniciar sesión');
      }

      // ✅ Construir URL completa de la foto
      const baseURL = "http://localhost:3000";
      const fotoURL = data.usuario.foto_perfil
        ? data.usuario.foto_perfil.startsWith("http")
          ? data.usuario.foto_perfil
          : `${baseURL}${data.usuario.foto_perfil}`
        : "";

      const usuarioCompleto = {
        documento: data.usuario.documento,
        nombre: data.usuario.nombre,
        apellido: data.usuario.apellido,
        email: data.usuario.email,
        telefono: data.usuario.telefono,
        pais: data.usuario.pais,
        foto_perfil: fotoURL
      };

      // ✅ 1. Guardar en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(usuarioCompleto));

      // ✅ 2. Actualizar el contexto
      setUsuario(usuarioCompleto);


      alert(`Bienvenido ${data.usuario.nombre}`);

      // ✅ 3. Redirigir al menú
      navigate('/menu');

    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = () => {
    navigate('/register');
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <form className="login-form" onSubmit={handleLogin}>
      {errors.general && (
        <div className="error-message general-error">
          {errors.general}
        </div>
      )}
      
      <div className="form-group">
        <Input
          type="email"
          name="email"
          placeholder="Correo"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
        />
      </div>

      <div className="form-group">
        <Input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
        />
      </div>

      <div className="form-actions">
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          fullWidth
        >
          Iniciar Sesión
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={handleCreateAccount}
          fullWidth
        >
          Crear Cuenta
        </Button>
      </div>

      <div className="form-footer">
        <button 
          type="button"
          className="forgot-password-link"
          onClick={handleForgotPassword}
        >
          ¿Olvidaste tu Contraseña?
        </button>
      </div>
    </form>
  );
};

export default LoginForm;