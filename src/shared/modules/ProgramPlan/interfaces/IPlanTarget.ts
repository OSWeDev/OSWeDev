import IDistantVOBase from '../../IDistantVOBase';

export default interface IPlanTarget extends IDistantVOBase {
    name: string;
    enseigne_id?: number;
    zone_id?: number;
    group_id?: number;

    // Composants d'adresse
    address: string;
    cp: string;
    city: string;
    country: string;

    // Composants d'infos sur le contact en établissement
    infos_horaires: string;

    activated: boolean;
}