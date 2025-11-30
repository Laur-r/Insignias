// backend/src/routes/metasAhorroRoutes.js
import express from 'express';
import MetasAhorroController from '../controllers/MetasAhorroController.js';
import { verificarLogrosAutomaticamente } from '../middleware/verificarLogros.js';

const router = express.Router();

// ⚠️ IMPORTANTE: Las rutas más específicas DEBEN ir ANTES de las rutas con parámetros dinámicos

// Rutas específicas PRIMERO
router.get('/resumen/:usuarioDocumento', MetasAhorroController.obtenerResumen);
router.get('/detalle/:id', MetasAhorroController.obtenerMeta);

// Rutas de acciones sobre metas específicas (con verificación de logros)
router.get('/:id/historial', MetasAhorroController.obtenerHistorial);
router.post('/:id/aportar', verificarLogrosAutomaticamente, MetasAhorroController.aportarMeta);
router.post('/:id/retirar', verificarLogrosAutomaticamente, MetasAhorroController.retirarMeta);
router.put('/:id/estado', verificarLogrosAutomaticamente, MetasAhorroController.cambiarEstado);

// Ruta general para listar metas (DESPUÉS de las específicas)
router.get('/:usuarioDocumento', MetasAhorroController.listarMetas);

// ✅ Rutas de modificación CON verificación automática de logros
router.post('/', verificarLogrosAutomaticamente, MetasAhorroController.crearMeta);
router.put('/:id', verificarLogrosAutomaticamente, MetasAhorroController.actualizarMeta);
router.delete('/:id', verificarLogrosAutomaticamente, MetasAhorroController.eliminarMeta);

export default router;