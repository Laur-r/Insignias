import { pool } from '../config/db.js';

class MetaAhorro {
    /**
     * Crear una nueva meta
     */
    static async crear(metaData) {
        const {
            usuario_documento,
            nombre,
            descripcion,
            monto_objetivo,
            fecha_objetivo,
            icono,
            color,
            prioridad
        } = metaData;

        const query = `
            INSERT INTO metas_ahorro (
                usuario_documento,
                nombre,
                descripcion,
                monto_objetivo,
                fecha_objetivo,
                icono,
                color,
                prioridad
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const values = [
            usuario_documento,
            nombre,
            descripcion || null,
            monto_objetivo,
            fecha_objetivo || null,
            icono || '😊',
            color || '#3b82f6',
            prioridad || 1
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Obtener todas las metas de un usuario
     */
    static async obtenerPorUsuario(usuario_documento) {
        const query = `
            SELECT
                m.*,
                ROUND((m.monto_actual / m.monto_objetivo) * 100, 2) as porcentaje_completado,
                CASE
                    WHEN m.fecha_objetivo IS NOT NULL THEN
                        m.fecha_objetivo - CURRENT_DATE
                    ELSE NULL
                END as dias_restantes
            FROM metas_ahorro m
            WHERE m.usuario_documento = $1
            ORDER BY
                CASE m.estado
                    WHEN 'activa' THEN 1
                    WHEN 'pausada' THEN 2
                    WHEN 'completada' THEN 3
                    ELSE 4
                END,
                m.prioridad DESC,
                m.created_at DESC
        `;
        const result = await pool.query(query, [usuario_documento]);
        return result.rows;
    }

    /**
     * Obtener una meta específica por ID
     */
    static async obtenerPorId(metaId, usuario_documento) {
        const query = `
            SELECT
                m.*,
                ROUND((m.monto_actual / m.monto_objetivo) * 100, 2) as porcentaje_completado,
                CASE
                    WHEN m.fecha_objetivo IS NOT NULL THEN
                        m.fecha_objetivo - CURRENT_DATE
                    ELSE NULL
                END as dias_restantes
            FROM metas_ahorro m
            WHERE m.id = $1 AND m.usuario_documento = $2
        `;
        const result = await pool.query(query, [metaId, usuario_documento]);
        return result.rows[0];
    }


    /**
     * Actualizar una meta
     */
    static async actualizar(metaId, usuario_documento, metaData) {
        const {
            nombre,
            descripcion,
            monto_objetivo,
            fecha_objetivo,
            icono,
            color,
            prioridad
        } = metaData;

        const query = `
            UPDATE metas_ahorro
            SET
                nombre = COALESCE($1, nombre),
                descripcion = COALESCE($2, descripcion),
                monto_objetivo = COALESCE($3, monto_objetivo),
                fecha_objetivo = COALESCE($4, fecha_objetivo),
                icono = COALESCE($5, icono),
                color = COALESCE($6, color),
                prioridad = COALESCE($7, prioridad),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8 AND usuario_documento = $9
            RETURNING *
        `;

        const values = [
            nombre,
            descripcion,
            monto_objetivo,
            fecha_objetivo,
            icono,
            color,
            prioridad,
            metaId,
            usuario_documento
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Cambiar estado de una meta
     */
    static async cambiarEstado(metaId, usuario_documento, nuevoEstado) {
        const query = `
            SELECT * FROM cambiar_estado_meta($1, $2, $3)
        `;
        const result = await pool.query(query, [metaId, usuario_documento, nuevoEstado]);
        return result.rows[0];
    }

    /**
     * Crear aporte a una meta (con transacción)
     */
    static async crearAporte(metaId, usuario_documento, monto, nota = null) {
        const query = `
            SELECT * FROM crear_aporte_con_transaccion($1, $2, $3, $4)
        `;
        const result = await pool.query(query, [metaId, monto, usuario_documento, nota]);
        return result.rows[0];
    }

    /**
     * Retirar dinero de una meta
     */
    static async retirar(metaId, usuario_documento, monto, nota = null) {
        const query = `
            SELECT * FROM retirar_meta_con_transaccion($1, $2, $3, $4)
        `;
        const result = await pool.query(query, [metaId, monto, usuario_documento, nota]);
        return result.rows[0];
    }

    /**
     * Eliminar meta (con devolución de dinero)
     */
    static async eliminar(metaId, usuario_documento) {
        const query = `
            SELECT * FROM eliminar_meta_con_devolucion($1, $2)
        `;
        const result = await pool.query(query, [metaId, usuario_documento]);
        return result.rows[0];
    }

    /**
     * Obtener historial de aportes/retiros de una meta
     */
    static async obtenerHistorial(metaId, usuario_documento) {
        // Primero verificar que la meta pertenece al usuario
        const metaQuery = `
            SELECT id FROM metas_ahorro
            WHERE id = $1 AND usuario_documento = $2
        `;
        const metaResult = await pool.query(metaQuery, [metaId, usuario_documento]);

        if (metaResult.rows.length === 0) {
            return null;
        }

        const query = `
            SELECT
                a.*,
                t.descripcion as transaccion_descripcion,
                t.fecha as transaccion_fecha
            FROM aportes_metas a
            INNER JOIN transacciones t ON a.transaccion_id = t.id
            WHERE a.meta_id = $1
            ORDER BY a.created_at DESC
        `;
        const result = await pool.query(query, [metaId]);
        return result.rows;
    }

    /**
     * Obtener resumen de metas del usuario
     */
    static async obtenerResumen(usuario_documento) {
        const query = `
        SELECT
            COUNT(*) as total_metas,
            COUNT(*) FILTER (WHERE estado = 'activa') as metas_activas,
            COUNT(*) FILTER (WHERE estado = 'completada') as metas_completadas,
            COALESCE(SUM(monto_objetivo), 0) as monto_total_objetivos,
            COALESCE(SUM(monto_actual), 0) as monto_total_ahorrado,  
            COALESCE(
                ROUND(
                    (SUM(monto_actual) / NULLIF(SUM(monto_objetivo), 0)) * 100,
                    2
                ),
                0
            ) as progreso_general
        FROM metas_ahorro
        WHERE usuario_documento = $1
    `;
        const result = await pool.query(query, [usuario_documento]);
        return result.rows[0];
    }
}

export default MetaAhorro;