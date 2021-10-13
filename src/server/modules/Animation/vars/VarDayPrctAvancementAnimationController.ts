import VarServerControllerBase from '../../../../server/modules/Var/VarServerControllerBase';
import AnimationController from '../../../../shared/modules/Animation/AnimationController';
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

/**
 * Réalise le calcul de l'avancement sur les modules:
 * nombre de réponses répondues / totalites réponses parmis les modules (potentiellement pour plusieurs utiliseurs).
 */
export default class VarDayPrctAvancementAnimationController extends VarServerControllerBase<ThemeModuleDataRangesVO> {

    public static getInstance(): VarDayPrctAvancementAnimationController {
        if (!VarDayPrctAvancementAnimationController.instance) {
            VarDayPrctAvancementAnimationController.instance = new VarDayPrctAvancementAnimationController();
        }
        return VarDayPrctAvancementAnimationController.instance;
    }

    protected static instance: VarDayPrctAvancementAnimationController = null;

    protected constructor() {
        super(
            new VarConfVO(AnimationController.VarDayPrctAvancementAnimationController_VAR_NAME, ThemeModuleDataRangesVO.API_TYPE_ID, TimeSegment.TYPE_DAY),
            { 'fr-fr': 'Prct avancement animation' },
            {
                'fr-fr': 'Prctage d\'avancement de l\'animation.'
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

    public async get_invalid_params_intersectors_on_POST_C_POST_D(c_or_d_vo: IDistantVOBase): Promise<ThemeModuleDataRangesVO[]> {

        return [this.get_invalid_params_intersectors_from_vo(this.varConf.name, c_or_d_vo)];
    }

    public async get_invalid_params_intersectors_on_POST_U<T extends IDistantVOBase>(u_vo_holder: DAOUpdateVOHolder<T>): Promise<ThemeModuleDataRangesVO[]> {

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
     * Réalise le calcul de l'avancement sur les modules:
     * nombre de réponses répondues / totalites réponses parmis les modules (potentiellement pour plusieurs utiliseurs).
     */
    protected getValue(varDAGNode: VarDAGNode): number {

        let qrs_by_theme_module: { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } } = varDAGNode.datasources[QRsRangesDatasourceController.getInstance().name];
        let uqrs_by_theme_module: { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationUserQRVO[] } } } = varDAGNode.datasources[UQRsRangesDatasourceController.getInstance().name];

        let cpt_qrs: number = 0;
        let cpt_uqrs: number = 0;

        // le nombre de questions
        for (let theme_id in qrs_by_theme_module) {
            for (let module_id in qrs_by_theme_module[theme_id]) {
                cpt_qrs += (qrs_by_theme_module[theme_id][module_id] ? Object.values(qrs_by_theme_module[theme_id][module_id]).length : 0);
            }
        }

        // le nombre de réponses
        for (let theme_id in uqrs_by_theme_module) {
            for (let module_id in uqrs_by_theme_module[theme_id]) {
                cpt_uqrs += (uqrs_by_theme_module[theme_id][module_id] ? Object.values(uqrs_by_theme_module[theme_id][module_id]).length : 0);
            }
        }

        // !division par zero
        if (!cpt_qrs) {
            return null;
        }

        return cpt_uqrs / cpt_qrs;
    }
}
