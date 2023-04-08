import { verifyToken } from '@app/middlewares/token-verification-middleware';
import { AccountStorageService } from '@app/services/database/account-storage.service';
import { HistoryStorageService } from '@app/services/database/history-storage.service';
import { UserStatsStorageService } from '@app/services/database/user-stats-storage.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { HistoryEvent } from '@common/interfaces/history-event';
import { Theme } from '@common/interfaces/theme';
import { IUser } from '@common/interfaces/user';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class UserProfileController {
    router: Router;

    constructor(
        private accountStorageService: AccountStorageService,
        private userStatsStorageService: UserStatsStorageService,
        private historyStorage: HistoryStorageService,
        private socketManager: SocketManager,
    ) {
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
            const userID = res.locals.user.userID;
            const newUsername: string = req.body.newUsername;
            if (await this.accountStorageService.isUsernameRegistered(newUsername)) {
                res.status(StatusCodes.CONFLICT).json({ message: 'The requested username is already taken. Please choose a different username.' });
                return;
            }
            await this.accountStorageService.updateUsername(userID, newUsername);
            res.sendStatus(StatusCodes.OK);
            this.socketManager.modifyUsername(userID, newUsername);
        });

        /**
         * HTTP PATCH request to change the password
         *
         * @param {{ newPassword: string }} body - new password
         * @return { message: string } send - error message if its the same password
         * @return { number } HTTP Status - The return status of the request
         */
        this.router.patch('/password', verifyToken, async (req: Request, res: Response) => {
            const userID: string = res.locals.user.userID;
            const password: string = req.body.newPassword as string;
            if (await this.accountStorageService.isSamePassword(userID, password)) {
                res.status(StatusCodes.CONFLICT).json({
                    message: 'The requested password is the same as the old one. Please choose a different password',
                });
                return;
            }
            await this.accountStorageService.updatePassword(userID, password);
            res.sendStatus(StatusCodes.OK);
        });

        /**
         * HTTP GET request to get the user information
         *
         * @return { userInfos: IUser } send - all user informations stored in the database
         * @return { number } HTTP Status - The return status of the request
         */
        this.router.get('/userData', verifyToken, async (req: Request, res: Response) => {
            const userID: string = res.locals.user.userID;
            const userInfos: IUser = await this.accountStorageService.getUserDataFromID(userID);
            res.status(StatusCodes.OK).json(userInfos);
        });

        /**
         * HTTP GET request to retrieve account history information
         *
         * @return { message: string } send - error message if invalid token
         * @return { historyEventList: HistoryEvent[] } send - new token with the new username payload to override the old one
         * @return { number } HTTP Status - The return status of the request
         */
        this.router.get('/history-events', verifyToken, async (req: Request, res: Response) => {
            const userID: string = res.locals.user.userID;
            const historyEventList: HistoryEvent[] = await this.accountStorageService.getUserEventHistory(userID);
            res.status(StatusCodes.OK).send({ historyEventList });
        });

        /**
         * HTTP PATCH request to change user language
         *
         * @param {{ language: 'en' | 'fr' }} body - new language
         * @return { number } HTTP Status - The return status of the request
         */
        this.router.patch('/language', verifyToken, async (req: Request, res: Response) => {
            const userID: string = res.locals.user.userID;
            const newLanguage: 'en' | 'fr' = req.body.language;
            await this.accountStorageService.updateLanguage(userID, newLanguage);
            res.sendStatus(StatusCodes.OK);
        });

        /**
         * HTTP PATCH request to change user theme
         *
         * @param {{ theme: Theme }} body - new theme
         * @return { number } HTTP Status - The return status of the request
         */
        this.router.patch('/theme', verifyToken, async (req: Request, res: Response) => {
            const userID: string = res.locals.user.userID;
            const newTheme: Theme = req.body.theme;
            await this.accountStorageService.updateTheme(userID, newTheme);
            res.sendStatus(StatusCodes.OK);
        });

        this.router.get('/stats', verifyToken, async (req: Request, res: Response) => {
            const userID: string = res.locals.user.userID;
            const userStats = await this.userStatsStorageService.getUserStats(userID);
            res.status(StatusCodes.OK).json(userStats);
        });

        this.router.get('/games/history', verifyToken, async (req: Request, res: Response) => {
            const userID: string = res.locals.user.userID;
            const userGamesHistory = await this.historyStorage.getHistoryByUser(userID);
            res.status(StatusCodes.OK).json(userGamesHistory);
        });
        this.router.get('/all', async (req: Request, res: Response) => {
            const userGamesHistory = await this.accountStorageService.getAllUsersData();
            res.status(StatusCodes.OK).json(userGamesHistory);
        });
    }
}
