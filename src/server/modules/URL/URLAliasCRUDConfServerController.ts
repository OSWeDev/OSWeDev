import Throttle from '../../../shared/annotations/Throttle';
import ContextQueryFieldVO from '../../../shared/modules/ContextFilter/vos/ContextQueryFieldVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTableController from '../../../shared/modules/DAO/ModuleTableController';
import EventifyEventListenerConfVO from '../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import CRUDURLController from '../../../shared/modules/URL/CRUDURLController';
import URLAliasCRUDConfVO from '../../../shared/modules/URL/vos/URLAliasCRUDConfVO';
import URLAliasVO from '../../../shared/modules/URL/vos/URLAliasVO';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';

export default class URLAliasCRUDConfServerController extends ModuleServerBase {

    private static async reapply_url_alias_crud_conf(url_alias_crud_conf: URLAliasCRUDConfVO): Promise<void> {

        /**
         * On doit générer la nouvelle conf d'une part et charger la conf actuelle de l'autre
         */
        let new_conf: { [from_to_uid: string]: URLAliasVO } = {};
        let current_conf: { [from_to_uid: string]: URLAliasVO } = {};
        await all_promises([
            (async () => {
                new_conf = await URLAliasCRUDConfServerController.get_new_url_alias_crud_conf(url_alias_crud_conf);
            })(),
            (async () => {
                current_conf = await URLAliasCRUDConfServerController.get_current_url_alias_crud_conf(url_alias_crud_conf);
            })()
        ]);

        const to_delete: URLAliasVO[] = [];
        const to_create: URLAliasVO[] = [];
        for (const from_to_uid in new_conf) {
            if (!current_conf[from_to_uid]) {
                // Nouvel alias à créer
                to_create.push(new_conf[from_to_uid]);
            }
        }

        for (const from_to_uid in current_conf) {
            if (!new_conf[from_to_uid]) {
                // Ancien alias à supprimer
                to_delete.push(current_conf[from_to_uid]);
            }
        }

        await all_promises([
            (async () => {
                if (to_delete.length > 0) {
                    await ModuleDAOServer.instance.deleteVOs_as_server(to_delete);
                }
            })(),
            (async () => {
                if (to_create.length > 0) {
                    await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(to_create);
                }
            })(),
        ]);
    }

