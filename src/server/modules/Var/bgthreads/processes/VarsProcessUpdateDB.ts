import MatroidController from '../../../../../shared/modules/Matroid/MatroidController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../../shared/modules/ModuleTableFieldVO';
import ModuleParams from '../../../../../shared/modules/Params/ModuleParams';
import VarDAGNode from '../../../../../server/modules/Var/vos/VarDAGNode';
import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import ModuleDAOServer from '../../../DAO/ModuleDAOServer';
import VarsCacheController from '../../VarsCacheController';
import VarsDatasProxy from '../../VarsDatasProxy';
import VarsProcessBase from './VarsProcessBase';
import VarConfVO from '../../../../../shared/modules/Var/vos/VarConfVO';
import PixelVarDataController from '../../PixelVarDataController';
import VarsController from '../../../../../shared/modules/Var/VarsController';

export default class VarsProcessUpdateDB extends VarsProcessBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!VarsProcessUpdateDB.instance) {
            VarsProcessUpdateDB.instance = new VarsProcessUpdateDB();
        }
        return VarsProcessUpdateDB.instance;
    }

    private static instance: VarsProcessUpdateDB = null;

    private constructor() {
        super('VarsProcessUpdateDB', VarDAGNode.TAG_5_NOTIFIED_END, VarDAGNode.TAG_6_UPDATING_IN_DB, VarDAGNode.TAG_6_UPDATED_IN_DB, 10, true);
    }

    protected worker_sync(node: VarDAGNode): boolean {
        return false;
    }
    protected async worker_async(node: VarDAGNode): Promise<boolean> {
        return false;
    }

    protected async worker_async_batch(nodes: { [node_name: string]: VarDAGNode }): Promise<boolean> {

        let nodes_by_type_and_index: { [type: string]: { [index: string]: VarDAGNode } } = {};
        let printed_tree: boolean = false;
        for (const i in nodes) {
            const node = nodes[i];

            if (this.is_pixel_of_card_supp_1(VarsController.var_conf_by_id[node.var_data.var_id], node.var_data)) {
                continue;
            }

            /**
             * On update en base aucune data issue de la BDD, puisque si on a chargé la donnée, soit c'est un import qu'on a donc interdiction de toucher, soit c'est
             *  un cache de var_data pas invalidé, et puisque pas invalidé, on y touche pas
             */
            if (node.var_data.id) {
                ConsoleHandler.warn('VarsProcessUpdateDB:worker_async_batch:node.var_data.id:' + node.var_data.id + ':node.var_data.index:' + node.var_data.index + ':is_import:' + (node.var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT));
                continue;
            }

            if (!nodes_by_type_and_index[node.var_data._type]) {
                nodes_by_type_and_index[node.var_data._type] = {};
            }

            // Check de cohérence : on doit pas avoir plusieurs noeuds avec le même index
            if (nodes_by_type_and_index[node.var_data._type][node.var_data.index]) {
                ConsoleHandler.error('VarsProcessUpdateDB:worker_async_batch:Erreur : on a plusieurs noeuds avec le même index : ' + node.var_data.index);
                if (!printed_tree) {
                    ConsoleHandler.error('VarsProcessUpdateDB:worker_async_batch:Erreur : nodes:' + JSON.stringify(nodes));
                    printed_tree = true;
                }
                continue;
            }
            nodes_by_type_and_index[node.var_data._type][node.var_data.index] = node;
        }

        if (!ConfigurationService.IS_UNIT_TEST_MODE) {
            nodes_by_type_and_index = await this.filter_var_datas_by_index_size_limit(nodes_by_type_and_index);
            nodes_by_type_and_index = await this.filter_by_BDD_do_cache_param_data(nodes_by_type_and_index);
        }

        const promises = [];
        let result = true;
        for (const i in nodes_by_type_and_index) {
            const nodes_by_index: { [index: string]: VarDAGNode } = nodes_by_type_and_index[i];

            if (!nodes_by_index) {
                continue;
            }

            const vars_datas: VarDataBaseVO[] = [];

            for (const j in nodes_by_index) {
                const node = nodes_by_index[j];
                vars_datas.push(node.var_data);
            }

            if (!vars_datas.length) {
                continue;
            }

            if (!ConfigurationService.IS_UNIT_TEST_MODE) {
                promises.push((async () => {
                    if (!await ModuleDAOServer.getInstance().insert_without_triggers_using_COPY(vars_datas, null, true)) {
                        result = false;
                    }
                })());
            }
        }
        await all_promises(promises);

        if (!result) {
            ConsoleHandler.error('VarsDatasProxy:handle_buffer:insert_without_triggers_using_COPY:Erreur - on garde dans le cache pour une prochaine tentative');
        }


        return true;
    }

    private is_pixel_of_card_supp_1(var_conf: VarConfVO, matroid: VarDataBaseVO): boolean {
        return var_conf.pixel_activated && (PixelVarDataController.getInstance().get_pixel_card(matroid) > 1);
    }

    /**
     * Check la taille des champs de type ranges au format texte pour parer au bug de postgresql 13 :
     *  'exceeds btree version 4 maximum 2704 for index'
     * @param vardatas
     * @returns
     */
    private async filter_var_datas_by_index_size_limit(nodes_by_type_and_index: { [type: string]: { [index: string]: VarDAGNode } }): Promise<{ [type: string]: { [index: string]: VarDAGNode } }> {
        const res_by_type: { [type: string]: { [index: string]: VarDAGNode } } = {};

        // A priori la limite à pas à être de 2700, le champ est compressé par la suite, mais ça permet d'être sûr
        const limit = await ModuleParams.getInstance().getParamValueAsInt(VarsDatasProxy.PARAM_NAME_filter_var_datas_by_index_size_limit, 2700, 180000);

        for (const _type in nodes_by_type_and_index) {
            const nodes: { [index: string]: VarDAGNode } = nodes_by_type_and_index[_type];

            const matroid_fields: ModuleTableFieldVO[] = MatroidController.getMatroidFields(_type);

            for (const i in nodes) {
                const node = nodes[i];
                const vardata = node.var_data;
                let refuse_var = false;

                for (const j in matroid_fields) {
                    const matroid_field = matroid_fields[j];

                    const matroid_field_value = vardata[matroid_field.field_id];
                    const matroid_field_value_index = RangeHandler.translate_to_bdd(matroid_field_value);
                    if (matroid_field_value_index && (matroid_field_value_index.length > limit)) {
                        ConsoleHandler.warn('VarsDatasProxy:filter_var_datas_by_index_size_limit:Le champ ' + matroid_field.field_id + ' de la matrice ' + _type + ' est trop long pour être indexé par postgresql, on le supprime de la requête:index:' + vardata.index);
                        refuse_var = true;
                        break;
                    }
                }

                if (!refuse_var) {

                    if (!res_by_type[_type]) {
                        res_by_type[_type] = {};
                    }
                    res_by_type[_type][vardata.index] = node;
                }
            }
        }

        return res_by_type;
    }

    private async filter_by_BDD_do_cache_param_data(nodes_by_type_and_index: { [type: string]: { [index: string]: VarDAGNode } }): Promise<{ [type: string]: { [index: string]: VarDAGNode } }> {
        const res_by_type: { [type: string]: { [index: string]: VarDAGNode } } = {};

        for (const _type in nodes_by_type_and_index) {
            const nodes = nodes_by_type_and_index[_type];

            for (const i in nodes) {
                const node = nodes[i];

                if (VarsCacheController.BDD_do_cache_param_data(node)) {

                    if (!res_by_type[_type]) {
                        res_by_type[_type] = {};
                    }

                    res_by_type[_type][node.var_data.index] = node;
                }
            }
        }

        return res_by_type;
    }
}