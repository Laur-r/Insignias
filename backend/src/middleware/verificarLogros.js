// backend/src/middleware/verificarLogros.js
import { pool } from '../config/db.js';

/**
 * Middleware para verificar automáticamente logros después de ciertas acciones
 */
export const verificarLogrosAutomaticamente = async (req, res, next) => {
  // Guardar la función original res.json
  const originalJson = res.json.bind(res);

  // Sobrescribir res.json
  res.json = async function(data) {
    // Solo verificar si la operación fue exitosa
    if (data && data.success) {
      try {
        // Obtener el documento del usuario de diferentes fuentes
        const usuarioDocumento = 
          req.body?.usuario_documento || 
          req.body?.usuarioDocumento ||
          req.user?.documento ||
          req.params?.usuarioDocumento ||
          data.data?.usuario_documento;

        if (usuarioDocumento) {
          console.log(`🎯 Verificando logros para usuario: ${usuarioDocumento}`);
          
          // Verificar progreso de forma asíncrona (no bloqueante)
          verificarProgresoUsuario(usuarioDocumento).catch(err => {
            console.error('⚠️ Error al verificar logros automáticamente:', err);
          });
        } else {
          console.warn('⚠️ No se pudo obtener el documento del usuario para verificar logros');
          console.log('req.body:', req.body);
          console.log('req.params:', req.params);
        }
      } catch (error) {
        console.error('⚠️ Error en verificación automática de logros:', error);
      }
    }

    // Llamar al json original
    return originalJson(data);
  };

  next();
};

/**
 * Función para verificar el progreso del usuario
 */
async function verificarProgresoUsuario(usuarioDocumento) {
  try {
    console.log(`📊 Iniciando verificación de progreso para usuario ${usuarioDocumento}...`);
    
    // Obtener todas las insignias activas
    const insigniasQuery = `
      SELECT id, nombre, condicion_tipo, valor_requerido, xp_reward
      FROM insignias
      WHERE estado = 'activa'
      ORDER BY id
    `;
    const { rows: insignias } = await pool.query(insigniasQuery);
    console.log(`📋 Total de insignias a verificar: ${insignias.length}`);

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
          valorActual = parseInt(cursosRows[0].total) || 0;
          break;

        case 'metas_activas':
          const metasActivasQuery = `
            SELECT COUNT(*) as total 
            FROM metas_ahorro 
            WHERE usuario_documento = $1 AND estado = 'activa'
          `;
          const { rows: metasActivasRows } = await pool.query(metasActivasQuery, [usuarioDocumento]);
          valorActual = parseInt(metasActivasRows[0].total) || 0;
          break;

        case 'metas_completadas':
          const metasCompletadasQuery = `
            SELECT COUNT(*) as total 
            FROM metas_ahorro 
            WHERE usuario_documento = $1 AND estado = 'completada'
          `;
          const { rows: metasCompletadasRows } = await pool.query(metasCompletadasQuery, [usuarioDocumento]);
          valorActual = parseInt(metasCompletadasRows[0].total) || 0;
          break;

        case 'metas_largo_plazo_completadas':
          const metasLargoPlazoQuery = `
            SELECT COUNT(*) as total 
            FROM metas_ahorro 
            WHERE usuario_documento = $1 
              AND estado = 'completada'
              AND fecha_completada IS NOT NULL
              AND EXTRACT(EPOCH FROM (fecha_completada - fecha_creacion))/86400 >= 180
          `;
          const { rows: metasLargoPlazoRows } = await pool.query(metasLargoPlazoQuery, [usuarioDocumento]);
          valorActual = parseInt(metasLargoPlazoRows[0].total) || 0;
          break;

        case 'metas_activas_consecutivas':
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
          valorActual = parseInt(rachaRows[0].max_racha) || 0;
          break;

        case 'uso_semanal':
          const usoSemanalQuery = `
            WITH semanas_uso AS (
              SELECT 
                DATE_TRUNC('week', fecha) as semana,
                COUNT(DISTINCT DATE(fecha)) as dias_usados
              FROM transacciones
              WHERE usuario_documento = $1
              GROUP BY DATE_TRUNC('week', fecha)
              HAVING COUNT(DISTINCT DATE(fecha)) >= 3
            )
            SELECT COUNT(*) as semanas_activas
            FROM semanas_uso
          `;
          const { rows: usoRows } = await pool.query(usoSemanalQuery, [usuarioDocumento]);
          valorActual = parseInt(usoRows[0].semanas_activas) || 0;
          break;

        case 'resumen_mensual':
          valorActual = 0;
          break;

        case 'transacciones_registradas':
          const transaccionesQuery = `
            SELECT COUNT(*) as total 
            FROM transacciones 
            WHERE usuario_documento = $1
          `;
          const { rows: transaccionesRows } = await pool.query(transaccionesQuery, [usuarioDocumento]);
          valorActual = parseInt(transaccionesRows[0].total) || 0;
          
          if (insignia.nombre.includes('Contador')) {
            console.log(`💰 Insignia "${insignia.nombre}": ${valorActual}/${insignia.valor_requerido} transacciones`);
          }
          break;
      }

      // Actualizar progreso en la tabla insignias_progreso
      await pool.query(`
        INSERT INTO insignias_progreso (usuario_documento, insignia_id, valor_actual, fecha_registro)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (usuario_documento, insignia_id)
        DO UPDATE SET valor_actual = $3, fecha_registro = NOW()
      `, [usuarioDocumento, insignia.id, valorActual]);

      // Verificar si se desbloqueó la insignia
      if (valorActual >= insignia.valor_requerido) {
        const yaDesbloqueadaQuery = `
          SELECT completada 
          FROM usuario_insignias 
          WHERE usuario_documento = $1 AND insignia_id = $2
        `;
        const { rows: yaDesbloqueada } = await pool.query(yaDesbloqueadaQuery, [usuarioDocumento, insignia.id]);

        // Si no existe o no está completada, desbloquearla
        if (yaDesbloqueada.length === 0 || !yaDesbloqueada[0].completada) {
          console.log(`🎉 ¡NUEVA INSIGNIA DESBLOQUEADA! "${insignia.nombre}" (+${insignia.xp_reward} XP)`);
          
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
            nombre: insignia.nombre,
            xp_ganado: insignia.xp_reward
          });
        }
      }
    }

    if (insigniasDesbloqueadas.length > 0) {
      console.log(`✅ ${insigniasDesbloqueadas.length} insignia(s) desbloqueada(s) en total`);
      insigniasDesbloqueadas.forEach(i => {
        console.log(`   ✨ ${i.nombre} (+${i.xp_ganado} XP)`);
      });
    } else {
      console.log(`ℹ️ No se desbloquearon nuevas insignias`);
    }

    return { success: true, insigniasDesbloqueadas };
  } catch (error) {
    console.error('❌ Error al verificar progreso:', error);
    return { success: false, error: error.message };
  }
}