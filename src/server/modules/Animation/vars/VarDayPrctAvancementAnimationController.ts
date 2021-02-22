import VarServerControllerBase from '../../../../server/modules/Var/VarServerControllerBase';
import ThemeModuleDataRangesVO from '../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO';
import AnimationQRVO from '../../../../shared/modules/Animation/vos/AnimationQRVO';
import AnimationUserQRVO from '../../../../shared/modules/Animation/vos/AnimationUserQRVO';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarConfVO from '../../../../shared/modules/Var/vos/VarConfVO';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import DAOUpdateVOHolder from '../../DAO/vos/DAOUpdateVOHolder';
import DataSourceControllerBase from '../../Var/datasource/DataSourceControllerBase';
import QRsRangesDatasourceController from '../datasources/QRsRangesDatasourceController';
import UQRsRangesDatasourceController from '../datasources/UQRsRangesDatasourceController';

export default class VarDayPrctAvancementAnimationController extends VarServerControllerBase<ThemeModuleDataRangesVO> {

    public static VAR_NAME: string = 'VarDayPrctAvancementAnimationController';

    public static getInstance(): VarDayPrctAvancementAnimationController {
        if (!VarDayPrctAvancementAnimationController.instance) {
            VarDayPrctAvancementAnimationController.instance = new VarDayPrctAvancementAnimationController();
        }
        return VarDayPrctAvancementAnimationController.instance;
    }

    protected static instance: VarDayPrctAvancementAnimationController = null;

    protected constructor() {
        super(
            new VarConfVO(VarDayPrctAvancementAnimationController.VAR_NAME, ThemeModuleDataRangesVO.API_TYPE_ID, TimeSegment.TYPE_DAY),
            { fr: 'Prct avancement animation' },
            {
                fr: 'Prctage d\'avancement de l\'animation.'
            },
            {}, {});

        this.optimization__has_no_imports = true;
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return [
            QRsRangesDatasourceController.getInstance(),
            UQRsRangesDatasourceController.getInstance()
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
            case AnimationQRVO.API_TYPE_ID:
            case AnimationUserQRVO.API_TYPE_ID:

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

        let qrs_by_theme_module: { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } } = varDAGNode.datasources[QRsRangesDatasourceController.getInstance().name];
        let uqrs_by_theme_module: { [theme_id: number]: { [module_id: number]: { [uqr_id: number]: AnimationUserQRVO } } } = varDAGNode.datasources[UQRsRangesDatasourceController.getInstance().name];

        let cpt_qrs: number = 0;
        let cpt_uqrs: number = 0;

        for (let theme_id in qrs_by_theme_module) {
            for (let module_id in qrs_by_theme_module[theme_id]) {
                cpt_qrs += (qrs_by_theme_module[theme_id][module_id] ? Object.values(qrs_by_theme_module[theme_id][module_id]).length : 0);
            }
        }

        for (let theme_id in uqrs_by_theme_module) {
            for (let module_id in uqrs_by_theme_module[theme_id]) {
                cpt_uqrs += (uqrs_by_theme_module[theme_id][module_id] ? Object.values(uqrs_by_theme_module[theme_id][module_id]).length : 0);
            }
        }

        if (!cpt_qrs) {
            return null;
        }

        return cpt_uqrs / cpt_qrs;
    }
}
