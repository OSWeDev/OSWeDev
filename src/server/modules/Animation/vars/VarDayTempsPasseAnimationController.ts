import ThemeModuleDataRangesVO from '../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO';
import AnimationParametersVO from '../../../../shared/modules/Animation/vos/AnimationParametersVO';
import AnimationUserModuleVO from '../../../../shared/modules/Animation/vos/AnimationUserModuleVO';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarConfVO from '../../../../shared/modules/Var/vos/VarConfVO';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import DAOUpdateVOHolder from '../../DAO/vos/DAOUpdateVOHolder';
import DataSourceControllerBase from '../../Var/datasource/DataSourceControllerBase';
import VarServerControllerBase from '../../Var/VarServerControllerBase';
import AnimationParamsRangesDatasourceController from '../datasources/AnimationParamsRangesDatasourceController';
import UMsRangesDatasourceController from '../datasources/UMsRangesDatasourceController';

export default class VarDayTempsPasseAnimationController extends VarServerControllerBase<ThemeModuleDataRangesVO> {

    public static VAR_NAME: string = 'VarDayTempsPasseAnimationController';

    public static getInstance(): VarDayTempsPasseAnimationController {
        if (!VarDayTempsPasseAnimationController.instance) {
            VarDayTempsPasseAnimationController.instance = new VarDayTempsPasseAnimationController();
        }
        return VarDayTempsPasseAnimationController.instance;
    }

    protected static instance: VarDayTempsPasseAnimationController = null;

    protected constructor() {
        super(
            new VarConfVO(VarDayTempsPasseAnimationController.VAR_NAME, ThemeModuleDataRangesVO.API_TYPE_ID, TimeSegment.TYPE_DAY),
            { fr: 'Tps passé animation' },
            {
                fr: 'Temps passé - animation.'
            },
            {}, {});

        this.optimization__has_no_imports = true;
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return [
            AnimationParamsRangesDatasourceController.getInstance(),
            UMsRangesDatasourceController.getInstance()
        ];
    }

    public get_invalid_params_intersectors_on_POST_C_POST_D(c_or_d_vo: IDistantVOBase): ThemeModuleDataRangesVO[] {

        return [this.get_invalid_params_intersectors_from_vo(this.varConf.name, c_or_d_vo)];
    }

    public get_invalid_params_intersectors_on_POST_U<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): ThemeModuleDataRangesVO[] {

        /**
         * Si on a pas touché aux champs utiles, on esquive la mise à jour
         */
        if (!this.has_changed_important_field(u_vo_holder as any)) {
            return null;
        }

        return [
            this.get_invalid_params_intersectors_from_vo(this.varConf.name, u_vo_holder.pre_update_vo as any),
            this.get_invalid_params_intersectors_from_vo(this.varConf.name, u_vo_holder.post_update_vo as any)
        ];
    }

    public has_changed_important_field<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): boolean {

        // TODO FIXME On peut peut-etre faire mieux que ça d'un point de vue métier
        return true;
    }

    public get_invalid_params_intersectors_from_vo<T extends IDistantVOBase>(var_name: string, vo: T): ThemeModuleDataRangesVO {

        switch (vo._type) {
            case AnimationUserModuleVO.API_TYPE_ID:
            case AnimationParametersVO.API_TYPE_ID:

                return ThemeModuleDataRangesVO.createNew(
                    var_name,
                    false,
                    [RangeHandler.getInstance().getMaxNumRange()],
                    [RangeHandler.getInstance().getMaxNumRange()],
                    [RangeHandler.getInstance().getMaxNumRange()]
                    // TODO FIXME Améliorer ce matroid point de vue métier
                );
        }
    }

    /**
     * Fonction qui prépare la mise à jour d'une data
     */
    protected getValue(varDAGNode: VarDAGNode): number {

        let ums_by_module_user: { [module_id: number]: { [user_id: number]: AnimationUserModuleVO } } = varDAGNode.datasources[UMsRangesDatasourceController.getInstance().name];
        let animation_params: AnimationParametersVO = varDAGNode.datasources[AnimationParamsRangesDatasourceController.getInstance().name];

        let cpt_ums: number = 0;
        let temps_total_passe: number = 0;

        for (let module_id in ums_by_module_user) {
            for (let user_id in ums_by_module_user[module_id]) {
                let aum: AnimationUserModuleVO = ums_by_module_user[module_id][user_id];

                if (!aum.end_date || !aum.start_date) {
                    continue;
                }

                let temps_passe: number = aum.end_date.diff(aum.start_date, 'hours', true);

                if (animation_params && animation_params.limite_temps_passe_module) {
                    if (temps_passe > animation_params.limite_temps_passe_module) {
                        continue;
                    }
                }

                cpt_ums++;

                temps_total_passe += temps_passe;
            }
        }

        if (!(!!cpt_ums && !!temps_total_passe)) {
            return null;
        }

        return temps_total_passe / cpt_ums;
    }

}
