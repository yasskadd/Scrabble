import { ImageType } from '../models/image-type';

export interface AvatarData {
	type: ImageType;
	name: string,
	url?: string;
	rawData?: string;
	file?: File
}