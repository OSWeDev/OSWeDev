import { IDatabase } from 'pg-promise';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import ModuleGPT from '../../../shared/modules/GPT/ModuleGPT';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import GPTAssistantAPIAssistantFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantFunctionVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';

export default class Patch20250728AddOseliaRealtimeFunctionCheckAssistant implements IGeneratorWorker {

    private static instance: Patch20250728AddOseliaRealtimeFunctionCheckAssistant = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250728AddOseliaRealtimeFunctionCheckAssistant';
    }

    public static getInstance(): Patch20250728AddOseliaRealtimeFunctionCheckAssistant {
        if (!Patch20250728AddOseliaRealtimeFunctionCheckAssistant.instance) {
            Patch20250728AddOseliaRealtimeFunctionCheckAssistant.instance = new Patch20250728AddOseliaRealtimeFunctionCheckAssistant();
        }
        return Patch20250728AddOseliaRealtimeFunctionCheckAssistant.instance;
    }

    public async work(db: IDatabase<unknown>) {

        // Vérifier si l'assistant de vérification existe déjà
        let check_assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().nom, ModuleGPT.ASSISTANT_CHECK_OSELIA_REALTIME_FUNCTION)
            .exec_as_server()
            .select_vo<GPTAssistantAPIAssistantVO>();

        if (!check_assistant) {
            // Créer l'assistant de vérification
            check_assistant = new GPTAssistantAPIAssistantVO();
            check_assistant.gpt_assistant_id = 'TODO'; // Sera mis à jour lors de la sync avec OpenAI
            check_assistant.nom = ModuleGPT.ASSISTANT_CHECK_OSELIA_REALTIME_FUNCTION;
            check_assistant.description = 'Assistant spécialisé dans la vérification de la cohérence des appels de fonction lors des interactions en temps réel avec Osélia';
            check_assistant.instructions = `Tu es un assistant de vérification spécialisé pour Osélia.

Ton rôle est d'analyser les appels de fonction que d'autres assistants tentent d'effectuer et de vérifier leur cohérence avant exécution.

Quand on te présente un appel de fonction avec ses paramètres, tu dois :

1. **Analyser la cohérence** de la demande :
   - Les paramètres fournis sont-ils logiques et complets ?
   - La fonction demandée correspond-elle réellement au besoin exprimé ?
   - Y a-t-il des incohérences flagrantes ou des informations manquantes critiques ?

2. **Évaluer le niveau de confiance** :
   - Si la demande est claire et cohérente : autoriser l'exécution
   - Si il y a des doutes ou des incohérences : demander des clarifications
   - Si la demande est manifestement erronée : refuser l'exécution

3. **Fournir un retour constructif** :
   - En cas de refus ou de doute : expliquer clairement ce qui pose problème
   - Suggérer des questions à poser à l'utilisateur pour clarifier
   - Proposer des alternatives si approprié

Tu dois être particulièrement vigilant sur :
- La cohérence entre la demande utilisateur originale et l'appel de fonction
- La complétude des paramètres requis
- La logique métier de la demande
- Les potentiels risques ou effets de bord

Réponds par "AUTORISE" si l'appel de fonction est cohérent, ou par "REFUSE" suivi de tes recommandations si ce n'est pas le cas.`;

            check_assistant.model = 'gpt-4o-mini';
            await ModuleDAO.instance.insertOrUpdateVO(check_assistant);
        }

        // Créer la fonction pour demander à un assistant de re-réfléchir
        await this.create_rethink_function_if_not_exists(check_assistant);
    }

    private async create_rethink_function_if_not_exists(assistant: GPTAssistantAPIAssistantVO): Promise<void> {
        const function_name = 'request_assistant_rethink';

        // Vérifier si la fonction existe déjà
        let rethink_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, function_name)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();

        if (!rethink_function) {
            // Créer la fonction
            rethink_function = new GPTAssistantAPIFunctionVO();
            rethink_function.gpt_function_name = function_name;
            rethink_function.gpt_function_description = 'Demande à un assistant de re-réfléchir à sa demande d\'appel de fonction en précisant les problèmes identifiés';
            rethink_function.module_name = 'GPT';
            rethink_function.module_function = 'request_assistant_rethink';
            rethink_function.prepend_thread_vo = true;
            rethink_function.json_stringify_output = false;
            rethink_function.use_promise_pipeline = false;
            rethink_function.promise_pipeline_max_concurrency = 1;

            await ModuleDAO.instance.insertOrUpdateVO(rethink_function);

            // Lier la fonction à l'assistant
            const assistant_function = new GPTAssistantAPIAssistantFunctionVO();
            assistant_function.assistant_id = assistant.id;
            assistant_function.function_id = rethink_function.id;
            await ModuleDAO.instance.insertOrUpdateVO(assistant_function);

            // Créer les paramètres de la fonction
            await this.create_rethink_function_params(rethink_function);
        }
    }

    private async create_rethink_function_params(function_vo: GPTAssistantAPIFunctionVO): Promise<void> {
        const params = [
            {
                name: 'function_name',
                description: 'Nom de la fonction pour laquelle la re-réflexion est demandée',
                type: GPTAssistantAPIFunctionParamVO.TYPE_STRING,
                required: true,
                weight: 0
            },
            {
                name: 'current_arguments',
                description: 'Arguments actuellement fournis pour l\'appel de fonction (en JSON)',
                type: GPTAssistantAPIFunctionParamVO.TYPE_STRING,
                required: true,
                weight: 1
            },
            {
                name: 'issues_identified',
                description: 'Description des problèmes identifiés avec l\'appel de fonction actuel',
                type: GPTAssistantAPIFunctionParamVO.TYPE_STRING,
                required: true,
                weight: 2
            },
            {
                name: 'suggestions',
                description: 'Suggestions pour améliorer l\'appel de fonction ou questions à poser à l\'utilisateur',
                type: GPTAssistantAPIFunctionParamVO.TYPE_STRING,
                required: false,
                weight: 3
            }
        ];

        for (const param of params) {
            // Vérifier si le paramètre existe déjà
            const existing_param = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<GPTAssistantAPIFunctionParamVO>().function_id, function_vo.id)
                .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, param.name)
                .exec_as_server()
                .select_vo<GPTAssistantAPIFunctionParamVO>();

            if (!existing_param) {
                const function_param = new GPTAssistantAPIFunctionParamVO();
                function_param.function_id = function_vo.id;
                function_param.gpt_funcparam_name = param.name;
                function_param.gpt_funcparam_description = param.description;
                function_param.type = param.type;
                function_param.required = param.required;
                function_param.weight = param.weight;

                await ModuleDAO.instance.insertOrUpdateVO(function_param);
            }
        }
    }
}
