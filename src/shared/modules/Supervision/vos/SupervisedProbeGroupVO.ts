import NumRange from '../../DataRender/vos/NumRange';
import TSRange from '../../DataRender/vos/TSRange';
import IDistantVOBase from '../../IDistantVOBase';

export default class SupervisedProbeGroupVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "supervision_probe_group";

    public id: number;
    public _type: string = SupervisedProbeGroupVO.API_TYPE_ID;

    public name: string;
    public probe_id_ranges: NumRange[];
    public ts_ranges: TSRange[];

    public static createNew(
        name: string,
        probe_id_ranges: NumRange[],
        ts_ranges: TSRange[],
    ): SupervisedProbeGroupVO {
        const res: SupervisedProbeGroupVO = new SupervisedProbeGroupVO();

        res.name = name;
        res.probe_id_ranges = probe_id_ranges;
        res.ts_ranges = ts_ranges;

        return res;
    }
}