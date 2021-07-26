import * as socketIO from 'socket.io';

export default class SocketWrapper {

    public constructor(
        public userId: number,
        public sessId: string,
        public socketId: string,
        public socket: socketIO.Socket,
    ) { }
}