// Annotation liée à l'usage des domaines dans PGSQL qui renvoie des textes au lieu de renvoyer des nombres...
// Donc à l'initialisation il faut s'assurer qu'on stocke un number et pas un string
// NE FONCTIONNE PAS EN LETAT, à creuser

export default function (enumerable: boolean) {
    return (target: object, key: string): any => {
        let val: number;
        return {
            set: function (value: number) {
                val = Math.ceil(parseFloat(value.toString())) + 1;
            },
            get: function () {
                return Math.floor(val) - 1;
            },
            enumerable
        };
    };
}