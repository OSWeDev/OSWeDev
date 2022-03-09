import IPlanContact from '../../../../shared/modules/ProgramPlan/interfaces/IPlanContact';
import IPlanTarget from '../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';

export default class ProgramPlanTools {

    public static getResourceName(first_name, name) {
        return name + ' ' + first_name.substring(0, 1) + '.';
    }

    public static getAddressHTMLFromTarget(target: IPlanTarget): string {
        let res: string;

        if ((!target) || (!target.address)) {
            return null;
        }

        res = target.address + (target.cp ? '<br>' + target.cp : '') + (target.city ? '<br>' + target.city : '') + (target.country ? '<br>' + target.country : '');
        return res;
    }

    public static getContactInfosHTMLFromTarget(target_contacts: IPlanContact[]): string {
        let res: string = '';

        if ((!target_contacts) || (target_contacts.length <= 0)) {
            return null;
        }

        for (let i in target_contacts) {
            let target_contact = target_contacts[i];

            res = (target_contact.firstname ? ((res != '') ? '<br><hr>' : '') + target_contact.firstname : '');
            res += (target_contact.lastname ? ((res != '') ? ' ' : '') + target_contact.lastname : '');
            res += (target_contact.mobile ? ((res != '') ? '<br>' : '') + target_contact.mobile : '');
            res += (target_contact.mail ? ((res != '') ? '<br>' : '') + target_contact.mail : '');
            res += (target_contact.infos ? ((res != '') ? '<br>' : '') + target_contact.infos : '');
        }

        return (res == '') ? null : res;
    }

    private constructor() { }
}