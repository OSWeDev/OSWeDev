import Module from '../Module';
import CommerceVueModule from '../../../vuejsclient/ts/components/commerce/CommerceVueModule';

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

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }
}