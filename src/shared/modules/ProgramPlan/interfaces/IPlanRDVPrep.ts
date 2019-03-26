import IDistantVOBase from '../../IDistantVOBase';

export default interface IPlanRDVPrep extends IDistantVOBase {
    rdv_id: number;
    author_id: number;
    cr_file_id: number;
}