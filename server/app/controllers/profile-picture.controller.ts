/* eslint-disable @typescript-eslint/naming-convention */
import { FileRequest } from '@app/interfaces/file-request';
import { uploadImage } from '@app/middlewares/multer-middleware';
import { verifyToken } from '@app/middlewares/token-verification-middleware';
import { AccountStorageService } from '@app/services/database/account-storage.service';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ImageInfo } from '@common/interfaces/image-info';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import * as uuid from 'uuid';

const BUCKET_NAME = 'scrabble-images';
const BUCKET_REGION = 'ca-central-1';
const ACCESS_KEY = 'AKIA5IBYO7WFXIYKAMR6';
const SECRET_ACCESS_KEY = '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';

@Service()
export class ProfilePictureController {
    router: Router;
    private s3Client: S3Client;

    constructor(private readonly accountStorage: AccountStorageService) {
        this.configureRouter();
        this.s3Client = this.configureS3Client();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.post('/profilePicture', uploadImage.single('image'), async (req: FileRequest, res: Response) => {
            if (req.fileValidationError) {
                res.status(StatusCodes.BAD_REQUEST).send({
                    message: 'No file received or invalid file type',
                    success: false,
                });
                return;
            }
            const imageKey = uuid.v4() + req.file?.originalname;
            const s3UploadCommand = this.createS3UploadCommand(req, imageKey as string);
            await this.s3Client.send(s3UploadCommand);
            // Get the signed_url
            const getImageCommand = this.createGetImageCommand(imageKey as string);
            const signedURL = await getSignedUrl(this.s3Client, getImageCommand, { expiresIn: 3600 });
            const imageInfo: ImageInfo = {
                name: req.file?.originalname as string,
                key: imageKey,
                signedUrl: signedURL,
            };
            res.status(StatusCodes.CREATED).send(imageInfo);
        });

        this.router.get('/profilePicture', verifyToken, async (req: Request, res: Response) => {
            const username = res.locals.user.name;
            const profilePicInfo = await this.accountStorage.getProfilePicInfo(username);
            if (profilePicInfo.hasDefaultPicture) {
                res.status(StatusCodes.BAD_REQUEST).send({ message: 'User has a generic profile picture, invalid request' });
                return;
            }
            // Create new signed_url
            const getImageCommand = this.createGetImageCommand(profilePicInfo.imageKey as string);
            const signedURL = await getSignedUrl(this.s3Client, getImageCommand, { expiresIn: 3600 });
            res.status(StatusCodes.ACCEPTED).send({ signedURL });
        });

        /* TODO: PUT request to modify existing profile picture, we need to get imageKey in database and to PutCommand to override
            the image in the bucket. Then create a new signed URL and send it to client */

        /* TODO: DELETE request to delete image from bucket. Happens if the user modified his profile picture to a generic one */
    }

    private configureS3Client(): S3Client {
        return new S3Client({
            credentials: {
                accessKeyId: ACCESS_KEY,
                secretAccessKey: SECRET_ACCESS_KEY,
            },
            region: BUCKET_REGION,
        });
    }

    private createS3UploadCommand(req: Request, imageKey: string): PutObjectCommand {
        return new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: imageKey,
            Body: req.file?.buffer,
            ContentType: req.file?.mimetype,
        });
    }

    private createGetImageCommand(key: string): GetObjectCommand {
        return new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
    }
}
