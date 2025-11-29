// hooks/useTransacciones.js
import { useTransaccion } from '../components/Context/TransaccionContext';

export const useTransacciones = () => {
    const { notificarCambio } = useTransaccion();

    const crearTransaccion = async (transaccionData) => {
        try {
            const response = await fetch('http://localhost:3000/api/transacciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaccionData)
            });

            const data = await response.json();

            if (data.success) {
                notificarCambio(); // ✅ Notificar cambio después de crear
                return data;
            }
            return data;
        } catch (error) {
            console.error('Error al crear transacción:', error);
            throw error;
        }
    };

    const eliminarTransaccion = async (id) => {
        try {
            const response = await fetch(`http://localhost:3000/api/transacciones/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                notificarCambio(); // ✅ Notificar cambio después de eliminar
                return data;
            }
            return data;
        } catch (error) {
            console.error('Error al eliminar transacción:', error);
            throw error;
        }
    };

    const actualizarTransaccion = async (id, transaccionData) => {
        try {
            const response = await fetch(`http://localhost:3000/api/transacciones/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaccionData)
            });

            const data = await response.json();

            if (data.success) {
                notificarCambio(); // ✅ Notificar cambio después de actualizar
                return data;
            }
            return data;
        } catch (error) {
            console.error('Error al actualizar transacción:', error);
            throw error;
        }
    };

    return {
        crearTransaccion,
        eliminarTransaccion,
        actualizarTransaccion
    };
};