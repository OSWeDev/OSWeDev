import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import RoleVO from '../../../../../../../shared/modules/AccessPolicy/vos/RoleVO';
import AnimationController from '../../../../../../../shared/modules/Animation/AnimationController';
import AnimationModuleVO from '../../../../../../../shared/modules/Animation/vos/AnimationModuleVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleAnimationReportingVuexGetter } from '../../../store/AnimationReportingVuexStore';

@Component({
    template: require('./reporting_filtres.pug'),
})
export default class VueAnimationReportingFiltresComponent extends VueComponentBase {

    @ModuleAnimationReportingVuexGetter
    private get_filter_anim_theme_active_options: DataFilterOption[];

    private tmp_filter_module_termine: DataFilterOption = null;
    private tmp_filter_module_valide: DataFilterOption = null;

    @Watch('tmp_filter_module_termine')
    private change_tmp_filter_module_termine() {
        this.$store.commit('AnimationReportingVuexStore/set_filter_module_termine_active_option', this.tmp_filter_module_termine);
    }

    @Watch('tmp_filter_module_valide')
    private change_tmp_filter_module_valide() {
        this.$store.commit('AnimationReportingVuexStore/set_filter_module_valide_active_option', this.tmp_filter_module_valide);
    }

    private get_role_name(role: RoleVO): string {
        return this.label(role.translatable_name);
    }

    private condition_by_anim_theme(anim_module: AnimationModuleVO, anim_theme_options: DataFilterOption[]): boolean {
        let res: boolean = true;

        if (this.get_filter_anim_theme_active_options && this.get_filter_anim_theme_active_options.length > 0) {
            return this.get_filter_anim_theme_active_options.find((e) => e.id == anim_module.theme_id) != null;
        }

        return res;
    }

    private multiselectOptionLabel(filter_item: DataFilterOption): string {
        if ((filter_item == null) || (typeof filter_item == 'undefined')) {
            return '';
        }

        return filter_item.label;
    }

    get filter_options(): DataFilterOption[] {
        return [
            new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.t('YES'), AnimationController.OPTION_YES),
            new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.t('NO'), AnimationController.OPTION_NO),
        ];
    }
}