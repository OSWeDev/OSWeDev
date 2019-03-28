import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import DAOTriggerHook from '../DAO/triggers/DAOTriggerHook';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import VarsController from '../../../shared/modules/Var/VarsController';
import IVarDataVOBase from '../../../shared/modules/Var/interfaces/IVarDataVOBase';
import ModuleVersioned from '../../../shared/modules/Versioned/ModuleVersioned';
import VersionedVOController from '../../../shared/modules/Versioned/VersionedVOController';
import IVersionedVO from '../../../shared/modules/Versioned/interfaces/IVersionedVO';
import DateHandler from '../../../shared/tools/DateHandler';
import moment = require('moment');
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import ModuleTableField from '../../../shared/modules/ModuleTableField';

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

        let ts = DateHandler.getInstance().formatDateTimeForBDD(moment());
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
        vo.version_edit_timestamp = DateHandler.getInstance().formatDateTimeForBDD(moment());

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
            console.error('handleTriggerVOPreDelete failed:insertionRes:' + JSON.stringify(insertionRes));
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
            console.error('restoreTrashedVo failed:insertionRes:' + JSON.stringify(insertionRes));
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