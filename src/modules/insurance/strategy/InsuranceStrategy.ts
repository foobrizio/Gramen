export interface InsuranceStrategy {
    getInsurance(): Promise<string>;
}