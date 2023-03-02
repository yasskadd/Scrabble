import { IUser } from '@app/interfaces/user';
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
            username: user.username,
            password: hashedPassword,
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

    private async generateHash(password: string): Promise<string> {
        const salt: string = await genSalt();
        const hashPassWord: string = await hash(password, salt);
        return hashPassWord;
    }

    private async compareHash(password: string, hashed: string): Promise<boolean> {
        return await compare(password, hashed);
    }
}
