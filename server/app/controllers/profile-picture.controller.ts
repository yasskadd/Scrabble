/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/naming-convention */
import { defaultImagesMap } from '@app/constants/profile-pictures';
import { FileRequest } from '@app/interfaces/file-request';
import { uploadImage } from '@app/middlewares/multer-middleware';
import { verifyToken } from '@app/middlewares/token-verification-middleware';
import { AccountStorageService } from '@app/services/database/account-storage.service';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3';
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
const PRESIGNED_URL_EXPIRY = 604800; // 1 week

@Service()
export class ProfilePictureController {
    router: Router;
    private s3Client: S3Client;
    private defaultImagesMap: Map<string, string>; // Map (key, )

    constructor(private accountStorage: AccountStorageService) {
        this.configureRouter();
        this.s3Client = this.configureS3Client();
        this.defaultImagesMap = defaultImagesMap;
    }

    private configureRouter(): void {
        this.router = Router();

        /**
         * HTTP GET request to get the default pictures informations
         *
         * @return { Map<string, string[] } send - The informations of all the images arranged in a key, value pair.
         *                       key - The name of the default image
         *                       value[0] - The url of the default image
         *                       value[1] - The encrypted key of the default image
         * @return { number } HTTP Status - The return status of the request
         */
        this.router.get('/default-pictures', async (req: Request, res: Response) => {
            const imageUrlsMap: Map<string, string[]> = new Map();
            for (const image of this.defaultImagesMap.entries()) {
                const getImageCommand = this.CreateGetCommand(image[1]);
                const signedUrl = await getSignedUrl(this.s3Client, getImageCommand, { expiresIn: PRESIGNED_URL_EXPIRY });
                imageUrlsMap.set(image[0], [signedUrl, image[1]]);
            }
            res.status(StatusCodes.OK).send(Object.fromEntries(imageUrlsMap));
        });

        /**
         * HTTP POST request to send an image to the S3 bucket
         *
         * @param { FormatData } files - Container for the files necessary for the request
         * @param      { image } files[0] - File of the image to post
         * @param   { imageKey } files[1] - File containing the imageKey in the text/html data
         * @return { number } HTTP Status - The return status of the request
         */
        this.router.post('/profile-picture', uploadImage.any(), async (req: FileRequest, res: Response) => {
            if (!req.files || req.fileValidationError || req.files.length !== 1 || !req.files[0] || req.body.ImageKey === undefined) {
                res.status(StatusCodes.BAD_REQUEST).send({
                    message: 'No file received or invalid file type',
                    success: false,
                });
                return;
            }

            const s3UploadCommand = this.createPutCommand(req.files[0], req.body.ImageKey);
            await this.s3Client.send(s3UploadCommand);

            res.sendStatus(StatusCodes.CREATED);
        });

        /**
         * HTTP GET request to request an image in the S3 bucket
         *
         * @param { string } session_token - String of the connected user token
         * @return {{ url: string }} data - URL of the image usable as a simple source link
         * @return { number } HTTP Status - The return status of the request
         */
        this.router.get('/profile-picture', verifyToken, async (req: Request, res: Response) => {
            const userID = res.locals.user.userID;
            const profilePicInfo: ImageInfo = await this.accountStorage.getProfilePicInfoFromID(userID);

            // Create new signed_url
            const getImageCommand = this.CreateGetCommand(profilePicInfo.key as string);
            const signedURL = await getSignedUrl(this.s3Client, getImageCommand, { expiresIn: PRESIGNED_URL_EXPIRY });
            res.status(StatusCodes.OK).send({ url: signedURL });
        });

        /**
         * HTTP PUT request to send a new image for a specific user
         *
         * @param { string } session_token - String of the connected user token
         * @param { File } file - File containing the actual image
         * @return {{ userData: IUser }} data - new user data containing the new image key (already synced in the database)
         * @return { number } HTTP Status - The return status of the request
         */
        this.router.put('/profile-picture', verifyToken, uploadImage.single('image'), async (req: FileRequest, res: Response) => {
            if (req.fileValidationError || !req.file) {
                res.status(StatusCodes.BAD_REQUEST).send({
                    message: 'No file received or invalid file type',
                    success: false,
                });
                return;
            }

            const userID = res.locals.user.userID;
            const oldProfilePicInfo = await this.accountStorage.getProfilePicInfoFromID(userID);
            const newImageKey = uuid.v4() + req.file?.originalname;
            const putCommand = this.createPutCommand(req.file, newImageKey as string);
            this.s3Client
                .send(putCommand)
                .then(async () => {
                    // Delete the old image in the bucket (like an override)
                    if (oldProfilePicInfo.key?.length && !oldProfilePicInfo.isDefaultPicture) {
                        const deleteImageCommand = this.createDeleteCommand(oldProfilePicInfo.key as string);
                        this.s3Client.send(deleteImageCommand).catch((err) => {
                            console.error(err);
                        });
                    }
                    // Update image in DB
                    await this.accountStorage.updateUploadedImage(userID, newImageKey as string, req.file?.originalname as string);
                    res.status(StatusCodes.OK).send({ userData: await this.accountStorage.getUserDataFromID(userID) });
                })
                .catch((err) => {
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                        message: 'Internal server error',
                        error: err.message,
                    });
                });
        });

        /* PATCH route only do modify profile picture to a default one, delete image in bucket if it exists and return file name */

        /**
         * HTTP PATCH request to update a user profile picture with a default one
         *
         * @param {{ fileName: string }} body - String of the default image name to use
         * @return {{ userData: IUser }} data - new user data containing the new image key (already synced in the database)
         * @return { number } HTTP Status - The return status of the request
         */
        this.router.patch('/profile-picture', verifyToken, async (req: Request, res: Response) => {
            // We just need to put hasDefaultImage to true and modify the image name, and delete the image in the bucket if it exists
            const userID = res.locals.user.userID;
            const profilePicInfo = await this.accountStorage.getProfilePicInfoFromID(userID);

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
                .updateDefaultImage(userID, req.body.fileName, this.defaultImagesMap.get(req.body.fileName) as string)
                .then(async () => {
                    res.status(StatusCodes.OK).send({ userData: await this.accountStorage.getUserDataFromID(userID) });
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

    private createPutCommand(req: Express.Multer.File, imageKey: string): PutObjectCommand {
        return new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: imageKey,
            Body: req.buffer,
            ContentType: req.mimetype,
        } as PutObjectCommandInput);
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
