import { ChatRoomsStorageService } from '@app/services/database/chat-rooms-storage.service';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class ChatRoomsController {
    router: Router;

    constructor(private readonly chatRoomsStorage: ChatRoomsStorageService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.post('/create', async (req: Request, res: Response) => {
            const roomName = req.body.roomName;
            console.log(roomName);
            if (await this.chatRoomsStorage.roomExists(roomName)) {
                res.status(StatusCodes.CONFLICT).send('Room already exist');
                return;
            }
            await this.chatRoomsStorage.createRoom(roomName);
            res.status(StatusCodes.CREATED).send('Room created with success');
        });

        this.router.patch('/sendMessage', async (req: Request, res: Response) => {
            const roomName = req.body.roomName;
            const message = req.body.message;
            if (!(await this.chatRoomsStorage.roomExists(roomName))) {
                res.status(StatusCodes.NOT_FOUND).send('Room does not exist');
                return;
            }
            await this.chatRoomsStorage.addMessageInRoom(roomName, message);
            res.status(StatusCodes.NO_CONTENT).send('Message has been sent with success');
        });

        this.router.get('/', async (req: Request, res: Response) => {
            const roomName = 'main';
            const room = await this.chatRoomsStorage.getRooms([roomName]);
            console.log(room);
            res.json(room);
        });
    }
}
