// Severity Levels
export enum Severity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

// Check Status
export enum CheckStatus {
    PASS = 'pass',
    FAIL = 'fail',
    WARNING = 'warning'
}

// Check Result Interface
export interface CheckResult {
    status: CheckStatus;
    severity: Severity;
    message: string;
}

// CategoryScore Interface
export interface CategoryScore {
    category: string;
    score: number;
}

// Verdict Type
export type Verdict = 'acceptable' | 'unacceptable';

// ValidationInput Interface
export interface ValidationInput {
    url: string;
    deviceProfile?: DeviceProfile;
    networkProfile?: NetworkProfile;
}

// ComplianceReport Interface
export interface ComplianceReport {
    url: string;
    results: CheckResult[];
    overallScore: number;
}

// PartialCheck Interface
export interface PartialCheck {
    id: string;
    status: CheckStatus;
}

// HumanCheck Interface
export interface HumanCheck {
    id: string;
    approver: string;
    remarks?: string;
}

// ThirdPartyDomain Interface
export interface ThirdPartyDomain {
    domain: string;
    isTrusted: boolean;
}

// DeviceProfile Interface
export interface DeviceProfile {
    type: string;
    os: string;
    browser: string;
}

// NetworkProfile Interface
export interface NetworkProfile {
    type: string;
    speed: number;
}