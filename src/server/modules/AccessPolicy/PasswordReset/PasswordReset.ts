import * as moment from 'moment';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ServerBase from '../../../ServerBase';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';

export default class PasswordReset {

    public static getInstance() {
        if (!PasswordReset.instance) {
            PasswordReset.instance = new PasswordReset();
        }
        return PasswordReset.instance;
    }

    private static instance: PasswordReset = null;

    private constructor() {
    }

    public async resetPwd(email: string, challenge: string, new_pwd1: string): Promise<boolean> {

        let user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecovery(email);

        if (!user) {
            return false;
        }

        if (user.recovery_challenge != challenge) {
            return false;
        }

        if (moment(user.recovery_expiration).utc(true).isBefore(moment().utc(true))) {
            return false;
        }

        try {

            let msg = VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID].getFieldFromId('password').validate(new_pwd1);
            if (!((!msg) || (msg == ""))) {

                return false;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return false;
        }

        // On doit se comporter comme un server à ce stade
        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        httpContext.set('IS_CLIENT', false);

        ModuleAccessPolicy.getInstance().prepareForInsertOrUpdateAfterPwdChange(user, new_pwd1);
        await ModuleDAO.getInstance().insertOrUpdateVO(user);
        return true;
    }
}