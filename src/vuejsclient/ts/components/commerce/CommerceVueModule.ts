import ModuleCommerce from '../../../../shared/modules/Commerce/ModuleCommerce';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import CommandeListeComponent from './commande/liste/CommandeListeComponent';
import CommandeDetailComponent from './commande/detail/CommandeDetailComponent';

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

    public initialize(): void {
        this.routes.push(
            {
                path: '/commandes',
                name: 'commandes',
                component: CommandeListeComponent
            },
            {
                path: '/commande/:commande_id',
                name: 'commandes',
                component: CommandeDetailComponent,
                props: (route) => ({
                    commande_id: parseInt(route.params.commande_id)
                })
            }
        );
    }
}