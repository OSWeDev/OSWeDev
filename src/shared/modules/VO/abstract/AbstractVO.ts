/**
 * AbstractVO
 *  - Abstract class for all VO's
 */
export abstract class AbstractVO {

    /**
     * Hydrate from the given properties
     *
     * @param {Partial<T>} props
     * @returns {T}
     */
    public from<T>(props: Partial<T>): this {

        Object.assign(this, props);

        return this;
    }
}
