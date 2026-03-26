// src/reporting/text-report.ts

interface ComplianceReport {
    categories: string[];
    score: number;
    recommendations: string[];
}

function generateTextComplianceReport(report: ComplianceReport): string {
    const formattedCategories = report.categories.join(', ');
    const formattedRecommendations = report.recommendations.join('\n');

    return `Compliance Report\n================\n\nCategories: ${formattedCategories}\nScore: ${report.score}\nRecommendations:\n${formattedRecommendations}`;
}

// Example usage
const exampleReport: ComplianceReport = {
    categories: ['Security', 'Performance', 'Compliance'],
    score: 85,
    recommendations: ['Increase security training.', 'Optimize database queries.', 'Conduct annual compliance audits.']
};

console.log(generateTextComplianceReport(exampleReport));