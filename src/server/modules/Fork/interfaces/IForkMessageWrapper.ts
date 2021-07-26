import { ChildProcess } from 'child_process';
import IFork from './IFork';
import IForkMessage from './IForkMessage';

export default interface IForkMessageWrapper {
    message: IForkMessage;
    forked_target: IFork;
    sendHandle: ChildProcess | NodeJS.Process;
}