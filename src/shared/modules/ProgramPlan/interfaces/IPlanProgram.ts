import IDistantVOBase from '../../IDistantVOBase';

export default interface IPlanProgram extends IDistantVOBase {
    name: string;
    start_date: string;
    end_date: string;
}