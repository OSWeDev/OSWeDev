import ICheckList from '../../../../shared/modules/CheckList/interfaces/ICheckList';
import ICheckListItem from '../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckPoint from '../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import ModuleCheckListBase from '../../../../shared/modules/CheckList/ModuleCheckListBase';
import CheckPointVO from '../../../../shared/modules/CheckList/vos/CheckPointVO';
import DatatableField from '../../../../shared/modules/DAO/vos/datatable/DatatableField';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import Module from '../../../../shared/modules/Module';
import ModulesManager from '../../../../shared/modules/ModulesManager';

export default abstract class CheckListControllerBase {

    public static controller_by_name: { [name: string]: CheckListControllerBase } = {};

    public static getInstance(name: string) {
        return CheckListControllerBase.controller_by_name[name];
    }

    public constructor(
        public name: string
    ) {
        CheckListControllerBase.controller_by_name[name] = this;
    }

    public abstract get_ordered_editable_fields(): Array<DatatableField<any, any>>;

    get shared_module(): Module {
        return ModulesManager.getInstance().getModuleByNameAndRole(this.name, Module.SharedModuleRoleName) as Module;
    }

    get checklist_shared_module(): ModuleCheckListBase {
        return this.shared_module as ModuleCheckListBase;
    }

    /**
     * Renvoie une instance de CheckListItem
     */
    public abstract getCheckListItemNewInstance(): ICheckListItem;

    public abstract get_state_step(step_name: string, checklist_item: ICheckListItem): Promise<number>;

    public async component_hook_onAsyncLoading(
        getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } },
        storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void,
        checklist: ICheckList, checklistitems: { [id: number]: ICheckListItem }, checkpoints: { [id: number]: ICheckPoint }
    ) { }

    public get_infos_cols_labels(): string[] {
        return [];
    }

    public items_sorter(a: ICheckListItem, b: ICheckListItem): number {
        if (a.id > b.id) {
            return -1;
        }

        if (a.id < b.id) {
            return 1;
        }

        return 0;
    }

    public get_infos_cols_content(checklist_item: ICheckListItem): string[] {
        return [];
    }

    public async get_step_description(checkpoint: CheckPointVO, checklist_item: ICheckListItem): Promise<string> {
        return null;
    }
}