// Entry point of the DAZN Sponsor URL Compliance Validator

import { validateUrl } from './validator';

export const runValidator = (url: string) => {
    const result = validateUrl(url);
    console.log(result);
};

// Execute the validator with a sample URL
runValidator('https://example.dazn.com');