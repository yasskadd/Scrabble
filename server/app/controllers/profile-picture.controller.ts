/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-unused-vars */
import { uploadImage } from '@app/middlewares/multer-middleware';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Request, Response, Router } from 'express';
import { Service } from 'typedi';

const BUCKET_NAME = 'scrabble-images';
const BUCKET_REGION = 'ca-central-1';
const ACCESS_KEY = 'AKIA5IBYO7WFXIYKAMR6';
const SECRET_ACCESS_KEY = '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';

@Service()
export class ProfilePictureController {
    router: Router;
    private s3Client: S3Client;

    constructor() {
        this.configureRouter();
        this.s3Client = this.configureS3Client();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.post('/profilePicture', uploadImage.single('image'), async (req: Request, res: Response) => {
            const imageKey = req.file?.originalname;
            const s3UploadCommand = this.createS3UploadCommand(req, imageKey as string);
            await this.s3Client.send(s3UploadCommand);
            // Get the signed_url
            const getImageCommand = this.createGetImageCommand(imageKey as string);
            const signedURL = await getSignedUrl(this.s3Client, getImageCommand, { expiresIn: 25000 });
            res.send({ signedURL });
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
