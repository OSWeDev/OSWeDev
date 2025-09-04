import AccessPolicyController from '../../../../shared/modules/AccessPolicy/AccessPolicyController';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ResetPwdResultVO from '../../../../shared/modules/AccessPolicy/vos/ResetPwdResultVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTableController from '../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../../shared/modules/DAO/ModuleTableFieldController';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import NotificationVO from '../../../../shared/modules/PushData/vos/NotificationVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import DAOServerController from '../../DAO/DAOServerController';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import PushDataServerController from '../../PushData/PushDataServerController';
import PasswordHistoryServerController from '../PasswordHistoryServerController';

export default class PasswordReset {

    private static instance: PasswordReset = null;

    private constructor() {
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!PasswordReset.instance) {
            PasswordReset.instance = new PasswordReset();
        }
        return PasswordReset.instance;
    }

    public async resetPwd(email: string, challenge: string, new_pwd1: string): Promise<boolean> {

        const user: UserVO = await ModuleDAOServer.instance.selectOneUserForRecovery(email);

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        return await this.resetPwdUser(user, challenge, new_pwd1);
    }

    public async resetPwdUID(uid: number, challenge: string, new_pwd1: string): Promise<boolean> {

        const user: UserVO = await ModuleDAOServer.instance.selectOneUserForRecoveryUID(uid);

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        return await this.resetPwdUser(user, challenge, new_pwd1);
    }


    public async checkCode(email: string, challenge: string): Promise<boolean> {

        const user: UserVO = await ModuleDAOServer.instance.selectOneUserForRecovery(email);

        if (!user) {
            return false;
        }

        if (user.blocked) {
            return false;
        }

        return await this.checkCodeUser(user, challenge);
    }

    public async checkCodeUID(uid: number, challenge: string): Promise<boolean> {

        const user: UserVO = await ModuleDAOServer.instance.selectOneUserForRecoveryUID(uid);

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

        if (user.recovery_expiration < Dates.now()) {
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

        if (user.recovery_expiration < Dates.now()) {
            return false;
        }

        try {

            // Vérifier d'abord la complexité et l'historique du mot de passe
            const passwordValidation = await PasswordHistoryServerController.getInstance().validatePassword(user.id, new_pwd1);
            if (passwordValidation !== null) {
                ConsoleHandler.warn('Mot de passe rejeté pour l\'utilisateur ' + user.id + ': ' + passwordValidation);
                return false;
            }

            const msg = ModuleTableFieldController.validate_field_value(
                ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID].getFieldFromId(field_names<UserVO>().password),
                new_pwd1);
            if (!((!msg) || (msg == ""))) {

                return false;
            }
        } catch (error) {
            ConsoleHandler.error(error);
            return false;
        }

        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            // On est en readonly partout, donc on informe sur impossibilité de se connecter
            await PushDataServerController.notifySession(
                'error.global_update_blocker.activated.___LABEL___',
                NotificationVO.SIMPLE_ERROR
            );
            return false;
        }

        AccessPolicyController.getInstance().prepareForInsertOrUpdateAfterPwdChange(user, new_pwd1);
        await query(UserVO.API_TYPE_ID).filter_by_id(user.id).exec_as_server().update_vos<UserVO>(
            ModuleTableController.translate_vos_to_api(user, false)
        );

        // Ajouter le nouveau mot de passe à l'historique après le changement réussi
        await PasswordHistoryServerController.getInstance().addPasswordToHistory(user.id, new_pwd1);

        return true;
    }

    public async resetPwdDetailed(email: string, challenge: string, new_pwd1: string): Promise<ResetPwdResultVO> {

        const user: UserVO = await ModuleDAOServer.instance.selectOneUserForRecovery(email);

        if (!user) {
            return ResetPwdResultVO.create({
                success: false,
                error_code: ResetPwdResultVO.ERROR_CODE_UNKNOWN_USER,
                message: 'Utilisateur introuvable ou email invalide'
            });
        }

        if (user.blocked) {
            return ResetPwdResultVO.create({
                success: false,
                error_code: ResetPwdResultVO.ERROR_CODE_UNKNOWN_USER,
                message: 'Compte utilisateur bloqué'
            });
        }

        return await this.resetPwdUserDetailed(user, challenge, new_pwd1);
    }

    public async resetPwdUIDDetailed(uid: number, challenge: string, new_pwd1: string): Promise<ResetPwdResultVO> {

        const user: UserVO = await ModuleDAOServer.instance.selectOneUserForRecoveryUID(uid);

        if (!user) {
            return ResetPwdResultVO.create({
                success: false,
                error_code: ResetPwdResultVO.ERROR_CODE_UNKNOWN_USER,
                message: 'Utilisateur introuvable ou ID invalide'
            });
        }

        if (user.blocked) {
            return ResetPwdResultVO.create({
                success: false,
                error_code: ResetPwdResultVO.ERROR_CODE_UNKNOWN_USER,
                message: 'Compte utilisateur bloqué'
            });
        }

        return await this.resetPwdUserDetailed(user, challenge, new_pwd1);
    }

    public async resetPwdUserDetailed(user: UserVO, challenge: string, new_pwd1: string): Promise<ResetPwdResultVO> {

        if (!user) {
            return ResetPwdResultVO.create({
                success: false,
                error_code: ResetPwdResultVO.ERROR_CODE_UNKNOWN_USER,
                message: 'Utilisateur introuvable'
            });
        }

        if (user.blocked) {
            return ResetPwdResultVO.create({
                success: false,
                error_code: ResetPwdResultVO.ERROR_CODE_UNKNOWN_USER,
                message: 'Compte utilisateur bloqué'
            });
        }

        if (user.recovery_challenge != challenge) {
            return ResetPwdResultVO.create({
                success: false,
                error_code: ResetPwdResultVO.ERROR_CODE_INVALID_CHALLENGE,
                message: 'Code de récupération invalide ou expiré'
            });
        }

        if (user.recovery_expiration < Dates.now()) {
            return ResetPwdResultVO.create({
                success: false,
                error_code: ResetPwdResultVO.ERROR_CODE_INVALID_CHALLENGE,
                message: 'Code de récupération expiré'
            });
        }

        try {

            // Vérifier d'abord la complexité et l'historique du mot de passe
            const passwordValidation = await PasswordHistoryServerController.getInstance().validatePassword(user.id, new_pwd1);
            if (passwordValidation !== null) {
                ConsoleHandler.warn('Mot de passe rejeté pour l\'utilisateur ' + user.id + ': ' + passwordValidation);

                if (passwordValidation.includes('already used')) {
                    return ResetPwdResultVO.create({
                        success: false,
                        error_code: ResetPwdResultVO.ERROR_CODE_PASSWORD_REUSED,
                        message: 'Ce mot de passe a déjà été utilisé. Veuillez en choisir un autre.'
                    });
                } else {
                    return ResetPwdResultVO.create({
                        success: false,
                        error_code: ResetPwdResultVO.ERROR_CODE_PASSWORD_INVALID,
                        message: passwordValidation
                    });
                }
            }

            const msg = ModuleTableFieldController.validate_field_value(
                ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID].getFieldFromId(field_names<UserVO>().password),
                new_pwd1);
            if (!((!msg) || (msg == ""))) {
                return ResetPwdResultVO.create({
                    success: false,
                    error_code: ResetPwdResultVO.ERROR_CODE_PASSWORD_INVALID,
                    message: msg
                });
            }
        } catch (error) {
            ConsoleHandler.error(error);
            return ResetPwdResultVO.create({
                success: false,
                error_code: ResetPwdResultVO.ERROR_CODE_INTERNAL_ERROR,
                message: 'Erreur interne lors de la validation du mot de passe'
            });
        }

        if (DAOServerController.GLOBAL_UPDATE_BLOCKER) {
            // On est en readonly partout, donc on informe sur impossibilité de se connecter
            await PushDataServerController.notifySession(
                'error.global_update_blocker.activated.___LABEL___',
                NotificationVO.SIMPLE_ERROR
            );
            return ResetPwdResultVO.create({
                success: false,
                error_code: ResetPwdResultVO.ERROR_CODE_INTERNAL_ERROR,
                message: 'Service temporairement indisponible'
            });
        }

        AccessPolicyController.getInstance().prepareForInsertOrUpdateAfterPwdChange(user, new_pwd1);
        await query(UserVO.API_TYPE_ID).filter_by_id(user.id).exec_as_server().update_vos<UserVO>(
            ModuleTableController.translate_vos_to_api(user, false)
        );

        // Ajouter le nouveau mot de passe à l'historique après le changement réussi
        await PasswordHistoryServerController.getInstance().addPasswordToHistory(user.id, new_pwd1);

        return ResetPwdResultVO.create({
            success: true,
            error_code: ResetPwdResultVO.ERROR_CODE_SUCCESS,
            message: 'Mot de passe modifié avec succès'
        });
    }
}