import { View, EventObjectInput, OptionsInput } from 'fullcalendar';
import IPlanRDV from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanTarget from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import ICustomCRReadComponent from './interfaces/ICustomCRReadComponent';
import ICustomCRUpdateComponent from './interfaces/ICustomCRUpdateComponent';
import ICustomCRCreateComponent from './interfaces/ICustomCRCreateComponent';






// TODO FIXME les filtrages suivant le role du user // On va filtrer en fonction du rôle
// if (this.user.admin || this.user.super_admin || this.user.admin_central) {
//     this.user_role = this.role_admin;
//     // Aucun filtrage
// } else {
//     // On cherche un manager en premier lieu
//     this.user_manager_obj = null;
//     this.user_animateur_obj = null;

//     for (let i in this.managers) {
//         let manager = this.managers[i];

//         if (manager.user_id == this.user.id) {
//             this.user_role = this.role_manager;
//             this.user_manager_obj = manager;

//             break;
//         }
//     }

//     if (this.user_manager_obj) {
//         // Filtrage en fonction du manager

//         // Managers
//         this.managers = [this.user_manager_obj];

//         // Animateurs
//         let filtered_animateurs = [];
//         for (let i in this.facilitators) {
//             let animateur = this.facilitators[i];

//             if (animateur.manager_id == this.user_manager_obj.id) {
//                 filtered_animateurs.push(animateur);
//             }
//         }
//         this.facilitators = filtered_animateurs;

//         this.updateFilteredDatas();
//     } else {

//         // On cherche un animateur
//         for (let i in this.facilitators) {
//             let animateur = this.facilitators[i];

//             if (animateur.user_id == this.user.id) {
//                 this.user_role = this.role_animateur;
//                 this.user_animateur_obj = animateur;

//                 break;
//             }
//         }

//         if (this.user_animateur_obj) {
//             // Filtrage en fonction de l'animateur

//             if (!this.user_animateur_obj.region_id) {
//                 // Filtrage par le manager et affichage que de l'animateur
//                 this.facilitators = [this.user_animateur_obj];

//                 for (let i in this.managers) {
//                     let manager = this.managers[i];

//                     if (manager.id == this.user_animateur_obj.manager_id) {
//                         this.managers = [manager];
//                         break;
//                     }
//                 }
//             } else {

//                 // Filtrage par région et visu sur les plannings des commerciaux de la région

//                 // Le premier est celui connecté pour plus de clarté
//                 let new_animateurs = [this.user_animateur_obj];

//                 for (let i in this.facilitators) {
//                     if ((this.facilitators[i].region_id == this.user_animateur_obj.region_id) && (this.facilitators[i].id != this.user_animateur_obj.id)) {
//                         new_animateurs.push(this.facilitators[i]);
//                     }
//                 }
//                 this.facilitators = new_animateurs;
//             }

//             this.updateFilteredDatas();
//         } else {
//             // Ni admin, ni animateur, ni manager...

//             // Réinitialiser les datas
//             this.enseignes = [];
//             this.managers = [];
//             this.etablissements = [];
//             this.boutiques_animees_mois = [];
//             this.facilitators = [];
//             this.rdvs = [];
//             this.animation_crs = [];

//             // this.stopLoading();
//             return;
//         }
//     }
// }



export default abstract class ProgramPlanControllerBase {

    public static getInstance() {
        return ProgramPlanControllerBase.instance;
    }

    private static instance: ProgramPlanControllerBase = null;

    protected constructor(
        public customCRCreateComponent,
        public customCRReadComponent,
        public customCRUpdateComponent,
    ) {
        ProgramPlanControllerBase.instance = this;
    }

    public getResourceName(first_name, name) {
        return name + ' ' + first_name.substring(0, 1) + '.';
    }

    /**
     * Permet de rajouter/surcharger des paramètres de l'évènement fullcalendar avant ajout au calendrier
     * @param event Evènement en cours de configuration pour ajout sur fullcalendar. Contient déjà :{
     *       id: rdv.id,
     *       etablissement_id: etablissement.id,
     *       resourceId: facilitator.id,
     *       start: rdv.start_time,
     *       end: rdv.end_time,
     *       title: etablissement.name,
     *       state: rdv.state
     *   }
     */
    public populateCalendarEvent(event: EventObjectInput) {
    }

    /**
     * 
     * @param event droppable item infos
     * @param elt jquery elt
     */
    public populateDroppableItem(event: EventObjectInput, elt) {
    }

    /**
     * Renvoie une instance de RDV
     */
    public abstract getRDVNewInstance(): IPlanRDV;

    public getAddressHTMLFromTarget(target: IPlanTarget): string {
        let res: string;

        if ((!target) || (!target.address)) {
            return null;
        }

        res = target.address + (target.cp ? '<br>' + target.cp : '') + (target.city ? '<br>' + target.city : '') + (target.country ? '<br>' + target.country : '');
        return res;
    }

    public getContactInfosHTMLFromTarget(target: IPlanTarget): string {
        let res: string;

        if ((!target) || ((!target.contact_infos) && (!target.contact_firstname) && (!target.contact_lastname) && (!target.contact_mail) && (!target.contact_mobile))) {
            return null;
        }

        res = (target.contact_firstname ? target.contact_firstname : '');
        res += (target.contact_lastname ? ((res != '') ? ' ' : '') + target.contact_lastname : '');
        res += (target.contact_mobile ? ((res != '') ? '<br>' : '') + target.contact_mobile : '');
        res += (target.contact_mail ? ((res != '') ? '<br>' : '') + target.contact_mail : '');
        res += (target.contact_infos ? ((res != '') ? '<br>' : '') + target.contact_infos : '');
        return res;
    }
}