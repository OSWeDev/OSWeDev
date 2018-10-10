import IDistantVOBase from '../../IDistantVOBase';

export default interface IPlanFacilitator extends IDistantVOBase {
    firstname: string;
    lastname: string;
    manager_id: number;
}