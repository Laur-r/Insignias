import { Router } from 'express';
import UsuarioController from '../controllers/UsuarioController.js';
import { verificarToken } from '../middleware/Autenticacion.js';
import uploadAvatar from '../middleware/uploadAvatar.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';


const router = Router();


// Rutas públicas
router.post('/registro', UsuarioController.crearUsuario);
router.post('/login', UsuarioController.loginUsuario);


// Recuperación de contraseña
router.post('/forgot-password', UsuarioController.solicitarRecuperacion);
router.get('/validate-token/:token', UsuarioController.validarToken);
router.post('/reset-password', UsuarioController.restablecerPassword);


// Rutas protegidas
router.get('/perfil', verificarToken, UsuarioController.obtenerUsuario);
router.put('/perfil', verificarToken, UsuarioController.actualizarPerfil);
router.put('/cambiar-password', verificarToken, UsuarioController.cambiarPassword);


// Nueva ruta para avatar (multipart/form-data)
router.put('/perfil/avatar', verificarToken, uploadAvatar.single('avatar'), UsuarioController.actualizarAvatar);

// ======================================================
// RUTAS PARA GOOGLE OAUTH
// ======================================================
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })
);

// Ruta 2: Callback de Google (después de autenticar)
router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
    }),
    (req, res) => {
        try {
            const token = jwt.sign(
                {
                    documento: req.user.documento,
                    email: req.user.email,
                    nombre: req.user.nombre
                },
                process.env.JWT_SECRET || 'fintrax_secreto_dev',
                { expiresIn: '7d' }
            );

            // Redirigir al frontend con el token
            res.redirect(`${process.env.FRONTEND_URL}/auth/google/callback?token=${token}`);
        } catch (error) {
            console.error('Error generando token:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=token_generation_failed`);
        }
    }
);


export default router;