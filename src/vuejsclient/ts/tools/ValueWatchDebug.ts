export default class ValueWatchDebug {

    public static breakOn(obj, propertyName, mode?, func?) {

        // this is directly from https://github.com/paulmillr/es6-shim
        function getPropertyDescriptor(obj_, name) {
            var property = Object.getOwnPropertyDescriptor(obj_, name);
            var proto = Object.getPrototypeOf(obj_);
            while (property === undefined && proto !== null) {
                property = Object.getOwnPropertyDescriptor(proto, name);
                proto = Object.getPrototypeOf(proto);
            }
            return property;
        }

        function verifyNotWritable() {
            if (mode !== 'read') {
                throw new Error("This property is not writable, so only possible mode is 'read'.");
            }
        }

        var enabled = true;
        var originalProperty = getPropertyDescriptor(obj, propertyName);
        var newProperty = { enumerable: originalProperty.enumerable };

        // write
        if (originalProperty.set) {// accessor property
            newProperty['set'] = function (val) {
                if (enabled && (!func || func && func(val))) {
                    // tslint:disable-next-line:no-debugger
                    debugger;
                }

                originalProperty.set.call(this, val);
            };
        } else if (originalProperty.writable) {// value property
            newProperty['set'] = function (val) {
                if (enabled && (!func || func && func(val))) {
                    // tslint:disable-next-line:no-debugger
                    debugger;
                }

                originalProperty.value = val;
            };
        } else {
            verifyNotWritable();
        }

        // read
        newProperty['get'] = function (val) {
            if (enabled && mode === 'read' && (!func || func && func(val))) {
                // tslint:disable-next-line:no-debugger
                debugger;
            }

            return originalProperty.get ? originalProperty.get.call(this, val) : originalProperty.value;
        };

        Object.defineProperty(obj, propertyName, newProperty);

        return {
            disable: function () {
                enabled = false;
            },

            enable: function () {
                enabled = true;
            }
        };
    }
}