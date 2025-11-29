import express from 'express';
import CategoriaController from '../controllers/CategoriaController.js';

const router = express.Router();

// GET - Obtener categorías por tipo (ingreso/gasto)
router.get('/:tipo', CategoriaController.obtenerPorTipo);

// POST - Crear nueva categoría
router.post('/', CategoriaController.crear);

// PUT - Actualizar categoría
router.put('/:id', CategoriaController.actualizar);

// DELETE - Eliminar categoría
router.delete('/:id', CategoriaController.eliminar);

export default router;