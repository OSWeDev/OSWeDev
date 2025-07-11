import Vue from "vue";

const watchersMetadata = new WeakMap<Vue, Array<{ path: string, handler: () => any, deep?: boolean, immediate?: boolean }>>();

export function SafeWatch(path_: string, options?: { deep?: boolean; immediate?: boolean }) {
    return function (target: Vue, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!watchersMetadata.has(target)) {
            watchersMetadata.set(target, []);
        }

        watchersMetadata.get(target)!.push({
            path: path_,
            handler: descriptor.value,
            deep: options?.deep,
            immediate: options?.immediate
        });

        if ((target as any).has_initialized_watchers_creation) {
            return;
        }

        (target as any).has_initialized_watchers_creation = true;

        // Typage explicite de la méthode created sur le prototype du composant
        const originalCreated = (target as any).created;

        (target as any).created = function (this: Vue, ...args: any[]) {
            if (originalCreated) originalCreated.apply(this, args);

            const watchers = watchersMetadata.get(target) || [];
            watchers.forEach(({ path, handler, deep, immediate }) => {
                this.$watch(path, handler.bind(this), { deep, immediate });
            });
        };
    };
}
