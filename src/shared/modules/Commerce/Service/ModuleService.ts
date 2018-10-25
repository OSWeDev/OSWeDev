import ModuleDAO from '../../DAO/ModuleDAO';
import Module from '../../Module';
import ModuleTable from '../../ModuleTable';
import ModuleTableField from '../../ModuleTableField';
import VOsTypesManager from '../../VOsTypesManager';
import ClientVO from '../Client/vos/ClientVO';
import ProduitVO from '../Produit/vos/ProduitVO';
import ServiceVO from './vos/ServiceVO';

export default class ModuleService extends Module {

    public static getInstance(): ModuleService {
        if (!ModuleService.instance) {
            ModuleService.instance = new ModuleService();
        }
        return ModuleService.instance;
    }

    private static instance: ModuleService = null;

    public datatable: ModuleTable<ServiceVO> = null;

    private constructor() {
        super(ServiceVO.API_TYPE_ID, 'Service', 'Commerce/Service');
    }

    public async hook_module_configure(db) {
        return true;
    }

    public async hook_module_async_client_admin_initialization() { }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeService();
    }

    public initializeService(): void {
        // Table Service
        let field_produit_id: ModuleTableField<number> = new ModuleTableField('produit_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Produit', true);
        let field_informations_id: ModuleTableField<number> = new ModuleTableField('informations_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Informations', true);

        let datatable_fields = [
            field_produit_id,
            field_informations_id,
        ];
        this.datatable = new ModuleTable<ServiceVO>(this, ServiceVO.API_TYPE_ID, datatable_fields, null, 'Service');
        field_produit_id.addManyToOneRelation(this.datatable, VOsTypesManager.getInstance().moduleTables_by_voType[ProduitVO.API_TYPE_ID]);
        field_informations_id.addManyToOneRelation(this.datatable, VOsTypesManager.getInstance().moduleTables_by_voType[ClientVO.API_TYPE_ID]);

        this.datatables.push(this.datatable);
    }

    public async getServiceById(serviceId: number): Promise<ServiceVO> {
        return ModuleDAO.getInstance().getVoById<ServiceVO>(ServiceVO.API_TYPE_ID, serviceId);
    }
}