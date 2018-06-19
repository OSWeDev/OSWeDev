import IDistantVOBase from '../../IDistantVOBase';
import IRenderOptions from './IRenderOptions';
import DataRenderingLogVO from '../vos/DataRenderingLogVO';
import TimeSegment from '../vos/TimeSegment';

export default interface IRenderDataModule {
    hook_render_managed_data_in_database(timeSegments: TimeSegment[], log: DataRenderingLogVO, options: IRenderOptions): Promise<boolean>;
    hook_configure_renderer(): Promise<void>;
}