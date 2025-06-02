import type { IForkProcess } from './IForkProcess';
import { Worker } from 'worker_threads';

export default interface IFork {
    uid: number;
    processes: { [name: string]: IForkProcess };
    worker: Worker;
}