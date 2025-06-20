import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import EventsController from '../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import CRUDURLController from '../../../shared/modules/URL/CRUDURLController';
import ModuleURL from '../../../shared/modules/URL/ModuleURL';
import URLAliasCRUDConfVO from '../../../shared/modules/URL/vos/URLAliasCRUDConfVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOPreDeleteTriggerHook from '../DAO/triggers/DAOPreDeleteTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import EventsServerController from '../Eventify/EventsServerController';
import ModuleServerBase from '../ModuleServerBase';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import URLAliasCRUDConfServerController from './URLAliasCRUDConfServerController';

export default class ModuleURLServer extends ModuleServerBase {

    private static instance: ModuleURLServer = null;

    private static readonly REGISTER_TRIGGER_EVENT_NAME: string = 'ModuleURLServer.REGISTER_TRIGGER';
    private static readonly UNREGISTER_TRIGGER_EVENT_NAME: string = 'ModuleURLServer.UNREGISTER_TRIGGER';

    private postCreateTrigger_conditionUID_by_conf_id: { [conf_id: number]: string } = null;
    private postUpdateTrigger_conditionUID_by_conf_id: { [conf_id: number]: string } = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleURL.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleURLServer.instance) {
            ModuleURLServer.instance = new ModuleURLServer();
        }
        return ModuleURLServer.instance;
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        // sur un changement de conf, postcreate, postupdate, on doit reapply_url_alias_crud_confs
        const postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        const postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        const preDeleteTrigger: DAOPreDeleteTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPreDeleteTriggerHook.DAO_PRE_DELETE_TRIGGER);

        postCreateTrigger.registerHandler(URLAliasCRUDConfVO.API_TYPE_ID, this, this.on_post_create_urlaliasconf_reload_conf);
        postUpdateTrigger.registerHandler(URLAliasCRUDConfVO.API_TYPE_ID, this, this.on_post_update_urlaliasconf_reload_conf);

        // On doit aussi update / create / delete les triggers de création des vos en fonction des modifs de confs
        postCreateTrigger.registerHandler(URLAliasCRUDConfVO.API_TYPE_ID, this, this.on_post_create_urlaliasconf_update_triggers);
        postUpdateTrigger.registerHandler(URLAliasCRUDConfVO.API_TYPE_ID, this, this.on_post_update_urlaliasconf_update_triggers);
        preDeleteTrigger.registerHandler(URLAliasCRUDConfVO.API_TYPE_ID, this, this.on_pre_delete_urlaliasconf_update_triggers);

        /**
         * TODO Question pas simple : si on create / update / delete un vo sur lequel on a une conf d'url alias, on doit vérifier l'impact sur l'alis d'url du vo en question ?
         * Quid du redirect ? on a des urls mortes si on fait ça... on devrait peut-etre juste faire en post-create une génération d'url alias pour ce contenu, et on touche pas automatiquement ensuite pour éviter les urls mortes... ?
         */
        // A voir en temps voulu pour les modifs
        // On lance simplement la génération de l'alias en cas de création du contenu, et la suppression de l'alias pour le moment en cas de suppression du contenu : ATTENTION FIXME : en terme de referencement il faut pas faire ça
        //  mais pour le moment on est plutôt dans une logique extranet
        EventsController.on_every_event_cb(
            ModuleURLServer.REGISTER_TRIGGER_EVENT_NAME,
            this.register_trigger_for_url_alias_conf.bind(this),
        );
        EventsController.on_every_event_cb(
            ModuleURLServer.UNREGISTER_TRIGGER_EVENT_NAME,
            this.unregister_trigger_for_url_alias_conf.bind(this),
        );
    }

    private async register_trigger_for_url_alias_conf(vo: URLAliasCRUDConfVO) {
        const postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);

        if (!vo || !vo.moduletable_ref_id) {
            return;
        }

        // Pas d'alias définis donc pas de trigger à créer pour les vos ciblés
        if ((!vo.url_alias_template_read) && (!vo.url_alias_template_update)) {
            return;
        }

        const moduletable = ModuleTableController.module_tables_by_vo_id[vo.moduletable_ref_id];

        if (!moduletable) {
            ConsoleHandler.error(`ModuleURLServer.on_post_create_urlaliasconf_update_triggers : No module table found for id ${vo.moduletable_ref_id}`);
            return;
        }

        this.postCreateTrigger_conditionUID_by_conf_id[vo.id] = postCreateTrigger.registerHandler(
            moduletable.vo_type,
            this,
            this.on_post_create_vo_linked_to_url_alias_conf);
    }

    private async unregister_trigger_for_url_alias_conf(vo: URLAliasCRUDConfVO) {

        // On supprime le trigger lié à la conf d'url alias
        const postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);

        if (!vo || !vo.id || !this.postCreateTrigger_conditionUID_by_conf_id[vo.id]) {
            return true;
        }

        postCreateTrigger.unregisterHandlerOnThisThread(
            this.postCreateTrigger_conditionUID_by_conf_id[vo.id],
            this.on_post_create_vo_linked_to_url_alias_conf);
        return true;
    }

    private async on_post_create_urlaliasconf_reload_conf(vo: URLAliasCRUDConfVO) {
        // On applique la conf d'url alias
        await URLAliasCRUDConfServerController.reapply_url_alias_crud_confs({ [vo.id]: vo });
    }

    private async on_post_update_urlaliasconf_reload_conf(vo_wrapper: DAOUpdateVOHolder<URLAliasCRUDConfVO>) {
        // On applique la conf d'url alias
        await URLAliasCRUDConfServerController.reapply_url_alias_crud_confs({ [vo_wrapper.post_update_vo.id]: vo_wrapper.post_update_vo });
    }

    private async on_post_create_urlaliasconf_update_triggers(vo: URLAliasCRUDConfVO) {

        // On créé les triggers de création des vos en fonction de la conf => On le fait sur TOUS les threads
        EventsServerController.broadcast_event(EventifyEventInstanceVO.new_event(ModuleURLServer.REGISTER_TRIGGER_EVENT_NAME, vo));
    }

    private async on_post_update_urlaliasconf_update_triggers(vo_wrapper: DAOUpdateVOHolder<URLAliasCRUDConfVO>) {

        if (!vo_wrapper || !vo_wrapper.post_update_vo || !vo_wrapper.post_update_vo.id || !vo_wrapper.pre_update_vo || !vo_wrapper.pre_update_vo.id) {
            return;
        }

        // Si il y a une différence de conf => on identifie si c'est un register ou un unregister (on a plus de template de read/update => unregister, on a (et on avait pas) de template de read/update => register)
        // Et si la différence est sur le modultetable, unregister l'ancien trigger et en register un nouveau si c'est pertinent
        if (vo_wrapper.post_update_vo.moduletable_ref_id === vo_wrapper.pre_update_vo.moduletable_ref_id) {

            const had_template = (vo_wrapper.pre_update_vo.url_alias_template_read || vo_wrapper.pre_update_vo.url_alias_template_update);
            const has_template = (vo_wrapper.post_update_vo.url_alias_template_read || vo_wrapper.post_update_vo.url_alias_template_update);

            if (had_template && !has_template) {
                EventsServerController.broadcast_event(EventifyEventInstanceVO.new_event(ModuleURLServer.UNREGISTER_TRIGGER_EVENT_NAME, vo_wrapper.pre_update_vo));
            } else if (!had_template && has_template) {
                EventsServerController.broadcast_event(EventifyEventInstanceVO.new_event(ModuleURLServer.REGISTER_TRIGGER_EVENT_NAME, vo_wrapper.post_update_vo));
            }
        } else {
            // Si on change de module table, on unregister l'ancien trigger et on register le nouveau
            EventsServerController.broadcast_event(EventifyEventInstanceVO.new_event(ModuleURLServer.UNREGISTER_TRIGGER_EVENT_NAME, vo_wrapper.pre_update_vo));
            EventsServerController.broadcast_event(EventifyEventInstanceVO.new_event(ModuleURLServer.REGISTER_TRIGGER_EVENT_NAME, vo_wrapper.post_update_vo));
        }
    }

    private async on_pre_delete_urlaliasconf_update_triggers(vo: URLAliasCRUDConfVO): Promise<boolean> {
        EventsServerController.broadcast_event(EventifyEventInstanceVO.new_event(ModuleURLServer.UNREGISTER_TRIGGER_EVENT_NAME, vo));
        return true;
    }


    /**
     * à la création d'un VO lié à une conf d'URL alias, on crée l'alias d'URL correspondant au VO
     * @param vo
     */
    private async on_post_create_vo_linked_to_url_alias_conf(vo: IDistantVOBase) {

        if (!vo || !vo.id) {
            ConsoleHandler.error('ModuleURLServer.on_post_create_vo_linked_to_url_alias_conf : No VO provided');
            return;
        }

        const url_alias_conf = await query(URLAliasCRUDConfVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<ModuleTableVO>().vo_type, vo._type, ModuleTableVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<URLAliasCRUDConfVO>();

        const aliases = [];
        if (url_alias_conf.url_alias_template_read) {

            aliases.push(CRUDURLController.get_vo_alias_url_for_read(url_alias_conf, vo));
        }

        if (url_alias_conf.url_alias_template_update) {

            aliases.push(CRUDURLController.get_vo_alias_url_for_update(url_alias_conf, vo));
        }

        if (aliases.length > 0) {
            await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(aliases);
        }
    }
}