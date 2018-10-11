import IDistantVOBase from '../../IDistantVOBase';

export default interface IPlanRDVCR extends IDistantVOBase {
    rdv_id: number;
    author_id: number;
    cr_file_id: number;
}