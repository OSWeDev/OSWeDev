import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import { IHookFilterVos } from '../../../shared/modules/DAO/interface/IHookFilterVos';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import APIDAOParamVO from '../../../shared/modules/DAO/vos/APIDAOParamVO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../shared/modules/ModuleTable';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import BooleanHandler from '../../../shared/tools/BooleanHandler';
import ServerBase from '../../ServerBase';
import ModuleServerBase from '../ModuleServerBase';
import ModuleServiceBase from '../ModuleServiceBase';
import DAOTriggerHook from './triggers/DAOTriggerHook';

export default class ModuleDAOServer extends ModuleServerBase {

    public static DAO_ACCESS_TYPE_CREATE: string = "CREATE";
    public static DAO_ACCESS_TYPE_READ: string = "READ";
    public static DAO_ACCESS_TYPE_UPDATE: string = "UPDATE";
    public static DAO_ACCESS_TYPE_DELETE: string = "DELETE";

    public static getInstance() {
        if (!ModuleDAOServer.instance) {
            ModuleDAOServer.instance = new ModuleDAOServer();
        }
        return ModuleDAOServer.instance;
    }

    private static instance: ModuleDAOServer = null;

    get actif(): boolean {
        return ModuleDAO.getInstance().actif;
    }

    // On expose des hooks pour les modules qui veulent gérer le filtrage des vos suivant l'utilisateur connecté
    private access_hooks: { [api_type_id: string]: { [access_type: string]: IHookFilterVos<IDistantVOBase> } } = {};

    // private pre_read_trigger_hook: DAOTriggerHook;
    private pre_update_trigger_hook: DAOTriggerHook;
    private pre_create_trigger_hook: DAOTriggerHook;
    private pre_delete_trigger_hook: DAOTriggerHook;

    // private post_read_trigger_hook: DAOTriggerHook;
    private post_update_trigger_hook: DAOTriggerHook;
    private post_create_trigger_hook: DAOTriggerHook;
    private post_delete_trigger_hook: DAOTriggerHook;


