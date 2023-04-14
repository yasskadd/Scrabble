/* eslint-disable @typescript-eslint/naming-convention */
import { defaultImagesMap } from '@app/constants/profile-pictures';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3';
import { Service } from 'typedi';

const BUCKET_NAME = 'scrabble-images';
const BUCKET_REGION = 'ca-central-1';
const ACCESS_KEY = 'AKIA5IBYO7WFXIYKAMR6';
const SECRET_ACCESS_KEY = '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';
export const PRESIGNED_URL_EXPIRY = 604800; // 1 week

@Service()
export class ImageStorageService {
    s3Client: S3Client;
    defaultImagesMap: Map<string, string>; // Map (key, )

    constructor() {
        this.s3Client = this.configureS3Client();
        this.defaultImagesMap = defaultImagesMap;
    }
    createPutCommand(req: Express.Multer.File, imageKey: string): PutObjectCommand {
        return new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: imageKey,
            Body: req.buffer,
            ContentType: req.mimetype,
        } as PutObjectCommandInput);
    }

    createGetCommand(key: string): GetObjectCommand {
        return new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
    }

    createDeleteCommand(key: string): DeleteObjectCommand {
        return new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
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
}
