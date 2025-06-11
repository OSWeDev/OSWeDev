import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../shared/modules/DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import IRange from '../../../shared/modules/DataRender/interfaces/IRange';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import Module from '../../../shared/modules/Module';
import ModulesManager from '../../../shared/modules/ModulesManager';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ModuleVocus from '../../../shared/modules/Vocus/ModuleVocus';
import VocusInfoVO from '../../../shared/modules/Vocus/vos/VocusInfoVO';
import { all_promises } from '../../../shared/tools/PromiseTools';
import RangeHandler from '../../../shared/tools/RangeHandler';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleVocusServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleVocusServer.instance) {
            ModuleVocusServer.instance = new ModuleVocusServer();
        }
        return ModuleVocusServer.instance;
    }

    private static instance: ModuleVocusServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleVocus.getInstance().name);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Vocus'
        }, 'menu.menuelements.admin.Vocus.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Vocus'
        }, 'menu.menuelements.admin.VocusAdminVueModule.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'CRUD'
        }, 'vocus.crud.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'ID'
        }, 'vocus.id.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Label'
        }, 'vocus.label.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Type'
        }, 'vocus.vo_type.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Limité à 1000 lignes...'
        }, 'vocus.limit1000.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Vocus'
        }, 'vocus.vocus.___LABEL___'));
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleVocus.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Vocus'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleVocus.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration du Vocus'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleVocus.APINAME_getVosRefsById, this.getVosRefsById.bind(this));
    }

    /**
     * Objectif: Renvoyer tous les IDistantVoBase qui sont liées à ce vo (par type + id) par une liaison 1/n, n/1 ou n/n
     * TODO : (dans le cas du n/n on pourrait renvoyer directement la cible finale, pas le vo de la table n/n)
     */
    public async getVosRefsById(
        API_TYPE_ID: string,
        id: number,
        segmentation_ranges: IRange[] = null,
        limit: number = 1000,
        limit_to_cascading_refs: boolean = false
    ): Promise<VocusInfoVO[]> {

        const res_map: { [type: string]: { [id: number]: VocusInfoVO } } = {};

        // On va aller chercher tous les module table fields qui sont des refs de cette table
        const moduleTable: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[API_TYPE_ID];

        if (!moduleTable) {
            return null;
        }

        const refFields: ModuleTableFieldVO[] = [];

        for (const i in ModuleTableController.module_tables_by_vo_type) {
            const table = ModuleTableController.module_tables_by_vo_type[i];

            if (table.vo_type == moduleTable.vo_type) {
                continue;
            }

            /**
             * On ignore les modules inactifs
             */
            if (table.module_name && !ModulesManager.getModuleByNameAndRole(table.module_name, Module.SharedModuleRoleName).actif) {
                continue;
            }

            // // On ignore les liens entre tables de versioning
            // if ((VersionedVOController.getInstance().getVersionedVoType(moduleTable.vo_type) == table.vo_type) ||
            //     (VersionedVOController.getInstance().getTrashedVersionedVoType(moduleTable.vo_type) == table.vo_type) ||
            //     (VersionedVOController.getInstance().getTrashedVoType(moduleTable.vo_type) == table.vo_type)) {
            //     continue;
            // }

            const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[table.vo_type];
            for (const j in fields) {
                const field = fields[j];

                if ((!field.foreign_ref_vo_type) || (field.foreign_ref_vo_type != moduleTable.vo_type)) {
                    continue;
                }

                if (limit_to_cascading_refs && !field.cascade_on_delete) {
                    continue;
                }

                refFields.push(field);
            }
        }

        const promises = [];
        for (const i in refFields) {
            const refField = refFields[i];

            promises.push((async () => {
                const refvos: IDistantVOBase[] = await query(refField.module_table_vo_type)
                    .filter_by_num_x_ranges(refField.field_id, [RangeHandler.create_single_elt_NumRange(id, NumSegment.TYPE_INT)])
                    .select_vos<IDistantVOBase>();

                for (const j in refvos) {
                    const refvo: IDistantVOBase = refvos[j];

                    if (!res_map[refvo._type]) {
                        res_map[refvo._type] = {};
                    }

                    const tmp: VocusInfoVO = res_map[refvo._type][refvo.id] ? res_map[refvo._type][refvo.id] : new VocusInfoVO();
                    tmp.is_cascade = tmp.is_cascade || refField.cascade_on_delete;
                    tmp.linked_id = refvo.id;
                    tmp.linked_type = refvo._type;

                    const table = ModuleTableController.module_tables_by_vo_type[refField.module_table_vo_type];
                    const table_label_function = ModuleTableController.table_label_function_by_vo_type[refField.module_table_vo_type];
                    if (table && table.default_label_field) {
                        tmp.linked_label = refvo[table.default_label_field.field_id];
                    } else if (table && table_label_function) {
                        tmp.linked_label = table_label_function(refvo);
                    }

                    res_map[refvo._type][refvo.id] = tmp;

                    if (limit) {
                        limit--;
                        if (limit <= 0) {
                            break;
                        }
                    }
                }
            })());
            if ((limit != null) && (limit <= 0)) {
                break;
            }
        }

        await all_promises(promises);

        const res: VocusInfoVO[] = [];
        for (const i in res_map) {
            for (const j in res_map[i]) {

                res.push(res_map[i][j]);
            }
        }

        return res;
    }
}