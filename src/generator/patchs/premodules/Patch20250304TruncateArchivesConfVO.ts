import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250304DropArchivesConfVO implements IGeneratorWorker {

    private static instance: Patch20250304DropArchivesConfVO = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250304DropArchivesConfVO';
    }

    public static getInstance(): Patch20250304DropArchivesConfVO {
        if (!Patch20250304DropArchivesConfVO.instance) {
            Patch20250304DropArchivesConfVO.instance = new Patch20250304DropArchivesConfVO();
        }
        return Patch20250304DropArchivesConfVO.instance;
    }

    public async work(db: IDatabase<unknown>) {

        await db.query("DROP TABLE IF EXISTS ref.module_file_archive_files_conf CASCADE;");
    }
}