import AnimationController from '../../../../shared/modules/Animation/AnimationController';
import ThemeModuleDataRangesVO from '../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO';
import AnimationQRVO from '../../../../shared/modules/Animation/vos/AnimationQRVO';
import AnimationUserModuleVO from '../../../../shared/modules/Animation/vos/AnimationUserModuleVO';
import AnimationUserQRVO from '../../../../shared/modules/Animation/vos/AnimationUserQRVO';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarConfVO from '../../../../shared/modules/Var/vos/VarConfVO';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import DAOUpdateVOHolder from '../../DAO/vos/DAOUpdateVOHolder';
import DataSourceControllerBase from '../../Var/datasource/DataSourceControllerBase';
import VarServerControllerBase from '../../Var/VarServerControllerBase';
import QRsRangesDatasourceController from '../datasources/QRsRangesDatasourceController';
import UMsRangesDatasourceController from '../datasources/UMsRangesDatasourceController';
import UQRsRangesDatasourceController from '../datasources/UQRsRangesDatasourceController';

/**
 * Réalise le calcul de score sur les modules: nombre de bonnes réponses / totalites réponses parmis les modules (potentiellement pour plusieurs utiliseurs).
 */
export default class VarDayPrctReussiteAnimationController extends VarServerControllerBase<ThemeModuleDataRangesVO> {

    public static getInstance(): VarDayPrctReussiteAnimationController {
        if (!VarDayPrctReussiteAnimationController.instance) {
            VarDayPrctReussiteAnimationController.instance = new VarDayPrctReussiteAnimationController();
        }
        return VarDayPrctReussiteAnimationController.instance;
    }

    protected static instance: VarDayPrctReussiteAnimationController = null;

    protected constructor() {
        super(
            new VarConfVO(AnimationController.VarDayPrctReussiteAnimationController_VAR_NAME, ThemeModuleDataRangesVO.API_TYPE_ID, TimeSegment.TYPE_DAY),
            { fr: 'Prct réussite animation' },
            {
                fr: 'Prctage de réussite de l\'animation.'
            },
            {}, {});

        this.optimization__has_no_imports = true;
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return [
            QRsRangesDatasourceController.getInstance(),
            UQRsRangesDatasourceController.getInstance(),
            UMsRangesDatasourceController.getInstance()
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
            case AnimationUserModuleVO.API_TYPE_ID:

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
     * Réalise le calcul de score sur les modules: nombre de bonnes réponses / totalites réponses parmis les modules (potentiellement pour plusieurs utiliseurs).
     * @remark Ne prend en compte que les réponses des modules terminés.
     */
    protected getValue(varDAGNode: VarDAGNode): number {

        let qrs_by_theme_module: { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } } = varDAGNode.datasources[QRsRangesDatasourceController.getInstance().name];
        let uqrs_by_theme_module_qr: { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationUserQRVO[] } } } = varDAGNode.datasources[UQRsRangesDatasourceController.getInstance().name];
        let ums_by_module_user: { [module_id: number]: { [user_id: number]: AnimationUserModuleVO } } = varDAGNode.datasources[UMsRangesDatasourceController.getInstance().name];

        let cpt_qrs: number = 0;
        let cpt_ok: number = 0;

        // ballaie les themes
        for (let theme_id in qrs_by_theme_module) {
            // ballaie les modules du thème
            for (let module_id in qrs_by_theme_module[theme_id]) {
                let nb_user_has_finished: number = 0;
                let user_id_check: { [user_id: number]: boolean } = {};

                // ballaie les qrs du module
                for (let qr_i in qrs_by_theme_module[theme_id][module_id]) {
                    let qr: AnimationQRVO = qrs_by_theme_module[theme_id][module_id][qr_i];

                    // si on a des réponses
                    if (uqrs_by_theme_module_qr && uqrs_by_theme_module_qr[theme_id] && uqrs_by_theme_module_qr[theme_id][module_id]) {
                        // ballaie les uqrs pour la qr
                        for (let uqr_i in uqrs_by_theme_module_qr[theme_id][module_id][qr.id]) {
                            let uqr: AnimationUserQRVO = uqrs_by_theme_module_qr[theme_id][module_id][qr.id][uqr_i];

                            // si l'utilisateur a bien finit le module on comptabilise
                            if (uqr && ums_by_module_user && ums_by_module_user[module_id] && ums_by_module_user[module_id][uqr.user_id] && ums_by_module_user[module_id][uqr.user_id].end_date) {
                                if (!user_id_check[uqr.user_id]) {
                                    nb_user_has_finished++;
                                    user_id_check[uqr.user_id] = true;
                                }

                                if (AnimationController.getInstance().isUserQROk(qr, uqr)) {
                                    cpt_ok++;
                                }
                            }
                        }
                    }
                }

                cpt_qrs += ((qrs_by_theme_module[theme_id][module_id] ? Object.values(qrs_by_theme_module[theme_id][module_id]).length : 0) * nb_user_has_finished);
            }
        }

        if (!cpt_qrs) {
            return null;
        }

        return cpt_ok / cpt_qrs;
    }
}
