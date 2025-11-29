import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.headers.authorization?.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fintrax_secreto_dev');

    // Agregar datos del usuario al request
    req.usuario = decoded;

    next();
  } catch (error) {
    console.error('Error al verificar token:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }

    return res.status(401).json({ error: 'Token inválido' });
  }
};