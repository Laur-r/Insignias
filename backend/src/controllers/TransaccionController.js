import { pool } from '../config/db.js';

export default class TransaccionController {

  //  Obtener transacciones por usuario y tipo (ingreso o gasto)
  static async obtenerPorUsuarioYTipo(req, res) {
    try {
      const { usuarioDocumento, tipo } = req.params;

      const query = `
        SELECT 
          t.id,
          t.usuario_documento,
          t.categoria_id,
          c.nombre AS categoria,
          t.tipo,
          t.monto,
          t.descripcion,
          t.fecha,
          t.created_at,
          t.updated_at
        FROM transacciones t
        LEFT JOIN categorias c ON t.categoria_id = c.id
        WHERE t.usuario_documento = $1 AND t.tipo = $2
        ORDER BY t.fecha DESC
      `;

      const { rows } = await pool.query(query, [usuarioDocumento, tipo]);

      res.status(200).json({
        success: true,
        data: rows
      });

    } catch (error) {
      console.error(' Error al obtener transacciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las transacciones',
        error: error.message
      });
    }
  }

  //  Crear nueva transacción
  static async crear(req, res) {
    try {
      const { usuario_documento, categoria_id, tipo, monto, descripcion, fecha } = req.body;

      const query = `
        INSERT INTO transacciones (usuario_documento, categoria_id, tipo, monto, descripcion, fecha)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const { rows } = await pool.query(query, [
        usuario_documento,
        categoria_id,
        tipo,
        monto,
        descripcion,
        fecha
      ]);

      res.status(201).json({
        success: true,
        message: 'Transacción creada exitosamente',
        data: rows[0]
      });

    } catch (error) {
      console.error(' Error al crear transacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear la transacción',
        error: error.message
      });
    }
  }

  //  Actualizar transacción
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { categoria_id, tipo, monto, descripcion, fecha } = req.body;

      const query = `
        UPDATE transacciones
        SET categoria_id = $1, tipo = $2, monto = $3, descripcion = $4, fecha = $5, updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `;

      const { rows } = await pool.query(query, [
        categoria_id,
        tipo,
        monto,
        descripcion,
        fecha,
        id
      ]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transacción no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Transacción actualizada exitosamente',
        data: rows[0]
      });

    } catch (error) {
      console.error(' Error al actualizar transacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la transacción',
        error: error.message
      });
    }
  }

  //  Eliminar transacción
  static async eliminar(req, res) {
    try {
      const { id } = req.params;

      const query = 'DELETE FROM transacciones WHERE id = $1 RETURNING *';
      const { rows } = await pool.query(query, [id]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transacción no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Transacción eliminada exitosamente',
        data: rows[0]
      });

    } catch (error) {
      console.error('❌ Error al eliminar transacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la transacción',
        error: error.message
      });
    }
  }

  //  Resumen del Dashboard
  static async obtenerResumenDashboard(req, res) {
    try {
      const { usuarioDocumento } = req.params;
      const { periodo } = req.query;

      if (!usuarioDocumento) {
        return res.status(400).json({
          success: false,
          message: 'Falta el documento del usuario'
        });
      }

      //  Determinar filtro de fecha según el periodo
      let filtroFecha = '';
      if (periodo === '1mes') filtroFecha = "AND fecha >= CURRENT_DATE - INTERVAL '1 month'";
      else if (periodo === '3meses') filtroFecha = "AND fecha >= CURRENT_DATE - INTERVAL '3 month'";
      else if (periodo === '6meses') filtroFecha = "AND fecha >= CURRENT_DATE - INTERVAL '6 month'";
      else if (periodo === '1año') filtroFecha = "AND fecha >= CURRENT_DATE - INTERVAL '12 month'";

      //  Totales generales
      const totalesQuery = `
        SELECT
          SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) AS total_ingresos,
          SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) AS total_gastos
        FROM transacciones
        WHERE usuario_documento = $1 ${filtroFecha}
      `;
      const { rows: [totales] } = await pool.query(totalesQuery, [usuarioDocumento]);

      const ingresos = Number(totales?.total_ingresos) || 0;
      const gastos = Number(totales?.total_gastos) || 0;
      const balance = ingresos - gastos;

      //  Desglose de ingresos
      const desgloseIngresosQuery = `
        SELECT c.nombre AS categoria, SUM(t.monto) AS monto
        FROM transacciones t
        JOIN categorias c ON t.categoria_id = c.id
        WHERE t.usuario_documento = $1 AND t.tipo = 'ingreso' ${filtroFecha}
        GROUP BY c.nombre
      `;
      const { rows: desgloseIngresos } = await pool.query(desgloseIngresosQuery, [usuarioDocumento]);

      //  Desglose de gastos
      const desgloseGastosQuery = `
        SELECT c.nombre AS categoria, SUM(t.monto) AS monto
        FROM transacciones t
        JOIN categorias c ON t.categoria_id = c.id
        WHERE t.usuario_documento = $1 AND t.tipo = 'gasto' ${filtroFecha}
        GROUP BY c.nombre
      `;
      const { rows: desgloseGastos } = await pool.query(desgloseGastosQuery, [usuarioDocumento]);

      //  Gráfica de barras mensual
      const graficaBarrasQuery = `
        SELECT 
          TO_CHAR(fecha, 'Mon') AS mes,
          SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) AS ingresos,
          SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) AS gastos
        FROM transacciones
        WHERE usuario_documento = $1 ${filtroFecha}
        GROUP BY TO_CHAR(fecha, 'Mon'), DATE_TRUNC('month', fecha)
        ORDER BY DATE_TRUNC('month', fecha)
      `;
      const { rows: graficaBarras } = await pool.query(graficaBarrasQuery, [usuarioDocumento]);

      // 🔹 Gráfica de torta (gastos por categoría)
      const graficaTortaQuery = `
        SELECT c.nombre AS categoria, SUM(t.monto) AS monto
        FROM transacciones t
        JOIN categorias c ON t.categoria_id = c.id
        WHERE t.usuario_documento = $1 AND t.tipo = 'gasto' ${filtroFecha}
        GROUP BY c.nombre
      `;
      const { rows: graficaTorta } = await pool.query(graficaTortaQuery, [usuarioDocumento]);

      res.status(200).json({
        success: true,
        data: {
          ingresos,
          gastos,
          balance,
          desgloseIngresos,
          desgloseGastos,
          graficaBarras,
          graficaTorta
        }
      });

    } catch (error) {
      console.error(' Error al obtener resumen del dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener resumen del dashboard',
        error: error.message
      });
    }
  }
}
