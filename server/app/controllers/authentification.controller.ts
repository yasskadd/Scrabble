import { SECRET_KEY } from '@app/../very-secret-file';
import { AccountStorageService } from '@app/services/database/account-storage.service';
import { IUser } from '@common/interfaces/user';
import { Request, Response, Router } from 'express';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import { Service } from 'typedi';
import * as uuid from 'uuid';

const SUCCESS = 200;
const ERROR = 401;
const TEMP_REDIRECT = 307;

@Service()
export class AuthentificationController {
    router: Router;

    constructor(private accountStorage: AccountStorageService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        /**
         * HTTP POST request to create a new account
         *
         * @param {{ username: string, password: string, email: string, profilePicture: ImageInfo }} body - The connection infos of the request
         * @return {{ imageKey: string }} send - The key of the selected profile picture
         */
        this.router.post('/signUp', async (req: Request, res: Response) => {
            const user: IUser = req.body;
            if (!(await this.accountStorage.isUsernameRegistered(user.username))) {
                // Generating an image key if the profile pic is not a default one
                let imageKey = '';
                if (user.profilePicture && !user.profilePicture.isDefaultPicture) {
                    imageKey = uuid.v4() + user.profilePicture?.name;
                    user.profilePicture.key = imageKey;
                }

                await this.accountStorage.addNewUser(user);
                // Sending back the user key to be used while uploading
                res.status(SUCCESS).send({ imageKey });
                return;
            }

            // TODO : Language
            res.status(ERROR).json({
                message: 'Username already exists',
            });
        });

        /**
         * HTTP POST request to connect an account
         *
         * @param {{ username: string, password: string }} body - The connection infos of the request
         * @return {{ username: string, password: string, email: string, profilePicture: ImageInfo }} send - The completed user informations
         */
        this.router.post('/login', async (req: Request, res: Response) => {
            const user: IUser = req.body;
            if (await this.accountStorage.isUsernameRegistered(user.username)) {
                const isLoginValid = await this.accountStorage.loginValidator(user);
                if (isLoginValid) {
                    const userData = await this.accountStorage.getUserData(user.username);
                    const token = this.createJWToken(user.username);
                    // Sending updated IUser with email and profile picture data added
                    res.status(SUCCESS).cookie('session_token', token).send({ userData });
                    return;
                }
            }

            // TODO : Language
            res.status(ERROR).json({
                message: 'invalid login credentials',
            });
        });

        this.router.post('/logout', async (req: Request, res: Response) => {
            res.clearCookie('session_token', {
                domain: 'localhost',
                path: '/',
            });
            res.redirect(TEMP_REDIRECT, '/auth/login');
        });

        /**
         * HTTP GET request to pull the captcha
         *
         * @return text/html
         */
        this.router.get('/captcha', async (req: Request, res: Response) => {
            const captcha = await fs.promises.readFile('./assets/webpages/captcha.html');
            res.setHeader('content-type', 'text/html');
            res.status(SUCCESS).send(captcha.toString());
            return;
        });
    }

    private createJWToken(username: string): string {
        const token = jwt.sign({ name: username }, SECRET_KEY, { algorithm: 'HS256', expiresIn: '1h' });
        return token;
    }
}
