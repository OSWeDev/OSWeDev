import PerfMonController from '../PerfMonController';

export default function PerfMonFunction(target, name, desc) {
    var method = desc.value;
    desc.value = function () {

        let UID: string = PerfMonController.getInstance().startPerfMon(name);
        let res = method.apply(this, arguments);

        if ((!!res) && (!!res.then) && (!!res.catch)) {

            // si on est asynchrone, on veut attendre le vrai résultat
            return new Promise((resolve, reject) => {
                Promise.resolve(res).then(function (value) {
                    PerfMonController.getInstance().endPerfMon(UID);
                    resolve(value);
                },
                    (value) => {
                        reject(value);
                    });
            });
        } else {
            PerfMonController.getInstance().endPerfMon(UID);
            return res;
        }
    };
}