import nodemailer from 'nodemailer';
import dotenv from 'dotenv';


dotenv.config();


const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});


// Verificar configuración
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error en configuración de email:', error);
  } else {
    console.log('✅ Servidor de email listo');
  }
});


export const enviarEmailRecuperacion = async (email, nombre, token) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;


  const mailOptions = {
    from: `"FintraX" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Recuperación de contraseña - FintraX',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
         
          body {
            font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-weight: 400;
            line-height: 1.6;
            color: #111;
            background-color: #f5f5f5;
          }
         
          h1, h2 {
            font-family: "Poppins", sans-serif;
            font-weight: 600;
            margin-bottom: 0.5em;
            color: #111;
          }
         
          .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
          }
         
          .header {
            background-color: #2563eb;
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
         
          .header h1 {
            color: white;
            font-size: 28px;
            margin: 0;
          }
         
          .content {
            background-color: #ffffff;
            padding: 40px 30px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
         
          .content h2 {
            color: #111 !important;
            font-size: 24px !important;
            margin-bottom: 20px !important;
          }
         
          .content p {
            margin-bottom: 15px !important;
            color: #333 !important;
          }
         
          /* Estilos específicos para combatir Gmail */
          .button-container {
            text-align: center;
            margin: 25px 0 !important;
            color: #111 !important;
          }
         
          .link-box {
            background-color: #f9fafb !important;
            padding: 15px !important;
            border-radius: 6px !important;
            border-left: 3px solid #2563eb !important;
            margin: 20px 0 !important;
          }
         
          .warning {
            background-color: #fef3c7;
            border-left: 3px solid #f59e0b;
            padding: 12px 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
         
          .warning strong {
            color: #92400e;
          }
         
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            color: #6b7280;
            font-size: 13px;
            border-top: 1px solid #e5e7eb;
          }


          .text-center {
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FintraX</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre || 'Usuario'},</h2>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
           
            <!-- Botón con estilos en línea para máxima compatibilidad -->
            <div class="button-container">
              <a href="${resetLink}"
                 style="display: inline-block; padding: 14px 32px; background-color: #2563eb !important; color: #ffffff !important; text-decoration: none !important; border-radius: 6px !important; font-weight: 500 !important; font-family: 'Inter', sans-serif !important; font-size: 16px !important; border: none !important; cursor: pointer !important; text-align: center !important; line-height: 1.5 !important;">
                Restablecer Contraseña
              </a>
            </div>


            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
           
            <div class="link-box">
              <p style="word-break: break-all; font-size: 14px; font-weight: 500; color: #2563eb !important; text-decoration: none !important; margin: 0;">
                ${resetLink}
              </p>
            </div>


            <div class="warning">
              <p><strong>Este enlace expirará en 1 hora.</strong></p>
              <p>Por seguridad, no compartas este enlace con nadie.</p>
            </div>


            <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
           
            <div class="footer">
              <p>© 2025 FintraX. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };


  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar email:', error);
    return { success: false, error };
  }
};


export const enviarPDFReporte = async (email, pdfBase64, nombreArchivo) => {
  const mailOptions = {
    from: `"FintraX" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Reporte FintraX - PDF Adjunto',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
         
          body {
            font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-weight: 400;
            line-height: 1.6;
            color: #111;
            background-color: #f5f5f5;
          }
         
          h1, h2 {
            font-family: "Poppins", sans-serif;
            font-weight: 600;
            margin-bottom: 0.5em;
            color: #111;
          }
         
          .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
          }
         
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
         
          .header h1 {
            color: white;
            font-size: 28px;
            margin: 0;
          }
         
          .content {
            background-color: #ffffff;
            padding: 40px 30px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
         
          .content h2 {
            color: #111 !important;
            font-size: 24px !important;
            margin-bottom: 20px !important;
          }
         
          .content p {
            margin-bottom: 15px !important;
            color: #333 !important;
          }
         
          .info-box {
            background-color: #f9fafb !important;
            padding: 15px !important;
            border-radius: 6px !important;
            border-left: 3px solid #2563eb !important;
            margin: 20px 0 !important;
          }
         
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            color: #6b7280;
            font-size: 13px;
            border-top: 1px solid #e5e7eb;
          }


          .text-center {
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FintraX</h1>
          </div>
          <div class="content">
            <h2>Tu Reporte está listo</h2>
            <p>Adjunto encontrarás tu reporte financiero en formato PDF.</p>
           
            <div class="info-box">
              <p><strong>Archivo:</strong> ${nombreArchivo}</p>
              <p><strong>Generado:</strong> ${new Date().toLocaleString('es-CO', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}</p>
            </div>


            <p>Si tienes alguna pregunta sobre tu reporte, no dudes en contactarnos.</p>
           
            <div class="footer">
              <p>© 2025 FintraX. Todos los derechos reservados.</p>
              <p>Este es un correo automático, por favor no responder directamente.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: nombreArchivo,
        content: Buffer.from(pdfBase64, 'base64'),
        contentType: 'application/pdf',
      },
    ],
  };


  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar PDF por email:', error);
    return { success: false, error };
  }
};
export default transporter;



