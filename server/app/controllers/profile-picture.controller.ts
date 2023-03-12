/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-unused-vars */
import { uploadImage } from '@app/middlewares/multer-middleware';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Request, Response, Router } from 'express';
import { Service } from 'typedi';
import * as uuid from 'uuid';

const BUCKET_NAME = 'scrabble-images';
const BUCKET_REGION = 'ca-central-1';
const ACCESS_KEY = 'AKIA5IBYO7WF6AJNCTTP';
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
            console.log(req.body);
            console.log(req.file);
            const imageKey = uuid.v4() + req.file?.originalname;
            const s3UploadCommand = this.createS3UploadCommand(req, imageKey);
            await this.s3Client.send(s3UploadCommand);
            res.send({});
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
}
