import { Pool } from 'pg';
import dotenv from 'dotenv';




dotenv.config({path: '../.env'});


console.log({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});


const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});


// Test de conexión
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log(' Base de datos conectada');
  } catch (err) {
    console.error(' Error de conexión a la base de datos:', err);
    process.exit(1);
  }
})();


export { pool };



