import PerfMonController from '../PerfMonController';

export default function PerfMonFunction(target, name, desc) {
    var method = desc.value;
    desc.value = function () {

        let UID: string = PerfMonController.getInstance().startPerfMon(name);
        let res = method.apply(this, arguments);
        // si on est asynchrone, on veut attendre le vrai résultat
        Promise.resolve(res).then(function () {
            PerfMonController.getInstance().endPerfMon(UID);
        });
    };
}