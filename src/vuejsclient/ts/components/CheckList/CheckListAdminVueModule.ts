import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleCheckListBase from '../../../../shared/modules/CheckList/ModuleCheckListBase';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';

export default class CheckListAdminVueModuleBase extends VueModuleBase {

    private _DEFAULT_MENU_BRANCH: MenuBranch = null;
    get DEFAULT_MENU_BRANCH(): MenuBranch {
        if (!this._DEFAULT_MENU_BRANCH) {
            this._DEFAULT_MENU_BRANCH = new MenuBranch(
                this.name + "_ChckLstAdminVueModule",
                MenuElementBase.PRIORITY_HIGH,
                "fa-list",
                []
            );
        }
        return this._DEFAULT_MENU_BRANCH;
    }

    private post_initialization_hook: () => Promise<void> = null;

    public constructor(name: string, post_initialization_hook: () => Promise<void> = null) {

        super(name);
        this.post_initialization_hook = post_initialization_hook;
    }

    get checklist_shared_module(): ModuleCheckListBase {
        return this.shared_module as ModuleCheckListBase;
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(this.checklist_shared_module.POLICY_BO_ACCESS)) {
            return;
        }

        let menuBranch: MenuBranch = this.DEFAULT_MENU_BRANCH;

        if (!!this.checklist_shared_module.checklist_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.checklist_shared_module.checklist_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.checklist_shared_module.checklist_type_id, MenuElementBase.PRIORITY_ULTRAHIGH, "fa-list"),
                    menuBranch),
                this.routes);
        }

        if (!!this.checklist_shared_module.checkpoint_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.checklist_shared_module.checkpoint_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.checklist_shared_module.checkpoint_type_id, MenuElementBase.PRIORITY_HIGH, "fa-check-circle"),
                    menuBranch),
                this.routes);
        }

        if (!!this.checklist_shared_module.checklistitem_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.checklist_shared_module.checklistitem_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.checklist_shared_module.checklistitem_type_id, MenuElementBase.PRIORITY_MEDIUM, "fa-file"),
                    menuBranch),
                this.routes);
        }

        if (!!this.post_initialization_hook) {
            await this.post_initialization_hook();
        }
    }
}