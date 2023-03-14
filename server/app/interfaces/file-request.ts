import { Request } from 'express';

export interface FileRequest extends Request {
    fileValidationError?: string;
}
