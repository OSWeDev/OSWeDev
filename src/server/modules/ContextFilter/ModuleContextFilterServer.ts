import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleContextFilter from '../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DataFilterOption from '../../../shared/modules/DataRender/vos/DataFilterOption';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import ContextFilterServerController from './ContextFilterServerController';

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
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_get_filter_visible_options, this.get_filter_visible_options.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_get_filtered_datatable_rows, this.get_filtered_datatable_rows.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_query_vos_from_active_filters, this.query_vos_from_active_filters.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_query_rows_count_from_active_filters, this.query_rows_count_from_active_filters.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_delete_vos_from_active_filters, this.delete_vos_from_active_filters.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_update_vos_from_active_filters, this.update_vos_from_active_filters.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleContextFilter.APINAME_query_vos_count_from_active_filters, this.query_vos_count_from_active_filters.bind(this));
    }

    /**
     * Builds a query to return the field values according to the context filters
     * @param api_type_id
     * @param field_id null returns all fields as would a getvo
     * @param get_active_field_filters
     * @param active_api_type_ids
     * @param limit
     * @param offset
     * @param res_field_alias ignored if field_id is null
     * @returns
     */
    public build_request_from_active_field_filters(
        api_type_ids: string[],
        field_ids: string[],
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        limit: number,
        offset: number,
        sort_by: SortByVO,
        res_field_aliases: string[],
        is_delete: boolean = false
    ): string {

        return ContextFilterServerController.getInstance().build_request_from_active_field_filters(
            api_type_ids,
            field_ids,
            get_active_field_filters,
            active_api_type_ids,
            limit,
            offset,
            sort_by,
            res_field_aliases,
            is_delete
        );
    }

    public build_request_from_active_field_filters_count(
        api_type_ids: string[],
        field_ids: string[],
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        res_field_aliases: string[]
    ): string {

        return ContextFilterServerController.getInstance().build_request_from_active_field_filters_count(
            api_type_ids,
            field_ids,
            get_active_field_filters,
            active_api_type_ids,
            res_field_aliases
        );
    }

    /**
     * Counts query results
     * @param api_type_id
     * @param get_active_field_filters
     * @param active_api_type_ids
     * @returns
     */
    public async query_vos_count_from_active_filters(
        api_type_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[]
    ): Promise<number> {

        let request: string = this.build_request_from_active_field_filters_count(
            [api_type_id],
            null,
            get_active_field_filters,
            active_api_type_ids,
            null
        );

        if (!request) {
            return null;
        }

        let query_res = await ModuleDAOServer.getInstance().query(request);
        let c = (query_res && (query_res.length == 1) && (typeof query_res[0]['c'] != 'undefined') && (query_res[0]['c'] !== null)) ? query_res[0]['c'] : null;
        c = c ? parseInt(c.toString()) : 0;
        return c;
    }


    /**
     * Counts query results
     * @param api_type_ids
     * @param field_ids
     * @param get_active_field_filters
     * @param active_api_type_ids
     * @returns
     */
    public async query_rows_count_from_active_filters(
        api_type_ids: string[],
        field_ids: string[],
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[]
    ): Promise<number> {

        let res_field_aliases = [];

        for (let i in field_ids) {
            res_field_aliases.push('_' + i.toString());
        }

        let request: string = this.build_request_from_active_field_filters_count(
            api_type_ids,
            field_ids,
            get_active_field_filters,
            active_api_type_ids,
            res_field_aliases
        );

        if (!request) {
            return null;
        }

        let query_res = await ModuleDAOServer.getInstance().query(request);
        let c = (query_res && (query_res.length == 1) && (typeof query_res[0]['c'] != 'undefined') && (query_res[0]['c'] !== null)) ? query_res[0]['c'] : null;
        c = c ? parseInt(c.toString()) : 0;
        return c;
    }

    /**
     * Query field values
     * @param api_type_id
     * @param field_id
     * @param get_active_field_filters
     * @param active_api_type_ids
     * @param limit
     * @param offset
     * @returns
     */
    public async query_rows_from_active_filters(
        api_type_ids: string[],
        field_ids: string[],
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        limit: number,
        offset: number,
        sort_by: SortByVO,
        res_field_aliases?: string[]
    ): Promise<any[]> {

        if (!res_field_aliases) {
            res_field_aliases = [];

            for (let i in field_ids) {
                res_field_aliases.push('_' + i.toString());
            }
        }

        let request: string = this.build_request_from_active_field_filters(
            api_type_ids,
            field_ids,
            get_active_field_filters,
            active_api_type_ids,
            limit,
            offset,
            sort_by,
            res_field_aliases
        );

        if (!request) {
            return null;
        }

        return await ModuleDAOServer.getInstance().query(request);
    }

    /**
     * Query field values
     * @param api_type_id
     * @param field_id
     * @param get_active_field_filters
     * @param active_api_type_ids
     * @param limit
     * @param offset
     * @returns
     */
    public async query_from_active_filters(
        api_type_id: string,
        field_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        limit: number,
        offset: number
    ): Promise<any[]> {
        let res_field_alias: string = 'query_res';
        let request: string = this.build_request_from_active_field_filters(
            [api_type_id],
            [field_id],
            get_active_field_filters,
            active_api_type_ids,
            limit,
            offset,
            null,
            [res_field_alias]
        );

        if (!request) {
            return null;
        }

        let query_res: any[] = await ModuleDAOServer.getInstance().query(request);
        if ((!query_res) || (!query_res.length)) {
            return null;
        }

        let res: any[] = [];
        for (let i in query_res) {
            let line_res = query_res[i];

            if (line_res == null) {
                continue;
            }

            let res_field = line_res[res_field_alias];
            res.push(res_field);
        }

        return res;
    }

    /**
     * Updates each VO, resulting in triggers being called as expected
     */
    public async update_vos_from_active_filters(
        api_type_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        update_field_id: string,
        new_api_translated_value: any
    ): Promise<void> {

        /**
         * On se fixe des paquets de 100 vos à updater
         * et on sort by id desc pour éviter que l'ordre change pendant le process - au pire si on a des nouvelles lignes, elles nous forcerons à remodifier des lignes déjà updatées. pas très grave
         */
        let offset = 0;
        let limit = 100;
        let might_have_more: boolean = true;
        let sortby: SortByVO = new SortByVO();
        sortby.field_id = 'id';
        sortby.sort_asc = false;
        sortby.vo_type = api_type_id;
        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];
        let field = moduletable.get_field_by_id(update_field_id);

        // Si le champs modifié impact un filtrage, on doit pas faire évoluer l'offset
        let change_offset = true;
        for (let field_id in get_active_field_filters[api_type_id]) {
            if (field_id == update_field_id) {
                change_offset = false;
                break;
            }
        }

        if (!field.is_readonly) {
            while (might_have_more) {

                let vos = await this.query_vos_from_active_filters(api_type_id, get_active_field_filters, active_api_type_ids, limit, offset, sortby);

                if ((!vos) || (!vos.length)) {
                    break;
                }

                vos.forEach((vo) => {
                    vo[field.field_id] = moduletable.default_get_field_api_version(new_api_translated_value, field);
                });
                await ModuleDAO.getInstance().insertOrUpdateVOs(vos);

                might_have_more = (vos.length >= limit);
                offset += change_offset ? limit : 0;
            }
        }
    }

    /**
     * WARNING : does not call triggers !!
     */
    public async delete_vos_from_active_filters(
        api_type_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[]
    ): Promise<void> {
        let request: string = this.build_request_from_active_field_filters(
            [api_type_id],
            null,
            get_active_field_filters,
            active_api_type_ids,
            null,
            null,
            null,
            null,
            true
        );

        if (!request) {
            return null;
        }

        await ModuleDAOServer.getInstance().query(request);
    }

    /**
     * Query vos
     * @param api_type_id
     * @param get_active_field_filters
     * @param active_api_type_ids
     * @param limit
     * @param offset
     * @returns
     */
    public async query_vos_from_active_filters<T extends IDistantVOBase>(
        api_type_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        limit: number,
        offset: number,
        sort_by: SortByVO
    ): Promise<T[]> {
        let request: string = this.build_request_from_active_field_filters(
            [api_type_id],
            null,
            get_active_field_filters,
            active_api_type_ids,
            limit,
            offset,
            sort_by,
            null
        );

        if (!request) {
            return null;
        }

        let query_res: any[] = await ModuleDAOServer.getInstance().query(request);
        if ((!query_res) || (!query_res.length)) {
            return null;
        }

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];

        return await ModuleDAOServer.getInstance().filterVOsAccess(moduletable, ModuleDAO.DAO_ACCESS_TYPE_READ, moduletable.forceNumerics(query_res));
    }

    private async get_filtered_datatable_rows(
        api_type_ids: string[],
        field_ids: string[],
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        limit: number,
        offset: number,
        sort_by: SortByVO,
        res_field_aliases: string[]): Promise<any[]> {

        return await this.query_rows_from_active_filters(
            api_type_ids,
            field_ids,
            get_active_field_filters,
            active_api_type_ids,
            limit,
            offset,
            sort_by,
            res_field_aliases
        );
    }

    private async get_filter_visible_options(
        api_type_id: string,
        field_id: string,
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        actual_query: string,
        limit: number,
        offset: number): Promise<DataFilterOption[]> {

        let res: DataFilterOption[] = [];

        if ((!api_type_id) || (!field_id)) {
            return res;
        }

        if ((!active_api_type_ids) || (active_api_type_ids.indexOf(api_type_id) < 0)) {
            return res;
        }

        /**
         * on ignore le filtre sur ce champs par défaut, et par contre on considère le acutal_query comme un filtrage en text_contient
         */
        if (get_active_field_filters && get_active_field_filters[api_type_id] && get_active_field_filters[api_type_id][field_id]) {
            delete get_active_field_filters[api_type_id][field_id];
        }

        if (actual_query) {
            let actual_filter = new ContextFilterVO();
            actual_filter.field_id = field_id;
            actual_filter.vo_type = api_type_id;
            actual_filter.filter_type = ContextFilterVO.TYPE_TEXT_INCLUDES_ANY;
            actual_filter.param_text = actual_query;

            if (!get_active_field_filters[api_type_id]) {
                get_active_field_filters[api_type_id] = {};
            }
            get_active_field_filters[api_type_id][field_id] = actual_filter;
        }


        let query_res: any[] = await this.query_from_active_filters(
            api_type_id,
            field_id,
            get_active_field_filters,
            active_api_type_ids,
            limit,
            offset
        );
        if ((!query_res) || (!query_res.length)) {
            return res;
        }

        for (let i in query_res) {
            let res_field = query_res[i];
            let line_option = this.translate_db_res_to_dataoption(api_type_id, field_id, res_field);

            if (line_option) {
                res.push(line_option);
            }
        }

        return res;
    }

    private translate_db_res_to_dataoption(
        api_type_id: string,
        field_id: string,
        db_res: any
    ): DataFilterOption {

        return ContextFilterServerController.getInstance().translate_db_res_to_dataoption(
            api_type_id,
            field_id,
            db_res
        );
    }
}