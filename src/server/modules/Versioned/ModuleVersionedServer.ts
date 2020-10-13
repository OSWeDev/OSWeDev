import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import IVersionedVO from '../../../shared/modules/Versioned/interfaces/IVersionedVO';
import ModuleVersioned from '../../../shared/modules/Versioned/ModuleVersioned';
import VersionedVOController from '../../../shared/modules/Versioned/VersionedVOController';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreDeleteTriggerHook from '../DAO/triggers/DAOPreDeleteTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
const moment = require('moment');

export default class ModuleVersionedServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleVersionedServer.instance) {
            ModuleVersionedServer.instance = new ModuleVersionedServer();
        }
        return ModuleVersionedServer.instance;
    }

    private static instance: ModuleVersionedServer = null;

    private constructor() {
        super(ModuleVersioned.getInstance().name);
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleVersioned.APINAME_RESTORE_TRASHED_VO, this.restoreTrashedVo.bind(this));
    }

    public async configure() {

        for (let i in VersionedVOController.getInstance().registeredModuleTables) {
            let registeredModuleTable = VersionedVOController.getInstance().registeredModuleTables[i];

            let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
            preCreateTrigger.registerHandler(registeredModuleTable.vo_type, this.handleTriggerVOPreCreate);

            let preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
            preUpdateTrigger.registerHandler(registeredModuleTable.vo_type, this.handleTriggerVOPreUpdate);

            let preDeleteTrigger: DAOPreDeleteTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPreDeleteTriggerHook.DAO_PRE_DELETE_TRIGGER);
            preDeleteTrigger.registerHandler(registeredModuleTable.vo_type, this.handleTriggerVOPreDelete);
        }
    }


    private async handleTriggerVOPreCreate(vo: IVersionedVO) {

        vo.version_num = (!!vo.version_num) ? vo.version_num : 1;
        vo.parent_id = null;
        vo.trashed = false;

        // TODO : ATTENTION par défaut c'est du without timezone en base, hors sur le serveur on a un timezone par défaut et sur les fullcalendar on est en without timezone par défaut ....
        let ts = moment().utc(true);
        let uid: number = ModuleAccessPolicyServer.getInstance().getLoggedUserId();
        let robot_user: UserVO = null;

        if (!vo.version_author_id) {
            if (!robot_user) {
                robot_user = await ModuleDAO.getInstance().getNamedVoByName<UserVO>(UserVO.API_TYPE_ID, 'robot');
            }

            vo.version_author_id = (!!uid) ? uid : ((robot_user) ? robot_user.id : null);
        }

        vo.version_timestamp = ts;

        if (!vo.version_edit_author_id) {
            if (!robot_user) {
                robot_user = await ModuleDAO.getInstance().getNamedVoByName<UserVO>(UserVO.API_TYPE_ID, 'robot');
            }

            vo.version_edit_author_id = (!!uid) ? uid : ((robot_user) ? robot_user.id : null);
        }

        vo.version_edit_timestamp = ts;

        return true;
    }

    private async handleTriggerVOPreUpdate(vo_update_handler: DAOUpdateVOHolder<IVersionedVO>) {

        let cloned: IVersionedVO = vo_update_handler.pre_update_vo;

        cloned.id = null;
        cloned._type = VersionedVOController.getInstance().getVersionedVoType(cloned._type);
        cloned.parent_id = vo_update_handler.post_update_vo.id;

        await ModuleDAO.getInstance().insertOrUpdateVO(cloned);

        let uid: number = ModuleAccessPolicyServer.getInstance().getLoggedUserId();

        if (!!uid) {
            vo_update_handler.post_update_vo.version_edit_author_id = uid;
        } else {
            let robot_user: UserVO = await ModuleDAO.getInstance().getNamedVoByName<UserVO>(UserVO.API_TYPE_ID, 'robot');
            vo_update_handler.post_update_vo.version_edit_author_id = robot_user ? robot_user.id : null;
        }

        vo_update_handler.post_update_vo.version_edit_timestamp = moment().utc(true);

        vo_update_handler.post_update_vo.version_num++;

        return true;
    }

    private async handleTriggerVOPreDelete(vo: IVersionedVO) {

        // On crée une nouvelle version pour garder trace de la date + utilisateur qui a fait la suppression
        vo.trashed = true;
        await ModuleDAO.getInstance().insertOrUpdateVO(vo);

        let cloned: IVersionedVO = await ModuleDAO.getInstance().getVoById<IVersionedVO>(vo._type, vo.id);

        cloned._type = VersionedVOController.getInstance().getTrashedVoType(vo._type);
        cloned.id = null;

        let insertionRes: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(cloned);
        if ((!insertionRes) || (!insertionRes.id)) {
            ConsoleHandler.getInstance().error('handleTriggerVOPreDelete failed:insertionRes:' + JSON.stringify(insertionRes));
            return false;
        }
        cloned.id = parseInt(insertionRes.id.toString());

        let versions: IVersionedVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IVersionedVO>(VersionedVOController.getInstance().getVersionedVoType(vo._type), 'parent_id', [vo.id]);

        for (let i in versions) {
            let version = versions[i];

            let cloned_version = Object.assign({}, version);

            cloned_version._type = VersionedVOController.getInstance().getTrashedVersionedVoType(vo._type);
            cloned_version.id = null;
            cloned_version.parent_id = cloned.id;

            await ModuleDAO.getInstance().insertOrUpdateVO(cloned_version);
        }
        await ModuleDAO.getInstance().deleteVOs(versions);

        return true;
    }

    private async restoreTrashedVo(vo: IVersionedVO): Promise<boolean> {

        let cloned = Object.assign({}, vo);

        cloned._type = VersionedVOController.getInstance().recoverOriginalVoTypeFromTrashed(vo._type);
        cloned.id = null;

        let insertionRes: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(cloned);
        if ((!insertionRes) || (!insertionRes.id)) {
            ConsoleHandler.getInstance().error('restoreTrashedVo failed:insertionRes:' + JSON.stringify(insertionRes));
            return false;
        }
        cloned.id = parseInt(insertionRes.id.toString());

        let versions: IVersionedVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IVersionedVO>(VersionedVOController.getInstance().getTrashedVersionedVoType(cloned._type), 'parent_id', [vo.id]);

        for (let i in versions) {
            let version = versions[i];

            let cloned_version = Object.assign({}, version);

            cloned_version._type = VersionedVOController.getInstance().getVersionedVoType(cloned._type);
            cloned_version.id = null;
            cloned_version.parent_id = cloned.id;

            await ModuleDAO.getInstance().insertOrUpdateVO(cloned_version);
        }
        await ModuleDAO.getInstance().deleteVOs(versions);
        await ModuleDAO.getInstance().deleteVOs([vo]);

        // On crée une nouvelle version pour garder trace de la date + utilisateur qui a fait la suppression
        cloned.trashed = false;
        await ModuleDAO.getInstance().insertOrUpdateVO(cloned);

        return true;
    }
}