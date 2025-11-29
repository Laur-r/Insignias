// common/auth/ResetPasswordForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Input from '../common/input';
import Button from '../common/button';

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    nuevaPassword: '',
    confirmarPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [errors, setErrors] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [tokenValido, setTokenValido] = useState(false);

  // Validar token al cargar la página
  useEffect(() => {
    const validarToken = async () => {
      if (!token) {
        setErrors({ general: 'Token no encontrado en la URL' });
        setTokenValido(false);
        setValidatingToken(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/usuarios/validate-token/${token}`
        );
        const data = await response.json();

        if (response.ok && data.valid) {
          setTokenValido(true);
        } else {
          setErrors({ general: data.error || 'El enlace es inválido o ha expirado' });
          setTokenValido(false);
        }
      } catch (err) {
        setErrors({ general: 'Error al validar el enlace' });
        setTokenValido(false);
        console.error(err);
      } finally {
        setValidatingToken(false);
      }
    };

    validarToken();
  }, [token]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Limpiar mensaje cuando el usuario empieza a escribir
    if (mensaje) {
      setMensaje('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nuevaPassword) {
      newErrors.nuevaPassword = 'La nueva contraseña es requerida';
    } else if (formData.nuevaPassword.length < 6) {
      newErrors.nuevaPassword = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (!formData.confirmarPassword) {
      newErrors.confirmarPassword = 'Debes confirmar la contraseña';
    } else if (formData.nuevaPassword !== formData.confirmarPassword) {
      newErrors.confirmarPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    setIsLoading(true);
    setMensaje('');
    setErrors({});

    try {
      const response = await fetch('http://localhost:3000/api/usuarios/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          nuevaPassword: formData.nuevaPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje(data.mensaje);
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        throw new Error(data.error || 'Error al restablecer la contraseña');
      }
    } catch (error) {
      console.error('Error en restablecimiento:', error);
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    navigate('/forgot-password');
  };

  // Mostrar loading mientras valida el token
  if (validatingToken) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Validando enlace...</p>
      </div>
    );
  }

  // Si el token no es válido
  if (!tokenValido) {
    return (
      <div className="error-container">
        <div className="error-icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2>Enlace inválido</h2>
        <p>{errors.general}</p>
        <Button
          type="button"
          variant="primary"
          onClick={handleRequestNewLink}
          fullWidth
        >
          Solicitar nuevo enlace
        </Button>
      </div>
    );
  }

  return (
    <form className="reset-password-form" onSubmit={handleSubmit}>
      <div className="reset-password-header">
        <h1>Crear Nueva Contraseña</h1>
        <p>Ingresa tu nueva contraseña para tu cuenta</p>
      </div>

      {errors.general && (
        <div className="error-message general-error">
          {errors.general}
        </div>
      )}

      {mensaje && (
        <div className="success-message">
          {mensaje} Redirigiendo...
        </div>
      )}
      
      <div className="form-group">
        <Input
          type="password"
          name="nuevaPassword"
          placeholder="Nueva contraseña (mínimo 6 caracteres)"
          value={formData.nuevaPassword}
          onChange={handleInputChange}
          error={errors.nuevaPassword}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <Input
          type="password"
          name="confirmarPassword"
          placeholder="Confirmar contraseña"
          value={formData.confirmarPassword}
          onChange={handleInputChange}
          error={errors.confirmarPassword}
          disabled={isLoading}
        />
      </div>

      <div className="form-actions">
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          fullWidth
        >
          Restablecer Contraseña
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={handleRequestNewLink}
          fullWidth
        >
          Solicitar nuevo enlace
        </Button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;