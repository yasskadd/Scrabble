import { SECRET_KEY } from '@app/../very-secret-file';
import { verifyToken } from '@app/middlewares/token-verification-middleware';
import { AccountStorageService } from '@app/services/database/account-storage.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { IUser } from '@common/interfaces/user';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as jwt from 'jsonwebtoken';
import { Service } from 'typedi';

@Service()
export class UserProfileController {
    router: Router;

    constructor(private accountStorageService: AccountStorageService, private socketManager: SocketManager) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        /**
         * HTTP PATCH request to update the username
         *
         * @param {{ newUsername: string }} body - new Username
         * @return { message: string } send - error message if unable to modify the username
         * @return { token: string } send - new token with the new username payload to override the old one
         * @return { number } HTTP Status - The return status of the request
         */
        this.router.patch('/username', verifyToken, async (req: Request, res: Response) => {
            const oldUsername = res.locals.user.name;
            const newUsername: string = req.body.newUsername;
            if (await this.accountStorageService.isUsernameRegistered(newUsername)) {
                res.status(StatusCodes.CONFLICT).json({ message: 'The requested username is already taken. Please choose a different username.' });
                return;
            }
            await this.accountStorageService.updateUsername(oldUsername, newUsername);
            const newToken: string = this.createJWToken(newUsername);
            res.status(StatusCodes.OK).cookie('session_token', newToken).send(); // send new token, need to override the one existing in the client
            this.socketManager.modifyUsername(oldUsername, newUsername);
        });

        /**
         * HTTP PATCH request to change the password
         *
         * @param {{ newPassword: string }} body - new password
         * @return { message: string } send - error message if its the same password
         * @return { number } HTTP Status - The return status of the request
         */
        this.router.patch('/password', verifyToken, async (req: Request, res: Response) => {
            const username: string = res.locals.user.name;
            const password: string = req.body.newPassword as string;
            if (await this.accountStorageService.isSamePassword(username, password)) {
                res.status(StatusCodes.CONFLICT).json({
                    message: 'The requested password is the same as the old one. Please choose a different password',
                });
                return;
            }
            await this.accountStorageService.updatePassword(username, password);
            res.sendStatus(StatusCodes.OK);
        });

        /**
         * HTTP GET request to get the user information
         *
         * @return { userInfos: IUser } send - all user informations stored in the database
         * @return { number } HTTP Status - The return status of the request
         */
        this.router.get('/userData', verifyToken, async (req: Request, res: Response) => {
            const username: string = res.locals.user.name;
            const userInfos: IUser = await this.accountStorageService.getUserData(username);
            res.status(StatusCodes.OK).json(userInfos);
        });
    }

    private createJWToken(username: string): string {
        const token = jwt.sign({ name: username }, SECRET_KEY, { algorithm: 'HS256', expiresIn: '1h' });
        return token;
    }
}
