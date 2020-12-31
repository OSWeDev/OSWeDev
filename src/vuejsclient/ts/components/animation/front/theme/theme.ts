import { Component, Prop } from "vue-property-decorator";
import AnimationController from "../../../../../../shared/modules/Animation/AnimationController";
import ThemeModuleDataParamRangesVO from "../../../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataParamRangesVO";
import VarDayPrctAvancementAnimationController from "../../../../../../shared/modules/Animation/vars/VarDayPrctAvancementAnimationController";
import AnimationModuleVO from "../../../../../../shared/modules/Animation/vos/AnimationModuleVO";
import AnimationThemeVO from "../../../../../../shared/modules/Animation/vos/AnimationThemeVO";
import NumSegment from "../../../../../../shared/modules/DataRender/vos/NumSegment";
import ISimpleNumberVarData from "../../../../../../shared/modules/Var/interfaces/ISimpleNumberVarData";
import IVarDataVOBase from "../../../../../../shared/modules/Var/interfaces/IVarDataVOBase";
import RangeHandler from "../../../../../../shared/tools/RangeHandler";
import VarDataRefComponent from '../../../Var/components/dataref/VarDataRefComponent';
import VueComponentBase from '../../../VueComponentBase';

@Component({
    template: require("./theme.pug"),
    components: {}
})
export default class VueAnimationThemeComponent extends VueComponentBase {

    @Prop()
    private theme: AnimationThemeVO;

    @Prop()
    private index_theme: number;

    @Prop()
    private modules: AnimationModuleVO[];

    private async mounted() { }

    private prct_avancement_theme: number = 0;

    private go_to_route_module(module: AnimationModuleVO) {
        this.$router.push({
            name: AnimationController.ROUTE_NAME_ANIMATION_MODULE,
            params: {
                module_id: module.id.toString(),
            }
        });
    }

    private prct_avancement_theme_value_callback(var_value: IVarDataVOBase, component: VarDataRefComponent): number {
        if (!component || !component.var_param.var_id) {
            return;
        }

        this.prct_avancement_theme = (var_value as ISimpleNumberVarData).value;

        return this.prct_avancement_theme;
    }

    private get_prct_avancement_module_param(module_id: number): ThemeModuleDataParamRangesVO {
        return ThemeModuleDataParamRangesVO.createNew(
            VarDayPrctAvancementAnimationController.getInstance().varConf.id,
            null,
            [RangeHandler.getInstance().create_single_elt_NumRange(module_id, NumSegment.TYPE_INT)],
        );
    }

    get ordered_modules(): AnimationModuleVO[] {
        return this.modules ? this.modules.sort((a, b) => a.weight - b.weight) : null;
    }

    get style_barre_avancement(): any {
        return {
            width: (this.prct_avancement_theme * 100) + '%',
        };
    }

    get prct_avancement_theme_param(): ThemeModuleDataParamRangesVO {
        return ThemeModuleDataParamRangesVO.createNew(
            VarDayPrctAvancementAnimationController.getInstance().varConf.id,
            [RangeHandler.getInstance().create_single_elt_NumRange(this.theme.id, NumSegment.TYPE_INT)],
            null,
        );
    }
}