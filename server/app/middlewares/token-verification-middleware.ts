import { SECRET_KEY } from '@app/../very-secret-file';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

const UNAUTHORIZED = 401;
const FORBIDDEN = 403;

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.session_token;
    if (!token) {
        res.status(UNAUTHORIZED).send('Token not found');
        return;
    }
    jwt.verify(token, SECRET_KEY, (err: jwt.VerifyErrors, decoded: any) => {
        if (err) return res.sendStatus(FORBIDDEN);
        res.locals.user = decoded;
        next();
        return;
    });
};
