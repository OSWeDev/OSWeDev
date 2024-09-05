import { IDatabase } from 'pg-promise';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';

export default class Patch20240905InitAllThreadsOseliaToHavingContents implements IGeneratorWorker {

    private static instance: Patch20240905InitAllThreadsOseliaToHavingContents = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20240905InitAllThreadsOseliaToHavingContents';
    }

    public static getInstance(): Patch20240905InitAllThreadsOseliaToHavingContents {
        if (!Patch20240905InitAllThreadsOseliaToHavingContents.instance) {
            Patch20240905InitAllThreadsOseliaToHavingContents.instance = new Patch20240905InitAllThreadsOseliaToHavingContents();
        }
        return Patch20240905InitAllThreadsOseliaToHavingContents.instance;
    }

    public async work(db: IDatabase<unknown>) {

        await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .exec_as_server()
            .update_vos<GPTAssistantAPIThreadVO>({ has_content: true });
    }
}