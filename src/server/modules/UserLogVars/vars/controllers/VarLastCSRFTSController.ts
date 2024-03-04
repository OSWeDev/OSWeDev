import UserLogVO from '../../../../../shared/modules/AccessPolicy/vos/UserLogVO';
import UserVO from '../../../../../shared/modules/AccessPolicy/vos/UserVO';
import NumRange from '../../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import UserLogVarsNamesHolder from '../../../../../shared/modules/UserLogVars/vars/UserLogVarsNamesHolder';
import UserDataRangesVO from '../../../../../shared/modules/UserLogVars/vars/vos/UserDataRangesVO';
import VarDAGNode from '../../../../../server/modules/Var/vos/VarDAGNode';
import VarConfVO from '../../../../../shared/modules/Var/vos/VarConfVO';
import VarPixelFieldConfVO from '../../../../../shared/modules/Var/vos/VarPixelFieldConfVO';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import DAOUpdateVOHolder from '../../../DAO/vos/DAOUpdateVOHolder';
import DataSourceControllerBase from '../../../Var/datasource/DataSourceControllerBase';
import VarServerControllerBase from '../../../Var/VarServerControllerBase';
import LastUserLogCSRFTSDatasourceController from '../datasources/LastUserLogCSRFTSDatasourceController';

export default class VarLastCSRFTSController extends VarServerControllerBase<UserDataRangesVO> {

    // istanbul ignore next: nothing to test
    public static getInstance(): VarLastCSRFTSController {
        if (!VarLastCSRFTSController.instance) {
            VarLastCSRFTSController.instance = new VarLastCSRFTSController();
        }
        return VarLastCSRFTSController.instance;
    }

    protected static instance: VarLastCSRFTSController = null;

    protected constructor() {
        super(
            new VarConfVO(UserLogVarsNamesHolder.VarLastCSRFTSController_VAR_NAME, UserDataRangesVO.API_TYPE_ID, {
                ts_ranges: TimeSegment.TYPE_MINUTE,
            }, null).set_pixel_activated(true).set_pixel_never_delete(true).set_pixel_fields([
                (new VarPixelFieldConfVO())
                    .set_vo_api_type_id(UserVO.API_TYPE_ID)
                    .set_vo_field_id('id')
                    .set_param_field_id('user_id_ranges')
                    .set_range_type(NumRange.RANGE_TYPE)
                    .set_segmentation_type(NumSegment.TYPE_INT)
            ]).set_aggregator(VarConfVO.MAX_AGGREGATOR),
            { 'fr-fr': 'Dernier chargement application' },
            {
                'fr-fr': 'Date du plus récent chargement de l\'application réalisé par les utilisateurs sélectionnés.'
            },
            {},
            {});

        this.optimization__has_no_imports = true;
    }

    public getDataSourcesDependencies(): DataSourceControllerBase[] {
        return [
            LastUserLogCSRFTSDatasourceController.getInstance(),
        ];
    }

    /**
     * On optimise en passant par le groupe de modifs, et on regroupe par groupe / minute pour générer ensuite les intersecteurs nécessaires
     * @param c_or_d_vos
     */
    public async get_invalid_params_intersectors_on_POST_C_POST_D_group(c_or_d_vos: UserLogVO[]): Promise<UserDataRangesVO[]> {
        let groupe_date_to_u_vo_holders: { [user_id: number]: boolean } = {};

        for (let i in c_or_d_vos) {
            let c_or_d_vo = c_or_d_vos[i];

            if (!groupe_date_to_u_vo_holders[c_or_d_vo.user_id]) {
                groupe_date_to_u_vo_holders[c_or_d_vo.user_id] = true;
            }
        }

        return this.get_intersecteurs(groupe_date_to_u_vo_holders);
    }

    /**
     * On optimise en passant par le groupe de modifs, et on regroupe par groupe / minute pour générer ensuite les intersecteurs nécessaires
     * @param u_vo_holders
     */
    public async get_invalid_params_intersectors_on_POST_U_group(u_vo_holders: Array<DAOUpdateVOHolder<IDistantVOBase>>): Promise<UserDataRangesVO[]> {
        let groupe_date_to_u_vo_holders: { [user_id: number]: boolean } = {};
        let u_vo_holders_typed: Array<DAOUpdateVOHolder<UserLogVO>> = u_vo_holders as Array<DAOUpdateVOHolder<UserLogVO>>;

        for (let i in u_vo_holders_typed) {
            let u_vo_holder = u_vo_holders_typed[i];

            if (!!u_vo_holder.pre_update_vo) {
                if (!groupe_date_to_u_vo_holders[u_vo_holder.pre_update_vo.user_id]) {
                    groupe_date_to_u_vo_holders[u_vo_holder.pre_update_vo.user_id] = true;
                }
            }
            if (!!u_vo_holder.post_update_vo) {
                if (!groupe_date_to_u_vo_holders[u_vo_holder.post_update_vo.user_id]) {
                    groupe_date_to_u_vo_holders[u_vo_holder.post_update_vo.user_id] = true;
                }
            }
        }

        return this.get_intersecteurs(groupe_date_to_u_vo_holders);
    }

    protected getValue(varDAGNode: VarDAGNode): number {

        let res = varDAGNode.datasources[LastUserLogCSRFTSDatasourceController.getInstance().name];

        if (res == null) {
            return null;
        }

        return res;
    }

    private get_intersecteurs(groupe_date_to_u_vo_holders: { [user_id: number]: boolean }): UserDataRangesVO[] {
        let res: UserDataRangesVO[] = [];

        for (let user_id_s in groupe_date_to_u_vo_holders) {
            let user_id = parseInt(user_id_s);

            res.push(UserDataRangesVO.createNew<UserDataRangesVO>(
                this.varConf.name,
                false,
                [RangeHandler.create_single_elt_NumRange(user_id, NumSegment.TYPE_INT)]
            ));
        }

        return res;
    }
}