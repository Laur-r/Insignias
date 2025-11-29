// routes/metasAhorro.js
import express from 'express';
import MetasAhorroController from '../controllers/MetasAhorroController.js';

const router = express.Router();

// Rutas específicas ANTES de las rutas con parámetros
router.get('/resumen/:usuarioDocumento', MetasAhorroController.obtenerResumen);
router.get('/detalle/:id', MetasAhorroController.obtenerMeta);
router.get('/:id/historial', MetasAhorroController.obtenerHistorial);

// Listar metas (debe ir DESPUÉS de las rutas específicas)
router.get('/:usuarioDocumento', MetasAhorroController.listarMetas);

// Crear nueva meta
router.post('/', MetasAhorroController.crearMeta);

// Actualizar meta
router.put('/:id', MetasAhorroController.actualizarMeta);

// Eliminar meta
router.delete('/:id', MetasAhorroController.eliminarMeta);

// Aportar a meta
router.post('/:id/aportar', MetasAhorroController.aportarMeta);

// Retirar de meta
router.post('/:id/retirar', MetasAhorroController.retirarMeta);

// Cambiar estado
router.put('/:id/estado', MetasAhorroController.cambiarEstado);

export default router;