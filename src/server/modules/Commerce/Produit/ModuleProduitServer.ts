import ModuleServerBase from '../../ModuleServerBase';
import ModuleProduit from '../../../../shared/modules/Commerce/Produit/ModuleProduit';
import ModuleAPI from '../../../../shared/modules/API/ModuleAPI';
import ProduitVO from '../../../../shared/modules/Commerce/Produit/vos/ProduitVO';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import TypeProduitVO from '../../../../shared/modules/Commerce/Produit/vos/TypeProduitVO';
import StringParamVO from '../../../../shared/modules/API/vos/apis/StringParamVO';
import NumberParamVO from '../../../../shared/modules/API/vos/apis/NumberParamVO';
import FacturationProduitVO from '../../../../shared/modules/Commerce/Produit/vos/FacturationProduitVO';
import ProduitAndServiceParamVO from '../../../../shared/modules/Commerce/Produit/vos/apis/ProduitParamLigneParamVO';
import ProduitControllersManager from './ProduitControllersManager';

export default class ModuleProduitServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleProduitServer.instance) {
            ModuleProduitServer.instance = new ModuleProduitServer();
        }
        return ModuleProduitServer.instance;
    }

    private static instance: ModuleProduitServer = null;

    constructor() {
        super(ModuleProduit.getInstance().name);
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleProduit.APINAME_getProduitAjoutPanier, this.getProduitAjoutPanier.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleProduit.APINAME_getFacturationProduitByIdProduit, this.getFacturationProduitByIdProduit.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleProduit.APINAME_getPrixProduit, this.getPrixProduit.bind(this));
    }

    public async getProduitAjoutPanier(param: StringParamVO): Promise<ProduitVO> {
        let produits: ProduitVO[] = await ModuleDAOServer.getInstance().selectAll<ProduitVO>(ProduitVO.API_TYPE_ID);

        if (!produits) {
            return null;
        }
        let types_produit: TypeProduitVO[] = await ModuleDAOServer.getInstance().selectAll<TypeProduitVO>(TypeProduitVO.API_TYPE_ID);

        if (!types_produit) {
            return null;
        }
        let type_produit: TypeProduitVO = types_produit.find((t) => t.vo_type_produit == param.text);

        if (!type_produit) {
            return null;
        }

        return produits.find((p) => p.type_produit_id == type_produit.id);
    }

    public async getFacturationProduitByIdProduit(param: NumberParamVO): Promise<FacturationProduitVO[]> {
        return await ModuleDAOServer.getInstance().selectAll<FacturationProduitVO>(
            FacturationProduitVO.API_TYPE_ID,
            ' WHERE t.produit_id = $1', [param.num]
        );
    }

    public async getPrixProduit(param: ProduitAndServiceParamVO): Promise<number> {
        return ProduitControllersManager.getInstance().get_registered_product_controller(param.produit_custom).calcPrixProduit(param.produit, param.produit_custom, param.ligneParam);
    }
}