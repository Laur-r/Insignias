import { createContext, useState, useContext, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // ✅ Inicializar desde localStorage
  const [usuario, setUsuario] = useState(() => {
    try {
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        const parsed = JSON.parse(usuarioGuardado);
        return parsed;
      }
    } catch (error) {
    }
    
    // Estado por defecto si no hay nada guardado
    return {
      documento: '',
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      pais: '',
      foto_perfil: ''
    };
  });

  // ✅ Sincronizar con localStorage cuando cambie el usuario
  useEffect(() => {
    if (usuario.documento) {
      localStorage.setItem('usuario', JSON.stringify(usuario));
    }
  }, [usuario]);

  const actualizarUsuario = (nuevosDatos) => {
    setUsuario(prev => {
      const actualizado = { ...prev, ...nuevosDatos };
      return actualizado;
    });
  };

  const limpiarUsuario = () => {
    setUsuario({
      documento: '',
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      pais: '',
      foto_perfil: ''
    });
    localStorage.removeItem('usuario');
  };

  return (
    <UserContext.Provider value={{ usuario, setUsuario, actualizarUsuario, limpiarUsuario }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe usarse dentro de UserProvider');
  }
  return context;
};