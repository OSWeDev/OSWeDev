import IDistantVOBase from '../../IDistantVOBase';

export default interface ICheckPoint extends IDistantVOBase {
    name: string;
    shortname: string;
    explaination: string;

    checklist_id: number;
}