import { ImageInfo } from './image-info';

export interface IUser {
    email: string;
    username: string;
    password: string;
    hasDefaultPicture: boolean;
    profilePicture: ImageInfo;
}
