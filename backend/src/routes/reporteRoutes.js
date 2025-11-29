import express from 'express';
import { enviarPDFCorreo } from '../controllers/reporteController.js';


const router = express.Router();


router.post('/enviar-pdf', enviarPDFCorreo);


export default router;

