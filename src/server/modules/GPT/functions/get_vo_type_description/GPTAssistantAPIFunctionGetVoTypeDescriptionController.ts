import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleTableController from "../../../../../shared/modules/DAO/ModuleTableController";
import GPTAssistantAPIFunctionParamVO from "../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO";
import GPTAssistantAPIFunctionVO from "../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO";
import GPTAssistantAPIThreadVO from "../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO";
import DefaultTranslationVO from "../../../../../shared/modules/Translation/vos/DefaultTranslationVO";
import LangVO from "../../../../../shared/modules/Translation/vos/LangVO";
import TranslatableTextVO from "../../../../../shared/modules/Translation/vos/TranslatableTextVO";
import TranslationVO from "../../../../../shared/modules/Translation/vos/TranslationVO";
import { field_names, reflect } from "../../../../../shared/tools/ObjectHandler";
import { all_promises } from "../../../../../shared/tools/PromiseTools";
import ModuleDAOServer from "../../../DAO/ModuleDAOServer";
import ModuleGPTServer from "../../ModuleGPTServer";
import AssistantVoFieldDescription from "./AssistantVoFieldDescription";
import AssistantVoTypeDescription from "./AssistantVoTypeDescription";

export default class GPTAssistantAPIFunctionGetVoTypeDescriptionController {

    /**
     * On renvoie la description d'un type d'objet (VO) en fonction de son api_type_id (son identifiant unique de type d'objet), ainsi que les descriptions de ses champs
     * @param thread_vo
     */
    public static async run_action(
        thread_vo: GPTAssistantAPIThreadVO,
        api_type_id: string,
    ): Promise<AssistantVoTypeDescription> {

        const res: AssistantVoTypeDescription = new AssistantVoTypeDescription();

        if (!api_type_id) {
            res.error = 'api_type_id is required';
            return res;
        }

        const module_table = ModuleTableController.module_tables_by_vo_type[api_type_id];
        if (!module_table) {
            res.error = 'api_type_id not found';
            return res;
        }

        res.api_type_id = api_type_id;

        if (module_table.label && module_table.label.code_text) {
            const trad = await query(TranslationVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, module_table.label.code_text, TranslatableTextVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<LangVO>().code_lang, DefaultTranslationVO.DEFAULT_LANG_DEFAULT_TRANSLATION, LangVO.API_TYPE_ID)
                .exec_as_server()
                .select_vo<TranslationVO>();
            res.name = trad ? trad.translated : null;
        }
        res.description = module_table.description;

        const fields: AssistantVoFieldDescription[] = [];
        const module_table_fields = module_table.get_fields();

        // On ajoute l'id et le _type :
        const field_desc_id = new AssistantVoFieldDescription();
        field_desc_id.api_type_id = api_type_id;
        field_desc_id.vo_field_name = 'id';
        field_desc_id.name = 'Identifiant unique du VO';
        field_desc_id.description = 'Identifiant unique de type number, auto-incrémenté en base de données';
        field_desc_id.vo_field_type = 'number';
        fields.push(field_desc_id);

        const field_desc_type = new AssistantVoFieldDescription();
        field_desc_type.api_type_id = api_type_id;
        field_desc_type.vo_field_name = '_type';
        field_desc_type.name = 'Type du VO - équivalent à l\'api_type_id';
        field_desc_type.description = 'Type de l\'objet, permet de différencier les objets de différents types. Correspond à l\'api_type_id de l\'objet';
        field_desc_type.vo_field_type = 'string';
        fields.push(field_desc_type);

        const promises = [];
        for (const i in module_table_fields) {
            const field = module_table_fields[i];

            promises.push((async () => {
                const field_desc = await AssistantVoFieldDescription.from_vo_field(field);
                fields.push(field_desc);
            })());
        }
        await all_promises(promises);

        res.fields = fields;

        return res;
    }

    /**
     * Crée la fonction et ses paramètres si elle n'existe pas
     */
    public static async create_function_and_params_description_if_not_exists() {

        const gpt_function_name: string = ModuleGPTServer.getInstance().name + '__' + reflect<ModuleGPTServer>().assistant_function_get_vo_type_description_controller;
        let func: GPTAssistantAPIFunctionVO = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, gpt_function_name)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();

        if (!!func) {
            return;
        }

        func = new GPTAssistantAPIFunctionVO();
        func.gpt_function_description = 'Obtenir la description d\'un type d\'objet (VO) en fonction de son api_type_id (son identifiant unique de type d\'objet), ainsi que les descriptions de ses champs';
        func.gpt_function_name = gpt_function_name;
        func.module_name = ModuleGPTServer.getInstance().name;
        func.module_function = reflect<ModuleGPTServer>().assistant_function_get_vo_type_description_controller as string;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(func);

        await GPTAssistantAPIFunctionGetVoTypeDescriptionController.create_params_description_if_not_exists(func);
    }

    public static async create_params_description_if_not_exists(func: GPTAssistantAPIFunctionVO) {
        // api_type_id: number,
        const api_type_id_param: GPTAssistantAPIFunctionParamVO = new GPTAssistantAPIFunctionParamVO();
        api_type_id_param.gpt_funcparam_name = 'api_type_id';
        api_type_id_param.gpt_funcparam_description = 'L\'identifiant unique de type d\'objet (son api_type_id) pour lequel on veut obtenir la description';
        api_type_id_param.function_id = func.id;
        api_type_id_param.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
        api_type_id_param.required = true;
        api_type_id_param.weight = 0;
        api_type_id_param.default_json_value = null;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(api_type_id_param);
    }
}