/**
 * AbstractVO
 *  - Abstract class for all VO's
 */
export abstract class AbstractVO<T> {

    /**
     * Hydrate from the given properties
     *
     * @param {Partial<T>} props
     * @returns {T}
     */
    public from(props: Partial<T>): this {

        Object.assign(this, props);

        return this;
    }
}
