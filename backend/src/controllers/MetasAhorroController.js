import MetaAhorro from '../models/MetaAhorro.js';

export default class MetasAhorroController {
    /**
     * Listar metas por usuario
     */
    static async listarMetas(req, res) {
        try {
            const { usuarioDocumento } = req.params;
            const { estado } = req.query;

            let metas;
            if (estado) {
                metas = await MetaAhorro.obtenerPorUsuario(usuarioDocumento);
                metas = metas.filter(meta => meta.estado === estado);
            } else {
                metas = await MetaAhorro.obtenerPorUsuario(usuarioDocumento);
            }

            res.status(200).json({
                success: true,
                data: metas
            });
        } catch (error) {
            console.error('❌ Error al listar metas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las metas',
                error: error.message
            });
        }
    }

    /**
     * Obtener una meta específica
     */
    static async obtenerMeta(req, res) {
        try {
            const { id } = req.params;
            const { usuario_documento } = req.query;

            if (!usuario_documento) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere el documento del usuario'
                });
            }

            const meta = await MetaAhorro.obtenerPorId(id, usuario_documento);

            if (!meta) {
                return res.status(404).json({
                    success: false,
                    message: 'Meta no encontrada'
                });
            }

            res.status(200).json({
                success: true,
                data: meta
            });
        } catch (error) {
            console.error('❌ Error al obtener meta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener la meta',
                error: error.message
            });
        }
    }

    /**
     * Crear nueva meta
     */
    static async crearMeta(req, res) {
        try {
            const metaData = req.body;

            if (!metaData.usuario_documento) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere el documento del usuario (usuario_documento)'
                });
            }

            if (!metaData.nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere el nombre de la meta'
                });
            }

            if (!metaData.monto_objetivo || isNaN(metaData.monto_objetivo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere un monto objetivo válido'
                });
            }

            const nuevaMeta = await MetaAhorro.crear(metaData);

            res.status(201).json({
                success: true,
                message: 'Meta creada exitosamente',
                data: nuevaMeta
            });
        } catch (error) {
            console.error('❌ Error al crear meta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear la meta',
                error: error.message
            });
        }
    }

    /**
     * Actualizar meta
     */
    static async actualizarMeta(req, res) {
        try {
            const { id } = req.params;
            const { usuario_documento, ...metaData } = req.body;

            if (!usuario_documento) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere el documento del usuario'
                });
            }

            const metaActualizada = await MetaAhorro.actualizar(id, usuario_documento, metaData);

            if (!metaActualizada) {
                return res.status(404).json({
                    success: false,
                    message: 'Meta no encontrada'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Meta actualizada exitosamente',
                data: metaActualizada
            });
        } catch (error) {
            console.error('❌ Error al actualizar meta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar la meta',
                error: error.message
            });
        }
    }

    /**
     * Eliminar meta
     */
    static async eliminarMeta(req, res) {
        try {
            const { id } = req.params;
            const { usuario_documento } = req.query;

            if (!usuario_documento) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere el documento del usuario'
                });
            }

            const resultado = await MetaAhorro.eliminar(id, usuario_documento);

            res.status(200).json({
                success: true,
                message: 'Meta eliminada exitosamente',
                data: {
                    meta_eliminada: resultado.meta_eliminada,
                    monto_devuelto: resultado.monto_devuelto,
                    transacciones_eliminadas: resultado.transacciones_eliminadas,
                    devolucion_realizada: resultado.monto_devuelto > 0
                }
            });
        } catch (error) {
            console.error('❌ Error al eliminar meta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar la meta',
                error: error.message
            });
        }
    }

    /**
     * Aportar a meta
     */
    static async aportarMeta(req, res) {
        try {
            const { id } = req.params;
            const { monto, nota, usuario_documento } = req.body;

            if (!usuario_documento) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere el documento del usuario'
                });
            }

            if (!monto || monto <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El monto debe ser mayor a 0'
                });
            }

            const resultado = await MetaAhorro.crearAporte(id, usuario_documento, monto, nota);

            res.status(200).json({
                success: true,
                message: 'Aporte realizado exitosamente',
                data: resultado
            });
        } catch (error) {
            console.error('❌ Error al realizar aporte:', error);
            res.status(500).json({
                success: false,
                message: 'Error al realizar el aporte',
                error: error.message
            });
        }
    }

    /**
     * Retirar de meta
     */
    static async retirarMeta(req, res) {
        try {
            const { id } = req.params;
            const { monto, nota, usuario_documento } = req.body;

            if (!usuario_documento) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere el documento del usuario'
                });
            }

            if (!monto || monto <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El monto debe ser mayor a 0'
                });
            }

            const resultado = await MetaAhorro.retirar(id, usuario_documento, monto, nota);

            res.status(200).json({
                success: true,
                message: 'Retiro realizado exitosamente',
                data: resultado
            });
        } catch (error) {
            console.error('❌ Error al realizar retiro:', error);
            res.status(500).json({
                success: false,
                message: 'Error al realizar el retiro',
                error: error.message
            });
        }
    }

    /**
     * Cambiar estado de meta
     */
    static async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado, usuario_documento } = req.body;

            if (!usuario_documento) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere el documento del usuario'
                });
            }

            const resultado = await MetaAhorro.cambiarEstado(id, usuario_documento, estado);

            res.status(200).json({
                success: true,
                message: 'Estado cambiado exitosamente',
                data: resultado
            });
        } catch (error) {
            console.error('❌ Error al cambiar estado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar el estado',
                error: error.message
            });
        }
    }

    /**
     * Obtener historial de meta
     */
    static async obtenerHistorial(req, res) {
        try {
            const { id } = req.params;
            const { usuario_documento } = req.query;

            if (!usuario_documento) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere el documento del usuario'
                });
            }

            const historial = await MetaAhorro.obtenerHistorial(id, usuario_documento);

            if (historial === null) {
                return res.status(404).json({
                    success: false,
                    message: 'Meta no encontrada'
                });
            }

            res.status(200).json({
                success: true,
                data: historial
            });
        } catch (error) {
            console.error('❌ Error al obtener historial:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el historial',
                error: error.message
            });
        }
    }

    /**
     * Obtener resumen de metas
     */
    static async obtenerResumen(req, res) {
        try {
            const { usuarioDocumento } = req.params;

            const resumen = await MetaAhorro.obtenerResumen(usuarioDocumento);

            res.status(200).json({
                success: true,
                data: resumen
            });
        } catch (error) {
            console.error('❌ Error al obtener resumen:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el resumen',
                error: error.message
            });
        }
    }
}