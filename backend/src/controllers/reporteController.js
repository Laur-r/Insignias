import { enviarPDFReporte } from '../config/email.js';
import jwt from 'jsonwebtoken';


export const enviarPDFCorreo = async (req, res) => {
  try {
    const { pdfBase64, nombreArchivo } = req.body;


    // Validar datos
    if (!pdfBase64 || !nombreArchivo) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos: pdfBase64, nombreArchivo',
      });
    }


    // Obtener el token del header
    const token = req.headers.authorization?.split(' ')[1];
   
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado. Token no encontrado',
      });
    }


    // Decodificar el token para obtener el email del usuario
    let emailUsuario;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      emailUsuario = decoded.email; // O decoded.correo según tu estructura
     
      if (!emailUsuario) {
        return res.status(400).json({
          success: false,
          error: 'El token no contiene información del correo',
        });
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado',
      });
    }


    // Enviar email con PDF
    const resultado = await enviarPDFReporte(emailUsuario, pdfBase64, nombreArchivo);


    if (resultado.success) {
      return res.status(200).json({
        success: true,
        mensaje: `PDF enviado exitosamente a ${emailUsuario}`,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Error al enviar el PDF',
        detalles: resultado.error.message,
      });
    }
  } catch (error) {
    console.error('Error en controlador de reporte:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      detalles: error.message,
    });
  }
};

