import { pool } from '../config/db.js';

export default class LogrosController {
  /**
   * Obtener todas las insignias con el progreso del usuario
   */
  static async obtenerInsigniasConProgreso(req, res) {
    try {
      const { usuarioDocumento } = req.params;

      if (!usuarioDocumento) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el documento del usuario'
        });
      }

      const query = `
        SELECT 
          i.id,
          i.nombre,
          i.descripcion,
          i.tipo,
          i.condicion_tipo,
          i.valor_requerido,
          i.xp_reward,
          i.imagen_url,
          COALESCE(ui.completada, false) as completada,
          COALESCE(ui.desbloqueada_en, NULL) as desbloqueada_en,
          COALESCE(ip.valor_actual, 0) as progreso_actual,
          ROUND((COALESCE(ip.valor_actual, 0)::numeric / i.valor_requerido::numeric) * 100, 2) as porcentaje_progreso
        FROM insignias i
        LEFT JOIN usuario_insignias ui 
          ON i.id = ui.insignia_id AND ui.usuario_documento = $1
        LEFT JOIN insignias_progreso ip 
          ON i.id = ip.insignia_id AND ip.usuario_documento = $1
        WHERE i.estado = 'activa'
        ORDER BY i.tipo, i.valor_requerido, i.id
      `;

      const { rows } = await pool.query(query, [usuarioDocumento]);

      // ✅ MEJORADO: Agrupar por tipo manteniendo TODAS las insignias (incluso niveles)
      const insigniasPorTipo = {
        educacion: rows.filter(i => i.tipo === 'educacion').sort((a, b) => a.valor_requerido - b.valor_requerido),
        ahorro: rows.filter(i => i.tipo === 'ahorro').sort((a, b) => a.valor_requerido - b.valor_requerido),
        habitos: rows.filter(i => i.tipo === 'habitos').sort((a, b) => a.valor_requerido - b.valor_requerido),
        transacciones: rows.filter(i => i.tipo === 'transacciones').sort((a, b) => a.valor_requerido - b.valor_requerido)
      };

      // Obtener estadísticas del usuario
      const statsQuery = `
        SELECT 
          COALESCE(u.xp, 0) as xp_total,
          COUNT(DISTINCT ui.insignia_id) FILTER (WHERE ui.completada = true) as insignias_desbloqueadas,
          (SELECT COUNT(*) FROM insignias WHERE estado = 'activa') as total_insignias
        FROM usuarios u
        LEFT JOIN usuario_insignias ui ON u.documento = ui.usuario_documento
        WHERE u.documento = $1
        GROUP BY u.xp
      `;

      const { rows: statsRows } = await pool.query(statsQuery, [usuarioDocumento]);
      const stats = statsRows[0] || { xp_total: 0, insignias_desbloqueadas: 0, total_insignias: 0 };

      res.status(200).json({
        success: true,
        data: {
          insigniasPorTipo,
          stats
        }
      });

    } catch (error) {
      console.error('Error al obtener insignias:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las insignias',
        error: error.message
      });
    }
  }

  /**
   * Verificar y actualizar progreso de insignias
   */
  static async verificarProgreso(req, res) {
    try {
      const { usuarioDocumento } = req.body;

      if (!usuarioDocumento) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el documento del usuario'
        });
      }

      // Obtener todas las insignias activas
      const insigniasQuery = `
        SELECT id, condicion_tipo, valor_requerido, xp_reward
        FROM insignias
        WHERE estado = 'activa'
      `;
      const { rows: insignias } = await pool.query(insigniasQuery);

      const insigniasDesbloqueadas = [];

      for (const insignia of insignias) {
        let valorActual = 0;

        // Calcular progreso según el tipo de condición
        switch (insignia.condicion_tipo) {
          case 'cursos_completados':
            const cursosQuery = `
              SELECT COUNT(*) as total 
              FROM inscripciones 
              WHERE usuario_documento = $1 AND progreso = 100
            `;
            const { rows: cursosRows } = await pool.query(cursosQuery, [usuarioDocumento]);
            valorActual = parseInt(cursosRows[0].total);
            break;

          case 'metas_activas':
            const metasActivasQuery = `
              SELECT COUNT(*) as total 
              FROM metas_ahorro 
              WHERE usuario_documento = $1 AND estado = 'activa'
            `;
            const { rows: metasActivasRows } = await pool.query(metasActivasQuery, [usuarioDocumento]);
            valorActual = parseInt(metasActivasRows[0].total);
            break;

          case 'metas_completadas':
            const metasCompletadasQuery = `
              SELECT COUNT(*) as total 
              FROM metas_ahorro 
              WHERE usuario_documento = $1 AND estado = 'completada'
            `;
            const { rows: metasCompletadasRows } = await pool.query(metasCompletadasQuery, [usuarioDocumento]);
            valorActual = parseInt(metasCompletadasRows[0].total);
            break;

          case 'metas_largo_plazo_completadas':
            // Metas completadas que duraron más de 6 meses
            const metasLargoPlazoQuery = `
              SELECT COUNT(*) as total 
              FROM metas_ahorro 
              WHERE usuario_documento = $1 
                AND estado = 'completada'
                AND fecha_completada IS NOT NULL
                AND EXTRACT(EPOCH FROM (fecha_completada - fecha_creacion))/86400 >= 180
            `;
            const { rows: metasLargoPlazoRows } = await pool.query(metasLargoPlazoQuery, [usuarioDocumento]);
            valorActual = parseInt(metasLargoPlazoRows[0].total);
            break;

          case 'metas_activas_consecutivas':
            // Calcular meses consecutivos con metas activas
            const mesesConsecutivosQuery = `
              WITH meses_con_metas AS (
                SELECT DISTINCT 
                  DATE_TRUNC('month', fecha_creacion) as mes
                FROM metas_ahorro
                WHERE usuario_documento = $1
                  AND estado IN ('activa', 'completada')
              ),
              meses_numerados AS (
                SELECT 
                  mes,
                  ROW_NUMBER() OVER (ORDER BY mes) as rn,
                  mes - (INTERVAL '1 month' * ROW_NUMBER() OVER (ORDER BY mes)) as grupo
                FROM meses_con_metas
              ),
              rachas AS (
                SELECT 
                  grupo,
                  COUNT(*) as meses_consecutivos
                FROM meses_numerados
                GROUP BY grupo
              )
              SELECT COALESCE(MAX(meses_consecutivos), 0) as max_racha
              FROM rachas
            `;
            const { rows: rachaRows } = await pool.query(mesesConsecutivosQuery, [usuarioDocumento]);
            valorActual = parseInt(rachaRows[0].max_racha);
            break;

          case 'uso_semanal':
            // Calcular semanas con al menos 3 usos
            const usoSemanalQuery = `
              WITH semanas_uso AS (
                SELECT 
                  DATE_TRUNC('week', fecha_registro) as semana,
                  COUNT(DISTINCT DATE(fecha_registro)) as dias_usados
                FROM (
                  SELECT fecha_registro FROM transacciones WHERE usuario_documento = $1
                  UNION ALL
                  SELECT fecha_creacion FROM metas_ahorro WHERE usuario_documento = $1
                  UNION ALL
                  SELECT fecha_inscripcion FROM inscripciones WHERE usuario_documento = $1
                ) as actividades
                GROUP BY semana
                HAVING COUNT(DISTINCT DATE(fecha_registro)) >= 3
              )
              SELECT COUNT(*) as semanas_activas
              FROM semanas_uso
            `;
            const { rows: usoRows } = await pool.query(usoSemanalQuery, [usuarioDocumento]);
            valorActual = parseInt(usoRows[0].semanas_activas);
            break;

          case 'resumen_mensual':
            // Por implementar - puede ser una tabla separada de resúmenes mensuales
            valorActual = 0;
            break;

          case 'transacciones_registradas':
            const transaccionesQuery = `
              SELECT COUNT(*) as total 
              FROM transacciones 
              WHERE usuario_documento = $1
            `;
            const { rows: transaccionesRows } = await pool.query(transaccionesQuery, [usuarioDocumento]);
            valorActual = parseInt(transaccionesRows[0].total);
            break;
        }

        // Actualizar progreso
        await pool.query(`
          INSERT INTO insignias_progreso (usuario_documento, insignia_id, valor_actual, fecha_registro)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (usuario_documento, insignia_id)
          DO UPDATE SET valor_actual = $3, fecha_registro = NOW()
        `, [usuarioDocumento, insignia.id, valorActual]);

        // Verificar si se desbloqueó
        if (valorActual >= insignia.valor_requerido) {
          const yaDesbloqueadaQuery = `
            SELECT completada 
            FROM usuario_insignias 
            WHERE usuario_documento = $1 AND insignia_id = $2
          `;
          const { rows: yaDesbloqueada } = await pool.query(yaDesbloqueadaQuery, [usuarioDocumento, insignia.id]);

          if (yaDesbloqueada.length === 0 || !yaDesbloqueada[0].completada) {
            await pool.query(`
              INSERT INTO usuario_insignias (usuario_documento, insignia_id, desbloqueada_en, completada)
              VALUES ($1, $2, NOW(), true)
              ON CONFLICT (usuario_documento, insignia_id)
              DO UPDATE SET completada = true, desbloqueada_en = NOW()
            `, [usuarioDocumento, insignia.id]);

            // Agregar XP al usuario
            await pool.query(`
              UPDATE usuarios 
              SET xp = COALESCE(xp, 0) + $1 
              WHERE documento = $2
            `, [insignia.xp_reward, usuarioDocumento]);

            insigniasDesbloqueadas.push({
              id: insignia.id,
              xp_ganado: insignia.xp_reward
            });
          }
        }
      }

      res.status(200).json({
        success: true,
        message: 'Progreso actualizado',
        data: {
          insigniasDesbloqueadas
        }
      });

    } catch (error) {
      console.error('Error al verificar progreso:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar el progreso',
        error: error.message
      });
    }
  }

  /**
   * Obtener historial de insignias desbloqueadas
   */
  static async obtenerHistorial(req, res) {
    try {
      const { usuarioDocumento } = req.params;

      const query = `
        SELECT 
          i.nombre,
          i.descripcion,
          i.imagen_url,
          i.xp_reward,
          i.tipo,
          ui.desbloqueada_en
        FROM usuario_insignias ui
        JOIN insignias i ON ui.insignia_id = i.id
        WHERE ui.usuario_documento = $1 AND ui.completada = true
        ORDER BY ui.desbloqueada_en DESC
      `;

      const { rows } = await pool.query(query, [usuarioDocumento]);

      res.status(200).json({
        success: true,
        data: rows
      });

    } catch (error) {
      console.error('Error al obtener historial:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el historial',
        error: error.message
      });
    }
  }

  /**
   * Función auxiliar para crear las constraints si no existen
   */
  static async crearConstraintsSiNoExisten() {
    try {
      // Verificar y crear constraint para insignias_progreso
      await pool.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'insignias_progreso_usuario_insignia_unique'
          ) THEN
            ALTER TABLE insignias_progreso 
            ADD CONSTRAINT insignias_progreso_usuario_insignia_unique 
            UNIQUE (usuario_documento, insignia_id);
          END IF;
        END $$;
      `);

      // Verificar y crear constraint para usuario_insignias
      await pool.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'usuario_insignias_usuario_insignia_unique'
          ) THEN
            ALTER TABLE usuario_insignias 
            ADD CONSTRAINT usuario_insignias_usuario_insignia_unique 
            UNIQUE (usuario_documento, insignia_id);
          END IF;
        END $$;
      `);

      console.log('✅ Constraints verificadas/creadas correctamente');
    } catch (error) {
      console.error('❌ Error al crear constraints:', error);
    }
  }
}