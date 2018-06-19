import Module from '../Module';
import ModuleTableField from '../ModuleTableField';
import ModuleTable from '../ModuleTable';
import ModuleParamChange from '../ModuleParamChange';
import * as moment from 'moment';
import ModuleAjaxCache from '../AjaxCache/ModuleAjaxCache';
import ModulePlanningMensuel from '../PlanningMensuel/ModulePlanningMensuel';
import StoreEmployeeVO from '../StoreEmployeeController/vos/StoreEmployeeVO';
import PlanningMensuelRealiseVO from '../PlanningMensuelRealise/vos/PlanningMensuelRealiseVO';
import AdpVO from './vos/AdpVO';
import ModulePlanningMensuelRealise from '../PlanningMensuelRealise/ModulePlanningMensuelRealise';
import ModuleStoreContractController from '../StoreContractController/ModuleStoreContractController';
import ModuleStoreEmployeeController from '../StoreEmployeeController/ModuleStoreEmployeeController';
import ModuleGestionDesHorairesBoutique from '../GestionDesHorairesBoutique/ModuleGestionDesHorairesBoutique';
import GestionDesHorairesBoutiqueVO from '../GestionDesHorairesBoutique/vos/GestionDesHorairesBoutiqueVO';
import StoreContractVO from '../StoreContractController/vos/StoreContractVO';
import ModuleTasksTypesController from '../TasksTypesController/ModuleTasksTypesController';
import AdpHistoricVO from './vos/AdpHistoricVO';

export default class ModuleAdp extends Module {

    public static getInstance(): ModuleAdp {
        if (!ModuleAdp.instance) {
            ModuleAdp.instance = new ModuleAdp();
        }
        return ModuleAdp.instance;
    }

    private static instance: ModuleAdp = null;

    private employees: StoreEmployeeVO[] = null;
    private realises: PlanningMensuelRealiseVO[] = null;
    private params: AdpVO = null;

    private constructor() {

        super("adp", "ADP");
        this.initialize();
    }

    /// #if false
    public async hook_module_configure(db) { return true; }
    public async hook_module_install(db) { return true; }
    /// #endif

    public async hook_module_on_params_changed(paramChanged: Array<ModuleParamChange<any>>) { }
    public async hook_module_async_client_admin_initialization() { }

    // Création des lignes pour ADP
    public create_ligne_adp(date, booking_code, employee_number, new_booking) {
        let self = this;
        if (self.params) {
            let record_type = (new_booking) ? "13" : "S3";

            return self.params["location"] + record_type + self.params["terminal_identifier"] + "  " +
                self.params["id_card_number"] + date.format("YYMMDDHHmmss") +
                booking_code + ";" + self.params["client"] + ";" + self.params["accounting_unit"] + ";" + employee_number;
        }

        return "";
    }

    // Création du fichier ADP à exporter
    public async create_file_adp(content, params: AdpVO): Promise<boolean> {
        let datas = await ModuleAjaxCache.getInstance().post("/api/adp/export",
            [],
            JSON.stringify({
                content: content,
                params: params
            }));
        if (datas && datas['success']) {
            await ModuleAjaxCache.getInstance().save([{
                id: undefined,
                _type: "module_adp_historique",
                date: moment().format("YYYY-MM-DD"),
                url: document.location.origin + datas['filename']
            } as any], null);
        }

        return datas['success'];
    }

