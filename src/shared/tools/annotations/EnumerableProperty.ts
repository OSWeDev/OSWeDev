export default function EnumerableProperty(enumerable: boolean) {
    return (target: object, key: string): any => {
        let val;
        return {
            set: function (value) {
                val = value;
            },
            get: function () {
                return val;
            },
            enumerable
        };
    };
}