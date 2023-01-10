import APIControllerWrapper from '../../API/APIControllerWrapper';
import ModuleAPI from '../../API/ModuleAPI';
import NumberParamVO, { NumberParamVOStatic } from '../../API/vos/apis/NumberParamVO';
import GetAPIDefinition from '../../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../../API/vos/PostAPIDefinition';
import { query } from '../../ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../DAO/ModuleDAO';
import Module from '../../Module';
import ModuleTable from '../../ModuleTable';
import ModuleTableField from '../../ModuleTableField';
import VOsTypesManager from '../../VOsTypesManager';
import ParamLigneCommandeVO from '../Commande/vos/ParamLigneCommandeVO';
import ProduitParamLigneParamVO, { ProduitParamLigneParamVOStatic } from './vos/apis/ProduitParamLigneParamVO';
import CategorieProduitVO from './vos/CategorieProduitVO';
import FacturationProduitVO from './vos/FacturationProduitVO';
import FacturationVO from './vos/FacturationVO';
import ProduitVO from './vos/ProduitVO';
import ProduitVOBase from './vos/ProduitVOBase';
import TypeProduitVO from './vos/TypeProduitVO';

export default class ModuleProduit extends Module {

    // public static APINAME_getProduitAjoutPanier: string = 'getProduitAjoutPanier';
    public static APINAME_getFacturationProduitByIdProduit: string = 'getFacturationProduitByIdProduit';
    public static APINAME_getPrixProduit: string = 'getPrixProduit';

    public static getInstance(): ModuleProduit {
        if (!ModuleProduit.instance) {
            ModuleProduit.instance = new ModuleProduit();
        }
        return ModuleProduit.instance;
    }

    private static instance: ModuleProduit = null;

    public getPrixProduit: (produit: ProduitVO, produit_base: ProduitVOBase, ligneParam: ParamLigneCommandeVO) => Promise<number> = APIControllerWrapper.sah(ModuleProduit.APINAME_getPrixProduit);
    public getFacturationProduitByIdProduit: (produitId: number) => Promise<FacturationProduitVO[]> = APIControllerWrapper.sah(ModuleProduit.APINAME_getFacturationProduitByIdProduit);

    private constructor() {
        super(ProduitVO.API_TYPE_ID, 'Produit', 'Commerce/Produit');
    }

    public registerApis() {
        // APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<StringParamVO, ProduitVO>(
        //     null,
        //     ModuleProduit.APINAME_getProduitAjoutPanier,
        //     [ProduitVO.API_TYPE_ID],
        //     StringParamVO.translateCheckAccessParams,
        // ));
        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, FacturationProduitVO[]>(
            null,
            ModuleProduit.APINAME_getFacturationProduitByIdProduit,
            [FacturationProduitVO.API_TYPE_ID],
            NumberParamVOStatic
        ));
        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<ProduitParamLigneParamVO, number>(
            null,
            ModuleProduit.APINAME_getPrixProduit,
            [],
            ProduitParamLigneParamVOStatic
        ));
    }

    public async getProduitById(produitId: number): Promise<ProduitVO> {
        return query(ProduitVO.API_TYPE_ID).filter_by_id(produitId).select_vo<ProduitVO>();
    }

    // REFONTE API needs rebuild with dedicated paramvo
    // public async getProduitAjoutPanier(api_type_id: string, ligneParam: ParamLigneCommandeVO, produit_base: ProduitVOBase): Promise<ProduitVO> {
    //     let produit: ProduitVO = await APIControllerWrapper.sah(ModuleProduit.APINAME_getProduitAjoutPanier, api_type_id);


    //     if (!produit) {
    //         return null;
    //     }

    //     produit.prix = await this.getPrixProduit(produit, produit_base, ligneParam);

    //     return produit;
    // }

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
        field_categorie_produit_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[CategorieProduitVO.API_TYPE_ID]);
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
        field_type_produit_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[TypeProduitVO.API_TYPE_ID]);
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
        field_produit_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ProduitVO.API_TYPE_ID]);
        field_facturation_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[FacturationVO.API_TYPE_ID]);
        this.datatables.push(dt);
    }
}