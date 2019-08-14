export default interface IBGThread {

    name: string;

    /**
     * Returns true if needs more time
     */
    work(): Promise<boolean>;
}