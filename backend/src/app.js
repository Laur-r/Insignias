import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import './config/passport.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import transaccionRoutes from './routes/TransaccionRoutes.js';
import categoriaRoutes from './routes/CategoriaRoutes.js';
import metasAhorroRoutes from './routes/metasAhorroRoutes.js';
import reporteRoutes from './routes/reporteRoutes.js';
import logrosRoutes from './routes/LogrosRoutes.js';
import LogrosController from './controllers/LogrosController.js';


import path from 'path';


dotenv.config({path: '../.env'});
const app = express();

app.use(cors());

// ⭐ AUMENTAR EL LÍMITE DE TAMAÑO
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(passport.initialize());

// Rutas
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/transacciones', transaccionRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/metas', metasAhorroRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/logros', logrosRoutes);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/', (req, res) => {
  res.send('Backend de FintraX funcionando');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

