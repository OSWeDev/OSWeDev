import ModuleCommerce from '../../../../shared/modules/Commerce/ModuleCommerce';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import CommandeListeComponent from './commande/liste/CommandeListeComponent';
import CommandeDetailComponent from './commande/detail/CommandeDetailComponent';
import ClientComponent from './client/ClientComponent';

export default class CommerceVueModule extends VueModuleBase {
    public static getInstance(): CommerceVueModule {
        if (!CommerceVueModule.instance) {
            CommerceVueModule.instance = new CommerceVueModule();
        }

        return CommerceVueModule.instance;
    }

    private static instance: CommerceVueModule = null;

    private constructor() {
        super(ModuleCommerce.getInstance().name);
    }

    public initialize() {
        this.routes.push(
            {
                path: '/commandes',
                name: 'commandes',
                component: CommandeListeComponent
            },
            {
                path: '/commande/:commande_id',
                name: 'commande_detail',
                component: CommandeDetailComponent,
                props: (route) => ({
                    commande_id: parseInt(route.params.commande_id)
                })
            },
            {
                path: '/infos',
                name: 'infos',
                component: ClientComponent
            }
        );
    }
}