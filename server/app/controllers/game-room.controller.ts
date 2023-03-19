import { Request, Response, Router } from 'express';
import { Service } from 'typedi';
import { GameSessions } from '@app/services/client-utilities/game-sessions.service';
import { HTTP_STATUS } from '@common/models/http-status';

@Service()
export class GameRoomController {
    router: Router;

    constructor(private gameSessionsService: GameSessions) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        /**
         * HTTP GET request to get all available game room
         *
         * @return {{ rooms: GameRoom[] }} send - The key of the selected profile picture
         */
        this.router.get('/rooms', async (req: Request, res: Response) => {
            const rooms = this.gameSessionsService.getAvailableRooms();
            if (rooms) {
                res.status(HTTP_STATUS.OK).send(rooms);
                return;
            }

            // TODO : Language
            res.sendStatus(HTTP_STATUS.NO_CONTENT);
        });
    }
}
