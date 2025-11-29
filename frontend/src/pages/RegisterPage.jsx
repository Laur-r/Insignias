import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Register.css';
import Navbar from '../components/Navbar.jsx';
import countries from "i18n-iso-countries";
import esCountries from "i18n-iso-countries/langs/es.json";

function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    documento: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    pais: 'Colombia',
    acceptTerms: false
  });

  // Inicializar países
  countries.registerLocale(esCountries);

  // Obtener lista de países en español
  const countryList = Object.entries(countries.getNames("es")).map(([code, name]) => ({
    code,
    name
  }));

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
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

    if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) newErrors.email = 'El email es requerido';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'El email no es válido';

    if (!formData.password) newErrors.password = 'La contraseña es requerida';
    else if (formData.password.length < 6) newErrors.password = 'Debe tener al menos 6 caracteres';

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirma tu contraseña';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';

    if (formData.phone && formData.phone.length < 10) newErrors.phone = 'El teléfono debe tener al menos 10 dígitos';

    if (!formData.acceptTerms) newErrors.acceptTerms = 'Debes aceptar los términos y condiciones';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/usuarios/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documento: formData.documento,
          email: formData.email,
          password: formData.password,
          nombre: formData.firstName,
          apellido: formData.lastName,
          telefono: formData.phone,
          pais: formData.pais
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en el registro');
      }

      alert('¡Registro exitoso!');
      // Redirigir al usuario
      window.location.href = '/login';

    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  return (<div className="App"> <Navbar />

    <div className="register-container">
      <div className="register-header">
        <h1 className="gradient-text">Crea tu cuenta</h1>
        <p>Comienza a llevar tus finanzas al siguiente nivel con Fintrax</p>
      </div>

      <form className="register-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">Nombre*</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={errors.firstName ? 'error' : ''}
              placeholder="Tu nombre"
            />
            {errors.firstName && <span className="error-message">{errors.firstName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Apellido *</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={errors.lastName ? 'error' : ''}
              placeholder="Tu apellido"
            />
            {errors.lastName && <span className="error-message">{errors.lastName}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="documento">Documento *</label>
          <input
            type="text"
            id="documento"
            name="documento"
            value={formData.documento}
            onChange={handleInputChange}
            className={errors.documento ? 'error' : ''}
            placeholder="Tu documento"
          />
          {errors.documento && <span className="error-message">{errors.documento}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={errors.email ? 'error' : ''}
            placeholder="tu@email.com"
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="phone">Teléfono (opcional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={errors.phone ? 'error' : ''}
              placeholder="+57 300 123 4567"
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="pais">País *</label>
            <select
              id="pais"
              name="pais"
              value={formData.pais}
              onChange={handleInputChange}
              className={`country-select ${errors.pais ? 'error' : ''}`}
            >
              <option value="">Selecciona tu país</option>
              {countryList.map((country) => (
                <option key={country.code} value={country.code} data-flag={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            {errors.pais && <span className="error-message">{errors.pais}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="password">Contraseña *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={errors.password ? 'error' : ''}
              placeholder="Mínimo 6 caracteres"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar contraseña *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder="Repite tu contraseña"
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>
        </div>

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleInputChange}
            />
            <span className="checkmark"></span>
            Acepto los <a href="/terms">términos y condiciones</a>
          </label>
          {errors.acceptTerms && <span className="error-message">{errors.acceptTerms}</span>}
        </div>

        <button
          type="submit"
          className="register-button"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Creando cuenta...
            </>
          ) : (
            'Crear cuenta'
          )}
        </button>
      </form>

      <div className="register-footer">
        <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link></p>
      </div>
    </div>
  </div>


  );
}

export default RegisterPage;
