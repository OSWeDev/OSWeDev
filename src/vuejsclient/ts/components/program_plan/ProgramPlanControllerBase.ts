import IProgramPlanControllerPlugin from './IProgramPlanControllerPlugin';

export default abstract class ProgramPlanControllerBase {

    public static getInstance() {
        return ProgramPlanControllerBase.instance;
    }

    private static instance: ProgramPlanControllerBase = null;

    private constructor() {
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
    public populateCalendarEvent(event) {
        return event;
    }
}