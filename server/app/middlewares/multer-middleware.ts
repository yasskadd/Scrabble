import { Request } from 'express';
import * as multer from 'multer';

const MAX_FILE_SIZE = 3145728; // 3MB
const acceptedFiles = ['image/png', 'image/jpg', 'image/jpeg'];
const fileStorage = multer.memoryStorage();
export const uploadImage = multer({
    storage: fileStorage,
    fileFilter: (req: Request, file: Express.Multer.File, cb) => {
        if (acceptedFiles.includes(file.mimetype)) cb(null, true);
        else {
            cb(null, true);
            return cb(new Error('Invalid file format!'));
        }
    },
    limits: { fileSize: MAX_FILE_SIZE },
});
