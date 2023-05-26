import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import IVersionedVO from '../../../shared/modules/Versioned/interfaces/IVersionedVO';
import ModuleVersioned from '../../../shared/modules/Versioned/ModuleVersioned';
import VersionedVOController from '../../../shared/modules/Versioned/VersionedVOController';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import StackContext from '../../StackContext';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreDeleteTriggerHook from '../DAO/triggers/DAOPreDeleteTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';

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
        APIControllerWrapper.registerServerApiHandler(ModuleVersioned.APINAME_RESTORE_TRASHED_VO, this.restoreTrashedVo.bind(this));
    }

    public async configure() {

        for (let i in VersionedVOController.getInstance().registeredModuleTables) {
            let registeredModuleTable = VersionedVOController.getInstance().registeredModuleTables[i];

            let preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
            preCreateTrigger.registerHandler(registeredModuleTable.vo_type, this, this.handleTriggerVOPreCreate);

            let preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
            preUpdateTrigger.registerHandler(registeredModuleTable.vo_type, this, this.handleTriggerVOPreUpdate);

            let preDeleteTrigger: DAOPreDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreDeleteTriggerHook.DAO_PRE_DELETE_TRIGGER);
            preDeleteTrigger.registerHandler(registeredModuleTable.vo_type, this, this.handleTriggerVOPreDelete);
        }
    }


    private async handleTriggerVOPreCreate(vo: IVersionedVO): Promise<boolean> {
        if (!vo) {
            return false;
        }

        vo.version_num = (!!vo.version_num) ? vo.version_num : 1;
        vo.parent_id = null;
        vo.trashed = false;

        // TODO : ATTENTION par défaut c'est du without timezone en base, hors sur le serveur on a un timezone par défaut et sur les fullcalendar on est en without timezone par défaut ....
        let ts = Dates.now();
        let uid: number = ModuleAccessPolicyServer.getInstance().getLoggedUserId();
        let robot_user: UserVO = null;

        if (!vo.version_author_id) {
            if (!robot_user) {
                robot_user = await query(UserVO.API_TYPE_ID).filter_by_text_eq('name', 'robot').exec_as_server().select_vo<UserVO>();
            }

            vo.version_author_id = (!!uid) ? uid : ((robot_user) ? robot_user.id : null);
        }

        vo.version_timestamp = ts;

        if (!vo.version_edit_author_id) {
            if (!robot_user) {
                robot_user = await query(UserVO.API_TYPE_ID).filter_by_text_eq('name', 'robot').exec_as_server().select_vo<UserVO>();
            }

            vo.version_edit_author_id = (!!uid) ? uid : ((robot_user) ? robot_user.id : null);
        }

        vo.version_edit_timestamp = ts;

        return true;
    }

    private async handleTriggerVOPreUpdate(vo_update_handler: DAOUpdateVOHolder<IVersionedVO>): Promise<boolean> {

        if (!vo_update_handler) {
            return false;
        }

        let cloned: IVersionedVO = Object.create(vo_update_handler.pre_update_vo);

        if (!cloned) {
            return false;
        }

        cloned.id = null;
        cloned._type = VersionedVOController.getInstance().getVersionedVoType(cloned._type);
        cloned.parent_id = vo_update_handler.post_update_vo.id;

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(cloned);

        let uid: number = ModuleAccessPolicyServer.getInstance().getLoggedUserId();

        if (!!uid) {
            vo_update_handler.post_update_vo.version_edit_author_id = uid;
        } else {
            let robot_user: UserVO = await query(UserVO.API_TYPE_ID).filter_by_text_eq('name', 'robot').exec_as_server().select_vo<UserVO>();
            vo_update_handler.post_update_vo.version_edit_author_id = robot_user ? robot_user.id : null;
        }

        vo_update_handler.post_update_vo.version_edit_timestamp = Dates.now();

        vo_update_handler.post_update_vo.version_num = (typeof vo_update_handler.post_update_vo.version_num == 'number') ?
            vo_update_handler.post_update_vo.version_num + 1 : 1;

        return true;
    }

    private async handleTriggerVOPreDelete(vo: IVersionedVO): Promise<boolean> {

        if (!vo) {
            return false;
        }

        // On crée une nouvelle version pour garder trace de la date + utilisateur qui a fait la suppression
        vo.trashed = true;
        await query(vo._type).filter_by_id(vo.id).exec_as_server().update_vos<IVersionedVO>({
            [field_names<IVersionedVO>().trashed]: vo.trashed,
        });

        let cloned: IVersionedVO = await query(vo._type).filter_by_id(vo.id).exec_as_server().select_vo();

        if (!cloned) {
            return false;
        }

        cloned._type = VersionedVOController.getInstance().getTrashedVoType(vo._type);
        cloned.id = null;

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(cloned);
        if (!cloned.id) {
            ConsoleHandler.error('handleTriggerVOPreDelete failed:insertionRes:' + JSON.stringify(cloned));
            return false;
        }

        let versions_query = query(VersionedVOController.getInstance().getVersionedVoType(vo._type)).filter_by_num_eq('parent_id', vo.id).exec_as_server();
        let versions: IVersionedVO[] = await versions_query.select_vos<IVersionedVO>();

        for (let i in versions) {
            let version = versions[i];

            let cloned_version = Object.assign({}, version);

            cloned_version._type = VersionedVOController.getInstance().getTrashedVersionedVoType(vo._type);
            cloned_version.id = null;
            cloned_version.parent_id = cloned.id;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(cloned_version);
        }
        await versions_query.delete_vos();

        return true;
    }

    private async restoreTrashedVo(vo: IVersionedVO): Promise<boolean> {

        let cloned = Object.assign({}, vo);

        cloned._type = VersionedVOController.getInstance().recoverOriginalVoTypeFromTrashed(vo._type);
        cloned.id = null;

        let insertionRes: InsertOrDeleteQueryResult = await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(cloned);
        if ((!insertionRes) || (!insertionRes.id)) {
            ConsoleHandler.error('restoreTrashedVo failed:insertionRes:' + JSON.stringify(insertionRes));
            return false;
        }
        cloned.id = insertionRes.id;

        let versions_query = query(VersionedVOController.getInstance().getTrashedVersionedVoType(cloned._type)).filter_by_num_eq('parent_id', vo.id).exec_as_server();
        let versions: IVersionedVO[] = await versions_query.select_vos<IVersionedVO>();

        for (let i in versions) {
            let version = versions[i];

            let cloned_version = Object.assign({}, version);

            cloned_version._type = VersionedVOController.getInstance().getVersionedVoType(cloned._type);
            cloned_version.id = null;
            cloned_version.parent_id = cloned.id;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(cloned_version);
        }
        await versions_query.delete_vos();
        await query(vo._type).filter_by_id(vo.id).delete_vos();

        // On crée une nouvelle version pour garder trace de la date + utilisateur qui a fait la suppression
        cloned.trashed = false;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(cloned);

        return true;
    }
}