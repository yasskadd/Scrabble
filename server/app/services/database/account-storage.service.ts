/* eslint-disable quote-props */
import { ImageInfo } from '@common/interfaces/image-info';
import { IUser } from '@common/interfaces/user';
import { compare, genSalt, hash } from 'bcrypt';
import { Document } from 'mongodb';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';

@Service()
export class AccountStorageService {
    constructor(private database: DatabaseService) {}

    async addNewUser(user: Document): Promise<void> {
        const hashedPassword = await this.generateHash(user.password);
        const newUser: IUser = {
            email: user.email,
            username: user.username,
            password: hashedPassword,
            profilePicture: user.profilePicture as ImageInfo,
        };
        await this.database.users.addDocument(newUser);
    }

    async loginValidator(user: IUser): Promise<boolean> {
        const userDocument = (await this.database.users.collection?.findOne({ username: user.username })) as Document;
        if (!userDocument) return false;
        const hashedPassword = userDocument.password;

        return await this.compareHash(user.password, hashedPassword);
    }

    async isUsernameRegistered(name: string): Promise<boolean> {
        return (await this.database.users.collection?.findOne({ username: name })) !== null;
    }

    async getUserData(username: string): Promise<IUser> {
        const userDocument = (await this.database.users.collection?.findOne({ username })) as Document;
        return userDocument as IUser;
    }

    async getProfilePicInfo(username: string): Promise<ImageInfo> {
        const userDocument = (await this.database.users.collection?.findOne({ username })) as Document;
        return userDocument.profilePicture as ImageInfo;
    }

    async updateUploadedImage(username: string, imageKey: string, fileName: string): Promise<void> {
        await this.database.users.collection?.updateOne(
            { username },
            {
                $set: {
                    'profilePicture.key': imageKey,
                    'profilePicture.name': fileName,
                    'profilePicture.isDefaultPicture': false,
                },
            },
        );
    }

    async updateDefaultImage(username: string, fileName: string, imageKey: string): Promise<void> {
        await this.database.users.collection.updateOne(
            { username },
            {
                $set: {
                    'profilePicture.isDefaultPicture': true,
                    'profilePicture.key': imageKey,
                    'profilePicture.name': fileName,
                },
            },
        );
    }

    async updateUsername(oldUsername: string, newUsername: string): Promise<void> {
        await this.database.users.collection.updateOne({ username: oldUsername }, { $set: { username: newUsername } });
    }

    async isSamePassword(username: string, newPassword: string): Promise<boolean> {
        const userDocument = (await this.database.users.collection?.findOne({ username })) as IUser | null;
        return await this.compareHash(newPassword, userDocument?.password as string);
    }

    async updatePassword(username: string, newPassword: string): Promise<void> {
        const newHashedPassword = await this.generateHash(newPassword);
        await this.database.users.collection.updateOne(
            { username },
            {
                $set: { password: newHashedPassword },
            },
        );
    }

    private async generateHash(password: string): Promise<string> {
        const salt: string = await genSalt();
        const hashPassWord: string = await hash(password, salt);
        return hashPassWord;
    }

    private async compareHash(password: string, hashed: string): Promise<boolean> {
        return await compare(password, hashed);
    }
}
