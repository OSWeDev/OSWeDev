import Module from '../../Module';
import ModuleTable from '../../ModuleTable';
import ProduitVO from './vos/ProduitVO';
import CategorieProduitVO from './vos/CategorieProduitVO';
import ModuleTableField from '../../ModuleTableField';
import ModuleDAO from '../../DAO/ModuleDAO';

export default class ModuleProduit extends Module {
    public static getInstance(): ModuleProduit {
        if (!ModuleProduit.instance) {
            ModuleProduit.instance = new ModuleProduit();
        }
        return ModuleProduit.instance;
    }

    private static instance: ModuleProduit = null;

    public datatable_produit: ModuleTable<ProduitVO> = null;
    public datatable_categorie_produit: ModuleTable<CategorieProduitVO> = null;

    private constructor() {
        super('commerce_produit', 'Produit', 'Commerce/Produit');
    }

    public async hook_module_configure(db) {
        return true;
    }

    public async hook_module_async_client_admin_initialization() { }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeCategorieProduit();
        this.initializeProduit();
    }

    public initializeCategorieProduit(): void {
        // Table CategorieProduit
        let datatable_fields = [
            new ModuleTableField('titre', ModuleTableField.FIELD_TYPE_string, 'Titre', true),
            new ModuleTableField('param_type', ModuleTableField.FIELD_TYPE_string, 'Type de param', true),
        ];
        this.datatable_categorie_produit = new ModuleTable<CategorieProduitVO>(this, CategorieProduitVO.API_TYPE_ID, datatable_fields, null, 'CategorieProduit');
        this.datatables.push(this.datatable_categorie_produit);
    }

    public initializeProduit(): void {
        // Table Produit
        let field_categorie_produit_id: ModuleTableField<number> = new ModuleTableField('categorie_produit_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Categorie produit');

        let datatable_fields = [
            new ModuleTableField('titre', ModuleTableField.FIELD_TYPE_string, 'Titre', true),
            new ModuleTableField('actif', ModuleTableField.FIELD_TYPE_boolean, 'Actif', true),
            new ModuleTableField('prix', ModuleTableField.FIELD_TYPE_float, 'Prix'),
            new ModuleTableField('tva', ModuleTableField.FIELD_TYPE_float, 'TVA', true),
            field_categorie_produit_id,
        ];
        this.datatable_produit = new ModuleTable<ProduitVO>(this, ProduitVO.API_TYPE_ID, datatable_fields, null, 'Produit');
        field_categorie_produit_id.addManyToOneRelation(this.datatable_produit, this.datatable_categorie_produit);
        this.datatables.push(this.datatable_produit);
    }

    public async getProduitById(produitId: number): Promise<ProduitVO> {
        return ModuleDAO.getInstance().getVoById<ProduitVO>(ProduitVO.API_TYPE_ID, produitId);
    }
}