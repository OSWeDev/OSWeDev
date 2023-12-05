export default interface IDBDisconnectionHanbler {

    db_is_disconnected: boolean;

    db_is_disconnected_since: number;

    mark_as_disconnected();
    wait_for_reconnection(): Promise<void>;
}