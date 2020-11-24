import { ChildProcess } from 'child_process';
import IForkMessage from './IForkMessage';

export default interface IForkMessageWrapper {
    message: IForkMessage;
    sendHandle: ChildProcess | NodeJS.Process;
}