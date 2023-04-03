

/**
 * IExportFrequency
 *  - Definition of export frequency
 */
export interface IExportFrequency {
    every: number;  // 1; 3; e.g. every 1 day; every 3 months
    granularity: 'day' | 'month' | 'year';
    day_in_month?: number;  // day in the month e.g. every 3 months at day 15
}