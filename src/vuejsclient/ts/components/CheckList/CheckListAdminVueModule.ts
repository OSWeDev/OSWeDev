import ModuleCheckListBase from '../../../../shared/modules/CheckList/ModuleCheckListBase';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import MenuController from '../menu/MenuController';

export default class CheckListAdminVueModuleBase extends VueModuleBase {

    private post_initialization_hook: () => Promise<void> = null;

    public constructor(name: string, post_initialization_hook: () => Promise<void> = null) {

        super(name);
        this.post_initialization_hook = post_initialization_hook;
        this.policies_needed = [
            this.checklist_shared_module.POLICY_BO_ACCESS
        ];
    }

    get checklist_shared_module(): ModuleCheckListBase {
        return this.shared_module as ModuleCheckListBase;
    }

    public async initializeAsync() {

        if (!this.policies_loaded[this.checklist_shared_module.POLICY_BO_ACCESS]) {
            return;
        }

        let menuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    this.checklist_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.name + "_ChckLstAdminVueModule",
                    "fa-list",
                    20,
                    null
                )
            );

        if ((!!this.checklist_shared_module.checklist_type_id) &&
            (!CRUDComponentManager.getInstance().cruds_by_api_type_id[this.checklist_shared_module.checklist_type_id])) {

            await CRUDComponentManager.getInstance().registerCRUD(
                this.checklist_shared_module.checklist_type_id,
                null,
                MenuElementVO.create_new(
                    this.checklist_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.checklist_shared_module.checklist_type_id,
                    "fa-list",
                    10,
                    null,
                    null,
                    menuBranch.id
                ),
                this.routes);
        }

        if ((!!this.checklist_shared_module.checkpoint_type_id) &&
            (!CRUDComponentManager.getInstance().cruds_by_api_type_id[this.checklist_shared_module.checkpoint_type_id])) {

            await CRUDComponentManager.getInstance().registerCRUD(
                this.checklist_shared_module.checkpoint_type_id,
                null,
                MenuElementVO.create_new(
                    this.checklist_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.checklist_shared_module.checkpoint_type_id,
                    "fa-check-circle",
                    20,
                    null,
                    null,
                    menuBranch.id
                ),
                this.routes);
        }

        if ((!!this.checklist_shared_module.checklistitem_type_id) &&
            (!CRUDComponentManager.getInstance().cruds_by_api_type_id[this.checklist_shared_module.checklistitem_type_id])) {

            await CRUDComponentManager.getInstance().registerCRUD(
                this.checklist_shared_module.checklistitem_type_id,
                null,
                MenuElementVO.create_new(
                    this.checklist_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.checklist_shared_module.checklistitem_type_id,
                    "fa-file",
                    30,
                    null,
                    null,
                    menuBranch.id
                ),
                this.routes);
        }

        if (!!this.post_initialization_hook) {
            await this.post_initialization_hook();
        }
    }
}