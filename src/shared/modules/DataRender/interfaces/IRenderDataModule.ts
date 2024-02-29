import ModuleTableVO from '../../DAO/vos/ModuleTableVO';
import DataRenderingLogVO from '../vos/DataRenderingLogVO';
import TimeSegment from '../vos/TimeSegment';
import IRenderOptions from './IRenderOptions';

export default interface IRenderDataModule {
    database: ModuleTableVO;
    data_timesegment_type: number;

    hook_render_managed_data_in_database(timeSegments: TimeSegment[], log: DataRenderingLogVO, options: IRenderOptions): Promise<boolean>;
    hook_configure_renderer(): Promise<void>;
}