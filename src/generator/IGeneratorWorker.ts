import { IDatabase } from 'pg-promise';

export default interface IGeneratorWorker {
    work: (db: IDatabase<any>) => Promise<void>;
    uid: string;
}