import { ImageType } from '../models/image-type';

export interface AvatarData {
	type: ImageType;
	src: string;
	data?: string;
}