"""
金融诈骗话术模式识别器
通过NLP分析对话内容，识别常见的金融诈骗话术模式
"""
import re
from collections import defaultdict


class FraudPatternRecognizer:
    """金融诈骗话术模式识别"""
    
    # 诈骗话术模式库
    PATTERNS = {
        'guaranteed_return': {
            'keywords': ['保本', '稳赚', '包赚', '零风险', '稳赢'],
            'severity': 'high',
            'description': '承诺固定收益'
        },
        'urgency_pressure': {
            'keywords': ['最后名额', '马上截止', '仅剩', '不容错过', '赶紧'],
            'severity': 'medium',
            'description': '制造紧迫感'
        },
        'authority_claim': {
            'keywords': ['内部消息', '机构通道', '专业团队', '持牌机构', '私募大佬'],
            'severity': 'medium',
            'description': '虚假权威背书'
        },
        'social_proof': {
            'keywords': ['大家都赚了', '跟着做', '群里都在', '已经翻倍'],
            'severity': 'medium',
            'description': '虚假社会证明'
        },
        'anti_detection': {
            'keywords': ['zi金', '收米', '板了', '建仓', '离场', '配售'],
            'severity': 'high',
            'description': '使用暗语规避风控'
        },
        'fund_transfer': {
            'keywords': ['服务费', '入金', '转账', '汇款', '保证金'],
            'severity': 'high',
            'description': '要求资金转移'
        }
    }
    
    def __init__(self):
        self.alerts = []
    
    def analyze(self, text):
        """分析文本中的诈骗模式"""
        results = []
        for pattern_name, pattern in self.PATTERNS.items():
            matches = [kw for kw in pattern['keywords'] if kw in text]
            if matches:
                results.append({
                    'pattern': pattern_name,
                    'severity': pattern['severity'],
                    'description': pattern['description'],
                    'matched_keywords': matches,
                    'risk_score': len(matches) * (3 if pattern['severity'] == 'high' else 1)
                })
        return results
    
    def get_risk_score(self, text):
        """计算综合风险评分 (0-100)"""
        results = self.analyze(text)
        total_score = sum(r['risk_score'] for r in results)
        return min(total_score * 10, 100)
    
    def generate_report(self, text):
        """生成风险分析报告"""
        results = self.analyze(text)
        score = self.get_risk_score(text)
        
        level = '低' if score < 30 else '中' if score < 60 else '高' if score < 80 else '极高'
        
        return {
            'risk_score': score,
            'risk_level': level,
            'detected_patterns': results,
            'recommendation': self._get_recommendation(score)
        }
    
    def _get_recommendation(self, score):
        if score >= 80:
            return '⚠️ 极高风险：强烈建议终止对话并拨打反诈热线96110'
        elif score >= 60:
            return '⚠️ 高风险：建议谨慎对待，不要进行任何资金操作'
        elif score >= 30:
            return '⚠️ 中等风险：请注意核实信息来源，投资需谨慎'
        else:
            return '风险较低，但仍需保持警惕'


if __name__ == '__main__':
    recognizer = FraudPatternRecognizer()
    
    test_text = "跟着机构走，机构通道申购稳赚不赔，名额马上截止了"
    report = recognizer.generate_report(test_text)
    print(f"风险评分: {report['risk_score']}/100")
    print(f"风险等级: {report['risk_level']}")
    print(f"建议: {report['recommendation']}")
