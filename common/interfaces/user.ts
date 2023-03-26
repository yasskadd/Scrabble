import { ImageInfo } from './image-info';

export interface IUser {
    email?: string;
    username: string;
    password: string;
    profilePicture?: ImageInfo;
    score: number;
}
