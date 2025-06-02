import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import GPTAssistantAPIServerSyncAssistantsController from "../../../server/modules/GPT/sync/GPTAssistantAPIServerSyncAssistantsController";
import ModuleOseliaServer from "../../../server/modules/Oselia/ModuleOseliaServer";
import SuperviseurAssistantTraductionServerController from "../../../server/modules/Translation/SuperviseurAssistantTraductionServerController";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import GPTAssistantAPIAssistantFunctionVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantFunctionVO";
import GPTAssistantAPIAssistantVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO";
import GPTAssistantAPIFunctionVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import { field_names, reflect } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250509AddOselia_Superviseur_AssistantTraduction implements IGeneratorWorker {

    private static instance: Patch20250509AddOselia_Superviseur_AssistantTraduction = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250509AddOselia_Superviseur_AssistantTraduction';
    }

    public static getInstance(): Patch20250509AddOselia_Superviseur_AssistantTraduction {
        if (!Patch20250509AddOselia_Superviseur_AssistantTraduction.instance) {
            Patch20250509AddOselia_Superviseur_AssistantTraduction.instance = new Patch20250509AddOselia_Superviseur_AssistantTraduction();
        }
        return Patch20250509AddOselia_Superviseur_AssistantTraduction.instance;
    }

    public async work(db: IDatabase<unknown>) {
        // On lance une synchro des assistants d'abord, dans le doute
        await GPTAssistantAPIServerSyncAssistantsController.sync_assistants();

        // On récupère l'assistant traduction
        let assistant: GPTAssistantAPIAssistantVO = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().nom, SuperviseurAssistantTraductionServerController.OSELIA_superviseur_assistant_traduction_ASSISTANT_NAME)
            .exec_as_server()
            .select_vo<GPTAssistantAPIAssistantVO>();

        if (!assistant) {
            // On déclare l'assistant s'il n'existe pas
            assistant = await this.declare_assistant();
        }

        // On associe les fonctions instantiate_assistant_traduction et get_codes_that_need_translation
        await this.link_function_to_assistant(assistant, ModuleOseliaServer.getInstance().name, reflect<ModuleOseliaServer>().instantiate_assistant_traduction);
        await this.link_function_to_assistant(assistant, ModuleOseliaServer.getInstance().name, reflect<ModuleOseliaServer>().get_codes_that_need_translation);
        await this.link_function_to_assistant(assistant, ModuleOseliaServer.getInstance().name, reflect<ModuleOseliaServer>().push_message_to_supervised_thread_id);
    }

    private async declare_assistant(): Promise<GPTAssistantAPIAssistantVO> {
        const assistant: GPTAssistantAPIAssistantVO = new GPTAssistantAPIAssistantVO();
        assistant.nom = SuperviseurAssistantTraductionServerController.OSELIA_superviseur_assistant_traduction_ASSISTANT_NAME;
        assistant.description = "Assistant OSELIA Superviseur de l'Agent de traduction";
        assistant.archived = false;

        assistant.instructions = "Tu es le superviseur d'un agent de traduction. Tu peux récupérer des listes de codes à traduire dans une langue donnée (à condition de savoir pour quel code_langue traduire - demande à l'utilisateur si besoin) et avec ces codes textes et le code de la langue, tu peux initier une demande de traduction qui sera réalisée par l'agent de traduction dans un thread séparé. Tous les messages de ce nouveau thread seront dupliqués dans le tien pour te permettre de suivre la résolution ou voir les questions posées par l'agent et tenter d'y répondre, avec au besoin l'aide de l'utilisateur auquel tu peux poser des questions pour t'aider.\n" +
            "Ton but est de traduire petit à petit, l'un après l'autre, tous les codes demandés par l'utilisateur.\n" +
            "Quand un agent a terminé sa traduction, ton rôle est de vérifier la traduction et surtout la justification apportée par l'agent, et si cela te semble insuffisant pour justifier du choix de la traduction, tu peux lui demander des compléments d'information.\n" +
            "Si tu as un doute tu dois demander de l'aide à l'utilisateur, et lui poser des questions pour l'aider à t'aider.\n" +
            "Pour ton information les codes de traductions se terminent traditionnellement par \".___LABEL___\" mais pas systématiquement.\n" +
            "Il est aussi important de noter que l'agent de traduction a accès à la fois à la mémoire de l'application mais aussi à une mémoire qui lui est propre en tant qu'agent. Tu ne peux pas y accéder mais si tu penses qu'il faut que l'agent se souvienne d'une prise de décision, par exemple si tu as posé une question à l'utilisateur et que la réponse a un impact qui devrait modifier le fonctionnement de l'agent, ou cette réponse est importante pour les prochains appels à l'agent, tu peux lui demander de rendre la demande persistante dans sa mémoire.\n" +
            "Tu as par contre accès à la mémoire de l'application et donc si c'est pertinent tu peux aussi pousser des informations directement dedans et l'agent de traduction pourra les utiliser pour ses prochaines traductions.\n";
        assistant.model = "gpt-4o-mini";
        assistant.tools_functions = true;
        assistant.app_mem_access = true;
        assistant.user_mem_access = true;
        assistant.agent_mem_access = true;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(assistant);

        return assistant;
    }

    private async link_function_to_assistant(assistant: GPTAssistantAPIAssistantVO, module_name: string, function_name: string) {
        const fonction_vo = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, module_name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, function_name)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!fonction_vo) {
            ConsoleHandler.error("Fonction " + function_name + " non trouvée dans le module " + module_name);
            throw new Error("Fonction " + function_name + " non trouvée dans le module " + module_name);
        }

        let assistant_link = await query(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<GPTAssistantAPIAssistantFunctionVO>().assistant_id, assistant.id)
            .filter_by_num_eq(field_names<GPTAssistantAPIAssistantFunctionVO>().function_id, fonction_vo.id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIAssistantFunctionVO>();
        if (!assistant_link) {
            assistant_link = new GPTAssistantAPIAssistantFunctionVO();
            assistant_link.assistant_id = assistant.id;
            assistant_link.function_id = fonction_vo.id;
            assistant_link.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(assistant_link);
        }

        return fonction_vo;
    }
}