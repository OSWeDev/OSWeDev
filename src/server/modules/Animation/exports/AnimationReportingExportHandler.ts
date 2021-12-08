import RoleVO from '../../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleAnimation from '../../../../shared/modules/Animation/ModuleAnimation';
import AnimationReportingParamVO from '../../../../shared/modules/Animation/params/AnimationReportingParamVO';
import ThemeModuleDataRangesVO from '../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO';
import AnimationModuleVO from '../../../../shared/modules/Animation/vos/AnimationModuleVO';
import AnimationThemeVO from '../../../../shared/modules/Animation/vos/AnimationThemeVO';
import AnimationUserModuleVO from '../../../../shared/modules/Animation/vos/AnimationUserModuleVO';
import APIControllerWrapper from '../../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ExportHistoricVO from '../../../../shared/modules/DataExport/vos/ExportHistoricVO';
import NumRange from '../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../shared/modules/DataRender/vos/NumSegment';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleTranslation from '../../../../shared/modules/Translation/ModuleTranslation';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { hourFilter, percentFilter } from '../../../../shared/tools/Filters';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import StackContext from '../../../StackContext';
import ExportHandlerBase from '../../DataExport/ExportHandlerBase';
import IExportableDatas from '../../DataExport/interfaces/IExportableDatas';
import VarsServerCallBackSubsController from '../../Var/VarsServerCallBackSubsController';
import VarDayPrctReussiteAnimationController from '../vars/VarDayPrctReussiteAnimationController';
import VarDayTempsPasseAnimationController from '../vars/VarDayTempsPasseAnimationController';
import ExportAnimationReportingLine from './ExportAnimationReportingLine';

export default class AnimationReportingExportHandler extends ExportHandlerBase {

    public static getInstance() {
        if (!AnimationReportingExportHandler.instance) {
            AnimationReportingExportHandler.instance = new AnimationReportingExportHandler();
        }
        return AnimationReportingExportHandler.instance;
    }

    private static instance: AnimationReportingExportHandler = null;

    protected constructor() {
        super();
    }

    public async prepare_datas(exhi: ExportHistoricVO): Promise<IExportableDatas> {

        ConsoleHandler.getInstance().log('AnimationReportingExportHandler:en_cours');

        let datas: IExportableDatas = {
            api_type_id: ModuleAnimation.EXPORT_API_TYPE_ID,
            column_labels: await this.get_column_labels(exhi),
            datas: await this.get_datas(exhi),
            filename: ModuleAnimation.EXPORT_API_TYPE_ID + '_' + Dates.format(exhi.creation_date, 'DD_MM') + '_' + exhi.creation_date + '.xlsx',
            ordered_column_list: this.ordered_column_list
        };

        ConsoleHandler.getInstance().log('AnimationReportingExportHandler:terminé');

        return datas;
    }

