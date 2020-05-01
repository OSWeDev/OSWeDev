import Module from '../../Module';
import ModuleTable from '../../ModuleTable';
import ProduitVO from './vos/ProduitVO';
import CategorieProduitVO from './vos/CategorieProduitVO';
import ModuleTableField from '../../ModuleTableField';
import ModuleDAO from '../../DAO/ModuleDAO';
import TypeProduitVO from './vos/TypeProduitVO';
import FacturationVO from './vos/FacturationVO';
import FacturationProduitVO from './vos/FacturationProduitVO';
import ModuleAPI from '../../API/ModuleAPI';
import PostAPIDefinition from '../../API/vos/PostAPIDefinition';
import StringParamVO from '../../API/vos/apis/StringParamVO';
import NumberParamVO from '../../API/vos/apis/NumberParamVO';
import GetAPIDefinition from '../../API/vos/GetAPIDefinition';
import ProduitVOBase from './vos/ProduitVOBase';
import ProduitAndServiceParamVO from './vos/apis/ProduitParamLigneParamVO';
import ParamLigneCommandeVO from '../Commande/vos/ParamLigneCommandeVO';
import VOsTypesManager from '../../VOsTypesManager';

export default class ModuleProduit extends Module {

    public static APINAME_getProduitAjoutPanier: string = 'getProduitAjoutPanier';
    public static APINAME_getFacturationProduitByIdProduit: string = 'getFacturationProduitByIdProduit';
    public static APINAME_getPrixProduit: string = 'getPrixProduit';

    public static getInstance(): ModuleProduit {
        if (!ModuleProduit.instance) {
            ModuleProduit.instance = new ModuleProduit();
        }
        return ModuleProduit.instance;
    }

    private static instance: ModuleProduit = null;

