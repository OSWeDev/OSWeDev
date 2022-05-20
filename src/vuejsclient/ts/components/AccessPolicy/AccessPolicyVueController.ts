import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import CRUD from '../../../../shared/modules/DAO/vos/CRUD';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import CRUDComponentManager from '../crud/CRUDComponentManager';

export default class AccessPolicyVueController {
    public static getInstance(): AccessPolicyVueController {
        if (!AccessPolicyVueController.instance) {
            AccessPolicyVueController.instance = new AccessPolicyVueController();
        }

        return AccessPolicyVueController.instance;
    }

    private static instance: AccessPolicyVueController = null;

    private constructor() {
    }

    public async conf_precreate_uservo_unicity() {

        let user_crud: CRUD<UserVO> = CRUDComponentManager.getInstance().cruds_by_api_type_id[UserVO.API_TYPE_ID];
        user_crud.preCreate = this.dockeck.bind(this);
        user_crud.preUpdate = this.dockeck.bind(this);
    }

    private async dockeck(dataVO: UserVO, ihmVO: IDistantVOBase) {

        /**
         * On check l'unicité des login / emails / mobile
         */
        let name = dataVO.name.trim();
        let email = dataVO.email.trim();
        let phone = dataVO.phone ? dataVO.phone.trim() : null;

        if (!await ModuleDAO.getInstance().selectUsersForCheckUnicity(name, email, phone, dataVO.id)) {
            return 'AccessPolicyVueController.precreate_uservo_unicity.error';
        }

        return null;
    }
}