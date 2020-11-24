import ICronWorker from '../../Cron/interfaces/ICronWorker';

export default interface ICronSupervisionWorker extends ICronWorker {
    work_for_invalidate(): Promise<number>;
}