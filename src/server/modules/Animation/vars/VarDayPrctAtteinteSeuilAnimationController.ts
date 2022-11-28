import AnimationController from "../../../../shared/modules/Animation/AnimationController";
import ThemeModuleDataRangesVO from "../../../../shared/modules/Animation/params/theme_module/ThemeModuleDataRangesVO";
import AnimationParametersVO from "../../../../shared/modules/Animation/vos/AnimationParametersVO";
import AnimationQRVO from "../../../../shared/modules/Animation/vos/AnimationQRVO";
import AnimationUserModuleVO from "../../../../shared/modules/Animation/vos/AnimationUserModuleVO";
import AnimationUserQRVO from "../../../../shared/modules/Animation/vos/AnimationUserQRVO";
import TimeSegment from "../../../../shared/modules/DataRender/vos/TimeSegment";
import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";
import VarDAGNode from "../../../../shared/modules/Var/graph/VarDAGNode";
import VarConfVO from "../../../../shared/modules/Var/vos/VarConfVO";
import ObjectHandler from "../../../../shared/tools/ObjectHandler";
import RangeHandler from "../../../../shared/tools/RangeHandler";
import DAOUpdateVOHolder from "../../DAO/vos/DAOUpdateVOHolder";
import DataSourceControllerBase from "../../Var/datasource/DataSourceControllerBase";
import VarServerControllerBase from "../../Var/VarServerControllerBase";
import AnimationParamsRangesDatasourceController from "../datasources/AnimationParamsRangesDatasourceController";
import QRsRangesDatasourceController from "../datasources/QRsRangesDatasourceController";
import UMsRangesDatasourceController from "../datasources/UMsRangesDatasourceController";
import UQRsRangesDatasourceController from "../datasources/UQRsRangesDatasourceController";

/**
 * permet de calculer le pourcentage de modules réussis parmis les modules spécifiés pour les utilisateurs
 * @example si on ne donne qu'un module et qu'un utilisateur: renvoie 1 s'il l'a validé 0 sinon
 * si on donne un module et un utilisateur l'ayant réussi l'autre non: renvoie 1/2
 * si on donne 3 modules et un utilisateur ayant réussi un des trois: renvoie 1/3
 */
export default class VarDayPrctAtteinteSeuilAnimationController extends VarServerControllerBase<ThemeModuleDataRangesVO> {

    public static getInstance(): VarDayPrctAtteinteSeuilAnimationController {
        if (!VarDayPrctAtteinteSeuilAnimationController.instance) {
            VarDayPrctAtteinteSeuilAnimationController.instance = new VarDayPrctAtteinteSeuilAnimationController();
        }
        return VarDayPrctAtteinteSeuilAnimationController.instance;
    }

    protected static instance: VarDayPrctAtteinteSeuilAnimationController = null;

    protected constructor() {
        super(
            new VarConfVO(AnimationController.VarDayPrctAtteinteSeuilAnimationController_VAR_NAME, ThemeModuleDataRangesVO.API_TYPE_ID),
            { 'fr-fr': 'Prct atteinte seuil animation' },
            {
                'fr-fr': 'Prctage atteinte seuil de l\'animation.'
            },
            {}, {});

        this.optimization__has_no_imports = true;
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return [
            AnimationParamsRangesDatasourceController.getInstance(),
            QRsRangesDatasourceController.getInstance(),
            UQRsRangesDatasourceController.getInstance(),
            UMsRangesDatasourceController.getInstance(),
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
            case AnimationParametersVO.API_TYPE_ID:
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
     * réalise le calcul du pourcentage de modules réussis parmis les modules spécifiés pour les utilisateurs
     * @example si on ne donne qu'un module et qu'un utilisateur: renvoie 1 s'il l'a validé 0 sinon
     * si on donne un module et un utilisateur l'ayant réussi l'autre non: renvoie 1/2
     * si on donne 3 modules et un utilisateur ayant réussi un des trois: renvoie 1/3
     */
    protected getValue(varDAGNode: VarDAGNode): number {

        let qrs_by_theme_module: { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } } = varDAGNode.datasources[QRsRangesDatasourceController.getInstance().name];
        let animation_params: AnimationParametersVO = varDAGNode.datasources[AnimationParamsRangesDatasourceController.getInstance().name];
        /** AnimationUserModuleVO (info sur la session d’un user sur un module) */
        let ums_by_module_user: { [module_id: number]: { [user_id: number]: AnimationUserModuleVO } } = varDAGNode.datasources[UMsRangesDatasourceController.getInstance().name];
        /** réponses des utilisateurs */
        let uqrs_by_theme_module_qr: { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationUserQRVO[] } } } = varDAGNode.datasources[UQRsRangesDatasourceController.getInstance().name];

        /** compteur de modules passés en revue */
        let cpt_modules: number = 0;
        /** compteur de modules validés */
        let cpt_modules_ok: number = 0;

        // on ballaie les modules de chaque thème
        for (let theme_id in qrs_by_theme_module) {
            for (let module_id in qrs_by_theme_module[theme_id]) {
                cpt_modules++;

                let users_answered_module = uqrs_by_theme_module_qr[theme_id] && uqrs_by_theme_module_qr[theme_id][module_id];
                let module_has_qr = ObjectHandler.getInstance().hasAtLeastOneAttribute(qrs_by_theme_module[theme_id][module_id]);
                // si on a pas de qr ou aucune réponse des utilisateur pour le module on passe au suivant
                if (!module_has_qr || !users_answered_module) {
                    continue;
                }

                let qrs_for_module = qrs_by_theme_module[theme_id][module_id];

                let cpt_bonnes_reponses: number = 0;
                let nb_user_has_finished: number = 0;
                /** les utilisateur passé en revue */
                let users_checked: { [user_id: number]: boolean } = {};

                // ballaie les qrs du module
                for (let qr_i in qrs_for_module) {
                    let qr: AnimationQRVO = qrs_for_module[qr_i];
                    let uqrs_for_qr = uqrs_by_theme_module_qr[theme_id][module_id][qr.id];

                    if (uqrs_for_qr) {
                        // ballaie les réponses des différents utilisateurs
                        for (let uqr of uqrs_for_qr) {
                            let user_finished_module = ums_by_module_user && ums_by_module_user[module_id] && ums_by_module_user[module_id][uqr.user_id] && ums_by_module_user[module_id][uqr.user_id].end_date;

                            // on ne prend en compte que les utilisateurs qui ont finit le module
                            if (user_finished_module) {
                                if (!users_checked[uqr.user_id]) {
                                    nb_user_has_finished++;
                                    users_checked[uqr.user_id] = true;
                                }

                                // si la réponse est correcte on incrémente le compteur de bonne réponse
                                if (AnimationController.getInstance().isUserQROk(qr, uqr)) {
                                    cpt_bonnes_reponses++;
                                }
                            }
                        }
                    }
                }

                /** nombre de questions sur le module * le nombre de personnes passé en revue */
                let total_qrs: number = ((qrs_for_module ? Object.values(qrs_for_module).length : 0) * nb_user_has_finished);

                let prct_reussite: number = total_qrs ? (cpt_bonnes_reponses / total_qrs) : 0;

                if (prct_reussite >= animation_params.seuil_validation_module_prct) {
                    cpt_modules_ok++;
                }
            }
        }

        if (!cpt_modules) {
            return null;
        }

        return cpt_modules_ok / cpt_modules;
    }
}
