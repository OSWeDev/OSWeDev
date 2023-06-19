import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import IPlanProgram from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanProgram';
import IPlanProgramCategory from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanProgramCategory';
import ModuleProgramPlanBase from '../../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import { ModuleDAOAction, ModuleDAOGetter } from '../../dao/store/DaoStore';
import VueComponentBase from '../../VueComponentBase';
import ProgramPlanClientVueModule from '../ProgramPlanClientVueModule';
import './ProgramsOverviewComponent.scss';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';

@Component({
    template: require('./ProgramsOverviewComponent.pug'),
    components: {}
})
export default class ProgramsOverviewComponent extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };
    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    @Prop({ default: null })
    public program_plan_shared_module: ModuleProgramPlanBase;

    @Prop({ default: null })
    public program_plan_client_module: ProgramPlanClientVueModule;

    public async mounted() {
        this.startLoading();
        this.nbLoadingSteps = 2;

        this.storeDatas({
            API_TYPE_ID: this.program_plan_shared_module.program_category_type_id,
            vos: await query(this.program_plan_shared_module.program_category_type_id).select_vos()
        });

        this.nextLoadingStep();

        this.storeDatas({
            API_TYPE_ID: this.program_plan_shared_module.program_type_id,
            vos: await query(this.program_plan_shared_module.program_type_id).select_vos()
        });

        this.stopLoading();
    }

    get programs_categories_ordered_by_weight(): IPlanProgramCategory[] {
        let res: IPlanProgramCategory[] = [];

        for (let i in this.getStoredDatas[this.program_plan_shared_module.program_category_type_id]) {
            let program_category: IPlanProgramCategory = this.getStoredDatas[this.program_plan_shared_module.program_category_type_id][i] as IPlanProgramCategory;

            res.push(program_category);
        }

        res.sort((a: IPlanProgramCategory, b: IPlanProgramCategory) => {
            return a.weight - b.weight;
        });
        return res;
    }

    get programs_by_category(): { [category_id: number]: IPlanProgram[] } {
        let res: { [category_id: number]: IPlanProgram[] } = {};

        for (let i in this.getStoredDatas[this.program_plan_shared_module.program_type_id]) {
            let program: IPlanProgram = this.getStoredDatas[this.program_plan_shared_module.program_type_id][i] as IPlanProgram;

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
        this.$router.push(this.program_plan_client_module.route_base_program + program.id);
    }
}