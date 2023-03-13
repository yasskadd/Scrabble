/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/naming-convention */
import { FileRequest } from '@app/interfaces/file-request';
import { uploadImage } from '@app/middlewares/multer-middleware';
import { verifyToken } from '@app/middlewares/token-verification-middleware';
import { AccountStorageService } from '@app/services/database/account-storage.service';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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

        this.router.post('/profile-picture', uploadImage.single('image'), async (req: FileRequest, res: Response) => {
            if (req.fileValidationError || !req.file) {
                res.status(StatusCodes.BAD_REQUEST).send({
                    message: 'No file received or invalid file type',
                    success: false,
                });
                return;
            }
            const imageKey = uuid.v4() + req.file?.originalname;
            const s3UploadCommand = this.createPutCommand(req, imageKey as string);
            await this.s3Client.send(s3UploadCommand);
            // Get the signed_url
            const getImageCommand = this.CreateGetCommand(imageKey as string);
            const signedURL = await getSignedUrl(this.s3Client, getImageCommand, { expiresIn: 3600 });
            const imageInfo: ImageInfo = {
                name: req.file?.originalname as string,
                isDefaultPicture: false,
                key: imageKey,
            };
            res.status(StatusCodes.CREATED).send({
                imageInfo,
                URL: signedURL,
            });
        });

        this.router.get('/profile-picture', verifyToken, async (req: Request, res: Response) => {
            const username = res.locals.user.name;
            const profilePicInfo: ImageInfo = await this.accountStorage.getProfilePicInfo(username);
            if (profilePicInfo.isDefaultPicture) {
                res.status(StatusCodes.OK).send({ isDefaultImage: true, url: profilePicInfo.name });
                return;
            }
            // Create new signed_url
            const getImageCommand = this.CreateGetCommand(profilePicInfo.key as string);
            const signedURL = await getSignedUrl(this.s3Client, getImageCommand, { expiresIn: 3600 });
            res.status(StatusCodes.OK).send({ isDefaultImage: false, url: signedURL });
        });

        /*  PUT request to UPLOAD modify existing profile picture, we need to get imageKey in database and to PutCommand to override
            the image in the bucket. Then create a new signed URL and send it to client */

        this.router.put('/profile-picture', verifyToken, uploadImage.single('image'), async (req: FileRequest, res: Response) => {
            if (req.fileValidationError || !req.file) {
                res.status(StatusCodes.BAD_REQUEST).send({
                    message: 'No file received or invalid file type',
                    success: false,
                });
                return;
            }
            const username = res.locals.user.name;
            const oldImageKey = (await this.accountStorage.getProfilePicInfo(username)).key;
            const newImageKey = uuid.v4() + req.file?.originalname;
            const putCommand = this.createPutCommand(req, newImageKey as string);
            this.s3Client
                .send(putCommand)
                .then(async () => {
                    // Delete the old image in the bucket (like an override)
                    if (oldImageKey?.length) {
                        const deleteImageCommand = this.createDeleteCommand(oldImageKey);
                        this.s3Client.send(deleteImageCommand).catch((err) => {
                            console.error(err);
                        });
                    }
                    // Update image in DB
                    await this.accountStorage.updateUploadedImage(username, newImageKey as string, req.file?.originalname as string);
                    res.status(StatusCodes.OK).send();
                })
                .catch((err) => {
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                        message: 'Internal server error',
                        error: err.message,
                    });
                });
        });

        /* PATCH route only do modify profile picture to a default one, delete image in bucket if it exists and return file name */

        this.router.patch('/profile-picture', verifyToken, async (req: Request, res: Response) => {
            // We just need to put hasDefaultImage to true and modify the image name, and delete the image in the bucket if it exists
            const username = res.locals.user.name;
            const profilePicInfo = await this.accountStorage.getProfilePicInfo(username);

            if (!profilePicInfo.isDefaultPicture) {
                if (profilePicInfo.key?.length) {
                    const deleteImageCommand = this.createDeleteCommand(profilePicInfo.key);
                    this.s3Client.send(deleteImageCommand).catch((err) => {
                        console.error(err);
                    });
                }
            }
            // Update DB (ImageKey to empty string and hasDefaultPicture to true and name to req.body.name)
            this.accountStorage
                .updateDefaultImage(username, req.body.fileName)
                .then(() => {
                    res.sendStatus(StatusCodes.OK);
                })
                .catch((err) => {
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                        error: err.message,
                    });
                });
        });
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

    private createPutCommand(req: Request, imageKey: string): PutObjectCommand {
        return new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: imageKey,
            Body: req.file?.buffer,
            ContentType: req.file?.mimetype,
        });
    }

    private CreateGetCommand(key: string): GetObjectCommand {
        return new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
    }

    private createDeleteCommand(key: string): DeleteObjectCommand {
        return new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
    }
}
