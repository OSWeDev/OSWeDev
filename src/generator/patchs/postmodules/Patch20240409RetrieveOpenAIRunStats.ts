import { IDatabase } from 'pg-promise';
import ModuleGPTServer from '../../../server/modules/GPT/ModuleGPTServer';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleGPT from '../../../shared/modules/GPT/ModuleGPT';

export default class Patch20240409RetrieveOpenAIRunStats implements IGeneratorWorker {

    private static instance: Patch20240409RetrieveOpenAIRunStats = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240409RetrieveOpenAIRunStats';
    }

    public static getInstance(): Patch20240409RetrieveOpenAIRunStats {
        if (!Patch20240409RetrieveOpenAIRunStats.instance) {
            Patch20240409RetrieveOpenAIRunStats.instance = new Patch20240409RetrieveOpenAIRunStats();
        }
        return Patch20240409RetrieveOpenAIRunStats.instance;
    }

    public async work(db: IDatabase<unknown>) {
        if (ModuleGPT.getInstance().actif) {
            await ModuleGPTServer.getInstance().sync_openai_datas();
        }
    }
}