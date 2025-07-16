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

        await this.declare_fonction_get_translation_samples_by_code_text(assistant);
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

        assistant.instructions = "Dans le cadre de la traduction des textes de l'UI pour une application web, ton rôle est de fournir des traductions précises en respectant le langage métier et en maintenant une longueur dans la nouvelle langue égale ou inférieure au texte original dans la langue par défaut afin de préserver l'affichage.\n " +
            "\n" +
            "Tu as à ta disposition :\n " +
            "- la fonction get_translation_samples_by_code_text(regex) pour récupérer des traductions existantes à partir d'expressions régulières du code de traduction. Par exemple si tu dois traduire le code admin.menu.user.tooltip.___LABEL___, tu peux t'intéresser à connaître les traductions existantes pour 'admin[.]menu[.][^.]+[.]tooltip[.]___LABEL___' pour tenter de voir comment sont construites les autres tooltips du menu si il y en a.\n " +
            "- la fonction get_translation_samples_by_translated_text(regex) pour récupérer des traductions existantes à partir d'expressions régulières du texte traduit. Par exemple si tu dois traduire en anglais le code admin.menu.user.tooltip.___LABEL___, et que dans la traduction en français de ce code tu trouves \"Cette page permet de configurer les utilisateurs de l'application\", tu peux t'intéresser aux traductions qui contiendrait l'expression \"utilisateurs de l'application\" pour essayer de voir si cette espression a déjà été traduite en anglais et si oui comment.\n " +
            "- la mémoire applicative, la mémoire agent, qui sont là pour t'aider à préciser ton fonctionnement ou t'apporter des subtilités importantes sur le language métier.\n " +
            "\n" +
            "Pour chaque traduction :\n " +
            "- Si tu as une traduction existante dans une autre langue que celle demandée pour ce code text, base-toi dessus pour produire ta traduction.\n " +
            "- Analyse également les traductions des codes proches (logique similaire, même module ou terminant par une partie similaire avant '.___LABEL___'. La terminaison en ___LABEL___ est habituelle).\n " +
            "- Effectue obligatoirement au moins 10 recherches d'exemples pour chaque traduction demandée, en privilégiant les recherches par texte plutôt que par code (avec get_translation_samples_by_translated_text) pour maintenir une cohérence dans les textes de la solution\n " +
            "- Si les recherches montrent un contre-exemple à ta traduction envisagée, modifie ton choix immédiatement et poursuis tes recherches jusqu'à certitude.\n " +
            "\n" +
            "Règles spécifiques à respecter absolument :\n " +
            "- Si un lexique t'es fourni, et si des expressions ou des acronymes du texte que tu dois traduire (pas dans le code mais dans la traduction dans une autre langue peut-etre) apparaissent dedans, tu dois le respecter.\n " +
            "- Ignore les nombres présents dans les codes (ex : .*[.]00750[.].*, .*[.]750[.].*, .*[.]751[.].*) pour déterminer une proximité de sens.\n " +
            "- Si un mot important manque dans le lexique, recherche-le en adaptant la forme (singulier/pluriel, masculin/féminin, inversion ordre des mots).\n " +
            "- Lorsque tu obtiens une traduction existante en langue par défaut, ta traduction proposée doit être aussi courte ou plus courte, en utilisant acronymes, abréviations ou synonymes sans altérer le sens métier.\n " +
            "- Reste cohérent avec les traductions déjà existantes dans la langue demandée. Si l'on traduit 'L'application' par 'The application' dans une autre partie de l'application, utilise 'The application' pour ce code_text aussi. Si on utilise 'WebApp', alors tu dois continuer d'utiliser WepApp.\n " +
            "- A la fin du processus et quelque soit l'issue de celui-ci, envoie la traduction avec set_translation accompagnée obligatoirement d'une explication synthétique (format HTML) détaillant clairement : les exemples consultés, ton raisonnement, et la raison précise de tout doute éventuel.\n " +
            "\n" +
            "Ne génère aucun message spontané, utilise uniquement les appels de fonctions sauf si une explication détaillée supplémentaire t'est explicitement demandée par la suite.";
        assistant.model = "gpt-4o-mini";
        assistant.tools_functions = true;
        assistant.app_mem_access = true;
        assistant.user_mem_access = true;
        assistant.agent_mem_access = true;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(assistant);

        return assistant;
    }

    private async declare_fonction_get_translation_samples_by_code_text(assistant: GPTAssistantAPIAssistantVO): Promise<GPTAssistantAPIFunctionVO> {
        let fonction_get_translation_samples_by_code_text = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleTranslation.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleTranslationServer>().get_translation_samples_by_code_text)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!fonction_get_translation_samples_by_code_text) {
            fonction_get_translation_samples_by_code_text = new GPTAssistantAPIFunctionVO();

            fonction_get_translation_samples_by_code_text.archived = false;
            fonction_get_translation_samples_by_code_text.module_function = reflect<ModuleTranslationServer>().get_translation_samples_by_code_text;
            fonction_get_translation_samples_by_code_text.module_name = ModuleTranslation.getInstance().name;
            fonction_get_translation_samples_by_code_text.prepend_thread_vo = true;
            fonction_get_translation_samples_by_code_text.gpt_function_name = reflect<ModuleTranslationServer>().get_translation_samples_by_code_text;
            fonction_get_translation_samples_by_code_text.gpt_function_description = "Cette fonction permet de récupérer des exemples de traductions déjà définies sur la base d'une expression régulière. " +
                "Elle prend en argument une expression régulière qui permet de filtrer les traductions par le code_text traduit. " +
                "Elle retourne une liste d'exemples -limitée à 100 code_text- de traductions déjà définies, avec les code_lang.";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(fonction_get_translation_samples_by_code_text);

            const argument = new GPTAssistantAPIFunctionParamVO();
            argument.archived = false;
            argument.function_id = fonction_get_translation_samples_by_code_text.id;
            argument.gpt_funcparam_description = "Expression régulière pour filtrer les exemples de traduction à récupérer. On filtre le code_text traduit, pas la traduction.";
            argument.gpt_funcparam_name = "regex";
            argument.required = true;
            argument.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument.weight = 1;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument);
        }

        let assistant_link = await query(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<GPTAssistantAPIAssistantFunctionVO>().assistant_id, assistant.id)
            .filter_by_num_eq(field_names<GPTAssistantAPIAssistantFunctionVO>().function_id, fonction_get_translation_samples_by_code_text.id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIAssistantFunctionVO>();
        if (!assistant_link) {
            assistant_link = new GPTAssistantAPIAssistantFunctionVO();
            assistant_link.assistant_id = assistant.id;
            assistant_link.function_id = fonction_get_translation_samples_by_code_text.id;
            assistant_link.weight = 2;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(assistant_link);
        }

        return fonction_get_translation_samples_by_code_text;
    }


    private async declare_fonction_get_translation_samples_by_translated_text(assistant: GPTAssistantAPIAssistantVO): Promise<GPTAssistantAPIFunctionVO> {
        let fonction_get_translation_samples_by_translated_text = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleTranslation.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleTranslationServer>().get_translation_samples_by_translated_text)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!fonction_get_translation_samples_by_translated_text) {
            fonction_get_translation_samples_by_translated_text = new GPTAssistantAPIFunctionVO();

            fonction_get_translation_samples_by_translated_text.archived = false;
            fonction_get_translation_samples_by_translated_text.module_function = reflect<ModuleTranslationServer>().get_translation_samples_by_translated_text;
            fonction_get_translation_samples_by_translated_text.module_name = ModuleTranslation.getInstance().name;
            fonction_get_translation_samples_by_translated_text.prepend_thread_vo = true;
            fonction_get_translation_samples_by_translated_text.gpt_function_name = reflect<ModuleTranslationServer>().get_translation_samples_by_translated_text;
            fonction_get_translation_samples_by_translated_text.gpt_function_description = "Cette fonction permet de récupérer des exemples de traductions déjà définies sur la base d'une expression régulière. " +
                "Elle prend en argument une expression régulière qui permet de filtrer les traductions par le code_text traduit. " +
                "Elle retourne une liste d'exemples -limitée à 100 code_text- de traductions déjà définies, avec les code_lang.";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(fonction_get_translation_samples_by_translated_text);

            const argument = new GPTAssistantAPIFunctionParamVO();
            argument.archived = false;
            argument.function_id = fonction_get_translation_samples_by_translated_text.id;
            argument.gpt_funcparam_description = "Expression régulière pour filtrer les exemples de traduction à récupérer. On filtre le code_text traduit, pas la traduction.";
            argument.gpt_funcparam_name = "regex";
            argument.required = true;
            argument.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument.weight = 1;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument);
        }

        let assistant_link = await query(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<GPTAssistantAPIAssistantFunctionVO>().assistant_id, assistant.id)
            .filter_by_num_eq(field_names<GPTAssistantAPIAssistantFunctionVO>().function_id, fonction_get_translation_samples_by_translated_text.id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIAssistantFunctionVO>();
        if (!assistant_link) {
            assistant_link = new GPTAssistantAPIAssistantFunctionVO();
            assistant_link.assistant_id = assistant.id;
            assistant_link.function_id = fonction_get_translation_samples_by_translated_text.id;
            assistant_link.weight = 2;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(assistant_link);
        }

        return fonction_get_translation_samples_by_translated_text;
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