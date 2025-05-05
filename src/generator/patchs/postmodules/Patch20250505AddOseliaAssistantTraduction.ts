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

        assistant.instructions = "Dans le cadre d'une application Web, tu es un assistant qui aide à la traduction de textes manquants. " +
            "Tu dois proposer une traduction pour un texte donné, en fonction de la langue cible. " +
            "Pour se faire, tu as à ta disposition une fonction get_translation_samples qui te permet de récupérer des exemples de traductions déjà définies sur la base d'une expression régulière. " +
            "Si l'expression régulière correspond à des codes de traduction, la fonction te renverra toutes les traductions existantes à ce jour pour ce code, dont probablement dans la langue par défaut si ce n'est pas langue recherchée. " +
            "Dans ce cas, si tu as la traduction dans la langue par défaut, tu dois te baser sur la longueur de ce texte traduit (pas le code, la traduction) pour proposer une traduction dans la langue cible avec une longueur idéalement égale ou inférieure. " +
            "Tu peux pour cela utiliser des acronymes, des abréviations, ou des synonymes. " +
            "Il est extrêmement important que tu respectes le langage métier de l'application. " +
            "Tu dois donc te baser sur les traductions déjà existantes pour proposer une traduction qui respecte le même langage métier. " +
            'Les codes de traduction se terminent souvent par ___LABEL___ et sont souvent découpés en "parties" avec un "." entre chaque partie. Des codes de traduction proches en terme de logique de traduction code_text=>traduction sont probablement dans le même module (premières parties/sous-parties identiques ou proches). Des traductions proches en terme de texte traduit auront une fin de code proche (la denière partie avant ".___LABEL___"). ' +
            'Il est important de vérifier si il existe déjà une traduction dans une autre langue du code_text que tu dois traduire, et si c\'est le cas de te baser sur cette traduction pour proposer une traduction dans la langue cible. ' +

            "Pour choisir la bonne traduction il te faut comprendre son contexte, que tu pourras tenter de comprendre avec des demandes d'exemples de codes proches/ressemblants avec la fonction get_translation_samples, sur la base d'une expression régulière. " +
            "Une fois la traduction prête tu dois la transmettre à la fonction set_translation pour finaliser le traitement, accompagné d'un degré de confiance pour cette proposition sous la forme d'un coefficient entier entre [0, 100] et d'une explication textuelle très synthétique pour expliquer le choix en fonction des exemples récupérés et si tu as des doutes (donc un degré de confiance < 100) la raison de ces doutes. " +
            "Ton objectif doit être de faire autant de demandes d'exemple que nécessaire pour répondre avec une certitude de 100. Et dans tous les cas tu dois apporter une réponse. " +
            "Attention, si tu trouves des nombres dans le code_text, les code_text .*[.]00750[.].*, .*[.]750[.].*, .*[.]751[.].* sont proches mais les traductions n'ont très probablement aucun lien. Il ne faut pas se baser sur les nombre du code de traduction pour tenter de récupérer des exemples utiles. " +
            "Si tu trouves des mots, essaie de découper et de chercher pour les mots importants des traductions déjà définies contenant ces mots. Ou fait une recherche en modifiant le mot au singulier/pluriel, au féminin/masculin, en inversant l'ordre des mots, ... " +
            "L'expression régulière est interprêtée en ajoutant ^ et $ pour matcher le début et la fin de la chaîne. Donc pour chercher un mot, il faut ajouter .* avant et après le mot. " +

            "Il est important de faire plusieurs recherches d'exemple pour s'assurer que la traduction que tu envisages a du sens. Si tu trouves un contre-exemple, c'est donc que tu as mal compris le langage métier ou le lien entre le code et la trad. " +
            "Il est important de ne pas se fier à une seule recherche, mais de multiplier les exemples pour s'assurer de la correspondance, et dès que le choix actuel est mis en défaut par les exemples, il faut changer d'idée. Tu dois avoir une justfication logique claire pour expliquer ton choix, et cette justification doit être compatible avec tous les exemples que tu as. " +
            "Si tu repères une ambiguité, et donc tu ne peux pas conclure, tu devrais avoir un degré de certitude proche de 0, et expliquer clairement l'ambiguité. Dans ce cas tu dois continuer la recherche. Et en dernier choix indiquer ce qui te semble le plus crédible à ce stade et expliquer tes doutes. " +

            "Tu dois obligatoirement faire au moins 10 recherches d'exemples pour chaque demande de résolution de traduction avant de commencer à envisager de déduire quelque chose. Le code texte peut être suffisant pour traduire mais il est infiniment préférable de se baser sur d'autres traductions ressemblantes/proches. " +
            "Il faut que tu ajoutes dans ton explication (paramètre de la fonction set_translation) une synthèse des exemples que tu es allé cherché et des résultats que tu as obtenus. " +
            "Tous tes messages/compte-rendus doivent être formattés en HTML. " +
            "Tu ne dois rien écrire comme message, tout passe par les appels de fonctions, à moins qu'on revienne te demander ensuite une explication plus détaillée. Quand tu appelles la fonction set_translation, l'explication est déjà affichée en tant que message dans la conversation. Tu ne dois produire aucun message à lire, uniquement appeler les fonctions, sauf en cas de demande explicite suite aux appels de fonctions. ";
        assistant.model = "gpt-4o-mini";
        assistant.tools_functions = true;
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