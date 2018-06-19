export default interface ICronWorker {

    worker_uid: string;
    work();
}