    private async get_datas(exhi: ExportHistoricVO): Promise<ExportAnimationReportingLine[]> {
        let res: ExportAnimationReportingLine[] = [];

        if ((!exhi.export_to_uid) || (!exhi.export_params_stringified)) {
            return null;
        }

        let user: UserVO = null;
        await StackContext.getInstance().runPromise(
            { IS_CLIENT: false },
            async () => {
                user = await ModuleDAO.getInstance().getVoById<UserVO>(UserVO.API_TYPE_ID, exhi.export_to_uid);
            });
        let import_params: AnimationReportingParamVO = APIControllerWrapper.getInstance().try_translate_vo_from_api(JSON.parse(exhi.export_params_stringified));

        let all_anim_theme_by_ids: { [id: number]: AnimationThemeVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<AnimationThemeVO>(AnimationThemeVO.API_TYPE_ID));
        let all_anim_module_by_ids: { [id: number]: AnimationModuleVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<AnimationModuleVO>(AnimationModuleVO.API_TYPE_ID));
        let all_role_by_ids: { [id: number]: RoleVO } = {};
        let all_user_by_ids: { [id: number]: UserVO } = {};
        let all_aum_by_theme_module_user: { [anim_theme_id: number]: { [anim_module_id: number]: { [user_id: number]: AnimationUserModuleVO } } } = {};

        let user_ids: number[] = [];
        let role_ids: number[] = [];

        let aums: AnimationUserModuleVO[] = await ModuleAnimation.getInstance().getAumsFiltered(
            import_params.filter_anim_theme_active_options,
            import_params.filter_anim_module_active_options,
            import_params.filter_role_active_options,
            import_params.filter_user_active_options,
            import_params.filter_module_termine_active_option,
            import_params.filter_module_valide_active_option,
        );

        let theme_id_ranges: NumRange[] = [];
        let module_id_ranges: NumRange[] = [];
        let user_id_ranges: NumRange[] = [];
        let user_id_add: { [id: number]: boolean } = {};
        let percent_module_finished: number = 0;
        let nb_module_finished: number = 0;
        let nb_module_total: number = 0;

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

                theme_id_ranges.push(RangeHandler.getInstance().create_single_elt_NumRange(theme.id, NumSegment.TYPE_INT));
            }

            if (!all_aum_by_theme_module_user[theme.id][aum.module_id]) {
                all_aum_by_theme_module_user[theme.id][aum.module_id] = {};

                module_id_ranges.push(RangeHandler.getInstance().create_single_elt_NumRange(aum.module_id, NumSegment.TYPE_INT));
            }

            if (!all_aum_by_theme_module_user[theme.id][aum.module_id][aum.user_id]) {
                all_aum_by_theme_module_user[theme.id][aum.module_id][aum.user_id] = aum;

                nb_module_total++;

                if (aum.end_date) {
                    nb_module_finished++;
                }

                if (!user_id_add[aum.user_id]) {
                    user_id_add[aum.user_id] = true;
                    user_id_ranges.push(RangeHandler.getInstance().create_single_elt_NumRange(aum.user_id, NumSegment.TYPE_INT));
                }

                user_ids.push(aum.user_id);
            }

