import IDistantVOBase from '../../IDistantVOBase';
import IRenderOptions from './IRenderOptions';
import DataRenderingLogVO from '../vos/DataRenderingLogVO';
import TimeSegment from '../vos/TimeSegment';
import ModuleTableVO from '../../DAO/vos/ModuleTableVO';
import IRenderedData from './IRenderedData';

export default interface IRenderDataModule {
    database: ModuleTableVO<IDistantVOBase & IRenderedData>;
    data_timesegment_type: number;

    hook_render_managed_data_in_database(timeSegments: TimeSegment[], log: DataRenderingLogVO, options: IRenderOptions): Promise<boolean>;
    hook_configure_renderer(): Promise<void>;
}