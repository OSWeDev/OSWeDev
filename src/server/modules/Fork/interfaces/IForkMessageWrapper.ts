import { MessagePort, Worker } from 'worker_threads';
import IFork from './IFork';
import IForkMessage from './IForkMessage';

export default interface IForkMessageWrapper {
    message: IForkMessage;
    forked_target: IFork;
    send_handle: Worker | MessagePort;
}