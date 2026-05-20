/**
 * A/B测试框架
 * 用于对比不同Agent策略的效果差异
 */

class ABTestFramework {
    constructor() {
        this.experiments = {};
    }
    
    createExperiment(config) {
        const experiment = {
            id: config.id,
            name: config.name,
            variants: config.variants,
            metrics: config.metrics,
            startTime: new Date().toISOString(),
            results: {},
            sampleSize: 0
        };
        
        this.experiments[experiment.id] = experiment;
        return experiment;
    }
    
    assignVariant(experimentId) {
        const exp = this.experiments[experimentId];
        if (!exp) return null;
        
        const rand = Math.random();
        let cumulative = 0;
        
        for (const variant of exp.variants) {
            cumulative += variant.weight;
            if (rand <= cumulative) {
                return variant;
            }
        }
        
        return exp.variants[exp.variants.length - 1];
    }
    
    recordMetric(experimentId, variantName, metricName, value) {
        const exp = this.experiments[experimentId];
        if (!exp) return;
        
        if (!exp.results[variantName]) {
            exp.results[variantName] = {};
        }
        if (!exp.results[variantName][metricName]) {
            exp.results[variantName][metricName] = [];
        }
        
        exp.results[variantName][metricName].push(value);
        exp.sampleSize++;
    }
    
    getResults(experimentId) {
        const exp = this.experiments[experimentId];
        if (!exp) return null;
        
        const summary = {};
        for (const [variant, metrics] of Object.entries(exp.results)) {
            summary[variant] = {};
            for (const [metric, values] of Object.entries(metrics)) {
                summary[variant][metric] = {
                    mean: values.reduce((a, b) => a + b, 0) / values.length,
                    count: values.length,
                    min: Math.min(...values),
                    max: Math.max(...values)
                };
            }
        }
        
        return summary;
    }
}

module.exports = new ABTestFramework();
