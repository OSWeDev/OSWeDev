import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import IVersionedVO from '../../../shared/modules/Versioned/interfaces/IVersionedVO';
import ModuleVersioned from '../../../shared/modules/Versioned/ModuleVersioned';
import VersionedVOController from '../../../shared/modules/Versioned/VersionedVOController';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../shared/tools/DateHandler';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModuleServerBase from '../ModuleServerBase';
import moment = require('moment');

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

            let preCreateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
            preCreateTrigger.registerHandler(registeredModuleTable.vo_type, this.handleTriggerVOPreCreate.bind(this));

            let preUpdateTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_UPDATE_TRIGGER);
            preUpdateTrigger.registerHandler(registeredModuleTable.vo_type, this.handleTriggerVOPreUpdate.bind(this));

            let preDeleteTrigger: DAOTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOTriggerHook.DAO_PRE_DELETE_TRIGGER);
            preDeleteTrigger.registerHandler(registeredModuleTable.vo_type, this.handleTriggerVOPreDelete.bind(this));
        }
    }


    private async handleTriggerVOPreCreate(vo: IVersionedVO) {

        vo.version_num = (!!vo.version_num) ? vo.version_num : 1;
        vo.parent_id = null;
        vo.trashed = false;

        // TODO : ATTENTION par défaut c'est du without timezone en base, hors sur le serveur on a un timezone par défaut et sur les fullcalendar on est en without timezone par défaut ....
        let ts = DateHandler.getInstance().formatDateTimeForBDD(moment().utc(true));
        let user: UserVO = await ModuleAccessPolicyServer.getInstance().getLoggedUser();

        vo.version_author_id = user ? user.id : null;
        vo.version_timestamp = ts;

        vo.version_edit_author_id = user ? user.id : null;
        vo.version_edit_timestamp = ts;

        return true;
    }

    private async handleTriggerVOPreUpdate(vo: IVersionedVO) {

        let cloned = Object.assign({}, vo);

        cloned.id = null;
        cloned._type = VersionedVOController.getInstance().getVersionedVoType(cloned._type);
        cloned.parent_id = vo.id;

        await ModuleDAO.getInstance().insertOrUpdateVO(cloned);

        let user: UserVO = await ModuleAccessPolicyServer.getInstance().getLoggedUser();

        vo.version_edit_author_id = user ? user.id : null;
        vo.version_edit_timestamp = DateHandler.getInstance().formatDateTimeForBDD(moment().utc(true));

        vo.version_num++;

        return true;
    }

    private async handleTriggerVOPreDelete(vo: IVersionedVO) {

        // On crée une nouvelle version pour garder trace de la date + utilisateur qui a fait la suppression
        vo.trashed = true;
        await ModuleDAO.getInstance().insertOrUpdateVO(vo);

        let cloned = Object.assign({}, vo);

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