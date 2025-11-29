import db from './config/db.js';

(async () => {
  try {
    const pool = await db.initialize();
    console.log('Conexión a PostgreSQL verificada');
    
    // Prueba adicional: consulta simple
    const { rows } = await pool.query('SELECT NOW() as current_time');
    console.log('Hora actual en la BD:', rows[0].current_time);
    
    process.exit(0);
  } catch (err) {
    console.error('Error al conectar:', err);
    process.exit(1);
  }
})();
