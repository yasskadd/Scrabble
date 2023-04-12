import { AccountStorageService } from '@app/services/database/account-storage.service';
import { ImageStorageService, PRESIGNED_URL_EXPIRY } from '@app/services/database/image-storage.service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ChatRoomUser } from '@common/interfaces/chat-room';
import { HTTP_STATUS } from '@common/models/http-status';
import { Request, Response, Router } from 'express';
import { Service } from 'typedi';

@Service()
export class ChatRoomsController {
    router: Router;

    constructor(private readonly accountStorage: AccountStorageService, private imageStorage: ImageStorageService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        /**
         * HTTP GET request to request the username and image url from a userID
         *
         * @param { string } id - String of the userID
         * @return {{ username: string, url: string }} data - username of the user and URL of his image
         */
        this.router.get('/user/:id', async (req: Request, res: Response) => {
            const userID = req.params.id as string;
            if (userID === undefined) return;
            const untreatedUserInfo = await this.accountStorage.getChatUserInfo(userID);
            if (untreatedUserInfo === undefined || untreatedUserInfo === null || untreatedUserInfo.username === undefined) {
                res.status(HTTP_STATUS.NOT_FOUND).send();
                return;
            }
            const userInfo = { username: untreatedUserInfo.username } as ChatRoomUser;
            if (untreatedUserInfo.profilePicture.key !== undefined) {
                const imageGetCommand = this.imageStorage.createGetCommand(untreatedUserInfo.profilePicture.key as string);
                userInfo.imageUrl = await getSignedUrl(this.imageStorage.s3Client, imageGetCommand, { expiresIn: PRESIGNED_URL_EXPIRY });
            }
            res.status(HTTP_STATUS.OK).json(userInfo);
        });
    }
}
