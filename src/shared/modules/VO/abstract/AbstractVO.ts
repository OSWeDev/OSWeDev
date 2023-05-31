/**
 * AbstractVO
 *  - Abstract class for all VO's
 */
export default abstract class AbstractVO {

    /**
     * Hydrate this from the given properties
     *
     * @param {Partial<T>} props
     * @returns {T}
     */
    public from<T>(props: Partial<T>): this {

        Object.assign(this, props);

        return this;
    }
}
