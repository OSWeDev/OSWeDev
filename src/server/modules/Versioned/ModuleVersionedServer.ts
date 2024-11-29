import { cloneDeep } from 'lodash';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleVersioned from '../../../shared/modules/Versioned/ModuleVersioned';
import VersionedVOController from '../../../shared/modules/Versioned/VersionedVOController';
import IVersionedVO from '../../../shared/modules/Versioned/interfaces/IVersionedVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPreCreateTriggerHook from '../DAO/triggers/DAOPreCreateTriggerHook';
import DAOPreDeleteTriggerHook from '../DAO/triggers/DAOPreDeleteTriggerHook';
import DAOPreUpdateTriggerHook from '../DAO/triggers/DAOPreUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModuleParamsServer from '../Params/ModuleParamsServer';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import ParamsServerController from '../Params/ParamsServerController';
import StackContext from '../../StackContext';
import { IRequestStackContext } from '../../ServerExpressController';

export default class ModuleVersionedServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleVersionedServer.instance) {
            ModuleVersionedServer.instance = new ModuleVersionedServer();
        }
        return ModuleVersionedServer.instance;
    }

    private static instance: ModuleVersionedServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleVersioned.getInstance().name);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleVersioned.APINAME_RESTORE_TRASHED_VO, this.restoreTrashedVo.bind(this));
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        for (const i in VersionedVOController.getInstance().registeredModuleTables) {
            const registeredModuleTable = VersionedVOController.getInstance().registeredModuleTables[i];

            const preCreateTrigger: DAOPreCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreCreateTriggerHook.DAO_PRE_CREATE_TRIGGER);
            preCreateTrigger.registerHandler(registeredModuleTable.vo_type, this, this.handleTriggerVOPreCreate);

            const preUpdateTrigger: DAOPreUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreUpdateTriggerHook.DAO_PRE_UPDATE_TRIGGER);
            preUpdateTrigger.registerHandler(registeredModuleTable.vo_type, this, this.handleTriggerVOPreUpdate);

            const preDeleteTrigger: DAOPreDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreDeleteTriggerHook.DAO_PRE_DELETE_TRIGGER);
            preDeleteTrigger.registerHandler(registeredModuleTable.vo_type, this, this.handleTriggerVOPreDelete);
        }
    }

    public async get_robot_user_id(): Promise<number> {
        let robot_user_id: number = await ParamsServerController.getParamValueAsInt(ModuleVersioned.PARAM_NAME_ROBOT_USER_ID, null, 3600000);

        if (!robot_user_id) {
            const robot_user: UserVO = await query(UserVO.API_TYPE_ID).filter_by_text_eq(field_names<UserVO>().name, 'robot').exec_as_server().select_vo<UserVO>();
            robot_user_id = robot_user ? robot_user.id : null;

            if (robot_user_id) {
                await ParamsServerController.setParamValue_as_server(ModuleVersioned.PARAM_NAME_ROBOT_USER_ID, robot_user_id.toString());
            }
        }

        return robot_user_id;
    }

    private async handleTriggerVOPreCreate(vo: IVersionedVO): Promise<boolean> {
        if (!vo) {
            return false;
        }

        vo.version_num = (vo.version_num) ? vo.version_num : 1;
        vo.parent_id = null;
        vo.trashed = false;

        // TODO : ATTENTION par défaut c'est du without timezone en base, hors sur le serveur on a un timezone par défaut et sur les fullcalendar on est en without timezone par défaut ....
        const ts = Dates.now();
        let uid: number = ModuleAccessPolicyServer.getLoggedUserId();
        if (!uid) {
            uid = await this.get_robot_user_id();
        }

        if (!vo.version_author_id) {
            vo.version_author_id = uid;
        }

        vo.version_timestamp = ts;

        if (!vo.version_edit_author_id) {
            vo.version_edit_author_id = uid;
        }

        vo.version_edit_timestamp = ts;

        return true;
    }

    private async handleTriggerVOPreUpdate(vo_update_handler: DAOUpdateVOHolder<IVersionedVO>): Promise<boolean> {

        if (!vo_update_handler) {
            return false;
        }

        const cloned: IVersionedVO = Object.create(vo_update_handler.pre_update_vo);

        if (!cloned) {
            return false;
        }

        cloned.id = null;
        cloned._type = VersionedVOController.getInstance().getVersionedVoType(cloned._type);
        cloned.parent_id = vo_update_handler.post_update_vo.id;

        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(cloned);

        const can_use_context = !StackContext.get(reflect<IRequestStackContext>().CONTEXT_INCOMPATIBLE);
        const uid: number = can_use_context ? ModuleAccessPolicyServer.getLoggedUserId() : null;

        if (uid) {
            vo_update_handler.post_update_vo.version_edit_author_id = uid;
        } else {

            vo_update_handler.post_update_vo.version_edit_author_id = await this.get_robot_user_id();
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

        const pre_cloned_vo: IVersionedVO = cloneDeep(vo);
        const post_cloned_vo: IVersionedVO = cloneDeep(vo);

        // On crée une nouvelle version pour garder trace de la date + utilisateur qui a fait la suppression
        post_cloned_vo.trashed = true;
        await this.handleTriggerVOPreUpdate(new DAOUpdateVOHolder<IVersionedVO>(pre_cloned_vo, post_cloned_vo));

        const cloned_deleted_vo: IVersionedVO = cloneDeep(post_cloned_vo);
        cloned_deleted_vo._type = VersionedVOController.getInstance().getTrashedVoType(cloned_deleted_vo._type);
        cloned_deleted_vo.id = null;

        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(cloned_deleted_vo);
        if (!cloned_deleted_vo.id) {
            ConsoleHandler.error('handleTriggerVOPreDelete failed:insertionRes:' + JSON.stringify(cloned_deleted_vo));
            return false;
        }

        const versions_query = query(VersionedVOController.getInstance().getVersionedVoType(vo._type)).filter_by_num_eq(field_names<IVersionedVO>().parent_id, vo.id).exec_as_server();
        const versions: IVersionedVO[] = await versions_query.select_vos<IVersionedVO>();

        for (const i in versions) {
            const version = versions[i];

            const cloned_version = Object.assign({}, version);

            cloned_version._type = VersionedVOController.getInstance().getTrashedVersionedVoType(vo._type);
            cloned_version.id = null;
            cloned_version.parent_id = cloned_deleted_vo.id;

            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(cloned_version);
        }

        await versions_query.delete_vos();

        return true;
    }

    private async restoreTrashedVo(vo: IVersionedVO): Promise<boolean> {

        const cloned = Object.assign({}, vo);

        cloned._type = VersionedVOController.getInstance().recoverOriginalVoTypeFromTrashed(vo._type);
        cloned.id = null;

        const insertionRes: InsertOrDeleteQueryResult = await ModuleDAOServer.instance.insertOrUpdateVO_as_server(cloned);
        if ((!insertionRes) || (!insertionRes.id)) {
            ConsoleHandler.error('restoreTrashedVo failed:insertionRes:' + JSON.stringify(insertionRes));
            return false;
        }
        cloned.id = insertionRes.id;

        const versions_query = query(VersionedVOController.getInstance().getTrashedVersionedVoType(cloned._type)).filter_by_num_eq(field_names<IVersionedVO>().parent_id, vo.id).exec_as_server();
        const versions: IVersionedVO[] = await versions_query.select_vos<IVersionedVO>();

        for (const i in versions) {
            const version = versions[i];

            const cloned_version = Object.assign({}, version);

            cloned_version._type = VersionedVOController.getInstance().getVersionedVoType(cloned._type);
            cloned_version.id = null;
            cloned_version.parent_id = cloned.id;

            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(cloned_version);
        }
        await versions_query.delete_vos();
        await query(vo._type).filter_by_id(vo.id).delete_vos();

        // On crée une nouvelle version pour garder trace de la date + utilisateur qui a fait la suppression
        cloned.trashed = false;
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(cloned);

        return true;
    }
}