    // A supprimer asap, surtout sur la version OS 
    private descriptors = {
        store_month: {
            table: "store_month",
            id: "id",
            fields: {
                store_id: "${store_id}",
                month: "${month}",
                actual_revenue: "${actual_revenue}"
            }
        },
        store_day: {
            table: "store_day",
            id: "store_day_id",
            fields: {
                store_id: "${store_id}",
                day: "${day}",
                target_revenue: "${target_revenue}",
                target_cabin_revenue: "${target_cabin_revenue}",
                actual_revenue: "${actual_revenue}",
                actual_nb_visits: "${actual_nb_visits}",
                comment: "${comment}",
                actual_cabin_revenue: "${actual_cabin_revenue}",
            }
        },
        task: {
            table: "task",
            id: "id",
            fields: {
                store_id: "${store_id}",
                employee_id: "${employee_id}",
                task_type_id: "${task_type_id}",
                period: "TSRANGE(${start}, ${stop})",
                is_normal: "${is_normal}"
            }
        },
        store_hour: {
            table: "store_hour",
            id: "id",
            fields: {
                goal_id: "${goal_id}",
                month: "${month}",
                hour_of_day: "${hour_of_day}",
                isoweekday: "${isoweekday}",
                nb_visits: "${nb_visits}"
            }
        },
        store_sales_detail: {
            table: "store_sales_detail",
            id: "id",
            fields: {
                goal_id: "${goal_id}",
                is_adjustment: "${is_adjustment}",
                avg_basket_value: "${avg_basket_value}",
                conversion_rate: "${conversion_rate}",
                avg_cabin_value: "${avg_cabin_value}",
                nb_cabin_hours_per_week: "${nb_cabin_hours_per_week}",
                nb_visits_per_salesperson: "${nb_visits_per_salesperson}",
                cabin_occupancy_rate: "${cabin_occupancy_rate}",
                conversion_rate_spontane: "${conversion_rate_spontane}"
            }
        },
        store_goal: {
            table: "store_goal",
            id: "id",
            fields: {
                store_id: "${store_id}",
                accounting_period_id: "${accounting_period_id}",
                min_hours_week_bo: "${min_hours_week_bo}",
                nb_hours_by_fte_by_week: "${nb_hours_by_fte_by_week}",
                nb_cabins: "${nb_cabins}",
                facial_treatment_goal_pct: "${facial_treatment_goal_pct}",
                sales_goal_euro: "${sales_goal_euro}",
                sales_trend_first_half_pct: "${sales_trend_first_half_pct}",
                target_costs_on_revenue_pct: "${target_costs_on_revenue_pct}",
                costs_trend_first_half_pct_as_sales_trend_pct: "${costs_trend_first_half_pct_as_sales_trend_pct}",
                reference_date: "${reference_date}",
                unit_payroll: "${unit_payroll}",
                december_target_costs_on_revenue_pct: "${december_target_costs_on_revenue_pct}",
                nb_weeks_worked_per_year: "${nb_weeks_worked_per_year}",
                december_year_revenue_pct: "${december_year_revenue_pct}",
                total_nb_visits: "${total_nb_visits}",
                sales_y_1_euro: "${sales_y_1_euro}",
                costs_on_revenue_y_1_pct: "${costs_on_revenue_y_1_pct}",
                heures_payees: "${heures_payees}",
                heures_payees_supp: "${heures_payees_supp}",
                ventes_par_etp_cible: "${ventes_par_etp_cible}",
                ventes_par_heures_travaillees_cible: "${ventes_par_heures_travaillees_cible}",
                prct_minimum_reco_heure_vente_vs_horaire: "${prct_minimum_reco_heure_vente_vs_horaire}",
            }
        },
        store_goal_historique: {
            table: "store_goal_historique",
            id: "id",
            fields: {
                date: "${date}",
                unit_payroll: "${unit_payroll}",
                goal_id: "${goal_id}",
                taux_de_transformation_cad: "${taux_de_transformation_cad}",
                panier_moyen_cad: "${panier_moyen_cad}",
                ca_cad: "${ca_cad}",
                ca_par_etp: "${ca_par_etp}",
                cabine_moyen_cad: "${cabine_moyen_cad}",
                plan_action: "${plan_action}",
                heures_payees: "${heures_payees}",
                heures_payees_supp: "${heures_payees_supp}",
                nb_visits: "${nb_visits}",
                paid_fte_for_the_month: "${paid_fte_for_the_month}",
                paid_over_hours_fte_equivalent_for_the_month: "${paid_over_hours_fte_equivalent_for_the_month}",
                paid_over_hours_fte_equivalent_year_to_date: "${paid_over_hours_fte_equivalent_year_to_date}",
                actual_cabin_revenue: "${actual_cabin_revenue}",
                sales_trend_first_half_pct: "${sales_trend_first_half_pct}",
                costs_trend_first_half_pct_as_sales_trend_pct: "${costs_trend_first_half_pct_as_sales_trend_pct}",
                conversion_rate: "${conversion_rate}",
                conversion_rate_spontane: "${conversion_rate_spontane}",
                avg_basket_value: "${avg_basket_value}",
                avg_cabin_value: "${avg_cabin_value}",
                avg_cumul_etp: "${avg_cumul_etp}",
            }
        },
        store_contract: {
            table: "store_contract",
            id: "id",
            fields: {
                employee_id: "${employee_id}",
                period: "${period}",
                position_id: "${position_id}",
                contract_type_id: "${contract_type_id}",
                min_hours_worked_per_week: "${min_hours_worked_per_week}",
                max_hours_worked_per_week: "${max_hours_worked_per_week}",
                vacation_days_per_year: "${vacation_days_per_year}",
                rotation_days_per_year: "${rotation_days_per_year}",
                work_hours_monday: "${work_hours_monday}",
                work_hours_tuesday: "${work_hours_tuesday}",
                work_hours_wednesday: "${work_hours_wednesday}",
                work_hours_thursday: "${work_hours_thursday}",
                work_hours_friday: "${work_hours_friday}",
                work_hours_saturday: "${work_hours_saturday}",
                work_hours_sunday: "${work_hours_sunday}",
                english_speaking: "${english_speaking}",
                store_exchange: "${store_exchange}",
                rotation_schedule: "${rotation_schedule}",
                flexible_schedule: "${flexible_schedule}",
                max_hours_worked_per_day: "${max_hours_worked_per_day}",
                max_pause_duration_hours: "${max_pause_duration_hours}",
                jours_de_conges: "${jours_de_conges}",
                heures_supplementaires: "${heures_supplementaires}",
                jours_travailles_semaine: "${jours_travailles_semaine}",
                nb_hours_worked_per_week: "${nb_hours_worked_per_week}",
                nb_hours_worked_per_month: "${nb_hours_worked_per_month}"
            }
        },
        store_contract_historique: {
            table: "store_contract_historique",
            id: "id",
            fields: {
                store_contract_id: "${store_contract_id}",
                date: "${date}",
                jours_de_conges: "${jours_de_conges}",
                heures_supplementaires: "${heures_supplementaires}",
                remaining_holidays: "${remaining_holidays}",
            }
        },
        // FIN FLK MDE
        // Module planning_rdv_animateurs_boutique
        module_planning_rdv_animateurs_boutique_animation_rdv: {
            table: "module_planning_rdv_animateurs_boutique_animation_rdv",
            id: "id",
            fields: {
                boutique_animee_id: "${boutique_animee_id}",
                animateur_id: "${animateur_id}",
                date_debut: "${date_debut}",
                date_fin: "${date_fin}",
                rdvpris: "${rdvpris}"
            }
        },
        module_planning_rdv_animateurs_boutique_animation_cr: {
            table: "module_planning_rdv_animateurs_boutique_animation_cr",
            id: "id",
            fields: {
                animation_rdv_id: "${animation_rdv_id}",
                user_id: "${user_id}",
                pointschiffres: "${pointschiffres}",
                objectif: "${objectif}",
                actions: "${actions}",
                plan_action: "${plan_action}",
                resultats: "${resultats}",
                divers: "${divers}"
            }
        },
        // !Module planning_rdv_animateurs_boutique
        // Module month_events
        module_month_events_events: {
            table: "module_month_events_events",
            id: "id",
            fields: {
                store_id: "${store_id}",
                task_type_id: "${task_type_id}",
                nom: "${nom}",
                nb_ressources: "${nb_ressources}",
                fixed_ressource_target_ids: "${fixed_ressource_target_ids}",
                date_debut: "${date_debut}",
                date_fin: "${date_fin}",
                recurrent_heure_debut: "${recurrent_heure_debut}",
                recurrent_heure_fin: "${recurrent_heure_fin}",
                recurrent: "${recurrent}",
                recurrent_lundi: "${recurrent_lundi}",
                recurrent_mardi: "${recurrent_mardi}",
                recurrent_mercredi: "${recurrent_mercredi}",
                recurrent_jeudi: "${recurrent_jeudi}",
                recurrent_vendredi: "${recurrent_vendredi}",
                recurrent_samedi: "${recurrent_samedi}",
                recurrent_dimanche: "${recurrent_dimanche}",
                recurrent_date_debut: "${recurrent_date_debut}",
                recurrent_date_fin: "${recurrent_date_fin}",
            }
        },
        // !Module month_events

        // MonthEventExceptionVO
        module_month_events_events_exceptions: {
            table: "module_month_events_events_exceptions",
            id: "id",
            fields: {
                store_id: "${store_id}",
                month_event_id: "${month_event_id}",
                ressource_id: "${ressource_id}",
                day: "${day}",
                deleted: "${deleted}"
            }
        },

        module_planning_mensuel: {
            table: "module_planning_mensuel",
            id: "id",
            fields: {
                store_id: "${store_id}",
                employee_id: "${employee_id}",
                date: "${date}",
                start_time: "${start_time}",
                end_time: "${end_time}",
                task_type_id: "${task_type_id}",
                month_event_id: "${month_event_id}",
                is_normal: "${is_normal}"
            }
        },
        module_planning_mensuel_realise: {
            table: "module_planning_mensuel_realise",
            id: "id",
            fields: {
                store_id: "${store_id}",
                employee_id: "${employee_id}",
                date: "${date}",
                start_time: "${start_time}",
                end_time: "${end_time}",
                task_type_id: "${task_type_id}",
                start_pause: "${start_pause}",
                end_pause: "${end_pause}",
                commentaire: "${commentaire}",
                is_normal: "${is_normal}"
            }
        },
        module_adp_historique: {
            table: "module_adp_historique",
            id: "id",
            fields: {
                date: "${date}",
                url: "${url}",
            }
        },
    };

