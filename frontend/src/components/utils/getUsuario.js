/**
 * Obtiene el documento del usuario desde localStorage
 * @returns {string|null} El documento del usuario o null si no existe
 */
export const getUsuarioDocumento = () => {
    try {
        const usuario = localStorage.getItem('usuario');

        if (!usuario) {
            return null;
        }

        const usuarioObj = JSON.parse(usuario);

        // Verificar que el objeto tenga la propiedad documento
        if (!usuarioObj.documento) {

            // Intentar recuperar del token JWT
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const tokenData = JSON.parse(atob(token.split('.')[1]));
                    return tokenData.documento || null;
                } catch (e) {
                    console.error('❌ Error al decodificar token:', e);
                }
            }

            return null;
        }
        return usuarioObj.documento;

    } catch (error) {
        return null;
    }
};

/**
 * Obtiene el objeto completo del usuario desde localStorage
 * @returns {Object|null} El objeto usuario o null si no existe
 */
export const getUsuario = () => {
    try {
        const usuario = localStorage.getItem('usuario');

        if (!usuario) {
            return null;
        }

        return JSON.parse(usuario);

    } catch (error) {
        return null;
    }
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} true si hay un token válido
 */
export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const usuario = getUsuario();

    return !!(token && usuario && usuario.documento);
};