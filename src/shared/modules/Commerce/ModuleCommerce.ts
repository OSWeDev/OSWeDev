import Module from '../Module';
import ModuleProduit from './Produit/ModuleProduit';
import ModuleClient from './Client/ModuleClient';
import ModuleService from './Service/ModuleService';
import ModuleCommande from './Commande/ModuleCommande';
import ModuleAbonnement from './Abonnement/ModuleAbonnement';
import ModulePaiement from './Paiement/ModulePaiement';

export default class ModuleCommerce extends Module {

    public static getInstance(): ModuleCommerce {
        if (!ModuleCommerce.instance) {
            ModuleCommerce.instance = new ModuleCommerce();
        }
        return ModuleCommerce.instance;
    }

    private static instance: ModuleCommerce = null;

    private constructor() {
        super("commerce", "Commerce");
    }

    public async hook_module_configure(db) {
        return true;
    }

    public async hook_module_async_client_admin_initialization() { }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }
}