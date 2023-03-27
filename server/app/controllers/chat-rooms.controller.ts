import { ChatRoomsStorageService } from '@app/services/database/chat-rooms-storage.service';
import { Request, Response, Router } from 'express';
import { Service } from 'typedi';

const ALREADY_EXIST_ROOM_ERROR = 409;
const ROOM_DOES_NOT_EXIST_ERROR = 404;
const ROOM_CREATED = 201;
const MESSAGE_SENDED = 204;

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
                res.status(ALREADY_EXIST_ROOM_ERROR).send('Room already exist');
                return;
            }
            await this.chatRoomsStorage.createRoom(roomName);
            res.status(ROOM_CREATED).send('Room created with success');
        });

        this.router.patch('/sendMessage', async (req: Request, res: Response) => {
            const roomName = req.body.roomName;
            const message = req.body.message;
            if (!(await this.chatRoomsStorage.roomExists(roomName))) {
                res.status(ROOM_DOES_NOT_EXIST_ERROR).send('Room does not exist');
                return;
            }
            await this.chatRoomsStorage.addMessageInRoom(roomName, message);
            res.status(MESSAGE_SENDED).send('Message has been sent with success');
        });

        this.router.get('/', async (req: Request, res: Response) => {
            const roomName = 'main';
            const room = await this.chatRoomsStorage.getRooms([roomName]);
            console.log(room);
            res.json(room);
        });
    }
}
