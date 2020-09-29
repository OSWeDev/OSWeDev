import * as moment from 'moment';
import AccessPolicyController from '../../../../shared/modules/AccessPolicy/AccessPolicyController';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import StackContext from '../../../../shared/tools/StackContext';
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

        if (user.blocked) {
            return false;
        }

        return await this.resetPwdUser(user, challenge, new_pwd1);
    }

    public async resetPwdUID(uid: number, challenge: string, new_pwd1: string): Promise<boolean> {

        let user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecoveryUID(uid);

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        return await this.resetPwdUser(user, challenge, new_pwd1);
    }


    public async checkCode(email: string, challenge: string): Promise<boolean> {

        let user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecovery(email);

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        return await this.checkCodeUser(user, challenge);
    }

    public async checkCodeUID(uid: number, challenge: string): Promise<boolean> {

        let user: UserVO = await ModuleDAOServer.getInstance().selectOneUserForRecoveryUID(uid);

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        return await this.checkCodeUser(user, challenge);
    }

    public async checkCodeUser(user: UserVO, challenge: string): Promise<boolean> {

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        if (user.recovery_challenge != challenge) {
            return false;
        }

        if (user.recovery_expiration.isBefore(moment().utc(true))) {
            return false;
        }

        return true;
    }

    public async resetPwdUser(user: UserVO, challenge: string, new_pwd1: string): Promise<boolean> {

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        if (user.recovery_challenge != challenge) {
            return false;
        }

        if (user.recovery_expiration.isBefore(moment().utc(true))) {
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
        await StackContext.getInstance().runPromise({ IS_CLIENT: false }, async () => {

            AccessPolicyController.getInstance().prepareForInsertOrUpdateAfterPwdChange(user, new_pwd1);
            await ModuleDAO.getInstance().insertOrUpdateVO(user);
        });

        return true;
    }
}