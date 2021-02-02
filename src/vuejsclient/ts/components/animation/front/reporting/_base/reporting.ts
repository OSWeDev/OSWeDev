import debounce from 'lodash/debounce';
import { Moment } from 'moment';
import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import RoleVO from '../../../../../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import AnimationController from '../../../../../../../shared/modules/Animation/AnimationController';
import ModuleAnimation from '../../../../../../../shared/modules/Animation/ModuleAnimation';
import ThemeModuleDataParamRangesVO from '../../../../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataParamRangesVO';
import VarDayPrctReussiteAnimationController from '../../../../../../../shared/modules/Animation/vars/VarDayPrctReussiteAnimationController';
import AnimationModuleVO from '../../../../../../../shared/modules/Animation/vos/AnimationModuleVO';
import AnimationThemeVO from '../../../../../../../shared/modules/Animation/vos/AnimationThemeVO';
import AnimationUserModuleVO from '../../../../../../../shared/modules/Animation/vos/AnimationUserModuleVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import NumRange from '../../../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../../../../shared/modules/DataRender/vos/NumSegment';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleAnimationReportingVuexAction, ModuleAnimationReportingVuexGetter } from '../../../store/AnimationReportingVuexStore';
import VueAnimationReportingFiltresComponent from '../filtres/reporting_filtres';
import './reporting.scss';

@Component({
    template: require('./reporting.pug'),
    components: {
        Filtres: VueAnimationReportingFiltresComponent,
    },
})
export default class VueAnimationReportingComponent extends VueComponentBase {

    @ModuleAnimationReportingVuexAction
    private init: (params: {
        all_anim_theme_by_ids: { [id: number]: AnimationThemeVO },
        all_anim_module_by_ids: { [id: number]: AnimationModuleVO },
        all_role_by_ids: { [id: number]: RoleVO },
        all_user_by_ids: { [id: number]: UserVO },
        all_aum_by_theme_module_user: { [anim_theme_id: number]: { [anim_module_id: number]: { [user_id: number]: AnimationUserModuleVO } } },
    }) => void;

    @ModuleAnimationReportingVuexAction
    private set_all_aum_by_theme_module_user: (all_aum_by_theme_module_user: { [anim_theme_id: number]: { [anim_module_id: number]: { [user_id: number]: AnimationUserModuleVO } } }) => void;

    @ModuleAnimationReportingVuexGetter
    private get_anim_theme_id_ranges: NumRange[];

    @ModuleAnimationReportingVuexGetter
    private get_anim_module_id_ranges: NumRange[];

    @ModuleAnimationReportingVuexGetter
    private get_user_id_ranges: NumRange[];

    @ModuleAnimationReportingVuexGetter
    private get_all_anim_theme_by_ids: { [id: number]: AnimationThemeVO };

    @ModuleAnimationReportingVuexGetter
    private get_all_anim_module_by_ids: { [id: number]: AnimationModuleVO };

    @ModuleAnimationReportingVuexGetter
    private get_all_user_by_ids: { [id: number]: UserVO };

    @ModuleAnimationReportingVuexGetter
    private get_all_role_by_ids: { [id: number]: RoleVO };

    @ModuleAnimationReportingVuexGetter
    private get_all_aum_by_theme_module_user: { [anim_theme_id: number]: { [anim_module_id: number]: { [user_id: number]: AnimationUserModuleVO } } };

    @ModuleAnimationReportingVuexGetter
    private get_percent_module_finished: number;

    @ModuleAnimationReportingVuexGetter
    private get_filter_anim_theme_active_options: DataFilterOption[];
    @ModuleAnimationReportingVuexGetter
    private get_filter_anim_module_active_options: DataFilterOption[];
    @ModuleAnimationReportingVuexGetter
    private get_filter_role_active_options: DataFilterOption[];
    @ModuleAnimationReportingVuexGetter
    private get_filter_user_active_options: DataFilterOption[];
    @ModuleAnimationReportingVuexGetter
    private get_filter_module_termine_active_option: DataFilterOption;
    @ModuleAnimationReportingVuexGetter
    private get_filter_module_valide_active_option: DataFilterOption;

    private is_init: boolean = false;

    private debounced_reloadAums = debounce(this.reloadAums, 300);

    @Watch('get_filter_anim_theme_active_options')
    @Watch('get_filter_anim_module_active_options')
    @Watch('get_filter_role_active_options')
    @Watch('get_filter_user_active_options')
    @Watch('get_filter_module_termine_active_option')
    @Watch('get_filter_module_valide_active_option')
    private onchange_filters() {
        this.debounced_reloadAums();
    }

    private async mounted() {
        this.is_init = false;

        let all_anim_theme_by_ids: { [id: number]: AnimationThemeVO } = {};
        let all_anim_module_by_ids: { [id: number]: AnimationModuleVO } = {};
        let all_role_by_ids: { [id: number]: RoleVO } = {};
        let all_user_by_ids: { [id: number]: UserVO } = {};
        let all_aum_by_theme_module_user: { [anim_theme_id: number]: { [anim_module_id: number]: { [user_id: number]: AnimationUserModuleVO } } } = {};

        let user_ids: number[] = [];
        let role_ids: number[] = [];

        let promises = [];

        promises.push((async () =>
            all_anim_theme_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<AnimationThemeVO>(AnimationThemeVO.API_TYPE_ID))
        )());

