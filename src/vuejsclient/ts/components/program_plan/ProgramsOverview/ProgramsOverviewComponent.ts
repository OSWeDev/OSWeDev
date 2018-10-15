import VueComponentBase from '../../VueComponentBase';
import Component from 'vue-class-component';
import { ModuleDAOGetter, ModuleDAOAction } from '../../dao/store/DaoStore';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import IPlanProgramCategory from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanProgramCategory';
import ModuleProgramPlanBase from '../../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import IPlanProgram from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanProgram';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ProgramPlanClientVueModule from '../ProgramPlanClientVueModule';


@Component({
    template: require('./ProgramsOverviewComponent.pug'),
    components: {
    }
})
export default class ProgramsOverviewComponent extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };
    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;


    public async mounted() {
        this.startLoading();
        this.nbLoadingSteps = 2;

        this.storeDatas({
            API_TYPE_ID: ModuleProgramPlanBase.getInstance().program_category_type_id,
            vos: await ModuleDAO.getInstance().getVos(ModuleProgramPlanBase.getInstance().program_category_type_id)
        });

        this.nextLoadingStep();

        this.storeDatas({
            API_TYPE_ID: ModuleProgramPlanBase.getInstance().program_type_id,
            vos: await ModuleDAO.getInstance().getVos(ModuleProgramPlanBase.getInstance().program_type_id)
        });

        this.stopLoading();
    }

    get programs_categories(): { [id: number]: IPlanProgramCategory } {
        return this.getStoredDatas[ModuleProgramPlanBase.getInstance().program_category_type_id] as { [id: number]: IPlanProgramCategory };
    }

    get programs_by_category(): { [category_id: number]: IPlanProgram[] } {
        let res: { [category_id: number]: IPlanProgram[] } = {};

        for (let i in this.getStoredDatas[ModuleProgramPlanBase.getInstance().program_type_id]) {
            let program: IPlanProgram = this.getStoredDatas[ModuleProgramPlanBase.getInstance().program_type_id][i] as IPlanProgram;

            if ((!program.days_by_target) || (!program.nb_targets)) {
                continue;
            }

            if (!res[program.category_id]) {
                res[program.category_id] = [];
            }
            res[program.category_id].push(program);
        }
        return res;
    }

    private open_program(program: IPlanProgram) {
        this.$router.push(ProgramPlanClientVueModule.ROUTE_BASE_PLAN_PROGRAM + program.id);
    }
}