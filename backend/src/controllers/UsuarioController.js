// controllers/UsuarioController.js
import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

export default class UsuarioController {
  // ======================================================
  // 1. REGISTRO DE USUARIO
  // ======================================================
  static async crearUsuario(req, res) {
    try {
      const { documento, email, password, nombre, apellido, telefono, pais } = req.body;

      if (!documento || !email || !password) {
        return res.status(400).json({ error: 'Documento, email y password son requeridos' });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const { rows } = await pool.query(
        `INSERT INTO usuarios(nombre, apellido, documento, email, telefono, pais, password_hash)
         VALUES($1, $2, $3, $4, $5, $6, $7)
         RETURNING documento, email, nombre, apellido, created_at`,
        [nombre, apellido, documento, email, telefono, pais || 'Colombia', password_hash]
      );

      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Error al crear usuario:', error);

      if (error.code === '23505') {
        const detail = error.detail.includes('email')
          ? 'Email ya existe'
          : 'Documento ya existe';
        return res.status(409).json({ error: detail });
      }

      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // ======================================================
  // 2. LOGIN DE USUARIO
  // ======================================================
  static async loginUsuario(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
      }

      const { rows } = await pool.query(
        'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
        [email]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
      }

      const usuario = rows[0];
      let passwordValida = false;

      if (usuario.password_hash.startsWith('$2b$')) {
        passwordValida = await bcrypt.compare(password, usuario.password_hash);
      } else {
        passwordValida = password === usuario.password_hash;
      }

      if (!passwordValida) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      const token = jwt.sign(
        { documento: usuario.documento, email: usuario.email },
        process.env.JWT_SECRET || 'fintrax_secreto_dev',
        { expiresIn: '2h' }
      );

      res.json({
        mensaje: 'Login exitoso',
        usuario: {
          documento: usuario.documento,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          telefono: usuario.telefono,
          pais: usuario.pais
        },
        token
      });
    } catch (error) {
      console.error('Error en loginUsuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // ======================================================
  // 3. SOLICITAR RECUPERACIÓN DE CONTRASEÑA
  // ======================================================
  static async solicitarRecuperacion(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email es requerido' });

      const { rows } = await pool.query(
        'SELECT email, nombre FROM usuarios WHERE email = $1 AND activo = true',
        [email]
      );

      const mensajeGenerico =
        'Si el email existe en nuestro sistema, recibirás un correo con instrucciones para recuperar tu contraseña.';

      if (rows.length === 0) {
        return res.json({ mensaje: mensajeGenerico });
      }

      const usuario = rows[0];
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const expiraEn = new Date(Date.now() + 3600000);

      await pool.query(
        `INSERT INTO password_reset_tokens (usuario_email, token, expira_en) 
         VALUES ($1, $2, $3)`,
        [email, token, expiraEn]
      );

      const { enviarEmailRecuperacion } = await import('../config/email.js');
      await enviarEmailRecuperacion(email, usuario.nombre, token);

      res.json({ mensaje: mensajeGenerico });
    } catch (error) {
      console.error('Error en solicitarRecuperacion:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // ======================================================
  // 4. VALIDAR TOKEN
  // ======================================================
  static async validarToken(req, res) {
    try {
      const { token } = req.params;

      const { rows } = await pool.query(
        `SELECT usuario_email FROM password_reset_tokens 
         WHERE token = $1 
         AND usado = FALSE 
         AND expira_en > NOW()`,
        [token]
      );

      if (rows.length === 0) {
        return res.status(400).json({
          valid: false,
          error: 'El enlace es inválido o ha expirado'
        });
      }

      res.json({ valid: true, email: rows[0].usuario_email });
    } catch (error) {
      console.error('Error en validarToken:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // ======================================================
  // 5. RESTABLECER CONTRASEÑA
  // ======================================================
  static async restablecerPassword(req, res) {
    try {
      const { token, nuevaPassword } = req.body;

      if (!token || !nuevaPassword) {
        return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
      }

      if (nuevaPassword.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      const tokenResult = await pool.query(
        `SELECT usuario_email FROM password_reset_tokens 
         WHERE token = $1 
         AND usado = FALSE 
         AND expira_en > NOW()`,
        [token]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(400).json({ error: 'El enlace es inválido o ha expirado' });
      }

      const email = tokenResult.rows[0].usuario_email;

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(nuevaPassword, salt);

      await pool.query(
        'UPDATE usuarios SET password_hash = $1 WHERE email = $2',
        [password_hash, email]
      );

      await pool.query('UPDATE password_reset_tokens SET usado = TRUE WHERE token = $1', [token]);

      res.json({ mensaje: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      console.error('Error en restablecerPassword:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // ======================================================
  // 6. OBTENER DATOS DEL PERFIL (AJUSTES DE CUENTA) - ahora incluye foto_perfil
  // ======================================================
  static async obtenerUsuario(req, res) {
    try {
      const { documento } = req.usuario;


      const { rows } = await pool.query(
        'SELECT documento, nombre, apellido, email, telefono, pais, foto_perfil FROM usuarios WHERE documento = $1 AND activo = true',
        [documento]
      );


      if (rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }


      res.json(rows[0]);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }


  // =========================
  // ACTUALIZAR PERFIL USUARIO
  // =========================
  static async actualizarPerfil(req, res) {
    const { nombre, email, pais } = req.body;

    try {
      // Validar campos básicos
      if (!nombre || !email) {
        return res.status(400).json({ error: "El nombre y el correo son obligatorios." });
      }

      // Obtener documento del usuario autenticado (desde el middleware de auth)
      const documento = req.usuario?.documento;
      if (!documento) {
        return res.status(401).json({ error: "No autorizado." });
      }

      // Actualizar datos en la base de datos
      const { rows } = await pool.query(
        `UPDATE usuarios
       SET nombre = $1, email = $2, pais = $3
       WHERE documento = $4
       RETURNING documento, nombre, email, pais, foto_perfil`,
        [nombre, email, pais || null, documento]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado." });
      }

      // Respuesta consistente con actualizarAvatar
      return res.json({
        mensaje: "Perfil actualizado correctamente",
        usuario: rows[0],
      });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      res.status(500).json({ error: "Error interno al actualizar el perfil." });
    }
  }


  // ======================================================
  // 8. CAMBIAR CONTRASEÑA (AJUSTES)
  // ======================================================
  static async cambiarPassword(req, res) {
    try {
      const { documento } = req.usuario;
      const { passwordActual, passwordNueva, passwordConfirmar } = req.body;

      if (!passwordActual || !passwordNueva || !passwordConfirmar) {
        return res.status(400).json({ error: 'Todos los campos de contraseña son requeridos' });
      }

      if (passwordNueva !== passwordConfirmar) {
        return res.status(400).json({ error: 'Las contraseñas nuevas no coinciden' });
      }

      if (passwordNueva.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      const { rows } = await pool.query(
        'SELECT password_hash FROM usuarios WHERE documento = $1 AND activo = true',
        [documento]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const usuario = rows[0];
      let passwordValida = false;

      if (usuario.password_hash.startsWith('$2b$')) {
        passwordValida = await bcrypt.compare(passwordActual, usuario.password_hash);
      } else {
        passwordValida = passwordActual === usuario.password_hash;
      }

      if (!passwordValida) {
        return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
      }

      const salt = await bcrypt.genSalt(10);
      const nuevoPasswordHash = await bcrypt.hash(passwordNueva, salt);

      await pool.query(
        'UPDATE usuarios SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE documento = $2',
        [nuevoPasswordHash, documento]
      );

      res.json({ mensaje: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // ======================================================
  // NUEVO: 9. ACTUALIZAR AVATAR (subida de archivo)
  // ======================================================
  static async actualizarAvatar(req, res) {
    try {
      const { documento } = req.usuario;


      if (!req.file) {
        return res.status(400).json({ error: 'Archivo de avatar no proporcionado' });
      }


      // Construir ruta pública (sirvo uploads estático en /uploads)
      const publicPath = `/uploads/avatars/${req.file.filename}`;


      // Obtener foto actual para eliminar fichero viejo si aplica
      const { rows: current } = await pool.query(
        'SELECT foto_perfil FROM usuarios WHERE documento = $1',
        [documento]
      );


      if (current.length > 0 && current[0].foto_perfil) {
        try {
          const existingPath = current[0].foto_perfil;
          // Si la ruta es relativa como '/uploads/avatars/archivo.jpg'
          if (existingPath.startsWith('/uploads/avatars/')) {
            const absolute = path.join(process.cwd(), existingPath.replace(/^\//, ''));
            if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
          }
        } catch (err) {
          console.warn('No se pudo eliminar avatar anterior:', err);
        }
      }


      const { rows } = await pool.query(
        'UPDATE usuarios SET foto_perfil = $1, updated_at = CURRENT_TIMESTAMP WHERE documento = $2 RETURNING documento, nombre, apellido, email, telefono, pais, foto_perfil',
        [publicPath, documento]
      );


      res.json({ mensaje: 'Avatar actualizado', usuario: rows[0] });
    } catch (error) {
      console.error('Error en actualizarAvatar:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
