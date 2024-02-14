export default interface IEvolizAPICredit {
    creditid: number;
    document_number: string;
    client: {
        clientid: number;
        code: string;
        name: string;
    };
    default_currency: {
        code: string;
        conversion: number;
        symbol: string;
    };
    document_currency: any;
    total: {
        rebate: {
            amount_vat_exclude: number;
            percent: number;
        };
        vat_exclude: number;
        vat: number;
        vat_include: number;
        advance: number;
        paid: number;
        net_to_pay: number;
    };
    currency_total: any;
    status_code: number;
    status: string;
    status_dates: {
        create: string;
        sent: any;
        inpayment: any;
        paid: any;
        match: any;
    };
    locked: boolean;
    lockdate: any;
    object: string;
    documentdate: string;
    duedate: string;
    execdate: string;
    term: {
        penalty: number;
        nopenalty: boolean;
        recovery_indemnity: boolean;
        discount_term: number;
        no_discount_term: boolean;
        payterm: {
            paytermid: number;
            label: string;
        };
        paytype: {
            paytypeid: number;
            label: string;
        };
    };
    comment: string;
    comment_clean: string;
    external_document_number: string;
    enabled: boolean;
    analytic: {
        id: number;
        code: string;
        label: string;
        enabled: boolean;
    };
    file: string;
    links: string;
    webdoc: string;
    template: {
        templateid: number;
        label: string;
    };
    items: [{
        itemid: number;
        reference: string;
        reference_clean: string;
        designation: string;
        designation_clean: string;
        quantity: number;
        unit: string;
        unit_price_vat_exclude: number;
        unit_price_vat_exclude_currency: any;
        vat: number;
        total: {
            rebate: any;
            vat_exclude: number;
            vat: number;
            vat_include: number;
        };
        currency_total: any;
        sale_classification: {
            id: number;
            code: number;
            label: string;
        };
    }];
}
// Generated by Copilot, using the following code as a prompt (from https://evoliz.io/documentation#section/Credit-resources (v1.24 in https://evoliz.io/changelog)):
// {
//     "creditid": 26263,
//         "document_number": "AF-20200200001",
//             "client": {
//         "clientid": 9876,
//             "code": "C00123",
//                 "name": "Triiptic"
//     },
//     "default_currency": {
//         "code": "EUR",
//             "conversion": 1,
//                 "symbol": "€"
//     },
//     "document_currency": null,
//         "total": {
//         "rebate": {
//             "amount_vat_exclude": -36,
//                 "percent": 10
//         },
//         "vat_exclude": -324,
//             "vat": -64.8,
//                 "vat_include": -388.8,
//                     "advance": 0,
//                         "paid": 388.8,
//                             "net_to_pay": 0
//     },
//     "currency_total": null,
//         "status_code": 2,
//             "status": "create",
//                 "status_dates": {
//         "create": "2019-10-10T09:26:39.000000Z",
//             "sent": null,
//                 "inpayment": null,
//                     "paid": null,
//                         "match": null
//     },
//     "locked": true,
//         "lockdate": null,
//             "object": "Abonnement Logiciel Gestion Commerciale",
//                 "documentdate": "2019-10-10",
//                     "duedate": "2019-10-25",
//                         "execdate": "2019-09-12",
//                             "term": {
//         "penalty": 3,
//             "nopenalty": false,
//                 "recovery_indemnity": false,
//                     "discount_term": 0,
//                         "no_discount_term": false,
//                             "payterm": {
//             "paytermid": 3,
//                 "label": "15 jours"
//         },
//         "paytype": {
//             "paytypeid": 3,
//                 "label": "Carte bancaire"
//         }
//     },
//     "comment": "Titulaire du compte : Hingis160 SARL<br />\nDomiciliation du compte : Boulogne<br />\nIBAN : FR7612345678901234567890123",
//         "comment_clean": "Titulaire du compte : Hingis160 SARL\nDomiciliation du compte : Boulogne\nIBAN : FR7612345678901234567890123",
//             "external_document_number": "EXT001",
//                 "enabled": true,
//                     "analytic": {
//         "id": 12345,
//             "code": "ANA3",
//                 "label": "Axe analytique 3",
//                     "enabled": false
//     },
//     "file": "https://../files/credit/26263",
//         "links": "https://../links/credit/26263",
//             "webdoc": "https://../modules/webdoc/4MDKOED5NATQJGE21886-9ccce0c003319d10d2e94af0c75977ed",
//                 "template": {
//         "templateid": 25,
//             "label": "Standard 2"
//     },
//     "items": {
//         "itemid": 12345,
//             "reference": "SPLIT",
//                 "reference_clean": "SPLIT",
//                     "designation": "Banana Split <br />\nPour une durée de 12 mois",
//                         "designation_clean": "Banana Split\nPour une durée de 12 mois",
//                             "quantity": 12,
//                                 "unit": "M",
//                                     "unit_price_vat_exclude": -30,
//                                         "unit_price_vat_exclude_currency": null,
//                                             "vat": 20,
//                                                 "total": {
//             "rebate": null,
//                 "vat_exclude": -360,
//                     "vat": 72,
//                         "vat_include": -432
//         },
//         "currency_total": null,
//             "sale_classification": {
//             "id": 45732,
//                 "code": 4,
//                     "label": "Vente de marchandise"
//         }
//     }
// }