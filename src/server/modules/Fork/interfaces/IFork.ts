import IForkProcess from './IForkProcess';
import { ChildProcess } from 'child_process';

export default interface IFork {
    uid: number;
    processes: { [name: string]: IForkProcess };
    child_process: ChildProcess;
}