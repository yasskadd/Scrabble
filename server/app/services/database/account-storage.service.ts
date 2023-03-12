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
            hasDefaultPicture: user.hasDefaultPicture,
            profilePicture: user.profilePicture as ImageInfo,
        };
        await this.database.users.addDocument(newUser);
    }

    async loginValidator(user: Document): Promise<boolean> {
        const userDocument = (await this.database.users.collection.findOne({ username: user.username })) as Document;
        const hashedPassword = userDocument.password;
        return await this.compareHash(user.password, hashedPassword);
    }

    async isUserRegistered(name: string): Promise<boolean> {
        return (await this.database.users.collection.findOne({ username: name })) !== null;
    }

    async handleImageRequest(username: string) {
        const userDocument = (await this.database.users.collection.findOne({ username })) as Document;
        console.log(userDocument);
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
