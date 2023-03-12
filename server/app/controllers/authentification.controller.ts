import { SECRET_KEY } from '@app/../very-secret-file';
import { AccountStorageService } from '@app/services/database/account-storage.service';
import { IUser } from '@common/interfaces/user';
import { Request, Response, Router } from 'express';
import * as jwt from 'jsonwebtoken';
import { Service } from 'typedi';

const SUCCESS = 200;
const ERROR = 401;

@Service()
export class AuthentificationController {
    router: Router;

    constructor(private readonly accountStorage: AccountStorageService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.post('/signUp', async (req: Request, res: Response) => {
            if (!(await this.accountStorage.isUserRegistered(req.body.username))) {
                await this.accountStorage.addNewUser(req.body);
                res.sendStatus(SUCCESS);
                return;
            }
            res.status(ERROR).json({
                message: 'Username already exists',
            });
        });

        this.router.delete('/login', async (req: Request, res: Response) => {
            const user: IUser = req.body;
            if (await this.accountStorage.isUserRegistered(req.body.username)) {
                const isLoginValid = await this.accountStorage.loginValidator(user);
                if (isLoginValid) {
                    const token = this.createJWToken(user.username);
                    res.status(SUCCESS)
                        .cookie('session_token', token, {
                            httpOnly: true,
                        })
                        .send('Cookie sent');
                    return;
                }
            }
            res.status(ERROR).json({
                message: 'invalid login credentials',
            });
        });

        this.router.post('/logout', async (req: Request, res: Response) => {
            res.clearCookie('session_token');
            res.redirect('/login');
        });
    }

    private createJWToken(username: string): string {
        const token = jwt.sign({ name: username }, SECRET_KEY, { algorithm: 'HS256', expiresIn: '1h' });
        return token;
    }
}
