import { FileRequest } from '@app/interfaces/file-request';
import * as multer from 'multer';

const MAX_FILE_SIZE = 3145728; // 3MB
const acceptedFiles = ['image/png', 'image/jpg', 'image/jpeg'];
const fileStorage = multer.memoryStorage();
export const uploadImage = multer({
    storage: fileStorage,
    fileFilter: (req: FileRequest, file: Express.Multer.File, cb) => {
        if (acceptedFiles.includes(file.mimetype)) cb(null, true);
        else {
            req.fileValidationError = 'Invalid Extension';
            return cb(null, false);
        }
    },
    limits: { fileSize: MAX_FILE_SIZE },
});
