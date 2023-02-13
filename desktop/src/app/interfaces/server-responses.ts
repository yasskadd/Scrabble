import { SocketEvents } from '@common/constants/socket-events';

export interface SocketResponse {
    validity: boolean;
    socketMessage?: SocketEvents;
}
