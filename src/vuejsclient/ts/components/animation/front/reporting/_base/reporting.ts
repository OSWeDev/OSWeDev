import debounce from 'lodash/debounce';

import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import RoleVO from '../../../../../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import AnimationController from '../../../../../../../shared/modules/Animation/AnimationController';
import ModuleAnimation from '../../../../../../../shared/modules/Animation/ModuleAnimation';
import AnimationReportingParamVO from '../../../../../../../shared/modules/Animation/params/AnimationReportingParamVO';
import ThemeModuleDataRangesVO from '../../../../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO';
import AnimationModuleVO from '../../../../../../../shared/modules/Animation/vos/AnimationModuleVO';
import AnimationThemeVO from '../../../../../../../shared/modules/Animation/vos/AnimationThemeVO';
import AnimationUserModuleVO from '../../../../../../../shared/modules/Animation/vos/AnimationUserModuleVO';
import APIControllerWrapper from '../../../../../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import ExportHistoricVO from '../../../../../../../shared/modules/DataExport/vos/ExportHistoricVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import NumRange from '../../../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../../../../shared/modules/DataRender/vos/NumSegment';
import Dates from '../../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import { all_promises } from '../../../../../../../shared/tools/PromiseTools';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import VueAppController from '../../../../../../VueAppController';
import AppVuexStoreManager from '../../../../../store/AppVuexStoreManager';
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
    private temps_passe_total_param: ThemeModuleDataRangesVO = null;
    private prct_reussite_total_param: ThemeModuleDataRangesVO = null;

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

    @Watch('$route', { immediate: true })
    private onRouteChange() {
        AppVuexStoreManager.getInstance().appVuexStore.dispatch('register_hook_export_data_to_XLSX', this.export_xlsx.bind(this));
    }

    private async export_xlsx() {
        /**
         * On lance une demande d'export BGThread et on renvoie null pour éviter de passer par l'export client
         */

        let exhi: ExportHistoricVO = new ExportHistoricVO();

        exhi.export_file_access_policy_name = ModuleAnimation.POLICY_FO_ACCESS;
        exhi.export_is_secured = true;

        let export_params: AnimationReportingParamVO = new AnimationReportingParamVO(
            this.get_filter_anim_theme_active_options,
            this.get_filter_anim_module_active_options,
            this.get_filter_role_active_options,
            this.get_filter_user_active_options,
            this.get_filter_module_termine_active_option,
            this.get_filter_module_valide_active_option,
        );
        exhi.export_params_stringified = JSON.stringify(APIControllerWrapper.getInstance().try_translate_vo_to_api(export_params));
        exhi.export_to_uid = VueAppController.getInstance().data_user.id;
        exhi.export_type_id = ModuleAnimation.EXPORT_API_TYPE_ID;

        await ModuleDAO.getInstance().insertOrUpdateVO(exhi);

        return null;
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
            all_anim_theme_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(await query(AnimationThemeVO.API_TYPE_ID).select_vos<AnimationThemeVO>())
        )());

        promises.push((async () =>
            all_anim_module_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(await query(AnimationModuleVO.API_TYPE_ID).select_vos<AnimationModuleVO>())
        )());

        await all_promises(promises);

        let aums: AnimationUserModuleVO[] = await query(AnimationUserModuleVO.API_TYPE_ID).select_vos<AnimationUserModuleVO>();

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

        this.reload_params();
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

        this.reload_params();
    }

    private reload_params() {
        this.temps_passe_total_param = ThemeModuleDataRangesVO.createNew(
            AnimationController.VarDayTempsPasseAnimationController_VAR_NAME,
            true,
            this.get_anim_theme_id_ranges,
            this.get_anim_module_id_ranges,
            this.get_user_id_ranges,
        );

        this.prct_reussite_total_param = ThemeModuleDataRangesVO.createNew(
            AnimationController.VarDayPrctReussiteAnimationController_VAR_NAME,
            true,
            this.get_anim_theme_id_ranges,
            this.get_anim_module_id_ranges,
            this.get_user_id_ranges,
        );
    }

    private get_formatted_date(date: number): string {
        return date ? Dates.format(date, 'DD/MM/YYYY HH:mm') : null;
    }

    private get_prct_reussite_param(aum: AnimationUserModuleVO): ThemeModuleDataRangesVO {
        return ThemeModuleDataRangesVO.createNew(
            AnimationController.VarDayPrctReussiteAnimationController_VAR_NAME,
            true,
            this.get_anim_theme_id_ranges,
            [RangeHandler.getInstance().create_single_elt_NumRange(aum.module_id, NumSegment.TYPE_INT)],
            [RangeHandler.getInstance().create_single_elt_NumRange(aum.user_id, NumSegment.TYPE_INT)],
        );
    }

    private get_temps_passe_param(aum: AnimationUserModuleVO): ThemeModuleDataRangesVO {
        return ThemeModuleDataRangesVO.createNew(
            AnimationController.VarDayTempsPasseAnimationController_VAR_NAME,
            true,
            this.get_anim_theme_id_ranges,
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

    get support_labels(): { [support_id: number]: string } {
        return AnimationUserModuleVO.SUPPORT_LABELS;
    }

    get is_filter_module_termine_active_no(): boolean {
        return this.get_filter_module_termine_active_option ? (this.get_filter_module_termine_active_option.id == AnimationController.OPTION_NO) : false;
    }
}