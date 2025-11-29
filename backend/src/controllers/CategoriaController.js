import { pool } from '../config/db.js';

export default class CategoriaController {

  // Obtener todas las categorías por tipo (ingreso o gasto)
  static async obtenerPorTipo(req, res) {
    try {
      const { tipo } = req.params;
      const usuarioDocumento = req.query.usuario_documento; // ✅ Obtener del query string

      const query = `
        SELECT 
          id, 
          usuario_documento,
          nombre, 
          tipo,
          created_at,
          CASE 
            WHEN usuario_documento IS NULL THEN true 
            ELSE false 
          END as es_sistema
        FROM categorias
        WHERE tipo = $1 
          AND (usuario_documento IS NULL OR usuario_documento = $2)
        ORDER BY es_sistema DESC, nombre ASC
      `;

      const { rows } = await pool.query(query, [tipo, usuarioDocumento]);

      res.status(200).json(rows);

    } catch (error) {
      console.error('❌ Error al obtener categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las categorías',
        error: error.message
      });
    }
  }

  // ✅ Crear nueva categoría
  static async crear(req, res) {
    try {
      const { usuario_documento, nombre, tipo } = req.body;

      // Validar que no exista ya una categoría con ese nombre para ese usuario
      const checkQuery = `
        SELECT id FROM categorias 
        WHERE LOWER(nombre) = LOWER($1) 
          AND tipo = $2 
          AND usuario_documento = $3
      `;

      const { rows: existing } = await pool.query(checkQuery, [nombre, tipo, usuario_documento]);

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya tienes una categoría con ese nombre'
        });
      }

      const insertQuery = `
        INSERT INTO categorias (usuario_documento, nombre, tipo)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const { rows } = await pool.query(insertQuery, [usuario_documento, nombre, tipo]);

      res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: rows[0]
      });

    } catch (error) {
      console.error('❌ Error al crear categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear la categoría',
        error: error.message
      });
    }
  }

  // ✅ Actualizar categoría
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { nombre } = req.body;

      // Verificar que la categoría existe y pertenece al usuario (no es del sistema)
      const checkQuery = `
        SELECT usuario_documento FROM categorias WHERE id = $1
      `;

      const { rows: categoria } = await pool.query(checkQuery, [id]);

      if (categoria.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      if (categoria[0].usuario_documento === null) {
        return res.status(403).json({
          success: false,
          message: 'No puedes editar categorías del sistema'
        });
      }

      const updateQuery = `
        UPDATE categorias
        SET nombre = $1
        WHERE id = $2
        RETURNING *
      `;

      const { rows } = await pool.query(updateQuery, [nombre, id]);

      res.status(200).json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: rows[0]
      });

    } catch (error) {
      console.error('❌ Error al actualizar categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la categoría',
        error: error.message
      });
    }
  }

  // ✅ Eliminar categoría
  static async eliminar(req, res) {
    try {
      const { id } = req.params;

      // Verificar que la categoría existe y pertenece al usuario
      const checkQuery = `
        SELECT usuario_documento FROM categorias WHERE id = $1
      `;

      const { rows: categoria } = await pool.query(checkQuery, [id]);

      if (categoria.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      if (categoria[0].usuario_documento === null) {
        return res.status(403).json({
          success: false,
          message: 'No puedes eliminar categorías del sistema'
        });
      }

      // Verificar si hay transacciones usando esta categoría
      const transQuery = `
        SELECT COUNT(*) as total FROM transacciones WHERE categoria_id = $1
      `;

      const { rows: trans } = await pool.query(transQuery, [id]);

      if (parseInt(trans[0].total) > 0) {
        return res.status(400).json({
          success: false,
          message: `No puedes eliminar esta categoría porque tiene ${trans[0].total} transacción(es) asociada(s)`
        });
      }

      const deleteQuery = `
        DELETE FROM categorias WHERE id = $1 RETURNING *
      `;

      const { rows } = await pool.query(deleteQuery, [id]);

      res.status(200).json({
        success: true,
        message: 'Categoría eliminada exitosamente',
        data: rows[0]
      });

    } catch (error) {
      console.error('❌ Error al eliminar categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la categoría',
        error: error.message
      });
    }
  }
}