import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { pool } from './db.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const { id, emails, name, photos } = profile;
            const email = emails[0].value;
            const googleId = id;
            const nombre = name.givenName;
            const apellido = name.familyName || '';
            const fotoPerfil = photos[0]?.value || null;

            // ✅ Buscar si el usuario ya existe por email
            const userByEmail = await pool.query(
                'SELECT * FROM usuarios WHERE email = $1',
                [email]
            );

            let user;

            if (userByEmail.rows.length > 0) {
                // ✅ Usuario YA EXISTE - SOLO vincular Google ID
                user = userByEmail.rows[0];

                // Vincular Google ID si no lo tiene
                if (!user.google_id) {
                    await pool.query(
                        'UPDATE usuarios SET google_id = $1, foto_perfil = $2, updated_at = CURRENT_TIMESTAMP WHERE documento = $3',
                        [googleId, fotoPerfil, user.documento]
                    );
                    user.google_id = googleId;
                    user.foto_perfil = fotoPerfil;
                }

            } else {
                // ✅ Usuario NO EXISTE - crear nuevo con documento Google

                const nuevoUsuario = await pool.query(
                    `INSERT INTO usuarios (
            documento, 
            email, 
            password_hash, 
            nombre, 
            apellido, 
            google_id, 
            foto_perfil,
            pais,
            activo
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
          RETURNING *`,
                    [
                        `GOOGLE_${googleId}`, // Documento único basado en Google ID
                        email,
                        null, // Sin password para usuarios de Google
                        nombre,
                        apellido,
                        googleId,
                        fotoPerfil,
                        'Colombia', // Default
                        true
                    ]
                );
                user = nuevoUsuario.rows[0];
            }

            return done(null, user);
        } catch (error) {
            console.error('Error en Google OAuth:', error);
            return done(error, null);
        }
    }
));

// Serialización para sesiones (opcional)
passport.serializeUser((user, done) => {
    done(null, user.documento);
});

passport.deserializeUser(async (documento, done) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE documento = $1', [documento]);
        done(null, result.rows[0]);
    } catch (error) {
        done(error, null);
    }
});

export default passport;