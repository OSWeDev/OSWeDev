import ProduitControllerBase from './ProduitControllerBase';
import DefaultProduitController from './DefaultProduitController';
import ProduitVOBase from '../../../../shared/modules/Commerce/Produit/vos/ProduitVOBase';

export default class ProduitControllersManager {
    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ProduitControllersManager.instance) {
            ProduitControllersManager.instance = new ProduitControllersManager();
        }
        return ProduitControllersManager.instance;
    }

    private static instance: ProduitControllersManager = null;

    private registered_product_controllers: { [vo_type_produit: string]: ProduitControllerBase } = {};

    private constructor() {
    }

    public register_product_controller(controller: ProduitControllerBase) {
        this.registered_product_controllers[controller.vo_type_produit] = controller;
    }

    public get_registered_product_controller(produit_base: ProduitVOBase): ProduitControllerBase {
        if (!produit_base || !this.registered_product_controllers[produit_base._type]) {
            return DefaultProduitController.getInstance();
        }
        return this.registered_product_controllers[produit_base._type];
    }
}