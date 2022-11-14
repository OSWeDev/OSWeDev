import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleContextFilter from '../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DataFilterOption from '../../../shared/modules/DataRender/vos/DataFilterOption';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ModuleServerBase from '../ModuleServerBase';
import ContextQueryServerController from './ContextQueryServerController';
import ParameterizedQueryWrapper from './vos/ParameterizedQueryWrapper';

export default class ModuleContextFilterServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleContextFilterServer.instance) {
            ModuleContextFilterServer.instance = new ModuleContextFilterServer();
        }
        return ModuleContextFilterServer.instance;
    }

    private static instance: ModuleContextFilterServer = null;

    private constructor() {
        super(ModuleContextFilter.getInstance().name);
    }

    public async configure() {
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_select_filter_visible_options, this.select_filter_visible_options.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_select_count, this.select_count.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_select_datatable_rows, this.select_datatable_rows.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_select_vos, this.select_vos.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_select, this.select.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_delete_vos, this.delete_vos.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_update_vos, this.update_vos.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_build_select_query, this.build_select_query.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_select_vo_from_unique_field, this.select_vo_from_unique_field.bind(this));
    }

    /**
     * Compter les résultats
     * @param context_query description de la requête, sans fields si on compte les vos, avec fields si on veut un datatable
     */
    public async select_count(
        context_query: ContextQueryVO
    ): Promise<number> {

        return await ContextQueryServerController.getInstance().select_count(context_query);
    }

    /**
     * Update des vos en appliquant les filtres
     *  1 à un (enfin en paquet de 100) pour appeler les triggers => rien de comparable à un update qui serait faire directement
     *  en bdd côté perf, on pourrait vouloir ajouter cette option mais attention aux triggers qui
     *  ne seraient pas exécutés dans ce cas...
     * @param update_field_id En cas d'update, le nom du champs cible (sur le base_api_type_id)
     * @param new_api_translated_value En cas d'update, la valeur api_translated (par exemple issue de moduletable.default_get_field_api_version)
     *  qu'on va mettre en remplacement de la valeur actuelle
     */
    public async update_vos(
        context_query: ContextQueryVO, update_field_id: string, new_api_translated_value: any
    ): Promise<void> {
        return await ContextQueryServerController.getInstance().update_vos(context_query, update_field_id, new_api_translated_value);
    }

    /**
     * Delete des vos en appliquant les filtres
     *  1 à un (enfin en paquet de 100) pour appeler les triggers => rien de comparable à un delete qui serait faire directement
     *  en bdd côté perf, on pourrait vouloir ajouter cette option mais attention aux triggers qui
     *  ne seraient pas exécutés dans ce cas...
     */
    public async delete_vos(
        context_query: ContextQueryVO
    ): Promise<void> {
        return await ContextQueryServerController.getInstance().delete_vos(context_query);
    }

    /**
     * Récupérer un vo par un field d'unicité
     * @param api_type_id le type de l'objet cherché
     * @param unique_field_id le field_id d'unicité
     * @param unique_field_value la value du field unique
     */
    public async select_vo_from_unique_field<T extends IDistantVOBase>(
        api_type_id: string,
        unique_field_id: string,
        unique_field_value: any,
    ): Promise<T> {

        if ((!api_type_id) || (!unique_field_id) || (unique_field_value == null)) {
            return null;
        }

        let field = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id].getFieldFromId(unique_field_id);
        let filter: ContextFilterVO = new ContextFilterVO();
        filter.vo_type = api_type_id;
        filter.field_id = field.field_id;

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_string:
                filter.param_text = unique_field_value;
                filter.filter_type = ContextFilterVO.TYPE_TEXT_EQUALS_ANY;
                break;
            default:
                throw new Error('Not Implemented');
        }

        let context_query: ContextQueryVO = new ContextQueryVO();
        context_query.base_api_type_id = api_type_id;
        context_query.active_api_type_ids = [api_type_id];
        context_query.filters = [filter];
        context_query.query_limit = 1;

        let res = await this.select_vos<T>(context_query);
        return (res && res.length) ? res[0] : null;
    }

    /**
     * Créer la requête en select
     * @param context_query
     */
    public async build_select_query(
        context_query: ContextQueryVO
    ): Promise<ParameterizedQueryWrapper> {
        return await ContextQueryServerController.getInstance().build_select_query(context_query);
    }

    /**
     * Filtrer des vos avec les context filters
     * @param context_query le champs fields doit être null pour demander des vos complets
     */
    public async select_vos<T extends IDistantVOBase>(
        context_query: ContextQueryVO
    ): Promise<T[]> {
        return await ContextQueryServerController.getInstance().select_vos(context_query);
    }

    /**
     * Filtrer des infos avec les context filters, en indiquant obligatoirement les champs ciblés, qui peuvent appartenir à des tables différentes
     * @param context_query le champs fields doit être rempli avec les champs ciblés par la requête (et avec les alias voulus)
     */
    private async select(context_query: ContextQueryVO): Promise<any[]> {

        return await ContextQueryServerController.getInstance().select(context_query);
    }

    /**
     * Filtrer des infos avec les context filters, en indiquant obligatoirement les champs ciblés, qui peuvent appartenir à des tables différentes
     * @param context_query le champs fields doit être rempli avec les champs ciblés par la requête (et avec les alias voulus)
     */
    private async select_datatable_rows(context_query: ContextQueryVO): Promise<any[]> {

        return await ContextQueryServerController.getInstance().select_datatable_rows(context_query);
    }

    /**
     * Filtrer des datafilteroption (pour les filtrages type multiselect) avec les context filters, en indiquant obligatoirement le champs ciblé
     * @param context_query le champs fields doit être rempli avec un seul champs, celui qui correspond au filtrage du multiselect, et l'alias "label" a priori
     */
    private async select_filter_visible_options(
        context_query: ContextQueryVO,
        actual_query: string
    ): Promise<DataFilterOption[]> {

        return await ContextQueryServerController.getInstance().select_filter_visible_options(
            context_query,
            actual_query
        );
    }
}