    public async configure() {
        // this.pre_read_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_PRE_READ_TRIGGER);
        this.pre_update_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        this.pre_create_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        this.pre_delete_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_PRE_DELETE_TRIGGER);

        // this.post_read_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_POST_READ_TRIGGER);
        this.post_update_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_POST_UPDATE_TRIGGER);
        this.post_create_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_POST_CREATE_TRIGGER);
        this.post_delete_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_POST_DELETE_TRIGGER);
    }

    public registerAccessHook<T extends IDistantVOBase>(API_TYPE_ID: string, access_type: string, hook: IHookFilterVos<T>) {
        if (!this.access_hooks[API_TYPE_ID]) {
            this.access_hooks[API_TYPE_ID] = {};
        }
        this.access_hooks[API_TYPE_ID][access_type] = hook;
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_DELETE_VOS, this.deleteVOs.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_INSERT_OR_UPDATE_VOS, this.insertOrUpdateVOs.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_INSERT_OR_UPDATE_VO, this.insertOrUpdateVO.bind(this));

        //FIXME API en Post car les params ne peuvent être transmis par l'url, mais
        //  on a besoin de gérer le cache comme sur un GET. A voir dans AjaxCache si on peut
        //  faire des POST avec cache.
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VO_BY_ID, this.getVoById.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS, this.getVos.bind(this));
        // ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_SELECT_ALL, this.selectAll.bind(this));
        // ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_SELECT_ONE, this.selectOne.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_DB_TX_UPDATE, this.db_tx_update.bind(this));
    }

    private async insertOrUpdateVOs(vos: IDistantVOBase[]): Promise<any[]> {

        let results: any[] = await ModuleServiceBase.getInstance().db.tx(async (t) => {

            let queries: any[] = [];

            for (let i in vos) {
                let vo: IDistantVOBase = vos[i];

                let isUpdate: boolean = vo.id ? true : false;
                let sql: string = await this.getqueryfor_insertOrUpdateVO(vo);

                if (!sql) {
                    continue;
                }

                queries.push(t.oneOrNone(sql, vo).then(async (data) => {
                    if (isUpdate) {
                        await this.post_update_trigger_hook.trigger(vo._type, vo);
                    } else {
                        await this.post_create_trigger_hook.trigger(vo._type, vo);
                    }
                }));
            }

            return t.batch(queries);
        });

        return results;
    }

    private async insertOrUpdateVO(vo: IDistantVOBase): Promise<any> {

        let isUpdate: boolean = vo.id ? true : false;
        let sql: string = await this.getqueryfor_insertOrUpdateVO(vo);

        if (!sql) {
            return null;
        }

        return await ModuleServiceBase.getInstance().db.oneOrNone(sql, vo).then(async (data) => {
            if (isUpdate) {
                await this.post_update_trigger_hook.trigger(vo._type, vo);
            } else {
                await this.post_create_trigger_hook.trigger(vo._type, vo);
            }
        });
    }

    private async deleteVOs(vos: IDistantVOBase[]): Promise<any[]> {

        let results: any[] = await ModuleServiceBase.getInstance().db.tx(async (t) => {

            let queries: any[] = [];

            for (let i in vos) {
                let vo = vos[i];

                if (!vo._type) {
                    console.error("Un VO sans _type dans le DAO ! " + JSON.stringify(vo));
                    continue;
                }

                let datatable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];

                if (!datatable) {
                    console.error("Impossible de trouver le datatable de ce _type ! " + JSON.stringify(vo));
                    continue;
                }

                // Ajout des triggers, avant et après suppression.
                //  Attention si un des output est false avant suppression, on annule la suppression
                let res: boolean[] = await this.pre_delete_trigger_hook.trigger(vo._type, vo);
                if (!BooleanHandler.getInstance().AND(res, true)) {
                    continue;
                }

                const sql = "DELETE FROM " + datatable.full_name + " where id = ${id} RETURNING id";
                queries.push(t.oneOrNone(sql, vo).then(async (data) => {
                    await this.post_delete_trigger_hook.trigger(vo._type, vo);
                }));
            }

            return t.batch(queries);
        });

        return results;
    }

    private db_tx_update(data): Promise<any> {
        let self = this;

        return ModuleServiceBase.getInstance().db.tx(async (t) => {
            let queries: any[] = [];

            for (const i in data.deletes) {
                const delete_ = data.deletes[i];
                const d = this.descriptors[delete_._type];

                // Ajout des triggers, avant et après suppression.
                //  Attention si un des output est false avant suppression, on annule la suppression
                let res: boolean[] = await this.pre_delete_trigger_hook.trigger(delete_._type, delete_);
                if (!BooleanHandler.getInstance().AND(res, true)) {
                    continue;
                }

                const sql = "DELETE FROM ref." + d.table + " where id = ${" + d.id + "} RETURNING id";

                // console.log(sql);
                const query = t.oneOrNone(sql, delete_).then(async (data) => {
                    await this.post_delete_trigger_hook.trigger(delete_._type, delete_);
                });

                // console.log(query);

                queries.push(query);
            }

            if (typeof data.updates != "object") {
                data.updates = JSON.parse(data.updates);
            }

            for (let i in data.updates) {
                let update = data.updates[i];

                if (!update) {
                    continue;
                }

                let d = self.descriptors[update._type];

                if (!d) {
                    continue;
                }

                let update_id = update[d.id];
                let sql;
                let query;

                if (update_id) {
                    // Ajout des triggers, avant et après modification.
                    //  Attention si un des output est false avant modification, on annule la modification
                    let res: boolean[] = await this.pre_update_trigger_hook.trigger(update._type, update);
                    if (!BooleanHandler.getInstance().AND(res, true)) {
                        continue;
                    }

                    const setters = [];
                    for (const f in d.fields) {
                        setters.push(f + ' = ' + d.fields[f]);
                    }

                    sql = "UPDATE ref." + d.table + " SET " + setters.join(', ') + " WHERE id = ${" + d.id + "} RETURNING ID";
                    query = t.oneOrNone(sql, update).then(async (data) => {
                        await this.post_update_trigger_hook.trigger(update._type, update);
                    });
                } else {
                    // Ajout des triggers, avant et après modification.
                    //  Attention si un des output est false avant modification, on annule la modification
                    let res: boolean[] = await this.pre_create_trigger_hook.trigger(update._type, update);
                    if (!BooleanHandler.getInstance().AND(res, true)) {
                        continue;
                    }

                    const tableFields = [];
                    const placeHolders = [];
                    for (const f in d.fields) {
                        tableFields.push(f);
                        placeHolders.push(d.fields[f]);
                    }

                    sql = "INSERT INTO ref." + d.table + " (" + tableFields.join(', ') + ") VALUES (" + placeHolders.join(', ') + ") RETURNING id";
                    query = t.oneOrNone(sql, update).then(async (data) => {
                        await this.post_create_trigger_hook.trigger(update._type, update);
                    });
                }

                query.catch((error) => {
                    console.error(error);
                });
                // console.log(sql);
                // console.log(update);

                queries.push(query);
            }

            return t.batch(queries); // settles all queries;
        })
            .then((results) => {

                const ids = results.map((r) => {
                    return r.id;
                });
                const n = (data.deletes || []).length;
                const deletes_ids = ids.slice(0, n);
                const updates_ids = ids.slice(n);
                const j = {
                    msg: "saved",
                    updates_ids,
                    deletes_ids
                };
                // console.log(j); // printing successful transaction output;
                return j;
            });
    }

    private async getqueryfor_insertOrUpdateVO(vo: IDistantVOBase): Promise<string> {

        if (!vo._type) {
            console.error("Un VO sans _type dans le DAO ! " + JSON.stringify(vo));
            return null;
        }

        let datatable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];

        if (!datatable) {
            console.error("Impossible de trouver le datatable de ce _type ! " + JSON.stringify(vo));
            return null;
        }

        let sql: string = null;

        if (vo.id) {

            // Ajout des triggers, avant et après modification.
            //  Attention si un des output est false avant modification, on annule la modification
            let res: boolean[] = await this.pre_update_trigger_hook.trigger(vo._type, vo);
            if (!BooleanHandler.getInstance().AND(res, true)) {
                return null;
            }

            const setters = [];
            for (const f in datatable.fields) {

                if (typeof vo[datatable.fields[f].field_id] == "undefined") {
                    continue;
                }

                setters.push(datatable.fields[f].field_id + ' = ${' + datatable.fields[f].field_id + '}');
            }

            sql = "UPDATE " + datatable.full_name + " SET " + setters.join(', ') + " WHERE id = ${id} RETURNING ID";

        } else {

            // Ajout des triggers, avant et après modification.
            //  Attention si un des output est false avant modification, on annule la modification
            let res: boolean[] = await this.pre_create_trigger_hook.trigger(vo._type, vo);
            if (!BooleanHandler.getInstance().AND(res, true)) {
                return null;
            }

            const tableFields = [];
            const placeHolders = [];
            for (const f in datatable.fields) {
                if (typeof vo[datatable.fields[f].field_id] == "undefined") {
                    continue;
                }

                tableFields.push(datatable.fields[f].field_id);
                placeHolders.push('${' + datatable.fields[f].field_id + '}');
            }

            sql = "INSERT INTO " + datatable.full_name + " (" + tableFields.join(', ') + ") VALUES (" + placeHolders.join(', ') + ") RETURNING id";
        }

        return sql;
    }


    public async selectAll<T extends IDistantVOBase>(API_TYPE_ID: string, query: string = null, queryParams: any[] = null, depends_on_api_type_ids: string[] = null): Promise<T[]> {
        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let res: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + datatable.full_name + " t " + (query ? query : ''), queryParams ? queryParams : []) as T[]);

        // On filtre les res suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ, res);
    }


    // private async selectAll<T extends IDistantVOBase>(apiDAOParamVOs: APIDAOParamVOs<T>): Promise<T[]> {
    //     let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[apiDAOParamVOs.API_TYPE_ID];

    //     // On vérifie qu'on peut faire un select
    //     if (!await this.checkAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ)) {
    //         return null;
    //     }

    //     let res: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + datatable.full_name + " t " + (apiDAOParamVOs.query ? apiDAOParamVOs.query : ''), apiDAOParamVOs.queryParams ? apiDAOParamVOs.queryParams : []) as T[]);

    //     // On filtre les res suivant les droits d'accès
    //     return await this.filterVOsAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ, res);
    // }

    private async checkAccess<T extends IDistantVOBase>(datatable: ModuleTable<T>, access_type: string): Promise<boolean> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return true;
        }

        // Si on lit les droits, on peut tout lire
        if ((datatable.full_name == ModuleAccessPolicy.getInstance().accesspolicy_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().rolepolicies_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().role_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().userroles_datatable.full_name)) {
            return true;
        }

        // On applique les accès au global sur le droit de faire un SELECT
        return await ModuleAccessPolicy.getInstance().checkAccess(ModuleDAO.ACCESS_GROUP_NAME, ModuleDAO.ACCESS_GROUP_NAME + '.' + access_type + "." + datatable.full_name);
    }

    private async filterVOsAccess<T extends IDistantVOBase>(datatable: ModuleTable<T>, access_type: string, vos: T[]): Promise<T[]> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return vos;
        }

        // Si on lit les droits, on peut tout lire
        if ((datatable.full_name == ModuleAccessPolicy.getInstance().accesspolicy_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().rolepolicies_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().role_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().userroles_datatable.full_name)) {
            return vos;
        }

        // On regarde si il existe un acces pour ce VO
        // Par défaut pas de filtrage
        if (await ModuleAccessPolicy.getInstance().isAdmin()) {
            return vos;
        }

        // Suivant le type de contenu et le type d'accès, on peut avoir un hook enregistré sur le ModuleDAO pour filtrer les vos
        let hook = this.access_hooks[datatable.vo_type] && this.access_hooks[datatable.vo_type][access_type] ? this.access_hooks[datatable.vo_type][access_type] : null;
        if (hook) {
            let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
            let uid: number = httpContext ? httpContext.get('UID') : null;
            let user_data = httpContext ? httpContext.get('USER_DATA') : null;
            return await hook(datatable, vos, uid, user_data) as T[];
        }

        return vos;
    }

    private async filterVOAccess<T extends IDistantVOBase>(datatable: ModuleTable<T>, access_type: string, vo: T): Promise<T> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return vo;
        }

        // Si on lit les droits, on peut tout lire
        if ((datatable.full_name == ModuleAccessPolicy.getInstance().accesspolicy_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().rolepolicies_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().role_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().userroles_datatable.full_name)) {
            return vo;
        }

        // On regarde si il existe un acces pour ce VO
        // Par défaut pas de filtrage

        // Suivant le type de contenu et le type d'accès, on peut avoir un hook enregistré sur le ModuleDAO pour filtrer les vos
        let hook = this.access_hooks[datatable.vo_type] && this.access_hooks[datatable.vo_type][access_type] ? this.access_hooks[datatable.vo_type][access_type] : null;
        if (hook) {
            let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
            let uid: number = httpContext ? httpContext.get('UID') : null;
            let user_data = httpContext ? httpContext.get('USER_DATA') : null;
            let filtered: T[] = await hook(datatable, [vo], uid, user_data) as T[];

            if (filtered && (filtered.length == 1)) {
                return vo;
            }
        }

        return vo;
    }

    // private async selectOne<T extends IDistantVOBase>(apiDAOParamVO: APIDAOParamVO<T>): Promise<T> {
    //     let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[apiDAOParamVO.API_TYPE_ID];

    //     // On vérifie qu'on peut faire un select
    //     if (!await this.checkAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ)) {
    //         return null;
    //     }

    //     let vo: T = datatable.forceNumeric(await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t " + (apiDAOParamVO.query ? apiDAOParamVO.query : '') + ";", apiDAOParamVO.queryParams ? apiDAOParamVO.queryParams : []) as T);

    //     // On filtre suivant les droits d'accès
    //     return await this.filterVOAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ, vo);
    // }

    public async selectOne<T extends IDistantVOBase>(API_TYPE_ID: string, query: string = null, queryParams: any[] = null, depends_on_api_type_ids: string[] = null): Promise<T> {
        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let vo: T = datatable.forceNumeric(await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t " + (query ? query : '') + ";", queryParams ? queryParams : []) as T);

        // On filtre suivant les droits d'accès
        return await this.filterVOAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ, vo);
    }

    private async getVoById<T extends IDistantVOBase>(apiDAOParamVO: APIDAOParamVO): Promise<T> {

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[apiDAOParamVO.API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let vo: T = datatable.forceNumeric(await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t WHERE id=" + apiDAOParamVO.id + ";") as T);

        // On filtre suivant les droits d'accès
        return await this.filterVOAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ, vo);
    }

    private async getVos<T extends IDistantVOBase>(API_TYPE_ID: StringParamVO): Promise<T[]> {

        // On filtre les res suivant les droits d'accès
        // return await this.selectAll(apiDAOParamVOs);
        return await this.selectAll<T>(API_TYPE_ID.text);
    }
}