    // Fonction d'export vers ADP
    public async export_to_adp(date_debut, date_fin, new_booking = true, stores): Promise<string> {
        let file_content = [];
        let promises = [];
        let self = this;
        let message = false;

        // On récupère les params
        let params_adp: AdpVO[] = await ModuleAjaxCache.getInstance().get('/ref/api/module_adp', ['module_adp']) as AdpVO[];
        self.params = (params_adp && params_adp.length > 0) ? params_adp[0] : null;

        for (let index = 0; index < stores.length; index++) {
            const storeId = stores[index];

            let realises_boutique: PlanningMensuelRealiseVO[] = await ModulePlanningMensuelRealise.getInstance().getPlanningMensuelRealise(storeId, moment(date_debut), moment(date_fin));

            let contracts: StoreContractVO[] = await ModuleStoreContractController.getInstance().getStoreContracts(storeId, moment(date_debut), moment(date_fin));
            let employees: StoreEmployeeVO[] = await ModuleStoreEmployeeController.getInstance().getStoreEmployees(storeId, moment(date_debut), moment(date_fin));
            let horaires_boutique: GestionDesHorairesBoutiqueVO[] = await ModuleGestionDesHorairesBoutique.getInstance().get_promise_for_horaires_from_store_id(storeId);

            let horaires_boutique_by_isoday: { [isoDay: string]: { heure_debut: number, heure_fin: number } } = null;

            if (horaires_boutique) {
                horaires_boutique_by_isoday = {};

                for (let i in horaires_boutique) {
                    horaires_boutique_by_isoday[horaires_boutique[i].jour_de_la_semaine] = {
                        heure_debut: parseInt(horaires_boutique[i].heure_debut),
                        heure_fin: parseInt(horaires_boutique[i].heure_fin)
                    };
                }
            }

            for (let index = 0; index < realises_boutique.length; index++) {
                const realise: PlanningMensuelRealiseVO = realises_boutique[index];
                let task_type = ModuleTasksTypesController.getInstance().tts_by_id[realise.task_type_id];

                // On vérifit que la tâche est à exporter, sinon on passe à la prochaine
                if (ModuleTasksTypesController.getInstance().getTTIdsOfTTGName('NOT_EXPORT_IN_ADP').indexOf(realise.task_type_id) >= 0) {
                    continue;
                }

                let employee: StoreEmployeeVO = employees.filter((employee_tmp) => {
                    return employee_tmp.id == realise.employee_id;
                })[0];

                if (employee) {
                    let contract = ModuleStoreContractController.getInstance().getContractsForEmployeeId(realise.employee_id, contracts, moment(date_debut), moment(date_fin));

                    if (contract) {
                        let get_heures_planifiees_jour: number = ModulePlanningMensuel.getInstance().get_heures_planifiees_jour(contract[0], moment(realise.date + " " + realise.start_time), moment(realise.date + " " + realise.end_time), realise.task_type_id, realise.employee_id);

                        if (get_heures_planifiees_jour > 0) {
                            let realise_start_time: string = realise.start_time.toString();

                            let horaire: { heure_debut: number, heure_fin: number } = null;
                            if (horaires_boutique_by_isoday) {
                                horaire = horaires_boutique_by_isoday[moment(realise.date).isoWeekday().toString()];
                            }

                            if (horaire && (parseInt(realise_start_time.substr(0, 2)) < horaire.heure_debut) && task_type && task_type.daily) {
                                let horaire_heure_debut: string = (horaire.heure_debut < 10) ? ("0" + horaire.heure_debut) : horaire.heure_debut.toString();
                                realise_start_time = horaire_heure_debut + realise_start_time.substr(2);
                            }

                            // Création de la ligne de début
                            let start = ModulePlanningMensuel.getInstance().getFormattedTacheTimeMoment(realise, realise_start_time);
                            file_content.push(self.create_ligne_adp(start, "01", employee.employee_number, new_booking));

                            // Création de la ligne de fin
                            let end = moment(realise.date + " " + start.add(get_heures_planifiees_jour, 'h').format("HH:mm:ss"));
                            file_content.push(self.create_ligne_adp(end, "00", employee.employee_number, new_booking));

                            if (realise.start_pause && realise.end_pause) {
                                // Création de la ligne de début
                                let start_pause = ModulePlanningMensuel.getInstance().getFormattedTacheTimeMoment(realise, realise.start_pause);
                                file_content.push(self.create_ligne_adp(start_pause, "10", employee.employee_number, new_booking));

                                // Création de la ligne de fin
                                let end_pause = ModulePlanningMensuel.getInstance().getFormattedTacheTimeMoment(realise, realise.end_pause);
                                file_content.push(self.create_ligne_adp(end_pause, "11", employee.employee_number, new_booking));
                            }
                        }
                    }
                }
            }
        }

        if (file_content && file_content.length > 0) {
            message = await self.create_file_adp(file_content, self.params);
        }

        return (message) ? "success" : "error";
    }

    protected initialize() {
        this.fields = [];
        this.datatables = [];

        // Création de la table adp
        let datatable_fields = [
            new ModuleTableField('url', 'text', 'URL', true),
            new ModuleTableField('port', 'text', 'Port', true),
            new ModuleTableField('login', 'text', 'Login', true),
            new ModuleTableField('passphrase', 'text', 'Mot de passe', true),
            new ModuleTableField('private_key', 'text', 'URL de la clé privé', true),
            new ModuleTableField('rep_dist', 'text', 'Répertoire distant', true),
            new ModuleTableField('location', 'text', 'Location', true),
            new ModuleTableField('terminal_identifier', 'text', 'terminal_identifier', true),
            new ModuleTableField('id_card_number', 'text', 'id_card_number', true),
            new ModuleTableField('client', 'text', 'client', true),
            new ModuleTableField('accounting_unit', 'text', 'accounting_unit', true),
        ];

        let datatable = new ModuleTable(this, AdpVO.API_TYPE_ID, AdpVO.forceNumeric, AdpVO.forceNumerics, datatable_fields);

        this.datatables.push(datatable);

        // Création de la table adp_historique
        datatable_fields = [
            new ModuleTableField('date', 'date', 'Date export', true),
            new ModuleTableField('url', 'text', 'URL du fichier', true),
        ];

        let datatable2 = new ModuleTable(this, AdpHistoricVO.API_TYPE_ID, AdpHistoricVO.forceNumeric, AdpHistoricVO.forceNumerics, datatable_fields, "historique");

        this.datatables.push(datatable2);
    }
}