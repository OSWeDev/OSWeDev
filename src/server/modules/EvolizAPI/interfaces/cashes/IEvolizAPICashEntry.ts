export default interface IEvolizAPICashEntry {
    entryid: number;
    cashid: number;
    userid: number;
    stampdate: string;
    date: string;
    sales: {
        turnover: {
            total: number;
            classifications: [{
                sale_classificationid: number;
                code: string;
                label: string;
                total: {
                    vat_exclude: number;
                    vat: number;
                    vat_include: number;
                };
                vat: number;
            }];
            payments: [{
                paymentid: number;
                userid: number;
                document: {
                    invoiceid: number;
                    creditid: number;
                    advanceid: number;
                    document_number: string;
                };
                cashentry: {
                    entryid: number;
                    date: string;
                    cash: {
                        cashid: number;
                        label: string;
                    }
                };
                paydate: string;
                stampdate: string;
                client: {
                    clientid: number;
                    code: string;
                    name: string;
                    civility: string;
                    contact: {
                        contactid: number;
                        firstname: string;
                        lastname: string;
                        email: string;
                    }
                };
                label: string;
                paytype: {
                    paytypeid: number;
                    paytype: string;
                };
                default_currency: {
                    code: string;
                    conversion: number;
                    symbol: string;
                };
                document_currency: {
                    code: string;
                    conversion: string;
                    symbol: string;
                };
                amount: number;
                currency_amount: any;
                links: string;
                comment: string;
            }];
        };
        paytypes: {
            total: number;
            entries: [{
                paytype: {
                    id: number;
                    label: string;
                };
                amount: number;
            }];
        };
    };
    purchases: {
        total: number;
        buys: [{
            buyid: number;
            userid: number;
            document_number: string;
            supplier: {
                supplierid: number;
                code: string;
                name: string;
            };
            default_currency: {
                code: string;
                conversion: number;
                symbol: string;
            };
            total: {
                vat_exclude: number;
                vat: number;
                vat_include: number;
                paid: number;
                net_to_pay: number;
            };
            status_code: number;
            status: string;
            status_dates: {
                create: string;
                prepare: string;
                voucher: string;
                inpayment: string;
                paid: string;
                match: string;
            };
            locked: any;
            lockdate: any;
            documentdate: string;
            duedate: string;
            term: {
                paytype: {
                    paytypeid: number;
                    label: string;
                };
                payterm: {
                    paytermid: number;
                    label: string;
                };
            };
            comment: string;
            label: string;
            external_document_number: string;
            enabled: boolean;
            analytic: any;
            input_mode: string;
            client: any;
            billable: boolean;
            startdate: any;
            enddate: any;
            cashentry: {
                entryid: number;
                date: string;
                cash: {
                    id: number;
                    label: string;
                }
            };
            file: string;
            links: string;
            webdoc: string;
            items: [{
                itemid: number;
                total: {
                    vat_exclude: number;
                    vat: any;
                };
                purchase_classification: {
                    id: number;
                    code: string;
                    label: string;
                };
            }];
        }];
    };
    paytypes_deposits: {
        total: number;
        entries: [{
            paytype: {
                id: number;
                label: string;
            };
            amount: number;
            with_fees: boolean;
            cost: {
                amount: number;
                vat: number;
            };
        }];
    };
    others: {
        cash_contribution: {
            amount: number;
            reason: number;
            comment: string;
        };
        cash_difference: number;
        cash_disbursement: {
            amount: number;
            affectation: {
                affectationid: number;
                code: string;
                label: string;
                account: {
                    accountid: number;
                    code: string;
                    label: string;
                };
                enabled: boolean;
            };
        };
    };
    file: string;
}
// Generated by Copilot, using the following code as a prompt (from https://evoliz.io/documentation#section/Cash-entry-resource (v1.24 in https://evoliz.io/changelog)):
// {
//     "entryid": 4545,
//         "cashid": 45,
//             "userid": null,
//                 "stampdate": "2022-01-01T09:26:39.000000Z",
//                     "date": "2022-01-01",
//                         "sales": {
//         "turnover": {
//             "total": 54.45,
//                 "classifications": [
//                     {
//                         "sale_classificationid": 25,
//                         "code": "02",
//                         "label": "Frais de Port Facturés",
//                         "total": {
//                             "vat_exclude": 360,
//                             "vat": 72,
//                             "vat_include": 432
//                         },
//                         "vat": 2.1
//                     }
//                 ],
//                     "payments": [
//                         {
//                             "paymentid": 2476128,
//                             "userid": 3780,
//                             "document": {
//                                 "invoiceid": 4013943,
//                                 "creditid": 4013943,
//                                 "advanceid": 4013943,
//                                 "document_number": "F-20190000160"
//                             },
//                             "cashentry": {
//                                 "entryid": 4545,
//                                 "date": "2022-01-01",
//                                 "cash": {
//                                     "cashid": 45,
//                                     "label": "Caisse Toulon"
//                                 }
//                             },
//                             "paydate": "2019-10-10",
//                             "stampdate": "2019-10-10T09:26:39.000000Z",
//                             "client": {
//                                 "clientid": 9876,
//                                 "code": "C00123",
//                                 "name": "Triiptic",
//                                 "civility": "M.",
//                                 "contact": {
//                                     "contactid": 45,
//                                     "firstname": "Olivier",
//                                     "lastname": "Gasquet",
//                                     "email": "contact@triiptic.fr"
//                                 }
//                             },
//                             "label": "Règlement client",
//                             "paytype": {
//                                 "paytypeid": 4,
//                                 "paytype": "Chèque"
//                             },
//                             "default_currency": {
//                                 "code": "EUR",
//                                 "conversion": 1,
//                                 "symbol": "€"
//                             },
//                             "document_currency": {
//                                 "code": "USD",
//                                 "conversion": "1,10",
//                                 "symbol": "$"
//                             },
//                             "amount": 537.71,
//                             "currency_amount": null,
//                             "links": "https://.../links/payment/2476128",
//                             "comment": "Chèque numéro 1234"
//                         }
//                     ]
//         },
//         "paytypes": {
//             "total": 54.45,
//                 "entries": [
//                     {
//                         "paytype": {
//                             "id": 1109,
//                             "label": "Espèces"
//                         },
//                         "amount": 150.25
//                     }
//                 ]
//         }
//     },
//     "purchases": {
//         "total": 54.45,
//             "buys": [
//                 {
//                     "buyid": 2361910,
//                     "userid": 3780,
//                     "document_number": "HA-20200002348",
//                     "supplier": {
//                         "supplierid": 45369,
//                         "code": "F160",
//                         "name": "Triiptic"
//                     },
//                     "default_currency": {
//                         "code": "EUR",
//                         "conversion": 1,
//                         "symbol": "€"
//                     },
//                     "total": {
//                         "vat_exclude": 324,
//                         "vat": 64.8,
//                         "vat_include": 388.8,
//                         "paid": 0,
//                         "net_to_pay": 388.8
//                     },
//                     "status_code": 2,
//                     "status": "create",
//                     "status_dates": {
//                         "create": "2019-10-15T17:45:00.000000Z",
//                         "prepare": "2019-11-17T14:25:00.000000Z",
//                         "voucher": null,
//                         "inpayment": null,
//                         "paid": null,
//                         "match": null
//                     },
//                     "locked": null,
//                     "lockdate": null,
//                     "documentdate": "2019-10-10",
//                     "duedate": "2019-10-25",
//                     "term": {
//                         "paytype": {
//                             "paytypeid": 3,
//                             "label": "Carte bancaire"
//                         },
//                         "payterm": {
//                             "paytermid": 3,
//                             "label": "15 jours"
//                         }
//                     },
//                     "comment": "",
//                     "label": "Triiptic\r\nEtudes et prestations de service",
//                     "external_document_number": "F-20190000160",
//                     "enabled": true,
//                     "analytic": null,
//                     "input_mode": "vat_exclude",
//                     "client": null,
//                     "billable": false,
//                     "startdate": null,
//                     "enddate": null,
//                     "cashentry": {
//                         "entryid": 25,
//                         "date": "22-09-2022",
//                         "cash": {
//                             "id": 75,
//                             "label": "Caisse Toulon"
//                         }
//                     },
//                     "file": "https://../files/buy/2361910",
//                     "links": "https://../links/buy/2361910",
//                     "webdoc": "https://.../modules/webdoc/9MDKOED5NATQJGE21886-9ccce0c003319d10d2e94af0c75977ed",
//                     "items": {
//                         "itemid": 3569175,
//                         "total": {
//                             "vat_exclude": 324,
//                             "vat": null
//                         },
//                         "purchase_classification": {
//                             "id": 68049,
//                             "code": "02",
//                             "label": "Etudes et prestations de service"
//                         }
//                     }
//                 }
//             ]
//     },
//     "paytypes_deposits": {
//         "total": 54.45,
//             "entries": [
//                 {
//                     "paytype": {
//                         "id": 1109,
//                         "label": "Espèces"
//                     },
//                     "amount": 150.25,
//                     "with_fees": true,
//                     "cost": {
//                         "amount": 10.5,
//                         "vat": 1.5
//                     }
//                 }
//             ]
//     },
//     "others": {
//         "cash_contribution": {
//             "amount": 25.33,
//                 "reason": 1,
//                     "comment": "string"
//         },
//         "cash_difference": 20,
//             "cash_disbursement": {
//             "amount": 25.33,
//                 "affectation": {
//                 "affectationid": 0,
//                     "code": "string",
//                         "label": "string",
//                             "account": {
//                     "accountid": 45,
//                         "code": "6061",
//                             "label": "Fournitures non stockables"
//                 },
//                 "enabled": true
//             }
//         }
//     },
//     "file": "https://.../files/cash-deposit/2476128"
// }