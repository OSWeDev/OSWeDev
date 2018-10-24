import IDistantVOBase from '../../IDistantVOBase';

export default interface IPlanTarget extends IDistantVOBase {
    name: string;
    enseigne_id: number;

    // Composants d'adresse
    address: string;
    cp: string;
    city: string;
    country: string;

    // Composants d'infos sur le contact en établissement
    contact_firstname: string;
    contact_lastname: string;
    contact_mail: string;
    contact_mobile: string;
    contact_infos: string;

    // Composants d'infos sur le contact en établissement
    infos_horaires: string;
}