    private static async get_new_url_alias_crud_conf(url_alias_conf: URLAliasCRUDConfVO) {
        const res: { [from_to_uid: string]: URLAliasVO } = {};

        if (!url_alias_conf) {
            return res;
        }

        const moduletable = ModuleTableController.module_tables_by_vo_id[url_alias_conf.moduletable_ref_id];
        if (!moduletable) {
            throw new Error('ModuleTable not found for id: ' + url_alias_conf.moduletable_ref_id);
        }

        if (url_alias_conf.url_alias_create) {
            // En create pas de param c'est simple on génère l'alias d'url directement
            const alias_create = new URLAliasVO();
            alias_create.alias_url = url_alias_conf.url_alias_create;
            alias_create.initial_url = CRUDURLController.get_crud_create_url(moduletable.vo_type);
            alias_create.url_alias_conf_id = url_alias_conf.id;
            alias_create.vo_id = null; // Pas d'id pour le create
            res[alias_create.initial_url + '|' + alias_create.alias_url] = alias_create;
        }

        /**
         * Pour définir les urls d'alias, on doit d'une part charger tous les vos du type lié, et pour chacun appliquer le template d'alias d'url
         * On doit donc faire des packs de 1000 vos pour éviter de trop charger la mémoire, mais globalement ATTENTION à ne pas faire des confs d'alias sur les types de contenus qui ont trop de vos ....
         */
        if (url_alias_conf.url_alias_template_read || url_alias_conf.url_alias_template_update) {

            /**
             * On identifie les field_names nécessaires à charger de la base pour pas tout charger inutilement
             * Les field_names étant identifiés par /:[field_name]/ dans le template d'alias d'url
             * On stocke les field_names dans une map pour éviter les doublons efficacement
             */
            const field_names_to_load: { [field_name: string]: ContextQueryFieldVO } = {};

            if (url_alias_conf.url_alias_template_read) {
                const read_template = url_alias_conf.url_alias_template_read;
                const read_field_names = read_template.match(/:([a-zA-Z_]+)/g);
                if (read_field_names) {
                    for (const field_name of read_field_names) {
                        const field_id = field_name.substring(1); // On enlève le ':' du début
                        field_names_to_load[field_id] = new ContextQueryFieldVO(
                            moduletable.vo_type, // api_type_id du type ciblé
                            field_id,
                        );
                    }
                }
            }

            if (url_alias_conf.url_alias_template_update) {
                const update_template = url_alias_conf.url_alias_template_update;
                const update_field_names = update_template.match(/:([a-zA-Z_]+)/g);
                if (update_field_names) {
                    for (const field_name of update_field_names) {
                        const field_id = field_name.substring(1); // On enlève le ':' du début
                        field_names_to_load[field_id] = new ContextQueryFieldVO(
                            moduletable.vo_type, // api_type_id du type ciblé
                            field_id,
                        );
                    }
                }
            }

            // On en fait un tableau de fields pour la query

            let might_have_more_vos_to_handle = true;
            const limit = 1000;
            let offset = 0;
            while (might_have_more_vos_to_handle) {

                const current_vos: IDistantVOBase[] = await query(moduletable.vo_type)
                    .add_fields(Object.values(field_names_to_load)) // On ajoute les fields nécessaires
                    .exec_as_server()
                    .set_limit(limit, offset)
                    .select_vos<IDistantVOBase>();

                if (!current_vos || current_vos.length === 0) {
                    break; // Pas de vos à traiter
                }

                offset += limit;
                might_have_more_vos_to_handle = (current_vos.length === limit);

                // Pour chaque vo, on génère les alias d'url
                for (const vo of current_vos) {

                    if (!vo) {
                        continue; // Pas de vo à traiter
                    }

                    if (url_alias_conf.url_alias_template_read) {
                        const alias_read = new URLAliasVO();
                        alias_read.alias_url = url_alias_conf.url_alias_template_read.replace(/:([a-zA-Z_]+)/g, (match, field_name) => {
                            return (vo[field_name] != null) ? CRUDURLController.transliterate_field_value_to_url(vo[field_name]) : "_";
                        });
                        alias_read.initial_url = CRUDURLController.get_crud_read_url(moduletable.vo_type, vo.id);
                        alias_read.url_alias_conf_id = url_alias_conf.id;
                        alias_read.vo_id = vo.id; // On met l'id du vo pour le read
                        res[alias_read.initial_url + '|' + alias_read.alias_url] = alias_read;
                    }

                    if (url_alias_conf.url_alias_template_update) {
                        const alias_update = new URLAliasVO();
                        alias_update.alias_url = url_alias_conf.url_alias_template_update.replace(/:([a-zA-Z_]+)/g, (match, field_name) => {
                            return (vo[field_name] != null) ? CRUDURLController.transliterate_field_value_to_url(vo[field_name]) : "_";
                        });
                        alias_update.initial_url = CRUDURLController.get_crud_update_url(moduletable.vo_type, vo.id);
                        alias_update.url_alias_conf_id = url_alias_conf.id;
                        alias_update.vo_id = vo.id; // On met l'id du vo pour l'update
                        res[alias_update.initial_url + '|' + alias_update.alias_url] = alias_update;
                    }
                }
            }
        }


        return res;
    }

    private static async get_current_url_alias_crud_conf(url_alias_conf: URLAliasCRUDConfVO): Promise<{ [from_to_uid: string]: URLAliasVO }> {
        const res: { [from_to_uid: string]: URLAliasVO } = {};

        if (!url_alias_conf) {
            return res;
        }

        const alias_urls: URLAliasVO[] = await query(URLAliasVO.API_TYPE_ID)
            .filter_by_id(url_alias_conf.id, URLAliasCRUDConfVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<URLAliasVO>();

        for (const alias_url of alias_urls) {
            if (alias_url.alias_url && alias_url.initial_url) {
                res[alias_url.initial_url + '|' + alias_url.alias_url] = alias_url;
            }
        }

        return res;
    }


    /**
     * On doit réappliquer pour tous les types de contenus la conf d'alias d'url du type de contenu, et impacter les alias d'url qui changent/manquent/sont en trop
     */
    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_MAP,
        throttle_ms: 1000,
        leading: true,
    })
    public static async reapply_url_alias_crud_confs(
        pre_url_alias_crud_conf_by_id: { [id: number]: URLAliasCRUDConfVO }
    ): Promise<void> {

        const promises = [];
        for (const i in pre_url_alias_crud_conf_by_id) {
            const pre_url_alias_crud_conf: URLAliasCRUDConfVO = pre_url_alias_crud_conf_by_id[i];

            promises.push(
                URLAliasCRUDConfServerController.reapply_url_alias_crud_conf(pre_url_alias_crud_conf)
            );
        }

        await all_promises(promises);
    }
}
