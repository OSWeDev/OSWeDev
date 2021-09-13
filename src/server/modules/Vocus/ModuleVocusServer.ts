import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IRange from '../../../shared/modules/DataRender/interfaces/IRange';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleVocus from '../../../shared/modules/Vocus/ModuleVocus';
import VocusInfoVO from '../../../shared/modules/Vocus/vos/VocusInfoVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';

export default class ModuleVocusServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleVocusServer.instance) {
            ModuleVocusServer.instance = new ModuleVocusServer();
        }
        return ModuleVocusServer.instance;
    }

    private static instance: ModuleVocusServer = null;

    private constructor() {
        super(ModuleVocus.getInstance().name);
    }

    public async configure() {
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Vocus'
        }, 'menu.menuelements.admin.Vocus.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Vocus'
        }, 'menu.menuelements.admin.VocusAdminVueModule.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'CRUD'
        }, 'vocus.crud.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'ID'
        }, 'vocus.id.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Label'
        }, 'vocus.label.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Type'
        }, 'vocus.vo_type.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Limité à 1000 lignes...'
        }, 'vocus.limit1000.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Vocus'
        }, 'vocus.vocus.___LABEL___'));
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleVocus.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Vocus'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleVocus.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration du Vocus'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.getInstance().get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleVocus.APINAME_getVosRefsById, this.getVosRefsById.bind(this));
    }

    /**
     * Objectif: Renvoyer tous les IDistantVoBase qui sont liées à ce vo (par type + id) par une liaison 1/n, n/1 ou n/n
     * TODO : (dans le cas du n/n on pourrait renvoyer directement la cible finale, pas le vo de la table n/n)
     */
    public async getVosRefsById(
        API_TYPE_ID: string,
        id: number,
        segmentation_ranges: IRange[] = null,
        limit: number = 1000
    ): Promise<VocusInfoVO[]> {

        let res_map: { [type: string]: { [id: number]: VocusInfoVO } } = {};

        // On va aller chercher tous les module table fields qui sont des refs de cette table
        let moduleTable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        if (!moduleTable) {
            return null;
        }

        let refFields: Array<ModuleTableField<any>> = [];

        for (let i in VOsTypesManager.getInstance().moduleTables_by_voType) {
            let table = VOsTypesManager.getInstance().moduleTables_by_voType[i];

            if (table.vo_type == moduleTable.vo_type) {
                continue;
            }

            /**
             * On ignore les modules inactifs
             */
            if (table.module && !table.module.actif) {
                continue;
            }

            // // On ignore les liens entre tables de versioning
            // if ((VersionedVOController.getInstance().getVersionedVoType(moduleTable.vo_type) == table.vo_type) ||
            //     (VersionedVOController.getInstance().getTrashedVersionedVoType(moduleTable.vo_type) == table.vo_type) ||
            //     (VersionedVOController.getInstance().getTrashedVoType(moduleTable.vo_type) == table.vo_type)) {
            //     continue;
            // }

            let fields = table.get_fields();
            for (let j in fields) {
                let field = fields[j];

                if (!field.has_relation) {
                    continue;
                }

                if ((!field.manyToOne_target_moduletable) || (field.manyToOne_target_moduletable.vo_type != moduleTable.vo_type)) {
                    continue;
                }

                refFields.push(field);
            }
        }

        for (let i in refFields) {
            let refField = refFields[i];

            let refvos: IDistantVOBase[] = await ModuleDAO.getInstance().getVosByRefFieldIds(refField.module_table.vo_type, refField.field_id, [id]);

            for (let j in refvos) {
                let refvo: IDistantVOBase = refvos[j];

                if (!res_map[refvo._type]) {
                    res_map[refvo._type] = {};
                }

                let tmp: VocusInfoVO = res_map[refvo._type][refvo.id] ? res_map[refvo._type][refvo.id] : new VocusInfoVO();
                tmp.is_cascade = tmp.is_cascade || refField.cascade_on_delete;
                tmp.linked_id = refvo.id;
                tmp.linked_type = refvo._type;

                let table = refField.module_table;
                if (table && table.default_label_field) {
                    tmp.linked_label = refvo[table.default_label_field.field_id];
                } else if (table && table.table_label_function) {
                    tmp.linked_label = table.table_label_function(refvo);
                }

                res_map[refvo._type][refvo.id] = tmp;

                if (!!limit) {
                    limit--;
                    if (limit <= 0) {
                        break;
                    }
                }
            }
            if ((limit != null) && (limit <= 0)) {
                break;
            }
        }

        let res: VocusInfoVO[] = [];
        for (let i in res_map) {
            for (let j in res_map[i]) {

                res.push(res_map[i][j]);
            }
        }

        return res;
    }
}