            if (module.role_id_ranges && module.role_id_ranges.length > 0) {
                role_ids = role_ids.concat(RangeHandler.getInstance().get_all_segmented_elements_from_ranges(module.role_id_ranges));
            }
        }

        percent_module_finished = nb_module_total ? nb_module_finished / nb_module_total : 0;

        if (user_ids.length > 0) {
            all_user_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVosByIds<UserVO>(UserVO.API_TYPE_ID, user_ids));
        }

        if (role_ids.length > 0) {
            all_role_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVosByIds<RoleVO>(RoleVO.API_TYPE_ID, role_ids));
        }

        // Si on a plus de 1 aums, on calcul le total
        if (aums.length > 1) {
            ConsoleHandler.getInstance().log('AnimationReportingExportHandler:export_total');
            res.push(await this.get_new_elem_total(
                user,
                theme_id_ranges,
                module_id_ranges,
                user_id_ranges,
                percent_module_finished,
            ));
        }

        ConsoleHandler.getInstance().log('AnimationReportingExportHandler:export_all_aum');

        for (let anim_theme_id in all_aum_by_theme_module_user) {
            for (let anim_module_id in all_aum_by_theme_module_user[anim_theme_id]) {
                for (let user_id in all_aum_by_theme_module_user[anim_theme_id][anim_module_id]) {
                    let aum: AnimationUserModuleVO = all_aum_by_theme_module_user[anim_theme_id][anim_module_id][user_id];

                    res.push(await this.get_new_elem(
                        user,
                        aum,
                        all_anim_theme_by_ids[anim_theme_id],
                        all_anim_module_by_ids[anim_module_id],
                        all_role_by_ids,
                        all_user_by_ids,
                    ));
                }
            }
        }

        return res;
    }

    private async get_new_elem_total(
        user: UserVO,
        theme_id_ranges: NumRange[],
        module_id_ranges: NumRange[],
        user_id_ranges: NumRange[],
        percent_module_finished: number,
    ): Promise<ExportAnimationReportingLine> {
        let res: ExportAnimationReportingLine = new ExportAnimationReportingLine();

        res.theme = await ModuleTranslation.getInstance().label('animation.reporting.total', user.lang_id) + '(' + theme_id_ranges.length.toString() + ')';
        res.module = module_id_ranges ? module_id_ranges.length.toString() : null;
        res.roles = null;
        res.utilisateur = user_id_ranges ? user_id_ranges.length.toString() : null;
        res.debut = null;
        res.fin = this.filterValue('fin', percent_module_finished);
        let data = null;
        try {
            data = await VarsServerCallBackSubsController.getInstance().get_var_data(this.get_DayTempsPasseAnimation_param(theme_id_ranges, module_id_ranges, user_id_ranges));
        } catch (error) {
            ConsoleHandler.getInstance().error('endModule:get_var_data:' + error + ':FIXME do we need to handle this ?');
        }

        res.temps_passe = this.filterValue('temps_passe', data ? data.value : null);
        res.feedback = null;
        res.commentaire = null;
        res.support = null;

        try {
            data = await VarsServerCallBackSubsController.getInstance().get_var_data(this.get_DayPrctReussiteAnimation_param(theme_id_ranges, module_id_ranges, user_id_ranges));
        } catch (error) {
            ConsoleHandler.getInstance().error('endModule:get_var_data2:' + error + ':FIXME do we need to handle this ?');
        }

        res.prct_reussite = this.filterValue('prct_reussite', data ? data.value : null);

        return res;
    }

    private async get_new_elem(
        user: UserVO,
        aum: AnimationUserModuleVO,
        theme: AnimationThemeVO,
        module: AnimationModuleVO,
        all_role_by_ids: { [id: number]: RoleVO },
        all_user_by_ids: { [id: number]: UserVO },
    ): Promise<ExportAnimationReportingLine> {
        let res: ExportAnimationReportingLine = new ExportAnimationReportingLine();

        res.theme = theme ? theme.name : null;
        res.module = module ? module.name : null;

        let roles: string[] = [];

        if (module && module.role_id_ranges && module.role_id_ranges.length > 0) {
            RangeHandler.getInstance().foreach_ranges(module.role_id_ranges, async (role_id: number) => {
                let role: RoleVO = all_role_by_ids[role_id];

                if (!role) {
                    return;
                }

                roles.push(await ModuleTranslation.getInstance().label(role.translatable_name, user.lang_id));
            });
        }

        let module_id_ranges: NumRange[] = [RangeHandler.getInstance().create_single_elt_NumRange(aum.module_id, NumSegment.TYPE_INT)];
        let user_id_ranges: NumRange[] = [RangeHandler.getInstance().create_single_elt_NumRange(aum.user_id, NumSegment.TYPE_INT)];

        res.roles = (roles.length > 0) ? roles.join(' - ') : null;
        res.utilisateur = all_user_by_ids[aum.user_id] ? all_user_by_ids[aum.user_id].name : null;
        res.debut = aum.start_date ? Dates.format(aum.start_date, 'DD/MM/YYYY HH:mm') : null;
        res.fin = aum.end_date ? Dates.format(aum.end_date, 'DD/MM/YYYY HH:mm') : null;

        let data = null;
        try {
            data = await VarsServerCallBackSubsController.getInstance().get_var_data(this.get_DayTempsPasseAnimation_param(null, module_id_ranges, user_id_ranges));
        } catch (error) {
            ConsoleHandler.getInstance().error('endModule:get_new_elem:' + error + ':FIXME do we need to handle this ?');
        }

        res.temps_passe = this.filterValue('temps_passe', data ? data.value : null);
        res.feedback = (aum.like_vote != null) ? await ModuleTranslation.getInstance().t(AnimationUserModuleVO.LIKE_VOTE_LABELS[aum.like_vote], user.lang_id) : null;
        res.commentaire = aum.commentaire;
        res.support = (aum.support != null) ? await ModuleTranslation.getInstance().t(AnimationUserModuleVO.SUPPORT_LABELS[aum.support], user.lang_id) : null;

        try {
            data = await VarsServerCallBackSubsController.getInstance().get_var_data(this.get_DayPrctReussiteAnimation_param(null, module_id_ranges, user_id_ranges));
        } catch (error) {
            ConsoleHandler.getInstance().error('endModule:get_new_elem2:' + error + ':FIXME do we need to handle this ?');
        }

        res.prct_reussite = this.filterValue('prct_reussite', data ? data.value : null);

        return res;
    }

    private get_DayPrctReussiteAnimation_param(anim_theme_id_ranges: NumRange[], anim_module_id_ranges: NumRange[], user_id_ranges: NumRange[]): ThemeModuleDataRangesVO {
        return ThemeModuleDataRangesVO.createNew(
            VarDayPrctReussiteAnimationController.getInstance().varConf.name,
            true,
            anim_theme_id_ranges,
            anim_module_id_ranges,
            user_id_ranges,
        );
    }

    private get_DayTempsPasseAnimation_param(anim_theme_id_ranges: NumRange[], anim_module_id_ranges: NumRange[], user_id_ranges: NumRange[]): ThemeModuleDataRangesVO {
        return ThemeModuleDataRangesVO.createNew(
            VarDayTempsPasseAnimationController.getInstance().varConf.name,
            true,
            anim_theme_id_ranges,
            anim_module_id_ranges,
            user_id_ranges,
        );
    }

    private filterValue(field_name: string, value: number): string {
        switch (field_name) {
            case 'temps_passe':
                return hourFilter.read(value);
            case 'prct_reussite':
            case 'fin':
                return percentFilter.read(value);
        }
    }

    private async get_column_labels(exhi: ExportHistoricVO): Promise<{ [field_name: string]: string }> {
        let user: UserVO = null;
        await StackContext.getInstance().runPromise(
            { IS_CLIENT: false },
            async () => {
                user = await ModuleDAO.getInstance().getVoById<UserVO>(UserVO.API_TYPE_ID, exhi.export_to_uid);
            });

        if (!user) {
            return null;
        }

        return {
            theme: await ModuleTranslation.getInstance().label('animation.reporting.theme', user.lang_id),
            module: await ModuleTranslation.getInstance().label('animation.reporting.module', user.lang_id),
            roles: await ModuleTranslation.getInstance().label('animation.reporting.roles', user.lang_id),
            utilisateur: await ModuleTranslation.getInstance().label('animation.reporting.user', user.lang_id),
            debut: await ModuleTranslation.getInstance().label('animation.reporting.start', user.lang_id),
            fin: await ModuleTranslation.getInstance().label('animation.reporting.end', user.lang_id),
            temps_passe: await ModuleTranslation.getInstance().label('animation.reporting.temps_passe', user.lang_id),
            feedback: await ModuleTranslation.getInstance().label('animation.reporting.like_vote', user.lang_id),
            commentaire: await ModuleTranslation.getInstance().label('animation.reporting.commentaire', user.lang_id),
            support: await ModuleTranslation.getInstance().label('animation.reporting.support', user.lang_id),
            prct_reussite: await ModuleTranslation.getInstance().label('animation.reporting.prct_reussite', user.lang_id),
        };
    }

    get ordered_column_list(): string[] {
        return [
            'theme',
            'module',
            'roles',
            'utilisateur',
            'debut',
            'fin',
            'temps_passe',
            'feedback',
            'commentaire',
            'support',
            'prct_reussite',
        ];
    }
}