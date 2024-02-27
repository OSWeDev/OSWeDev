import { field_names } from '../../../tools/ObjectHandler';
import APIControllerWrapper from '../../API/APIControllerWrapper';
import NumberParamVO, { NumberParamVOStatic } from '../../API/vos/apis/NumberParamVO';
import GetAPIDefinition from '../../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../../API/vos/PostAPIDefinition';
import { query } from '../../ContextFilter/vos/ContextQueryVO';
import Module from '../../Module';
import ModuleTableVO from '../../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../DAO/vos/ModuleTableFieldVO';
import VOsTypesManager from '../../VO/manager/VOsTypesManager';
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

    // istanbul ignore next: nothing to test
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
        // APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, ProduitVO>(
        //     null,
        //     ModuleProduit.APINAME_getProduitAjoutPanier,
        //     [ProduitVO.API_TYPE_ID],
        //     StringParamVO.translateCheckAccessParams,
        // ));
        APIControllerWrapper.registerApi(new GetAPIDefinition<NumberParamVO, FacturationProduitVO[]>(
            null,
            ModuleProduit.APINAME_getFacturationProduitByIdProduit,
            [FacturationProduitVO.API_TYPE_ID],
            NumberParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<ProduitParamLigneParamVO, number>(
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
        this.initializeCategorieProduit();
        this.initializeTypeProduit();
        this.initializeProduit();
        this.initializeFacturation();
        this.initializeFacturationProduit();
    }

    private initializeCategorieProduit(): void {
        // Table CategorieProduit
        const default_label_field: ModuleTableFieldVO<string> = ModuleTableFieldController.create_new(CategorieProduitVO.API_TYPE_ID, field_names<CategorieProduitVO>().titre, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre', true);
        const datatable_fields = [
            default_label_field,
        ];
        this.datatables.push(new ModuleTableVO<CategorieProduitVO>(this, CategorieProduitVO.API_TYPE_ID, () => new CategorieProduitVO(), datatable_fields, default_label_field, 'CategorieProduit'));
    }

    private initializeTypeProduit(): void {
        // Table TypeProduit
        const default_label_field: ModuleTableFieldVO<string> = ModuleTableFieldController.create_new(TypeProduitVO.API_TYPE_ID, field_names<TypeProduitVO>().vo_type_produit, ModuleTableFieldVO.FIELD_TYPE_string, 'vo_type_produit', true);
        const field_categorie_produit_id: ModuleTableFieldVO<number> = ModuleTableFieldController.create_new(TypeProduitVO.API_TYPE_ID, field_names<TypeProduitVO>().categorie_produit_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Categorie produit', true);

        const datatable_fields = [
            default_label_field,
            ModuleTableFieldController.create_new(TypeProduitVO.API_TYPE_ID, field_names<TypeProduitVO>().vo_type_param, ModuleTableFieldVO.FIELD_TYPE_string, 'vo_type_param', true),
            field_categorie_produit_id,
        ];

        const dt = new ModuleTableVO<TypeProduitVO>(this, TypeProduitVO.API_TYPE_ID, () => new TypeProduitVO(), datatable_fields, default_label_field, 'TypeProduit');
        field_categorie_produit_id.set_many_to_one_target_moduletable_name(CategorieProduitVO.API_TYPE_ID);
        this.datatables.push(dt);
    }

    private initializeProduit(): void {
        // Table Produit
        const field_type_produit_id: ModuleTableFieldVO<number> = ModuleTableFieldController.create_new(ProduitVO.API_TYPE_ID, field_names<ProduitVO>().type_produit_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Type produit', true);
        const default_label_field: ModuleTableFieldVO<string> = ModuleTableFieldController.create_new(ProduitVO.API_TYPE_ID, field_names<ProduitVO>().titre, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre', true);

        const datatable_fields = [
            default_label_field,
            ModuleTableFieldController.create_new(ProduitVO.API_TYPE_ID, field_names<ProduitVO>().actif, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Actif', true),
            ModuleTableFieldController.create_new(ProduitVO.API_TYPE_ID, field_names<ProduitVO>().prix, ModuleTableFieldVO.FIELD_TYPE_amount, 'Prix', true),
            ModuleTableFieldController.create_new(ProduitVO.API_TYPE_ID, field_names<ProduitVO>().tva, ModuleTableFieldVO.FIELD_TYPE_prct, 'TVA', true),
            field_type_produit_id,
            ModuleTableFieldController.create_new(ProduitVO.API_TYPE_ID, field_names<ProduitVO>().picto, ModuleTableFieldVO.FIELD_TYPE_string, 'Picto'),
            ModuleTableFieldController.create_new(ProduitVO.API_TYPE_ID, field_names<ProduitVO>().is_complementaire, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Complémentaire ?'),
        ];
        const dt = new ModuleTableVO<ProduitVO>(this, ProduitVO.API_TYPE_ID, () => new ProduitVO(), datatable_fields, default_label_field, 'Produit');
        field_type_produit_id.set_many_to_one_target_moduletable_name(TypeProduitVO.API_TYPE_ID);
        this.datatables.push(dt);
    }

    private initializeFacturation(): void {
        // Table Produit
        const default_label_field: ModuleTableFieldVO<string> = ModuleTableFieldController.create_new(FacturationVO.API_TYPE_ID, field_names<FacturationVO>().titre, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre', true);

        const datatable_fields = [
            default_label_field,
            ModuleTableFieldController.create_new(FacturationVO.API_TYPE_ID, field_names<FacturationVO>().frequence, ModuleTableFieldVO.FIELD_TYPE_int, 'Frequence', true),
            ModuleTableFieldController.create_new(FacturationVO.API_TYPE_ID, field_names<FacturationVO>().texte_affichage, ModuleTableFieldVO.FIELD_TYPE_string, 'Texte Affichage', true),
        ];
        this.datatables.push(new ModuleTableVO<FacturationVO>(this, FacturationVO.API_TYPE_ID, () => new FacturationVO(), datatable_fields, default_label_field, 'Facturation'));
    }

    private initializeFacturationProduit(): void {
        // Table Produit
        const field_produit_id: ModuleTableFieldVO<number> = ModuleTableFieldController.create_new(FacturationProduitVO.API_TYPE_ID, field_names<FacturationProduitVO>().produit_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Produit', true);
        const field_facturation_id: ModuleTableFieldVO<number> = ModuleTableFieldController.create_new(FacturationProduitVO.API_TYPE_ID, field_names<FacturationProduitVO>().facturation_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Facturation', true);

        const datatable_fields = [
            field_produit_id,
            field_facturation_id,
            ModuleTableFieldController.create_new(FacturationProduitVO.API_TYPE_ID, field_names<FacturationProduitVO>().par_defaut, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Par default'),
        ];
        const dt = new ModuleTableVO<FacturationProduitVO>(this, FacturationProduitVO.API_TYPE_ID, () => new FacturationProduitVO(), datatable_fields, null, 'Facturation Produit');
        field_produit_id.set_many_to_one_target_moduletable_name(ProduitVO.API_TYPE_ID);
        field_facturation_id.set_many_to_one_target_moduletable_name(FacturationVO.API_TYPE_ID);
        this.datatables.push(dt);
    }
}