        promises.push((async () =>
            all_anim_module_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID))
        )());

        await Promise.all(promises);

        let aums: AnimationUserModuleVO[] = await ModuleDAO.getInstance().getVos<AnimationUserModuleVO>(AnimationUserModuleVO.API_TYPE_ID);

        for (let i in aums) {
            let aum: AnimationUserModuleVO = aums[i];

            let module: AnimationModuleVO = all_anim_module_by_ids[aum.module_id];

            if (!module) {
                continue;
            }

            let theme: AnimationThemeVO = all_anim_theme_by_ids[module.theme_id];

            if (!theme) {
                continue;
            }

            if (!all_aum_by_theme_module_user[theme.id]) {
                all_aum_by_theme_module_user[theme.id] = {};
            }

            if (!all_aum_by_theme_module_user[theme.id][aum.module_id]) {
                all_aum_by_theme_module_user[theme.id][aum.module_id] = {};
            }

            if (!all_aum_by_theme_module_user[theme.id][aum.module_id][aum.user_id]) {
                all_aum_by_theme_module_user[theme.id][aum.module_id][aum.user_id] = aum;

                user_ids.push(aum.user_id);
            }

            if (module.role_id_ranges && module.role_id_ranges.length > 0) {
                role_ids = role_ids.concat(RangeHandler.getInstance().get_all_segmented_elements_from_ranges(module.role_id_ranges));
            }
        }

        if (user_ids.length > 0) {
            all_user_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVosByIds<UserVO>(UserVO.API_TYPE_ID, user_ids));
        }

        if (role_ids.length > 0) {
            all_role_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVosByIds<RoleVO>(RoleVO.API_TYPE_ID, role_ids));
        }

        this.init({
            all_anim_theme_by_ids: all_anim_theme_by_ids,
            all_anim_module_by_ids: all_anim_module_by_ids,
            all_role_by_ids: all_role_by_ids,
            all_user_by_ids: all_user_by_ids,
            all_aum_by_theme_module_user: all_aum_by_theme_module_user,
        });

        this.is_init = true;
    }

    private async reloadAums() {
        let all_aum_by_theme_module_user: { [anim_theme_id: number]: { [anim_module_id: number]: { [user_id: number]: AnimationUserModuleVO } } } = {};

        let aums: AnimationUserModuleVO[] = await ModuleAnimation.getInstance().getAumsFiltered(
            this.get_filter_anim_theme_active_options,
            this.get_filter_anim_module_active_options,
            this.get_filter_role_active_options,
            this.get_filter_user_active_options,
            this.get_filter_module_termine_active_option,
            this.get_filter_module_valide_active_option,
        );

        for (let i in aums) {
            let aum: AnimationUserModuleVO = aums[i];

            let module: AnimationModuleVO = this.get_all_anim_module_by_ids[aum.module_id];

            if (!module) {
                continue;
            }

            let theme: AnimationThemeVO = this.get_all_anim_theme_by_ids[module.theme_id];

            if (!theme) {
                continue;
            }

            if (!all_aum_by_theme_module_user[theme.id]) {
                all_aum_by_theme_module_user[theme.id] = {};
            }

            if (!all_aum_by_theme_module_user[theme.id][aum.module_id]) {
                all_aum_by_theme_module_user[theme.id][aum.module_id] = {};
            }

            all_aum_by_theme_module_user[theme.id][aum.module_id][aum.user_id] = aum;
        }

        this.set_all_aum_by_theme_module_user(all_aum_by_theme_module_user);
    }

    private get_formatted_date(date: Moment): string {
        return date ? date.format('DD/MM/YYYY HH:mm') : null;
    }

    private get_temps_passe_en_h(aum: AnimationUserModuleVO): number {
        return aum && aum.start_date && aum.end_date ? (aum.end_date.diff(aum.start_date, 'hours', true)) : null;
    }

    private get_prct_reussite_total_param(aum: AnimationUserModuleVO): ThemeModuleDataParamRangesVO {
        return ThemeModuleDataParamRangesVO.createNew(
            VarDayPrctReussiteAnimationController.getInstance().varConf.id,
            null,
            [RangeHandler.getInstance().create_single_elt_NumRange(aum.module_id, NumSegment.TYPE_INT)],
            [RangeHandler.getInstance().create_single_elt_NumRange(aum.user_id, NumSegment.TYPE_INT)],
        );
    }

    private get_roles_anim_module(anim_module: AnimationModuleVO): string {
        let res: string[] = [];

        if (anim_module && anim_module.role_id_ranges && anim_module.role_id_ranges.length > 0) {
            RangeHandler.getInstance().foreach_ranges_sync(anim_module.role_id_ranges, (role_id: number) => {
                let role: RoleVO = this.get_all_role_by_ids[role_id];

                if (!role) {
                    return;
                }

                res.push(this.label(role.translatable_name));
            });
        }

        return res.join(' - ');
    }

    get like_vote_labels(): { [like_vote_id: number]: string } {
        return AnimationUserModuleVO.LIKE_VOTE_LABELS;
    }

    get prct_reussite_total_param(): ThemeModuleDataParamRangesVO {
        return ThemeModuleDataParamRangesVO.createNew(
            VarDayPrctReussiteAnimationController.getInstance().varConf.id,
            this.get_anim_theme_id_ranges,
            this.get_anim_module_id_ranges,
            this.get_user_id_ranges,
        );
    }

    get is_filter_module_termine_active_no(): boolean {
        return this.get_filter_module_termine_active_option ? (this.get_filter_module_termine_active_option.id == AnimationController.OPTION_NO) : false;
    }
}