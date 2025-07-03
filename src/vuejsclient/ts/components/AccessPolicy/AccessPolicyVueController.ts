import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import CRUD from '../../../../shared/modules/DAO/vos/CRUD';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import TextHandler from '../../../../shared/tools/TextHandler';
import CRUDComponentManager from '../crud/CRUDComponentManager';

export default class AccessPolicyVueController {

    private static instance: AccessPolicyVueController = null;

    public static getInstance(): AccessPolicyVueController {
        if (!AccessPolicyVueController.instance) {
            AccessPolicyVueController.instance = new AccessPolicyVueController();
        }

        return AccessPolicyVueController.instance;
    }

    public async conf_precreate_uservo_unicity() {

        const user_crud: CRUD<UserVO> = CRUDComponentManager.getInstance().cruds_by_api_type_id[UserVO.API_TYPE_ID];
        user_crud.preCreate = this.dockeck.bind(this);
        user_crud.preUpdate = this.dockeck.bind(this);
        user_crud.hook_prepare_new_vo_for_creation = async (vo: IDistantVOBase) => {
            // On génère un mot de passe par défaut
            (vo as UserVO).password = TextHandler.getInstance().generatePassword();
        };
    }

    private async dockeck(dataVO: UserVO, ihmVO: IDistantVOBase) {

        /**
         * On check l'unicité des login / emails / mobile
         */
        const name = dataVO.name.trim();
        const email = dataVO.email.trim();
        const phone = dataVO.phone ? dataVO.phone.trim() : null;

        if (!await ModuleDAO.instance.selectUsersForCheckUnicity(name, email, phone, dataVO.id)) {
            return 'AccessPolicyVueController.precreate_uservo_unicity.error';
        }

        return null;
    }
}