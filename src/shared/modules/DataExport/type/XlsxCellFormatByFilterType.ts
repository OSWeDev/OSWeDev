
/**
 * List of all available cell formats by filter type
 */
export enum XlsxCellFormatByFilterType {
    amount = "#,##0.00",
    percent = "0.00%",
    toFixed = "#,##0.00",
    toFixedCeil = "#,##0.00",
    toFixedFloor = "#,##0.00",
    hideZero = "#,##0.00",
    boolean = "0",
    padHour = "00",
    truncate = "@",
    bignum = "#,##0.00",
    hour = "00",
    planningCheck = "0",
    alerteCheck = "0",
    tstz = "dd/mm/yyyy hh:mm:ss"
}