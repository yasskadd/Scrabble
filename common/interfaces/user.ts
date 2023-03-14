import { AvatarData } from '../interfaces/avatar-data';

export interface IUser {
	username: string;
	password: string;
	avatar?: AvatarData;
}
