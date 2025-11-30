// backend/src/routes/TransaccionRoutes.js
import express from 'express';
import TransaccionController from '../controllers/TransaccionController.js';
import { verificarLogrosAutomaticamente } from '../middleware/verificarLogros.js';

const router = express.Router();

// ⚠️ IMPORTANTE: Las rutas más específicas DEBEN ir ANTES de las rutas con parámetros dinámicos

// Ruta para dashboard (la más específica)
router.get('/dashboard/:usuarioDocumento', TransaccionController.obtenerResumenDashboard);

// Ruta para obtener por usuario y tipo
router.get('/:usuarioDocumento/:tipo', TransaccionController.obtenerPorUsuarioYTipo);

// ✅ Rutas de modificación CON verificación automática de logros
router.post('/', verificarLogrosAutomaticamente, TransaccionController.crear);
router.put('/:id', verificarLogrosAutomaticamente, TransaccionController.actualizar);
router.delete('/:id', verificarLogrosAutomaticamente, TransaccionController.eliminar);

export default router;