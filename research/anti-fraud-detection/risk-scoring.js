/**
 * 对话风险评分引擎
 * 实时评估社群对话的风险等级，用于反诈检测研究
 */

const RISK_WEIGHTS = {
    financial_claim: 30,      // 收益承诺
    urgency: 15,              // 紧迫感施压
    authority: 20,            // 权威背书
    transfer_request: 35,     // 资金转移要求
    evasion_language: 25,     // 规避性语言
    anti_fraud_bypass: 40,    // 反诈规避话术
    social_proof: 10,         // 虚假社会证明
};

class RiskScoringEngine {
    constructor() {
        this.scoreHistory = [];
    }
    
    scoreMessage(message) {
        const factors = this.detectRiskFactors(message);
        const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
        const normalizedScore = Math.min(totalScore, 100);
        
        const result = {
            score: normalizedScore,
            level: this.getRiskLevel(normalizedScore),
            factors: factors,
            timestamp: new Date().toISOString(),
            action: this.getRecommendedAction(normalizedScore)
        };
        
        this.scoreHistory.push(result);
        return result;
    }
    
    detectRiskFactors(text) {
        const factors = [];
        
        if (/保本|稳赚|零风险|包赚/.test(text)) {
            factors.push({ type: 'financial_claim', score: RISK_WEIGHTS.financial_claim, description: '检测到收益承诺' });
        }
        if (/最后|马上|赶紧|仅剩|截止/.test(text)) {
            factors.push({ type: 'urgency', score: RISK_WEIGHTS.urgency, description: '检测到紧迫感施压' });
        }
        if (/转账|汇款|入金|服务费|保证金/.test(text)) {
            factors.push({ type: 'transfer_request', score: RISK_WEIGHTS.transfer_request, description: '检测到资金转移要求' });
        }
        if (/zi金|收米|板了|配售/.test(text)) {
            factors.push({ type: 'evasion_language', score: RISK_WEIGHTS.evasion_language, description: '检测到规避性暗语' });
        }
        
        return factors;
    }
    
    getRiskLevel(score) {
        if (score >= 80) return 'CRITICAL';
        if (score >= 60) return 'HIGH';
        if (score >= 30) return 'MEDIUM';
        return 'LOW';
    }
    
    getRecommendedAction(score) {
        if (score >= 80) return 'BLOCK_AND_ALERT';
        if (score >= 60) return 'WARN_AND_REVIEW';
        if (score >= 30) return 'FLAG_FOR_REVIEW';
        return 'ALLOW';
    }
    
    getSessionRiskScore() {
        if (this.scoreHistory.length === 0) return 0;
        const recent = this.scoreHistory.slice(-10);
        return Math.round(recent.reduce((s, r) => s + r.score, 0) / recent.length);
    }
}

module.exports = new RiskScoringEngine();
