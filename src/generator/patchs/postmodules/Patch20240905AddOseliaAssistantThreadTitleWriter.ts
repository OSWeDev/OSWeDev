import { IDatabase } from 'pg-promise';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';

export default class Patch20240905AddOseliaAssistantThreadTitleWriter implements IGeneratorWorker {

    private static instance: Patch20240905AddOseliaAssistantThreadTitleWriter = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20240905AddOseliaAssistantThreadTitleWriter';
    }

    public static getInstance(): Patch20240905AddOseliaAssistantThreadTitleWriter {
        if (!Patch20240905AddOseliaAssistantThreadTitleWriter.instance) {
            Patch20240905AddOseliaAssistantThreadTitleWriter.instance = new Patch20240905AddOseliaAssistantThreadTitleWriter();
        }
        return Patch20240905AddOseliaAssistantThreadTitleWriter.instance;
    }

    public async work(db: IDatabase<unknown>) {

        let assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID).filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().nom, GPTAssistantAPIThreadVO.OSELIA_THREAD_TITLE_BUILDER_ASSISTANT_NAME).exec_as_server().select_vo<GPTAssistantAPIAssistantVO>();

        if (!assistant) {
            assistant = new GPTAssistantAPIAssistantVO();
            assistant.gpt_assistant_id = 'TODO';
            assistant.nom = GPTAssistantAPIThreadVO.OSELIA_THREAD_TITLE_BUILDER_ASSISTANT_NAME;
            assistant.description = 'Assistant dont le but est d\'utiliser les 100 premiers mots d\'un thread pour en faire le titre';
            assistant.instructions = 'Ton rôle est simple, on te fournit les 100 premiers mots d\'une discussion entre un ou plusieurs humains et un ou plusieurs assistants IA ' +
                'et tu dois définir un titre à la discussion (dont tu peux présumer la finalité, tu ne fais pas un résumé, mais tu dois identifier un titre inventif - unique - qui permettra à l\'utilisateur humain de retrouver rapidement une discussion passée par son titre). Tu ne dois renvoyer que le titre sans guillemets ou autres fioritures.';
            assistant.model = 'gpt-4o-mini';
            await ModuleDAO.instance.insertOrUpdateVO(assistant);
        }
    }
}