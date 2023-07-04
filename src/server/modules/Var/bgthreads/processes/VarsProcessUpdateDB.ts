import MatroidController from '../../../../../shared/modules/Matroid/MatroidController';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import ModuleParams from '../../../../../shared/modules/Params/ModuleParams';
import VarsController from '../../../../../shared/modules/Var/VarsController';
import VarDAGNode from '../../../../../shared/modules/Var/graph/VarDAGNode';
import VarConfVO from '../../../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import PixelVarDataController from '../../PixelVarDataController';
import VarsDatasProxy from '../../VarsDatasProxy';
import VarsServerController from '../../VarsServerController';
import VarsProcessBase from './VarsProcessBase';

export default class VarsProcessUpdateDB extends VarsProcessBase {

    public static getInstance() {
        if (!VarsProcessUpdateDB.instance) {
            VarsProcessUpdateDB.instance = new VarsProcessUpdateDB();
        }
        return VarsProcessUpdateDB.instance;
    }

    private static instance: VarsProcessUpdateDB = null;

    private constructor() {
        super('VarsProcessUpdateDB', VarDAGNode.TAG_5_NOTIFIED_END, VarDAGNode.TAG_6_UPDATING_IN_DB, VarDAGNode.TAG_6_UPDATED_IN_DB, 10000, true);
    }

    protected worker_sync(node: VarDAGNode): boolean {
        return false;
    }
    protected async worker_async(node: VarDAGNode): Promise<boolean> {
        return false;
    }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<boolean> {

        let nodes_by_type: { [type: string]: VarDAGNode[] } = {};
        for (let i in nodes) {
            let node = nodes[i];

            if (node.by_pass_update_in_db) {
                continue;
            }

            if (this.is_pixel_of_card_supp_1(VarsController.var_conf_by_id[node.var_data.var_id], node.var_data)) {
                continue;
            }

            if (!nodes_by_type[node.var_data._type]) {
                nodes_by_type[node.var_data._type] = [];
            }
            nodes_by_type[node.var_data._type].push(node);
        }

        nodes_by_type = await this.filter_var_datas_by_index_size_limit(nodes_by_type);

        for (let i in nodes_by_type) {
            let nodes_array = nodes_by_type[i];

            await VarDAGNode.BULK_UPDATE(nodes_array);
        }

        return true;
    }

    private is_pixel_of_card_supp_1(var_conf: VarConfVO, matroid: VarDataBaseVO): boolean {
        return var_conf.pixel_activated && (PixelVarDataController.getInstance().get_pixel_card(matroid) > 1);
    }

