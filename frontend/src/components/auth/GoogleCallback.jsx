import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleGoogleCallback = async () => {
            try {
                // Extraer el token de la URL
                const params = new URLSearchParams(location.search);
                const token = params.get('token');

                if (!token) {
                    throw new Error('No se recibió el token de autenticación');
                }

                // Guardar el token
                localStorage.setItem('token', token);

                // ✅ OBTENER DATOS COMPLETOS DEL USUARIO DESDE EL BACKEND
                const response = await fetch('http://localhost:3000/api/usuarios/perfil', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Error al obtener datos del usuario');
                }

                const usuarioCompleto = await response.json();

                // Guardar el usuario completo en localStorage
                localStorage.setItem('usuario', JSON.stringify(usuarioCompleto));

                // Redirigir al menú
                navigate('/menu');

            } catch (error) {
                setError(error.message);

                // Redirigir al login después de 3 segundos
                setTimeout(() => {
                    navigate('/login', {
                        state: {
                            error: 'Error al iniciar sesión con Google. Intenta de nuevo.'
                        }
                    });
                }, 3000);
            }
        };

        handleGoogleCallback();
    }, [location, navigate]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                maxWidth: '400px'
            }}>
                {error ? (
                    <>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '20px'
                        }}>❌</div>
                        <h2 style={{
                            color: '#ff4444',
                            marginBottom: '10px'
                        }}>Error de autenticación</h2>
                        <p style={{ color: '#666' }}>{error}</p>
                        <p style={{ 
                            color: '#999', 
                            fontSize: '14px',
                            marginTop: '20px'
                        }}>Redirigiendo al login...</p>
                    </>
                ) : (
                    <>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '4px solid #f3f3f3',
                            borderTop: '4px solid #3498db',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 20px'
                        }}></div>
                        <h2 style={{
                            color: '#333',
                            marginBottom: '10px'
                        }}>Procesando inicio de sesión...</h2>
                        <p style={{ color: '#666' }}>
                            Por favor espera mientras te redirigimos.
                        </p>
                    </>
                )}
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default GoogleCallback;