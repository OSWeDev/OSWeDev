
import moment = require('moment');
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleContextFilter from '../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DataFilterOption from '../../../shared/modules/DataRender/vos/DataFilterOption';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import RangeHandler from '../../../shared/tools/RangeHandler';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConversionHandler from '../../../shared/tools/ConversionHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import StackContext from '../../StackContext';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import TypesPathElt from './vos/TypesPathElt';

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

        let res = this.build_request_from_active_field_filters_(
            api_type_ids,
            field_ids,
            get_active_field_filters,
            active_api_type_ids,
            sort_by,
            res_field_aliases
        );

        if (limit) {
            res += ' LIMIT ' + limit;

            if (offset) {
                res += ' OFFSET ' + offset;
            }
        }

        return res;
    }

    public build_request_from_active_field_filters_count(
        api_type_ids: string[],
        field_ids: string[],
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        res_field_aliases: string[]
    ): string {

        let res = 'SELECT COUNT(*) c FROM (' + this.build_request_from_active_field_filters_(
            api_type_ids,
            field_ids,
            get_active_field_filters,
            active_api_type_ids,
            null,
            res_field_aliases
        ) + ') as tocount';

        return res;
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

        if (db_res == null) {
            /**
             * TODO FIXME a voir si on retourne pas une option explicite et sélectionnable
             */
            return null;
        }

        let field = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id].get_field_by_id(field_id);
        let res: DataFilterOption = new DataFilterOption(
            DataFilterOption.STATE_SELECTABLE,
            db_res.toString(),
            null
        );
        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_enum:
                res.numeric_value = ConversionHandler.forceNumber(db_res);
                res.string_value = (res.numeric_value == null) ? null : field.enum_values[res.numeric_value];
                res.label = res.string_value;
                break;

            case ModuleTableField.FIELD_TYPE_file_field:
            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_image_field:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_hour:
                res.numeric_value = ConversionHandler.forceNumber(db_res);
                break;

            case ModuleTableField.FIELD_TYPE_tstz:
                res.tstz_value = parseInt(db_res.toString());
                break;


            case ModuleTableField.FIELD_TYPE_email:
                if (db_res && db_res.trim) {
                    res.string_value = db_res.trim();
                }
                break;

            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_translatable_text:
                res.string_value = db_res;
                break;

            case ModuleTableField.FIELD_TYPE_html_array:

            case ModuleTableField.FIELD_TYPE_boolean:
                res.boolean_value = db_res;
                break;

            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_hourrange:
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_string_array:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                throw new Error('Not Implemented');

            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_month:
                res.tstz_value = moment(db_res).utc(true).unix();
                break;

            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                throw new Error('Not Implemented');
        }

        res.init_text_uid();
        return res;
    }

    private update_where_conditions(
        where_conditions: string[],
        active_field_filter: ContextFilterVO,
        tables_aliases_by_type: { [vo_type: string]: string }
    ) {

        let field_id = tables_aliases_by_type[active_field_filter.vo_type] + '.' + active_field_filter.field_id;
        let field = VOsTypesManager.getInstance().moduleTables_by_voType[active_field_filter.vo_type].get_field_by_id(active_field_filter.field_id);

        switch (active_field_filter.filter_type) {

            case ContextFilterVO.TYPE_BOOLEAN_TRUE_ALL:
            case ContextFilterVO.TYPE_BOOLEAN_TRUE_ANY:
                where_conditions.push(field_id + " = TRUE");
                break;
            case ContextFilterVO.TYPE_BOOLEAN_FALSE_ALL:
            case ContextFilterVO.TYPE_BOOLEAN_FALSE_ANY:
                where_conditions.push(field_id + " = FALSE");
                break;

            case ContextFilterVO.TYPE_TEXT_INCLUDES_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " ILIKE '%" + text + "%'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "%'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " ILIKE ANY(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'%" + text + "%' ILIKE ANY(" + field_id + ')');
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "%' ILIKE ANY(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') OR (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_DATE_EQUALS:
                throw new Error('Not Implemented');

            case ContextFilterVO.TYPE_TEXT_EQUALS_ALL:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " = '" + text + "'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            // TODO on peut aussi identifie qu'on a plusieurs chaines différentes et fuir la requete (si on doit être = à TOUS il vaut mieux en avoir qu'un...)
                            where_conditions.push(field_id + " = ALL(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'" + active_field_filter.param_text + "' = ALL(" + field_id + ")");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                like_array.push(text.replace(/'/g, "''"));
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("['" + like_array.join("','") + "'] <@ " + field_id + " AND ['" + like_array.join("','") + "'] @> " + field_id);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_EQUALS_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " = '" + text + "'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " = ANY(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'" + active_field_filter.param_text + "' = ANY(" + field_id + ")");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "' = ANY(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') OR (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_STARTSWITH_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " ILIKE '" + text + "%'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "%'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " ILIKE ANY(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'" + text + "%' ILIKE ANY(" + field_id + ')');
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "%' ILIKE ANY(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') OR (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_ENDSWITH_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " ILIKE '%" + text + "'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " ILIKE ANY(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'%" + text + "' ILIKE ANY(" + field_id + ')');
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "' ILIKE ANY(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') OR (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_EQUALS_NONE:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " != '" + text + "'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " != ALL(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'" + active_field_filter.param_text + "' != ALL(" + field_id + ")");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "' != ALL(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') AND (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_INCLUDES_NONE:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " NOT ILIKE '%" + text + "%'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "%'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " NOT ILIKE ALL(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'%" + text + "%' NOT ILIKE ALL(" + field_id + ')');
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "%' NOT ILIKE ALL(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') AND (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_STARTSWITH_NONE:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " NOT ILIKE '" + text + "%'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "%'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " NOT ILIKE ALL(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'" + text + "%' NOT ILIKE ALL(" + field_id + ')');
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'" + text + "%' NOT ILIKE ALL(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') AND (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_TEXT_ENDSWITH_NONE:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_string:
                    case ModuleTableField.FIELD_TYPE_html:
                    case ModuleTableField.FIELD_TYPE_textarea:
                    case ModuleTableField.FIELD_TYPE_translatable_text:
                    case ModuleTableField.FIELD_TYPE_email:
                    case ModuleTableField.FIELD_TYPE_password:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push(field_id + " NOT ILIKE '%" + text + "'");
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "'");
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push(field_id + " NOT ILIKE ALL(ARRAY[" + like_array.join(',') + "])");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_string_array:
                    case ModuleTableField.FIELD_TYPE_html_array:
                        if (active_field_filter.param_text != null) {
                            let text = active_field_filter.param_text.replace(/'/g, "''");
                            where_conditions.push("'%" + text + "' NOT ILIKE ALL(" + field_id + ')');
                        } else if (active_field_filter.param_textarray != null) {
                            let like_array = [];
                            for (let i in active_field_filter.param_textarray) {
                                let text = active_field_filter.param_textarray[i];
                                if (!text) {
                                    continue;
                                }
                                text = text.replace(/'/g, "''");
                                like_array.push("'%" + text + "' NOT ILIKE ALL(" + field_id + ')');
                            }
                            if ((!like_array) || (!like_array.length)) {
                                return;
                            }
                            where_conditions.push("(" + like_array.join(') AND (') + ")");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_INFEQ_ALL:
            case ContextFilterVO.TYPE_NUMERIC_INFEQ_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                        if (active_field_filter.param_numeric != null) {
                            where_conditions.push(field_id + " <= " + active_field_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_INF_ALL:
            case ContextFilterVO.TYPE_NUMERIC_INF_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                        if (active_field_filter.param_numeric != null) {
                            where_conditions.push(field_id + " < " + active_field_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_SUP_ALL:
            case ContextFilterVO.TYPE_NUMERIC_SUP_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                        if (active_field_filter.param_numeric != null) {
                            where_conditions.push(field_id + " > " + active_field_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_SUPEQ_ALL:
            case ContextFilterVO.TYPE_NUMERIC_SUPEQ_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                        if (active_field_filter.param_numeric != null) {
                            where_conditions.push(field_id + " >= " + active_field_filter.param_numeric);
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_EQUALS:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                        if (active_field_filter.param_numeric != null) {
                            where_conditions.push(field_id + " = '" + active_field_filter.param_numeric + "'");
                        } else {
                            throw new Error('Not Implemented');
                        }
                        break;

                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NUMERIC_INTERSECTS:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:

                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:

                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:

                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:

                        let where_clause: string = '';

                        for (let j in active_field_filter.param_numranges) {
                            let field_range: NumRange = active_field_filter.param_numranges[j];

                            where_clause += (where_clause == '') ? "" : " OR ";

                            where_clause += ModuleDAOServer.getInstance().getClauseWhereRangeIntersectsField(field, field_range);
                        }

                        where_conditions.push(where_clause);
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_NULL_ALL:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                    default:
                        where_conditions.push(field_id + " is NULL");
                }
                break;


            case ContextFilterVO.TYPE_FILTER_OR:
                let conditions_OR: string[] = [];
                this.update_where_conditions(conditions_OR, active_field_filter.left_hook, tables_aliases_by_type);
                this.update_where_conditions(conditions_OR, active_field_filter.right_hook, tables_aliases_by_type);
                where_conditions.push(' ((' + conditions_OR[0] + ') OR (' + conditions_OR[1] + ')) ');
                break;

            case ContextFilterVO.TYPE_FILTER_AND:
                let conditions_AND: string[] = [];
                this.update_where_conditions(conditions_AND, active_field_filter.left_hook, tables_aliases_by_type);
                this.update_where_conditions(conditions_AND, active_field_filter.right_hook, tables_aliases_by_type);
                where_conditions.push(' ((' + conditions_AND[0] + ') AND (' + conditions_AND[1] + ')) ');
                break;

            case ContextFilterVO.TYPE_FILTER_NOT:
                let conditions_NOT: string[] = [];
                this.update_where_conditions(conditions_NOT, active_field_filter.left_hook, tables_aliases_by_type);
                where_conditions.push(' (NOT (' + conditions_NOT[0] + ')) ');
                break;


            case ContextFilterVO.TYPE_NULL_ANY:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                    default:
                        where_conditions.push(field_id + " is NULL");
                        break;


                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        where_conditions.push("ANY(" + field_id + ") is NULL");
                        break;
                }
                break;

            case ContextFilterVO.TYPE_NULL_NONE:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_amount:
                    case ModuleTableField.FIELD_TYPE_enum:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_float:
                    case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                    case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_prct:
                    case ModuleTableField.FIELD_TYPE_tstz:
                    case ModuleTableField.FIELD_TYPE_numrange:
                    case ModuleTableField.FIELD_TYPE_tsrange:
                    default:
                        where_conditions.push(field_id + " is NOT NULL");
                        break;


                    case ModuleTableField.FIELD_TYPE_isoweekdays:
                    case ModuleTableField.FIELD_TYPE_int_array:
                    case ModuleTableField.FIELD_TYPE_tstz_array:
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        where_conditions.push("ALL(" + field_id + ") is NOT NULL");
                        break;
                }
                break;

            case ContextFilterVO.TYPE_DATE_DOW:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_tstz:
                        let where_clause: string = '';

                        if (active_field_filter.param_numranges && active_field_filter.param_numranges.length) {
                            let dows: number[] = [];

                            RangeHandler.getInstance().foreach_ranges_sync(active_field_filter.param_numranges, (dow) => dows.push(dow));
                            if ((!dows) || (!dows.length)) {
                                break;
                            }

                            where_clause = 'extract(isodow from to_timestamp(' + field.field_id + ')::date) in (' + dows.join(',') + ')';
                            where_conditions.push(where_clause);
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_DATE_YEAR:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_tstz:
                        let where_clause: string = '';

                        if (active_field_filter.param_numranges && active_field_filter.param_numranges.length) {
                            let years: number[] = [];

                            RangeHandler.getInstance().foreach_ranges_sync(active_field_filter.param_numranges, (year) => years.push(year));
                            if ((!years) || (!years.length)) {
                                break;
                            }

                            where_clause = 'extract(year from to_timestamp(' + field.field_id + ')::date) in (' + years.join(',') + ')';
                            where_conditions.push(where_clause);
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_DATE_MONTH:
                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_tsrange:
                        throw new Error('Not Implemented');

                    case ModuleTableField.FIELD_TYPE_tstz:
                        let where_clause: string = '';

                        if (active_field_filter.param_numranges && active_field_filter.param_numranges.length) {
                            let months: number[] = [];

                            RangeHandler.getInstance().foreach_ranges_sync(active_field_filter.param_numranges, (month) => months.push(month));
                            if ((!months) || (!months.length)) {
                                break;
                            }

                            where_clause = 'extract(month from to_timestamp(' + field.field_id + ')::date) in (' + months.join(',') + ')';
                            where_conditions.push(where_clause);
                        }
                        break;

                    default:
                        throw new Error('Not Implemented');
                }
                break;

            case ContextFilterVO.TYPE_FILTER_XOR:
            case ContextFilterVO.TYPE_NUMERIC_INCLUDES:
            case ContextFilterVO.TYPE_NUMERIC_IS_INCLUDED_IN:
            case ContextFilterVO.TYPE_ID_INTERSECTS:
            case ContextFilterVO.TYPE_ID_EQUALS:
            case ContextFilterVO.TYPE_ID_INCLUDES:
            case ContextFilterVO.TYPE_ID_IS_INCLUDED_IN:
            case ContextFilterVO.TYPE_HOUR_INTERSECTS:
            case ContextFilterVO.TYPE_HOUR_EQUALS:
            case ContextFilterVO.TYPE_HOUR_INCLUDES:
            case ContextFilterVO.TYPE_HOUR_IS_INCLUDED_IN:
            case ContextFilterVO.TYPE_DATE_INTERSECTS:
            case ContextFilterVO.TYPE_DATE_INCLUDES:
            case ContextFilterVO.TYPE_DATE_IS_INCLUDED_IN:
            case ContextFilterVO.TYPE_TEXT_INCLUDES_ALL:
            case ContextFilterVO.TYPE_TEXT_STARTSWITH_ALL:
            case ContextFilterVO.TYPE_TEXT_ENDSWITH_ALL:



            case ContextFilterVO.TYPE_DATE_DOM:
            case ContextFilterVO.TYPE_DATE_WEEK:

                throw new Error('Not Implemented');
        }
    }

    private updates_jointures(
        jointures: string[],
        targeted_type: string,
        joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> },
        tables_aliases_by_type: { [vo_type: string]: string },
        path: Array<ModuleTableField<any>>,
        aliases_n: number
    ): number {
        if ((!path) || (!path.length)) {
            return aliases_n;
        }

        /**
         * On reverse le path pour faire les jointures du plus proche de la cible au plus loin
         */
        let field: ModuleTableField<any> = path.pop();
        while (field) {

            /**
             * Soit on est sur un manyToOne soit sur un oneToMany.
             *  On teste d'abord le oneToMany potentiel
             */
            if ((!joined_tables_by_vo_type[field.manyToOne_target_moduletable.vo_type]) && (field.manyToOne_target_moduletable.vo_type != targeted_type)) {

                // On est a priori sur un oneToMany qui nécessite un join
                joined_tables_by_vo_type[field.manyToOne_target_moduletable.vo_type] = field.manyToOne_target_moduletable;

                if (!tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type]) {
                    tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] = 't' + (aliases_n++);
                }

                if (!tables_aliases_by_type[field.module_table.vo_type]) {
                    tables_aliases_by_type[field.module_table.vo_type] = 't' + (aliases_n++);
                }

                /**
                 * FIXME Les tables segmentées sont pas du tout compatibles pour le moment
                 */
                if (field.manyToOne_target_moduletable.is_segmented) {
                    throw new Error('Not implemented');
                }

                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_file_field:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_image_field:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                        jointures.push(
                            field.manyToOne_target_moduletable.full_name + ' ' + tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + ' ON ' +
                            tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id + ' = ' +
                            tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id'
                        );
                        break;
                    case ModuleTableField.FIELD_TYPE_numrange:
                        // jointures.push(
                        // field.manyToOne_target_moduletable.full_name + ' ' + tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + ' ON ' +
                        //     tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id::numeric <@ ' +
                        //     tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id
                        // );
                        throw new Error('Not Implemented');

                        break;
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');
                        // jointures.push(
                        // field.manyToOne_target_moduletable.full_name + ' ' + tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + ' ON ' +
                        //     tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id::numeric <@ ' +
                        //     tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id
                        // );
                        break;
                    case ModuleTableField.FIELD_TYPE_int_array:
                        jointures.push(
                            field.manyToOne_target_moduletable.full_name + ' ' + tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + ' ON ' +
                            tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id in ' +
                            tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id
                        );
                        break;
                }
            } else if ((!joined_tables_by_vo_type[field.module_table.vo_type]) && (field.module_table.vo_type != targeted_type)) {
                // } else if (field.module_table.vo_type != targeted_type) {

                /**
                 * On est sur un many to one
                 */

                /**
                 * Si la table cible n'est pas join on doit l'ajouter et faire le join dessus
                 */

                /**
                 * Si les deux tables sont connues on devrait avoir
                 */
                // if ((!joined_tables_by_vo_type[field.module_table.vo_type]) && (!tables_aliases_by_type) {

                // }

                joined_tables_by_vo_type[field.module_table.vo_type] = field.module_table;

                if (!tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type]) {
                    tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] = 't' + (aliases_n++);
                }

                if (!tables_aliases_by_type[field.module_table.vo_type]) {
                    tables_aliases_by_type[field.module_table.vo_type] = 't' + (aliases_n++);
                }

                /**
                 * FIXME Les tables segmentées sont pas du tout compatibles pour le moment
                 */
                if (field.module_table.is_segmented) {
                    throw new Error('Not implemented');
                }

                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_file_field:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_image_field:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                        jointures.push(
                            field.module_table.full_name + ' ' + tables_aliases_by_type[field.module_table.vo_type] + ' ON ' +
                            tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id + ' = ' +
                            tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id'
                        );
                        break;
                    case ModuleTableField.FIELD_TYPE_numrange:
                        // jointures.push(
                        //     field.module_table.full_name + ' ' + tables_aliases_by_type[field.module_table.vo_type] + ' ON ' +
                        //     tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id::numeric <@ ' +
                        //     tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id
                        // );
                        throw new Error('Not Implemented');

                        break;
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');
                        // jointures.push(
                        //     field.module_table.full_name + ' ' + tables_aliases_by_type[field.module_table.vo_type] + ' ON ' +
                        //     tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id::numeric <@ ' +
                        //     tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id
                        // );
                        break;
                    case ModuleTableField.FIELD_TYPE_int_array:
                        jointures.push(
                            field.module_table.full_name + ' ' + tables_aliases_by_type[field.module_table.vo_type] + ' ON ' +
                            tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id in ' +
                            tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id
                        );
                        break;
                }
            } else if (joined_tables_by_vo_type[field.module_table.vo_type] && (field.module_table.vo_type != targeted_type) && (!joined_tables_by_vo_type[field.manyToOne_target_moduletable.vo_type])) {

                /**
                 * manytoOne mais dont c'est la cible qui est pas join encore
                 */

                joined_tables_by_vo_type[field.manyToOne_target_moduletable.vo_type] = field.manyToOne_target_moduletable;

                if (!tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type]) {
                    tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] = 't' + (aliases_n++);
                }

                if (!tables_aliases_by_type[field.module_table.vo_type]) {
                    tables_aliases_by_type[field.module_table.vo_type] = 't' + (aliases_n++);
                }

                /**
                 * FIXME Les tables segmentées sont pas du tout compatibles pour le moment
                 */
                if (field.manyToOne_target_moduletable.is_segmented) {
                    throw new Error('Not implemented');
                }

                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_file_field:
                    case ModuleTableField.FIELD_TYPE_file_ref:
                    case ModuleTableField.FIELD_TYPE_image_field:
                    case ModuleTableField.FIELD_TYPE_image_ref:
                    case ModuleTableField.FIELD_TYPE_int:
                    case ModuleTableField.FIELD_TYPE_foreign_key:
                        jointures.push(
                            field.manyToOne_target_moduletable.full_name + ' ' + tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + ' ON ' +
                            tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id + ' = ' +
                            tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id'
                        );
                        break;
                    case ModuleTableField.FIELD_TYPE_numrange:
                        // jointures.push(
                        //     field.manyToOne_target_moduletable.full_name + ' ' + tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + ' ON ' +
                        //     tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id::numeric <@ ' +
                        //     tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id
                        // );
                        throw new Error('Not Implemented');

                        break;
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        throw new Error('Not Implemented');
                        // jointures.push(
                        //     field.manyToOne_target_moduletable.full_name + ' ' + tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + ' ON ' +
                        //     tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id::numeric <@ ' +
                        //     tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id
                        // );
                        break;
                    case ModuleTableField.FIELD_TYPE_int_array:
                        jointures.push(
                            field.manyToOne_target_moduletable.full_name + ' ' + tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + ' ON ' +
                            tables_aliases_by_type[field.manyToOne_target_moduletable.vo_type] + '.id in ' +
                            tables_aliases_by_type[field.module_table.vo_type] + '.' + field.field_id
                        );
                        break;
                }
            }

            field = path.pop();
        }

        return aliases_n;
    }

    private get_path_between_types(active_api_type_ids: string[], from_types: string[], to_type: string): Array<ModuleTableField<any>> {
        /**
         * On avance sur tous les fronts en même temps et on veut associer à chaque chemin un poids qui correspond à la distance
         *  Une relation N/N compte pour 1 en poids et non 2 même si on a 2 vo_type_id à passer, on ignore directement la table intermédiaire
         */
        let reverse_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } } = null;
        let new_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } } = null;
        let deployed_deps_from: { [api_type_id: string]: boolean } = {};

        let isBlocked: boolean = false;
        let starting_path_elt: TypesPathElt = null;
        while ((!isBlocked) && (!starting_path_elt)) {

            if (new_paths) {
                starting_path_elt = this.get_starting_point(from_types, to_type, new_paths);
                if (starting_path_elt) {
                    break;
                }
            }

            isBlocked = true;
            let this_turn_new_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } } = new_paths;
            new_paths = null;

            if (!reverse_paths) {
                reverse_paths = {};

                let references: Array<ModuleTableField<any>> = VOsTypesManager.getInstance().get_type_references(to_type);
                references = references.filter((ref) => active_api_type_ids.indexOf(ref.module_table.vo_type) >= 0);

                if (!deployed_deps_from[to_type]) {
                    deployed_deps_from[to_type] = true;

                    let fields = VOsTypesManager.getInstance().getManyToOneFields(to_type, Object.keys(deployed_deps_from));
                    for (let i in fields) {
                        let field = fields[i];

                        if (active_api_type_ids.indexOf(field.module_table.vo_type) < 0) {
                            continue;
                        }

                        if (!references) {
                            references = [];
                        }
                        references.push(field);
                    }
                }

                if ((!references) || (!references.length)) {
                    return null;
                }
                new_paths = this.merge_references(
                    references,
                    reverse_paths,
                    from_types,
                    null
                );
                isBlocked = (new_paths == null);
                continue;
            }

            for (let api_type_id_i in this_turn_new_paths) {
                let this_turn_new_paths_fields = this_turn_new_paths[api_type_id_i];

                for (let field_i in this_turn_new_paths_fields) {
                    let new_path = this_turn_new_paths_fields[field_i];

                    let references: Array<ModuleTableField<any>> = VOsTypesManager.getInstance().get_type_references(new_path.from_api_type_id);
                    references = references.filter((ref) => active_api_type_ids.indexOf(ref.module_table.vo_type) >= 0);

                    if (!deployed_deps_from[new_path.from_api_type_id]) {
                        deployed_deps_from[new_path.from_api_type_id] = true;

                        let fields = VOsTypesManager.getInstance().getManyToOneFields(new_path.from_api_type_id, Object.keys(deployed_deps_from));
                        for (let i in fields) {
                            let field = fields[i];

                            if (active_api_type_ids.indexOf(field.module_table.vo_type) < 0) {
                                continue;
                            }

                            if (!references) {
                                references = [];
                            }
                            references.push(field);
                        }
                    }

                    if ((!references) || (!references.length)) {
                        continue;
                    }
                    let local_new_paths = this.merge_references(
                        references,
                        reverse_paths,
                        from_types,
                        new_path
                    );
                    isBlocked = isBlocked && (local_new_paths == null);

                    if (!!local_new_paths) {
                        if (!new_paths) {
                            new_paths = local_new_paths;
                            continue;
                        }

                        this.merge_new_paths(local_new_paths, new_paths);
                    }

                    continue;
                }
            }
        }

        if (isBlocked || !starting_path_elt) {
            return null;
        }

        return this.get_fields_path_from_path_elts(starting_path_elt);
    }

    private get_starting_point(
        from_types: string[], to_type: string,
        reverse_paths_to_test: { [api_type_id: string]: { [field_id: string]: TypesPathElt } }): TypesPathElt {

        if (!reverse_paths_to_test) {
            return null;
        }

        for (let i in from_types) {
            let from_type = from_types[i];

            if (!!reverse_paths_to_test[from_type]) {
                return reverse_paths_to_test[from_type][ObjectHandler.getInstance().getFirstAttributeName(reverse_paths_to_test[from_type])];
            }
        }

        for (let type_i in reverse_paths_to_test) {
            let reverse_paths_to_test_fields = reverse_paths_to_test[type_i];

            for (let field_i in reverse_paths_to_test_fields) {
                let reverse_path_to_test = reverse_paths_to_test_fields[field_i];

                if (from_types.indexOf(reverse_path_to_test.to_api_type_id) >= 0) {
                    return reverse_path_to_test;
                }
            }
        }

        return null;
    }

    private get_fields_path_from_path_elts(
        starting_path_elt: TypesPathElt): Array<ModuleTableField<any>> {

        if (!starting_path_elt) {
            return null;
        }

        let res: Array<ModuleTableField<any>> = [];
        let path_elt: TypesPathElt = starting_path_elt;
        while (path_elt) {

            res.push(VOsTypesManager.getInstance().moduleTables_by_voType[path_elt.from_api_type_id].get_field_by_id(path_elt.from_field_id));
            path_elt = path_elt.next_path_elt;
        }
        return res;
    }

    private merge_new_paths(
        local_new_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } },
        new_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } }
    ) {
        for (let i in local_new_paths) {
            let local_new_paths_fields = local_new_paths[i];

            if (!new_paths[i]) {
                new_paths[i] = {};
            }

            for (let j in local_new_paths_fields) {
                let local_new_path = local_new_paths_fields[j];

                if (!new_paths[i][j]) {
                    new_paths[i][j] = local_new_path;
                }
                /**
                 * Probablement pas utile de merger ici
                 */
            }
        }
    }

    /**
     * On prend en param les types ciblés pour break rapidement si on a une réponse à fournir.
     *  Cependant à voir dans le temps si on peut avoir des chemins plus courts en restant plus longtemps. Je pense pas.
     * @param references
     * @param reverse_paths
     * @param targeted_types
     * @param actual_path
     */
    private merge_references(
        references: Array<ModuleTableField<any>>,
        reverse_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } },
        targeted_types: string[],
        actual_path: TypesPathElt = null): { [api_type_id: string]: { [field_id: string]: TypesPathElt } } {

        let new_paths: { [api_type_id: string]: { [field_id: string]: TypesPathElt } } = null;

        for (let i in references) {
            let reference = references[i];

            // // INFO : Si on passe par une table segmentée sans que celle-ci soit la cible ou la source, on ignore cette référence
            // // Obj par l'exemple : lignes de factures, très nombreuses, et plusieurs catégories / PDVs, on veut pas filtrer les
            // //  PDV en fonction de la catégorie choisie dans les factures liées. Sinon c'est délirant en terme de requetes / temps de
            // //  réponse. On pourrait ajouter un switch sur une requete très insistante mais par défaut ça semble pas une bonne idée
            // //  ça sous-entend surtout peutêtre qu'il y a un poids sur les tables pour le chemin à utiliser et qu'on est en train
            // //  de dire que dans ce cas précis on a juste un poids très élevé.
            // if (reference.module_table.is_segmented) {
            //     if ((!reverse_paths[reference.module_table.vo_type]) && (targeted_types.indexOf(reference.module_table.vo_type) < 0)) {
            //         continue;
            //     }
            // }

            /**
             * Les tables de matroides (params de vars) sont ignorées pour la définition des paths
             *  on veut que des tables de datas
             */
            if (reference.module_table.isMatroidTable) {
                if ((!reverse_paths[reference.module_table.vo_type]) && (targeted_types.indexOf(reference.module_table.vo_type) < 0)) {
                    continue;
                }
            }

            // Si c'est une ref via many to many on ajoute pas de poids sur cette ref
            let reference_weight: number = VOsTypesManager.getInstance().isManyToManyModuleTable(
                VOsTypesManager.getInstance().moduleTables_by_voType[reference.module_table.vo_type]) ? 0 : 1;

            if (reverse_paths[reference.module_table.vo_type] &&
                reverse_paths[reference.module_table.vo_type][reference.field_id]) {

                // On check qu'on est pas sur un trajet plus rapide => mais c'est improbable/impossible non ?
                if (actual_path) {
                    if (
                        reverse_paths[reference.module_table.vo_type][reference.field_id].from_path_index >
                        actual_path.from_path_index + reference_weight
                    ) {
                        reverse_paths[reference.module_table.vo_type][reference.field_id].from_path_index = actual_path ? actual_path.from_path_index + reference_weight : reference_weight;
                        reverse_paths[reference.module_table.vo_type][reference.field_id].to_path_index = actual_path ? actual_path.from_path_index : 0;
                        reverse_paths[reference.module_table.vo_type][reference.field_id].next_path_elt = actual_path;
                    }
                }

                continue;
            }

            if (!reverse_paths[reference.module_table.vo_type]) {
                reverse_paths[reference.module_table.vo_type] = {};
            }

            reverse_paths[reference.module_table.vo_type][reference.field_id] = new TypesPathElt(
                reference.module_table.vo_type,
                reference.field_id,

                reference.manyToOne_target_moduletable.vo_type,
                reference.target_field,

                actual_path ? actual_path.from_path_index + reference_weight : reference_weight,
                actual_path ? actual_path.from_path_index : 0,

                actual_path ? actual_path : null
            );

            if (!new_paths) {
                new_paths = {};
            }

            if (!new_paths[reference.module_table.vo_type]) {
                new_paths[reference.module_table.vo_type] = {};
            }

            new_paths[reference.module_table.vo_type][reference.field_id] = reverse_paths[reference.module_table.vo_type][reference.field_id];

            if (targeted_types && targeted_types.find((target) => target == reference.module_table.vo_type)) {
                return new_paths;
            }
        }

        return new_paths;
    }

    /**
     * ATTENTION : sécurité déclarative...
     * access_right doit contenir le droit (exemple DAO_ACCESS_TYPE_READ) le plus élevé nécessité pour la requête qui sera construite avec cette fonction
     * Par défaut on met donc la suppression puisque si l'on a accès à la suppression, on a accès à tout.
     */
    private build_request_from_active_field_filters_(
        api_type_ids: string[],
        field_ids: string[],
        get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } },
        active_api_type_ids: string[],
        sort_by: SortByVO,
        res_field_aliases: string[],
        access_type: string = ModuleDAO.DAO_ACCESS_TYPE_DELETE,
        is_delete: boolean = false
    ): string {

        try {

            /**
             * Par mesure de sécu on check que les éléments proposés existent en base
             */
            if ((!api_type_ids) ||
                (api_type_ids.length <= 0) ||
                ((field_ids && res_field_aliases) &&
                    ((res_field_aliases.length != field_ids.length) ||
                        (api_type_ids.length != field_ids.length)))) {
                return null;
            }

            if (!this.check_access_to_api_type_ids_field_ids(api_type_ids, field_ids, access_type)) {
                return null;
            }

            let aliases_n: number = 0;
            let tables_aliases_by_type: { [vo_type: string]: string } = {};

            let res: string = null;
            let FROM: string = null;

            /**
             * On prend arbitrairement la première table comme FROM, on join vers elle par la suite.
             */
            let main_api_type_id = null;
            let jointures: string[] = [];
            let joined_tables_by_vo_type: { [vo_type: string]: ModuleTable<any> } = {};


            /**
             * On agrémente la liste des active_api_type_ids par les relations N/N dont les types liés sont actifs
             */
            let nn_tables = VOsTypesManager.getInstance().get_manyToManyModuleTables();
            for (let i in nn_tables) {
                let nn_table = nn_tables[i];

                let nnfields = nn_table.get_fields();
                let has_inactive_relation = false;
                for (let j in nnfields) {
                    let nnfield = nnfields[j];

                    if (active_api_type_ids.indexOf(nnfield.manyToOne_target_moduletable.vo_type) < 0) {
                        has_inactive_relation = true;
                        break;
                    }
                }

                if (!has_inactive_relation) {
                    active_api_type_ids.push(nn_table.vo_type);
                }
            }


            if (!field_ids) {
                if (api_type_ids.length != 1) {
                    ConsoleHandler.getInstance().error('build_request_from_active_field_filters:api_type_ids.length != 1:' + api_type_ids.join(','));
                    return null;
                }

                main_api_type_id = api_type_ids[0];
                let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[main_api_type_id];

                if (!moduletable) {
                    return null;
                }

                /**
                 * FIXME Les tables segmentées sont pas du tout compatibles pour le moment
                 */
                if (moduletable.is_segmented) {
                    throw new Error('Not implemented');
                }

                tables_aliases_by_type[main_api_type_id] = 't' + (aliases_n++);

                if (!is_delete) {
                    res = "SELECT " + tables_aliases_by_type[main_api_type_id] + ".* ";
                    FROM = " FROM " + moduletable.full_name + " " + tables_aliases_by_type[main_api_type_id];
                } else {
                    res = "DELETE ";
                    FROM = " FROM " + moduletable.full_name + " " + tables_aliases_by_type[main_api_type_id];
                }
            } else {

                if (is_delete) {
                    throw new Error('Not implemented');
                }

                res = "SELECT DISTINCT ";
                let first = true;

                for (let i in api_type_ids) {
                    let api_type_id = api_type_ids[i];
                    let field_id = field_ids[i];

                    let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];
                    if ((!moduletable) || ((!!field_id) && (field_id != 'id') && (!moduletable.get_field_by_id(field_id)))) {
                        return null;
                    }

                    /**
                     * FIXME Les tables segmentées sont pas du tout compatibles pour le moment
                     */
                    if (moduletable.is_segmented) {
                        throw new Error('Not implemented');
                    }


                    let is_new_t = false;
                    if (!tables_aliases_by_type[api_type_id]) {
                        tables_aliases_by_type[api_type_id] = 't' + (aliases_n++);
                        is_new_t = true;
                    }

                    if (!first) {
                        res += ', ';
                    }
                    first = false;

                    res += tables_aliases_by_type[api_type_id] + "." + field_id + " as " + res_field_aliases[i] + ' ';

                    if (!main_api_type_id) {
                        main_api_type_id = api_type_id;

                        FROM = " FROM " + moduletable.full_name + " " + tables_aliases_by_type[api_type_id];
                        joined_tables_by_vo_type[api_type_id] = moduletable;
                    } else {
                        /**
                         * Si on connait déjà, rien à faire
                         */
                        if (is_new_t) {
                            /**
                             * Par contre si on découvre, et qu'on est pas sur la première table, on passe sur un join à mettre en place
                             */
                            if (!joined_tables_by_vo_type[api_type_id]) {

                                /**
                                 * On doit identifier le chemin le plus court pour rejoindre les 2 types de données
                                 */
                                let path: Array<ModuleTableField<any>> = this.get_path_between_types(active_api_type_ids, Object.keys(tables_aliases_by_type), api_type_id);
                                if (!path) {
                                    // pas d'impact de ce filtrage puisqu'on a pas de chemin jusqu'au type cible
                                    continue;
                                }

                                /**
                                 * On doit checker le trajet complet
                                 */
                                if (!this.check_access_to_fields(path, access_type)) {
                                    return null;
                                }

                                aliases_n = this.updates_jointures(jointures, api_type_id, joined_tables_by_vo_type, tables_aliases_by_type, path, aliases_n);
                                // joined_tables_by_vo_type[api_type_id_i] = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id_i];
                            }
                        }
                    }
                }
            }

            res += FROM;

            /**
             * C'est là que le fun prend place, on doit créer la requête pour chaque context_filter et combiner tout ensemble
             */
            let where_conditions: string[] = [];

            for (let api_type_id_i in get_active_field_filters) {
                let active_field_filters_by_fields = get_active_field_filters[api_type_id_i];

                for (let field_id_i in active_field_filters_by_fields) {
                    let active_field_filter: ContextFilterVO = active_field_filters_by_fields[field_id_i];

                    if (!active_field_filter) {
                        continue;
                    }

                    if (active_field_filter.vo_type == main_api_type_id) {
                        /**
                         * On a pas besoin de jointure mais par contre on a besoin du filtre
                         */
                        this.update_where_conditions(where_conditions, active_field_filter, tables_aliases_by_type);
                        continue;
                    }

                    if (!joined_tables_by_vo_type[api_type_id_i]) {

                        /**
                         * On doit identifier le chemin le plus court pour rejoindre les 2 types de données
                         */
                        let path: Array<ModuleTableField<any>> = this.get_path_between_types(active_api_type_ids, Object.keys(tables_aliases_by_type), api_type_id_i);
                        if (!path) {
                            // pas d'impact de ce filtrage puisqu'on a pas de chemin jusqu'au type cible
                            continue;
                        }
                        aliases_n = this.updates_jointures(jointures, main_api_type_id, joined_tables_by_vo_type, tables_aliases_by_type, path, aliases_n);
                        // joined_tables_by_vo_type[api_type_id_i] = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id_i];
                    }

                    this.update_where_conditions(where_conditions, active_field_filter, tables_aliases_by_type);
                }
            }

            if (jointures && jointures.length) {
                /**
                 * Il faut ordonner les jointures, pour ne pas référencer des aliases pas encore déclarés
                 */
                jointures.sort((jointurea: string, jointureb: string) => {
                    // Si on cite un alias dans a qui est déclaré dans b, on doit être après b, sinon
                    //  soit l'inverse soit osef
                    let alias_a = jointurea.split(' ')[1];
                    let alias_b = jointureb.split(' ')[1];

                    let citation_1_a = jointurea.split(' ')[3].split('.')[0];
                    let citation_2_a = jointurea.split(' ')[5].split('.')[0];

                    let citation_1_b = jointureb.split(' ')[3].split('.')[0];
                    let citation_2_b = jointureb.split(' ')[5].split('.')[0];

                    if ((citation_1_a == alias_b) || (citation_2_a == alias_b)) {
                        return 1;
                    }

                    if ((citation_1_b == alias_a) || (citation_2_b == alias_a)) {
                        return -1;
                    }

                    return 0;
                });
                res += ' JOIN ' + jointures.join(' JOIN ');
            }

            if (where_conditions && where_conditions.length) {
                res += ' WHERE (' + where_conditions.join(') AND (') + ')';
            }

            if (sort_by) {

                res += ' ORDER BY ' + tables_aliases_by_type[sort_by.vo_type] + '.' + sort_by.field_id + (sort_by.sort_asc ? ' ASC ' : ' DESC ');
            }

            return res;
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return null;
        }
    }

    private check_access_to_api_type_ids_field_ids(
        api_type_ids: string[],
        field_ids: string[],
        access_type: string): boolean {

        if (!StackContext.getInstance().get('IS_CLIENT')) {
            return true;
        }

        let uid: number = StackContext.getInstance().get('UID');
        let roles;
        if (!uid) {
            roles = AccessPolicyServerController.getInstance().getUsersRoles(false, null);
        } else {
            roles = AccessPolicyServerController.getInstance().getUsersRoles(true, uid);
        }

        for (let i in api_type_ids) {
            let api_type_id = api_type_ids[i];
            let field_id = field_ids ? field_ids[i] : null;

            if (!this.check_access_to_field(api_type_id, field_id, access_type, roles)) {
                return false;
            }
        }

        return true;
    }

    private check_access_to_fields(
        fields: Array<ModuleTableField<any>>,
        access_type: string): boolean {

        if (!StackContext.getInstance().get('IS_CLIENT')) {
            return true;
        }

        let uid: number = StackContext.getInstance().get('UID');
        let roles;
        if (!uid) {
            roles = AccessPolicyServerController.getInstance().getUsersRoles(false, null);
        } else {
            roles = AccessPolicyServerController.getInstance().getUsersRoles(true, uid);
        }

        for (let i in fields) {
            let api_type_id = fields[i].module_table.vo_type;
            let field_id = fields[i].field_id;

            if (!this.check_access_to_field(api_type_id, field_id, access_type, roles)) {
                return false;
            }
        }

        return true;
    }

    private check_access_to_field(
        api_type_id: string,
        field_id: string,
        access_type: string,
        roles): boolean {

        /**
         * Si le field_id est le label du type ou id, on peut transformer un droit de type READ en LIST
         */
        let table = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];
        let tmp_access_type = access_type;
        if ((access_type == ModuleDAO.DAO_ACCESS_TYPE_READ) && ((field_id == 'id') || (table.default_label_field && table.default_label_field.field_id && (field_id == table.default_label_field.field_id)))) {
            tmp_access_type = ModuleDAO.DAO_ACCESS_TYPE_LIST_LABELS;
        }

        let target_policy: AccessPolicyVO = AccessPolicyServerController.getInstance().get_registered_policy(
            ModuleDAO.getInstance().getAccessPolicyName(tmp_access_type, api_type_id)
        );

        if (!AccessPolicyServerController.getInstance().checkAccessTo(target_policy, roles)) {
            return false;
        }

        return true;
    }
}