    /**
     * On indique en param le nombre de vars qu'on accepte de gérer dans le buffer
     *  Le dépilage se fait dans l'ordre de la déclaration, via une itération
     *  Si un jour l'ordre diffère dans JS, on passera sur une liste en FIFO, c'est le but dans tous les cas
     * @returns 0 si on a géré limit éléments dans le buffer, != 0 sinon
     */
    private async handle_buffer(): Promise<void> {

        try {

            if (do_insert && VarsCacheController.getInstance().BDD_do_cache_param_data(handle_var, controller, (!!wrapper.is_server_request) || (!!wrapper.client_tab_id))) {

                if (!to_insert_by_type[handle_var._type]) {
                    to_insert_by_type[handle_var._type] = [];
                }
                to_insert_by_type[handle_var._type].push(handle_var);

                if (env.DEBUG_VARS) {
                    ConsoleHandler.log('handle_buffer:insertOrUpdateVO' +
                        ':index| ' + handle_var._bdd_only_index + " :value|" + handle_var.value + ":value_ts|" + handle_var.value_ts + ":type|" + VarDataBaseVO.VALUE_TYPE_LABELS[handle_var.value_type] +
                        ':client_user_id|' + wrapper.client_user_id + ':client_tab_id|' + wrapper.client_tab_id + ':is_server_request|' + wrapper.is_server_request + ':reason|' + wrapper.reason);
                }
            }
        }

            if (ObjectHandler.hasAtLeastOneAttribute(to_insert_by_type)) {

            let promises = [];
            let result = true;
            for (let api_type_id in to_insert_by_type) {
                let to_insert = to_insert_by_type[api_type_id];

                // on filtre les vars qui ont des indexs trops gros pour postgresql
                let filtered_insert = await this.filter_var_datas_by_index_size_limit(to_insert);

                if ((!filtered_insert) || (!filtered_insert.length)) {
                    continue;
                }

                promises.push((async () => {
                    if (!await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY(filtered_insert, null, true)) {
                        result = false;
                    }

                    /**
                     * Par contre si ça marche il faut mettre à jour les ids dans le cache
                     */
                    let filtered_insert_by_index: { [index: string]: VarDataBaseVO } = {};
                    for (let i in filtered_insert) {
                        let var_data = filtered_insert[i];
                        filtered_insert_by_index[var_data.index] = var_data;
                    }
                    let inserted_vars: Array<{ id: string, _bdd_only_index: string }> = await query(api_type_id)
                        .field('id')
                        .field('_bdd_only_index')
                        .filter_by_text_has('_bdd_only_index', to_insert.map((var_data: VarDataBaseVO) => var_data.index)).exec_as_server().select_all();

                    for (let i in inserted_vars) {
                        let inserted_var = inserted_vars[i];

                        filtered_insert_by_index[inserted_var._bdd_only_index].id = parseInt(inserted_var.id);
                    }
                })());
            }
            await all_promises(promises);

            if (!result) {
                ConsoleHandler.error('VarsDatasProxy:handle_buffer:insert_without_triggers_using_COPY:Erreur - on garde dans le cache pour une prochaine tentative');
            }

            for (let i in to_insert_by_type) {
                let to_insert = to_insert_by_type[i];

                for (let j in to_insert) {
                    let inserted_var_data = to_insert[j];
                    let index: string = inserted_var_data.index;
                    let wrapper = this.vars_datas_buffer_wrapped_indexes[index];

                    /**
                     * On s'assure qu'on a bien la même info dans le cache (cf https://trello.com/c/XkGripbS/1668-pb-de-redondance-de-calcul-sur-els-vars-on-fait-2-fois-le-calcul-ici-pkoi)
                     */
                    let to_notify: boolean = this.check_or_update_var_buffer(inserted_var_data);

                    if (to_notify) {
                        await VarsTabsSubsController.getInstance().notify_vardatas(
                            [new NotifVardatasParam([inserted_var_data])]);
                        await VarsServerCallBackSubsController.getInstance().notify_vardatas([inserted_var_data]);
                    }

                    if (!wrapper) {
                        continue;
                    }

                    wrapper.nb_reads_since_last_insert_or_update = 0;
                    wrapper.nb_reads_since_last_check = 0;
                    wrapper.needs_insert_or_update_ = false;
                    wrapper.var_data_origin_value = wrapper.var_data.value;
                    wrapper.var_data_origin_type = wrapper.var_data.value_type;
                    wrapper.last_insert_or_update = Dates.now();
                    wrapper.update_timeout();
                }
            }
        }

        for (let index in do_delete_from_cache_indexes) {
            delete self.vars_datas_buffer_wrapped_indexes[index];
        }

    } catch(error) {
        ConsoleHandler.error(error);
    } finally {
        this.semaphore_handle_buffer = false;
    }
    }

    /**
     * Check la taille des champs de type ranges au format texte pour parer au bug de postgresql 13 :
     *  'exceeds btree version 4 maximum 2704 for index'
     * @param vardatas
     * @returns
     */
    private async filter_var_datas_by_index_size_limit(nodes_by_type: { [type: string]: VarDAGNode[] }): Promise < { [type: string]: VarDAGNode[] } > {
    let res_by_type: { [type: string]: VarDAGNode[] } = {};

    // A priori la limite à pas à être de 2700, le champ est compressé par la suite, mais ça permet d'être sûr
    let limit = await ModuleParams.getInstance().getParamValueAsInt(VarsDatasProxy.PARAM_NAME_filter_var_datas_by_index_size_limit, 2700, 180000);

    for(let _type in nodes_by_type) {
        let nodes = nodes_by_type[_type];

        let matroid_fields: Array<ModuleTableField<any>> = MatroidController.getInstance().getMatroidFields(_type);

        for (let i in nodes) {
            let node = nodes[i];
            let vardata = node.var_data;
            let refuse_var = false;

            for (let j in matroid_fields) {
                let matroid_field = matroid_fields[j];

                let matroid_field_value = vardata[matroid_field.field_id];
                let matroid_field_value_index = RangeHandler.translate_to_bdd(matroid_field_value);
                if (matroid_field_value_index && (matroid_field_value_index.length > limit)) {
                    ConsoleHandler.warn('VarsDatasProxy:filter_var_datas_by_index_size_limit:Le champ ' + matroid_field.field_id + ' de la matrice ' + _type + ' est trop long pour être indexé par postgresql, on le supprime de la requête:index:' + vardata.index);
                    refuse_var = true;
                    break;
                }
            }

            if (!refuse_var) {

                if (!res_by_type[_type]) {
                    res_by_type[_type] = [];
                }
                res_by_type[_type].push(node);
            }
        }
    }

        return res_by_type;
}
}