import express from 'express';
import TransaccionController from '../controllers/TransaccionController.js';

const router = express.Router();


router.get('/dashboard/:usuarioDocumento', TransaccionController.obtenerResumenDashboard);


router.get('/:usuarioDocumento/:tipo', TransaccionController.obtenerPorUsuarioYTipo);
router.post('/', TransaccionController.crear);
router.put('/:id', TransaccionController.actualizar);
router.delete('/:id', TransaccionController.eliminar);

export default router;
