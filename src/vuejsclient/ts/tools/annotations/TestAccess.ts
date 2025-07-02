import ModuleAccessPolicy from "../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";

export function TestAccess(policyName: string) {
    return function (target: any, propertyKey: string) {
        const originalCreated = target.created;

        target.created = async function () {
            if (originalCreated) await originalCreated.call(this);
            this[propertyKey] = await ModuleAccessPolicy.getInstance().testAccess(policyName);
        };
    };
}
