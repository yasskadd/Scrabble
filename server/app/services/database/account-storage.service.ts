/* eslint-disable quote-props */
import { UserChatRoom } from '@app/interfaces/user-chat-room';
import { ChatRoomUserInfo } from '@common/interfaces/chat-room';
import { HistoryEvent } from '@common/interfaces/history-event';
import { ImageInfo } from '@common/interfaces/image-info';
import { Theme } from '@common/interfaces/theme';
import { IUser } from '@common/interfaces/user';
import { HistoryActions } from '@common/models/history-actions';
import { compare, genSalt, hash } from 'bcrypt';
import * as moment from 'moment';
import { Document, FindOptions, ObjectId } from 'mongodb';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';

const DEFAULT_PLAYER_SCORE = 200;
const DEFAULT_PLAYER_STATS = 0;
@Service()
export class AccountStorageService {
    constructor(private database: DatabaseService) {}

    async addNewUser(user: Document): Promise<void> {
        const hashedPassword = await this.generateHash(user.password);
        const id = new ObjectId();
        const newUser = {
            _id: id,
            email: user.email,
            username: user.username,
            password: hashedPassword,
            profilePicture: user.profilePicture as ImageInfo,
            chatRooms: [{ name: 'main', messageCount: 0 }],
            historyEventList: [],
            language: user.language,
            theme: user.theme,
        };
        const userStats = {
            userIdRef: id,
            ranking: DEFAULT_PLAYER_SCORE,
            gameCount: DEFAULT_PLAYER_STATS,
            win: DEFAULT_PLAYER_STATS,
            loss: DEFAULT_PLAYER_STATS,
            totalGameTime: DEFAULT_PLAYER_STATS,
            totalGameScore: DEFAULT_PLAYER_STATS,
            averageGameTime: '0:0',
            averageGameScore: DEFAULT_PLAYER_STATS,
        };
        await this.database.users.addDocument(newUser);
        await this.database.usersStats.addDocument(userStats);
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

    async isEmailRegistered(email: string): Promise<boolean> {
        return (await this.database.users.collection.findOne({ email })) !== null;
    }

    async getUserData(username: string): Promise<IUser> {
        const userDocument = (await this.database.users.collection?.findOne({ username })) as Document;
        return userDocument as IUser;
    }

    async getAllUsersData(): Promise<{ [key: string]: string }> {
        const options: FindOptions<Document> = {
            projection: { _id: 1, username: 1 },
        };
        const userHashMap: { [key: string]: string } = {};
        const userDocuments = await this.database.users.fetchDocuments({}, options);
        for (const doc of userDocuments) {
            userHashMap[doc._id.toString()] = doc.username;
        }
        return userHashMap;
    }

    async getUserDataFromID(id: string): Promise<IUser> {
        const userDocument = (await this.database.users.collection.findOne({ _id: new ObjectId(id) })) as Document;
        return userDocument as IUser;
    }

    async getUserIdFromUsername(username: string): Promise<string> {
        const userDocument = (await this.database.users.collection.findOne({ username }, { projection: { _id: 1 } })) as Document;
        return userDocument._id as string;
    }

    async getChatUserInfo(id: string): Promise<ChatRoomUserInfo> {
        const userDocument = (await this.database.users.collection.findOne(
            { _id: new ObjectId(id) },
            { projection: { username: 1, profilePicture: 1 } },
        )) as Document;
        return userDocument as ChatRoomUserInfo;
    }

    async getProfilePicInfoFromID(id: string): Promise<ImageInfo> {
        const userDocument = (await this.database.users.collection?.findOne({ _id: new ObjectId(id) })) as Document;
        return userDocument.profilePicture as ImageInfo;
    }

    async updateUploadedImage(id: string, imageKey: string, fileName: string): Promise<void> {
        await this.database.users.collection?.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    'profilePicture.key': imageKey,
                    'profilePicture.name': fileName,
                    'profilePicture.isDefaultPicture': false,
                },
            },
        );
    }

    async updateDefaultImage(id: string, fileName: string, imageKey: string): Promise<void> {
        await this.database.users.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    'profilePicture.isDefaultPicture': true,
                    'profilePicture.key': imageKey,
                    'profilePicture.name': fileName,
                },
            },
        );
    }

    async updateUsername(id: string, newUsername: string): Promise<void> {
        await this.database.users.collection.updateOne({ _id: new ObjectId(id) }, { $set: { username: newUsername } });
    }

    async updateScore(id: string, newScore: number): Promise<void> {
        await this.database.users.collection.updateOne({ _id: new ObjectId(id) }, { $set: { score: newScore } });
    }

    async updateLanguage(id: string, newLanguage: 'en' | 'fr'): Promise<void> {
        await this.database.users.collection.updateOne({ _id: new ObjectId(id) }, { $set: { language: newLanguage } });
    }

    async updateTheme(id: string, newTheme: Theme): Promise<void> {
        await this.database.users.collection.updateOne({ _id: new ObjectId(id) }, { $set: { theme: newTheme } });
    }

    async isSamePassword(id: string, newPassword: string): Promise<boolean> {
        const userDocument = (await this.database.users.collection?.findOne({ _id: new ObjectId(id) })) as IUser | null;
        return await this.compareHash(newPassword, userDocument?.password as string);
    }

    async updatePassword(id: string, newPassword: string): Promise<void> {
        const newHashedPassword = await this.generateHash(newPassword);
        await this.database.users.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: { password: newHashedPassword },
            },
        );
    }

    async addUserEventHistory(id: string, userEvent: string, dateEvent: Date, isWinner?: boolean): Promise<void> {
        const historyEvent = this.createHistoryEvent(userEvent, dateEvent, isWinner);
        if (historyEvent) {
            await this.database.users.collection.updateOne({ _id: new ObjectId(id) }, { $push: { historyEventList: historyEvent } });
        }
    }

    async addChatRoom(id: string, chatRoom: UserChatRoom) {
        await this.database.users.updateDocument({ _id: new ObjectId(id) }, { $push: { chatRooms: chatRoom } });
    }

    async deleteChatRoom(id: string, chatRoomName: string) {
        await this.database.users.updateDocument({ _id: new ObjectId(id) }, { $pull: { chatRooms: { name: chatRoomName } } });
    }

    async updateChatRoomMessageCount(id: string, chatRoomName: string, messageCount: number) {
        await this.database.users.updateDocument(
            { _id: new ObjectId(id), chatRooms: { $elemMatch: { name: chatRoomName } } },
            { $set: { 'chatRooms.$.messageCount': messageCount } },
        );
    }

    async getUserEventHistory(id: string): Promise<HistoryEvent[]> {
        const projection = { historyEventList: 1, _id: 0 };
        const historyEventList = await this.database.users.collection.findOne({ _id: new ObjectId(id) }, { projection });
        if (historyEventList) return historyEventList.historyEventList as HistoryEvent[];
        return [];
    }

    private async generateHash(password: string): Promise<string> {
        const salt: string = await genSalt();
        const hashPassWord: string = await hash(password, salt);
        return hashPassWord;
    }

    private async compareHash(password: string, hashed: string): Promise<boolean> {
        return await compare(password, hashed);
    }

    private createHistoryEvent(userEvent: string, dateEvent: Date, isWinner?: boolean): HistoryEvent | undefined {
        const gameWon = userEvent === HistoryActions.Game ? isWinner : null;
        const momentDate = moment(dateEvent);
        const formattedDate: string = momentDate.format('HH:mm:ss YYYY-MM-DD');
        return {
            event: userEvent,
            date: formattedDate,
            gameWon,
        } as HistoryEvent;
    }
}
