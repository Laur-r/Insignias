import { createContext, useContext, useState, useEffect } from 'react';

const TransaccionContext = createContext();

export const TransaccionProvider = ({ children }) => {
  const [actualizar, setActualizar] = useState(0);

  // ✅ LEER del localStorage al inicializar
  useEffect(() => {
    const storedUpdate = localStorage.getItem('dashboard_actualizar');
    if (storedUpdate) {
      setActualizar(Number(storedUpdate));
    }
  }, []);

  const notificarCambio = () => {
    const nuevoValor = actualizar + 1;
    setActualizar(nuevoValor);
    // ✅ GUARDAR en localStorage para que otras páginas lo vean
    localStorage.setItem('dashboard_actualizar', nuevoValor.toString());
  };

  // ✅ ESCUCHAR cambios en localStorage desde otras pestañas/componentes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'dashboard_actualizar') {
        setActualizar(Number(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <TransaccionContext.Provider value={{ notificarCambio, actualizar }}>
      {children}
    </TransaccionContext.Provider>
  );
};

export const useTransaccion = () => {
  const context = useContext(TransaccionContext);
  if (!context) {
    throw new Error('useTransaccion debe usarse dentro de un TransaccionProvider');
  }
  return context;
};