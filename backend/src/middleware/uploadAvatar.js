// middleware/uploadAvatar.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';


const avatarsDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, avatarsDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const documento = req.usuario && req.usuario.documento ? req.usuario.documento : 'user';
        const filename = `${documento}-${Date.now()}${ext}`;
        cb(null, filename);
    }
});


function fileFilter(req, file, cb) {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo imágenes (jpg, png, webp).'));
    }
}


export const uploadAvatar = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
    fileFilter
});


export default uploadAvatar;