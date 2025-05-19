import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import GPTAssistantAPIServerSyncAssistantsController from "../../../server/modules/GPT/sync/GPTAssistantAPIServerSyncAssistantsController";
import OseliaServerController from "../../../server/modules/Oselia/OseliaServerController";
import ModuleTranslationServer from "../../../server/modules/Translation/ModuleTranslationServer";
import AssistantTraductionCronWorker, { IParamOseliaAssistantTraduction } from "../../../server/modules/Translation/workers/AssistantTraduction/AssistantTraductionCronWorker";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import GPTAssistantAPIAssistantFunctionVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantFunctionVO";
import GPTAssistantAPIAssistantVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO";
import GPTAssistantAPIFunctionParamVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO";
import GPTAssistantAPIFunctionVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO";
import OseliaPromptVO from "../../../shared/modules/Oselia/vos/OseliaPromptVO";
import ModuleTranslation from "../../../shared/modules/Translation/ModuleTranslation";
import { field_names, reflect } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250505AddOseliaAssistantTraduction implements IGeneratorWorker {

    private static instance: Patch20250505AddOseliaAssistantTraduction = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250505AddOseliaAssistantTraduction';
    }

    public static getInstance(): Patch20250505AddOseliaAssistantTraduction {
        if (!Patch20250505AddOseliaAssistantTraduction.instance) {
            Patch20250505AddOseliaAssistantTraduction.instance = new Patch20250505AddOseliaAssistantTraduction();
        }
        return Patch20250505AddOseliaAssistantTraduction.instance;
    }

    public async work(db: IDatabase<unknown>) {
        // On lance une synchro des assistants d'abord, dans le doute
        await GPTAssistantAPIServerSyncAssistantsController.sync_assistants();

        // On récupère l'assistant traduction
        let assistant: GPTAssistantAPIAssistantVO = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().nom, AssistantTraductionCronWorker.OSELIA_assistant_traduction_ASSISTANT_NAME)
            .exec_as_server()
            .select_vo<GPTAssistantAPIAssistantVO>();

        if (!assistant) {
            // On déclare l'assistant s'il n'existe pas
            assistant = await this.declare_assistant();
        }

        await this.declare_fonction_get_translation_samples(assistant);
        await this.declare_fonction_set_translation(assistant);

        // On déclare aussi le prompt de l'assistant traduction
        let prompt_assistant_traduction = await query(OseliaPromptVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaPromptVO>().name, AssistantTraductionCronWorker.OSELIA_assistant_traduction_PROMPT_NAME)
            .exec_as_server()
            .select_vo<OseliaPromptVO>();

        if (!prompt_assistant_traduction) {
            prompt_assistant_traduction = new OseliaPromptVO();
            prompt_assistant_traduction.name = AssistantTraductionCronWorker.OSELIA_assistant_traduction_PROMPT_NAME;

            prompt_assistant_traduction.prompt = 'Traduction manquante : code_text "' + OseliaServerController.wrap_param_name_for_prompt(reflect<IParamOseliaAssistantTraduction>().code_text) +
                '", code_langue "' + OseliaServerController.wrap_param_name_for_prompt(reflect<IParamOseliaAssistantTraduction>().code_lang) + '". ' +
                'Le code de la langue par défaut est "' + OseliaServerController.wrap_param_name_for_prompt(reflect<IParamOseliaAssistantTraduction>().default_lang_code) + '".';
            prompt_assistant_traduction.prompt_description = "Prompt pour résoudre une traduction manquante pour un code_text et un code_langue donnés.";
            prompt_assistant_traduction.prompt_parameters_description = {
                [reflect<IParamOseliaAssistantTraduction>().code_lang]: 'Le code de la langue dans laquelle il faut proposer une traduction',
                [reflect<IParamOseliaAssistantTraduction>().code_text]: 'Le code du texte à traduire',
                [reflect<IParamOseliaAssistantTraduction>().default_lang_code]: 'Le code de la langue par défaut de l\'application',
                [reflect<IParamOseliaAssistantTraduction>().lang_id]: 'L\'id de la langue dans laquelle il faut proposer une traduction',
                [reflect<IParamOseliaAssistantTraduction>().missing_elt_id]: 'L\'id de l\'élément à traduire',
            };

            prompt_assistant_traduction.default_assistant_id = assistant.id;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(prompt_assistant_traduction);
        }
    }

    private async declare_assistant(): Promise<GPTAssistantAPIAssistantVO> {
        const assistant: GPTAssistantAPIAssistantVO = new GPTAssistantAPIAssistantVO();
        assistant.nom = AssistantTraductionCronWorker.OSELIA_assistant_traduction_ASSISTANT_NAME;
        assistant.description = "Assistant OSELIA pour la résolution des traductions manquantes";
        assistant.archived = false;

        assistant.instructions = "Dans le cadre de la traduction des UI strings pour l'application web interne Stellantis (ventes pièces de rechange & KPIs), ton rôle est de fournir des traductions précises en respectant strictement le langage métier et en maintenant une longueur en anglais égale ou inférieure au texte original en français afin de préserver l'affichage.\n " +

            "Tu as obligatoirement à ta disposition :\n " +
            "1. En tout premier lieu tu dois systématiquement charger le lexique de l'application pour améliorer ta traduction : la clé de l'app_mem doit contenir le mot \"Lexique\" ou \"Glossaire\" ;" +
            "2. la fonction get_translation_samples(regex) pour récupérer des traductions existantes à partir d'expressions régulières ;\n " +
            "2. la mémoire applicative 'Lexique métier (FR → EN)' qui contient obligatoirement le jargon métier exact à utiliser.\n " +

            "Pour chaque traduction :\n " +
            "- Vérifie en premier lieu s'il existe une traduction du même code dans une autre langue via get_translation_samples(). Si elle existe, base-toi dessus pour produire ta traduction.\n " +
            "- Analyse également les traductions des codes proches (logique similaire, même module ou terminant par une partie similaire avant '.___LABEL___').\n " +
            "- Effectue obligatoirement au moins 10 recherches d'exemples pour chaque traduction demandée.\n " +
            "- Si les recherches montrent un contre-exemple à ta traduction envisagée, modifie ton choix immédiatement et poursuis tes recherches jusqu'à certitude.\n " +

            "Règles spécifiques à respecter absolument :\n " +
            "- Conserve toujours les identifiants de codes intacts.\n " +
            "- Si une traduction est ambiguë ou manque au lexique métier, indique explicitement un niveau de confiance inférieur à 50 et demande de l'aide.\n " +
            "- Ignore les nombres présents dans les codes (ex : .*[.]00750[.].*, .*[.]750[.].*, .*[.]751[.].*) pour déterminer une proximité de sens.\n " +
            "- Si un mot important manque dans le lexique, recherche-le en adaptant la forme (singulier/pluriel, masculin/féminin, inversion ordre des mots).\n " +
            "- Lorsque tu obtiens une traduction existante en langue par défaut, ta traduction proposée doit être aussi courte ou plus courte, en utilisant acronymes, abréviations ou synonymes sans altérer le sens métier.\n " +

            "Ton workflow est strictement celui-ci :\n " +
            "1. Recherche systématiquement dans la mémoire applicative (app_mem) le lexique/glossaire et dans ta mémoire agent (agent_mem) des informations complémentaires.\n " +
            "2. Effectue au moins 10 appels à get_translation_samples avant d'envisager une traduction.\n " +
            "3. Formule une traduction, évalue ta confiance entre 0 et 100 (100 = certitude totale).\n " +
            "4. Envoie la traduction avec set_translation accompagnée obligatoirement d'une explication synthétique (format HTML) détaillant clairement : les exemples consultés, ton raisonnement, et la raison précise de tout doute éventuel.\n " +

            "Ne génère aucun message spontané, utilise uniquement les appels de fonctions sauf si une explication détaillée supplémentaire t'est explicitement demandée par la suite.";
        assistant.model = "gpt-4o-mini";
        assistant.tools_functions = true;
        assistant.app_mem_access = true;
        assistant.user_mem_access = true;
        assistant.agent_mem_access = true;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(assistant);

        return assistant;
    }

    private async declare_fonction_get_translation_samples(assistant: GPTAssistantAPIAssistantVO): Promise<GPTAssistantAPIFunctionVO> {
        let fonction_get_translation_samples = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleTranslation.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleTranslationServer>().get_translation_samples)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!fonction_get_translation_samples) {
            fonction_get_translation_samples = new GPTAssistantAPIFunctionVO();

            fonction_get_translation_samples.archived = false;
            fonction_get_translation_samples.module_function = reflect<ModuleTranslationServer>().get_translation_samples;
            fonction_get_translation_samples.module_name = ModuleTranslation.getInstance().name;
            fonction_get_translation_samples.prepend_thread_vo = true;
            fonction_get_translation_samples.gpt_function_name = reflect<ModuleTranslationServer>().get_translation_samples;
            fonction_get_translation_samples.gpt_function_description = "Cette fonction permet de récupérer des exemples de traductions déjà définies sur la base d'une expression régulière. " +
                "Elle prend en argument une expression régulière qui permet de filtrer les traductions par le code_text traduit. " +
                "Elle retourne une liste d'exemples -limitée à 100 code_text- de traductions déjà définies, avec les code_lang.";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(fonction_get_translation_samples);

            const argument = new GPTAssistantAPIFunctionParamVO();
            argument.archived = false;
            argument.function_id = fonction_get_translation_samples.id;
            argument.gpt_funcparam_description = "Expression régulière pour filtrer les exemples de traduction à récupérer. On filtre le code_text traduit, pas la traduction.";
            argument.gpt_funcparam_name = "regex";
            argument.required = true;
            argument.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument.weight = 1;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument);
        }

        let assistant_link = await query(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<GPTAssistantAPIAssistantFunctionVO>().assistant_id, assistant.id)
            .filter_by_num_eq(field_names<GPTAssistantAPIAssistantFunctionVO>().function_id, fonction_get_translation_samples.id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIAssistantFunctionVO>();
        if (!assistant_link) {
            assistant_link = new GPTAssistantAPIAssistantFunctionVO();
            assistant_link.assistant_id = assistant.id;
            assistant_link.function_id = fonction_get_translation_samples.id;
            assistant_link.weight = 2;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(assistant_link);
        }

        return fonction_get_translation_samples;
    }

    private async declare_fonction_set_translation(assistant: GPTAssistantAPIAssistantVO): Promise<GPTAssistantAPIFunctionVO> {
        let fonction_set_translation = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleTranslation.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleTranslationServer>().set_translation)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!fonction_set_translation) {
            fonction_set_translation = new GPTAssistantAPIFunctionVO();

            fonction_set_translation.archived = false;
            fonction_set_translation.module_function = reflect<ModuleTranslationServer>().set_translation;
            fonction_set_translation.module_name = ModuleTranslation.getInstance().name;
            fonction_set_translation.prepend_thread_vo = true;
            fonction_set_translation.gpt_function_name = reflect<ModuleTranslationServer>().set_translation;
            fonction_set_translation.gpt_function_description = "Cette fonction permet de fixer la traduction du code_text dans le code_lang. L'information du code_text et du code_lang sont connues par la fonction et n'ont pas besoin de passer en argument. " +
                "En revanche il est important d'informer sur la raison du choix et les doutes que tu peux avoir en utilisant les arguments dédiés. " +
                "Le but reste bien dans la grande majorité des cas de répondre avec une certitude de 100, sinon il faut continuer de chercher des exemples pour affiner la solution.";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(fonction_set_translation);


            const argument_target_id = new GPTAssistantAPIFunctionParamVO();
            argument_target_id.archived = false;
            argument_target_id.function_id = fonction_set_translation.id;
            argument_target_id.gpt_funcparam_description = "Traduction proposée pour le code_text dans la lange code_lang";
            argument_target_id.gpt_funcparam_name = "traduction";
            argument_target_id.required = true;
            argument_target_id.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_target_id.weight = 1;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_target_id);
            const argument_degre_certitude = new GPTAssistantAPIFunctionParamVO();
            argument_degre_certitude.archived = false;
            argument_degre_certitude.function_id = fonction_set_translation.id;
            argument_degre_certitude.gpt_funcparam_description = "Le degré de certitude de cette solution proposée, entre 0 et 100 inclus. 100 signifie que tu es sûr de ta réponse, 0 que tu n'es pas sûr du tout.";
            argument_degre_certitude.gpt_funcparam_name = "degre_certitude";
            argument_degre_certitude.required = true;
            argument_degre_certitude.type = GPTAssistantAPIFunctionParamVO.TYPE_INTEGER;
            argument_degre_certitude.weight = 2;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_degre_certitude);

            const argument_explication = new GPTAssistantAPIFunctionParamVO();
            argument_explication.archived = false;
            argument_explication.function_id = fonction_set_translation.id;
            argument_explication.gpt_funcparam_description = "Explication du choix de la traduction, très synthétique, et au besoin (certitude < 100) une explication des doutes aussi que tu peux avoir.";
            argument_explication.gpt_funcparam_name = "explication";
            argument_explication.required = true;
            argument_explication.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_explication.weight = 3;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_explication);
        }

        let assistant_link = await query(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<GPTAssistantAPIAssistantFunctionVO>().assistant_id, assistant.id)
            .filter_by_num_eq(field_names<GPTAssistantAPIAssistantFunctionVO>().function_id, fonction_set_translation.id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIAssistantFunctionVO>();
        if (!assistant_link) {
            assistant_link = new GPTAssistantAPIAssistantFunctionVO();
            assistant_link.assistant_id = assistant.id;
            assistant_link.function_id = fonction_set_translation.id;
            assistant_link.weight = 3;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(assistant_link);
        }

        return fonction_set_translation;
    }
}