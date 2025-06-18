import ModuleURL from '../../../shared/modules/URL/ModuleURL';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleURLServer extends ModuleServerBase {

    private static instance: ModuleURLServer = null;

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
        register triggers

        /**
         * TODO Question pas simple : si on create / update / delete un vo sur lequel on a une conf d'url alias, on doit vérifier l'impact sur l'alis d'url du vo en question ?
         * Quid du redirect ? on a des urls mortes si on fait ça... on devrait peut-etre juste faire en post-create une génération d'url alias pour ce contenu, et on touche pas automatiquement ensuite pour éviter les urls mortes... ?
         */
        todo quid new vo / updates ...
    }
}