    private constructor() {
        super(ProduitVO.API_TYPE_ID, 'Produit', 'Commerce/Produit');
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<StringParamVO, ProduitVO>(
            ModuleProduit.APINAME_getProduitAjoutPanier,
            [ProduitVO.API_TYPE_ID],
            StringParamVO.translateCheckAccessParams,
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, FacturationProduitVO[]>(
            ModuleProduit.APINAME_getFacturationProduitByIdProduit,
            [FacturationProduitVO.API_TYPE_ID],
            NumberParamVO.translateCheckAccessParams,
            NumberParamVO.URL,
            NumberParamVO.translateToURL,
            NumberParamVO.translateFromREQ
        ));
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<ProduitAndServiceParamVO, number>(
            ModuleProduit.APINAME_getPrixProduit,
            [],
            ProduitAndServiceParamVO.translateCheckAccessParams,
        ));
    }

    public async getProduitById(produitId: number): Promise<ProduitVO> {
        return ModuleDAO.getInstance().getVoById<ProduitVO>(ProduitVO.API_TYPE_ID, produitId);
    }

    public async getPrixProduit(produit: ProduitVO, produit_base: ProduitVOBase, ligneParam: ParamLigneCommandeVO): Promise<number> {
        return ModuleAPI.getInstance().handleAPI<ProduitAndServiceParamVO, number>(ModuleProduit.APINAME_getPrixProduit, produit, produit_base, ligneParam);
    }

    public async getProduitAjoutPanier(api_type_id: string, ligneParam: ParamLigneCommandeVO, produit_base: ProduitVOBase): Promise<ProduitVO> {
        let produit: ProduitVO = await ModuleAPI.getInstance().handleAPI<StringParamVO, ProduitVO>(ModuleProduit.APINAME_getProduitAjoutPanier, api_type_id);


        if (!produit) {
            return null;
        }

        produit.prix = await this.getPrixProduit(produit, produit_base, ligneParam);

        return produit;
    }

    public async getFacturationProduitByIdProduit(produitId: number): Promise<FacturationProduitVO[]> {
        return ModuleAPI.getInstance().handleAPI<NumberParamVO, FacturationProduitVO[]>(ModuleProduit.APINAME_getFacturationProduitByIdProduit, produitId);
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeCategorieProduit();
        this.initializeTypeProduit();
        this.initializeProduit();
        this.initializeFacturation();
        this.initializeFacturationProduit();
    }

    private initializeCategorieProduit(): void {
        // Table CategorieProduit
        let default_label_field: ModuleTableField<string> = new ModuleTableField('titre', ModuleTableField.FIELD_TYPE_string, 'Titre', true);
        let datatable_fields = [
            default_label_field,
        ];
        this.datatables.push(new ModuleTable<CategorieProduitVO>(this, CategorieProduitVO.API_TYPE_ID, () => new CategorieProduitVO(), datatable_fields, default_label_field, 'CategorieProduit'));
    }

    private initializeTypeProduit(): void {
        // Table TypeProduit
        let default_label_field: ModuleTableField<string> = new ModuleTableField('vo_type_produit', ModuleTableField.FIELD_TYPE_string, 'vo_type_produit', true);
        let field_categorie_produit_id: ModuleTableField<number> = new ModuleTableField('categorie_produit_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Categorie produit', true);

        let datatable_fields = [
            default_label_field,
            new ModuleTableField('vo_type_param', ModuleTableField.FIELD_TYPE_string, 'vo_type_param', true),
            field_categorie_produit_id,
        ];

        let dt = new ModuleTable<TypeProduitVO>(this, TypeProduitVO.API_TYPE_ID, () => new TypeProduitVO(), datatable_fields, default_label_field, 'TypeProduit');
        field_categorie_produit_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[CategorieProduitVO.API_TYPE_ID]);
        this.datatables.push(dt);
    }

    private initializeProduit(): void {
        // Table Produit
        let field_type_produit_id: ModuleTableField<number> = new ModuleTableField('type_produit_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Type produit', true);
        let default_label_field: ModuleTableField<string> = new ModuleTableField('titre', ModuleTableField.FIELD_TYPE_string, 'Titre', true);

        let datatable_fields = [
            default_label_field,
            new ModuleTableField('actif', ModuleTableField.FIELD_TYPE_boolean, 'Actif', true),
            new ModuleTableField('prix', ModuleTableField.FIELD_TYPE_amount, 'Prix', true),
            new ModuleTableField('tva', ModuleTableField.FIELD_TYPE_prct, 'TVA', true),
            field_type_produit_id,
            new ModuleTableField('picto', ModuleTableField.FIELD_TYPE_string, 'Picto'),
            new ModuleTableField('is_complementaire', ModuleTableField.FIELD_TYPE_boolean, 'Complémentaire ?'),
        ];
        let dt = new ModuleTable<ProduitVO>(this, ProduitVO.API_TYPE_ID, () => new ProduitVO(), datatable_fields, default_label_field, 'Produit');
        field_type_produit_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[TypeProduitVO.API_TYPE_ID]);
        this.datatables.push(dt);
    }

    private initializeFacturation(): void {
        // Table Produit
        let default_label_field: ModuleTableField<string> = new ModuleTableField('titre', ModuleTableField.FIELD_TYPE_string, 'Titre', true);

        let datatable_fields = [
            default_label_field,
            new ModuleTableField('frequence', ModuleTableField.FIELD_TYPE_int, 'Frequence', true),
            new ModuleTableField('texte_affichage', ModuleTableField.FIELD_TYPE_string, 'Texte Affichage', true),
        ];
        this.datatables.push(new ModuleTable<FacturationVO>(this, FacturationVO.API_TYPE_ID, () => new FacturationVO(), datatable_fields, default_label_field, 'Facturation'));
    }

    private initializeFacturationProduit(): void {
        // Table Produit
        let field_produit_id: ModuleTableField<number> = new ModuleTableField('produit_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Produit', true);
        let field_facturation_id: ModuleTableField<number> = new ModuleTableField('facturation_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Facturation', true);

        let datatable_fields = [
            field_produit_id,
            field_facturation_id,
            new ModuleTableField('par_defaut', ModuleTableField.FIELD_TYPE_boolean, 'Par default'),
        ];
        let dt = new ModuleTable<FacturationProduitVO>(this, FacturationProduitVO.API_TYPE_ID, () => new FacturationProduitVO(), datatable_fields, null, 'Facturation Produit');
        field_produit_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[ProduitVO.API_TYPE_ID]);
        field_facturation_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FacturationVO.API_TYPE_ID]);
        this.datatables.push(dt);
    }
}