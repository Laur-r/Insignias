// common/auth/ForgotPasswordForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../common/input';
import Button from '../common/button';

const ForgotPasswordForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [mensaje, setMensaje] = useState('');

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
    
    if (!formData.email) {
      newErrors.email = 'El correo es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo no es válido';
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
      const response = await fetch('http://localhost:3000/api/usuarios/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje(data.mensaje);
        setFormData({ email: '' }); // Limpiar el campo
      } else {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error en recuperación:', error);
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <form className="forgot-password-form" onSubmit={handleSubmit}>
      <div className="forgot-password-header">
        <h1>Recuperar Contraseña</h1>
        <p>Te enviaremos instrucciones para restablecer tu contraseña</p>
      </div>

      {errors.general && (
        <div className="error-message general-error">
          {errors.general}
        </div>
      )}

      {mensaje && (
        <div className="success-message">
          {mensaje}
        </div>
      )}
      
      <div className="form-group">
        <Input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
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
          Enviar Instrucciones
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={handleBackToLogin}
          fullWidth
        >
          Volver al Inicio de Sesión
        </Button>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
