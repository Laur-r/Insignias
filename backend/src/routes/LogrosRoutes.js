import express from 'express';
import LogrosController from '../controllers/LogrosController.js';

const router = express.Router();

// Obtener todas las insignias con progreso del usuario
router.get('/:usuarioDocumento', LogrosController.obtenerInsigniasConProgreso);

// Verificar y actualizar progreso
router.post('/verificar', LogrosController.verificarProgreso);

// Obtener historial de insignias desbloqueadas
router.get('/historial/:usuarioDocumento', LogrosController.obtenerHistorial);

export default router;