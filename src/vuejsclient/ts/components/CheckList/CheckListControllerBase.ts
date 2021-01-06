import ICheckListItem from '../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import DatatableField from '../../../../shared/modules/DAO/vos/datatable/DatatableField';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import Module from '../../../../shared/modules/Module';
import ModulesManager from '../../../../shared/modules/ModulesManager';
import ModuleProgramPlanBase from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';

export default abstract class CheckListControllerBase {

    public static getInstance(name: string) {
        return CheckListControllerBase.controller_by_name[name];
    }

    protected static controller_by_name: { [name: string]: CheckListControllerBase } = {};

    public constructor(
        public name: string,
        public customFilterComponent
    ) {
        CheckListControllerBase.controller_by_name[name] = this;
    }

    public abstract get_ordered_editable_fields(): Array<DatatableField<any, any>>;

    get shared_module(): Module {
        return ModulesManager.getInstance().getModuleByNameAndRole(this.name, Module.SharedModuleRoleName) as Module;
    }

    get checklist_shared_module(): ModuleProgramPlanBase {
        return this.shared_module as ModuleProgramPlanBase;
    }

    /**
     * Renvoie une instance de CheckListItem
     */
    public abstract getCheckListItemNewInstance(): ICheckListItem;

    public async component_hook_onAsyncLoading(
        getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } },
        storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void
    ) { }
}