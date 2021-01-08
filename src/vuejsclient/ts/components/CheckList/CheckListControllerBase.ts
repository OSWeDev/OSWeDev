import ICheckListItem from '../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import DatatableField from '../../../../shared/modules/DAO/vos/datatable/DatatableField';
import Module from '../../../../shared/modules/Module';
import ModulesManager from '../../../../shared/modules/ModulesManager';
import ModuleProgramPlanBase from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';

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

    get checklist_shared_module(): ModuleProgramPlanBase {
        return this.shared_module as ModuleProgramPlanBase;
    }

    /**
     * Renvoie une instance de CheckListItem
     */
    public abstract getCheckListItemNewInstance(): ICheckListItem;

    public abstract get_state_step(step_shortname: string, checklist_item: ICheckListItem): Promise<number>;
}