import os
import re
import random

def generate_bank_card():
    banks = ['中国工商银行', '中国建设银行', '中国农业银行', '中国银行', 
             '交通银行', '招商银行', '中信银行', '光大银行', 
             '浦发银行', '民生银行', '兴业银行', '平安银行']
    bank = random.choice(banks)
    card_num = random.randint(1000000000000000, 9999999999999999)
    return f"{bank} ({card_num})"

def generate_experience(occupation, gender, age):
    experiences = {
        "医生": [
            f"{gender}，从医{age-25}年，三甲医院主任医师，通过朋友介绍接触股市，稳健型投资者",
            f"{gender}，{age}岁，医学博士，工作{age-28}年，投资经验{age-35}年，注重价值投资"
        ],
        "教师": [
            f"{gender}，高级教师，教龄{age-22}年，理财观念保守，偏爱低风险产品",
            f"{gender}，{age}岁，重点中学老师，{age-22}年教龄，投资风格稳健"
        ],
        "律师": [
            f"{gender}，执业{age-25}年，擅长风险控制，投资决策理性谨慎",
            f"{gender}，{age}岁，知名律所合伙人，法律专家，投资注重合规性"
        ],
        "会计师": [
            f"{gender}，CPA持证，{age-25}年从业经验，对财务数据敏感",
            f"{gender}，{age}岁，注册会计师，擅长财务分析和风险评估"
        ],
        "快递员": [
            f"{gender}，从业{age-18}年，勤劳踏实，希望通过投资改善生活",
            f"{gender}，{age}岁，快递小哥，月入{random.randint(6000, 12000)}，想增加收入"
        ],
        "外卖骑手": [
            f"{gender}，{age}岁，外卖骑手，工作辛苦，渴望财务自由",
            f"{gender}，从业{age-18}年，时间灵活，利用碎片时间学习投资"
        ],
        "水果店主": [
            f"{gender}，个体户，经营水果摊{age-20}年，现金流管理经验丰富",
            f"{gender}，{age}岁，小老板，懂经营，善于把握市场机会"
        ],
        "健身教练": [
            f"{gender}，{age}岁，健身达人，身材管理严格，投资也追求自律",
            f"{gender}，从业{age-20}年，注重健康和财富双丰收"
        ],
        "运营专员": [
            f"{gender}，{age}岁，互联网运营，对新事物接受快，学习能力强",
            f"{gender}，工作{age-22}年，擅长数据分析，投资风格偏成长型"
        ],
        "程序员": [
            f"{gender}，{age}岁，码农，逻辑思维强，偏爱量化投资策略",
            f"{gender}，从业{age-22}年，技术控，喜欢研究投资技术指标"
        ],
        "退休干部": [
            f"{gender}，退休干部，{age}岁，政策敏感度高，注重长期投资",
            f"{gender}，从政{age-22}年，退休后专注投资理财"
        ],
        "大厨": [
            f"{gender}，星级酒店主厨，从业{age-20}年，对食材品质要求高",
            f"{gender}，{age}岁，美食家，投资也讲究'火候'"
        ],
        "全职宝妈": [
            f"{gender}，全职带娃{age-25}年，善于精打细算，注重家庭理财",
            f"{gender}，{age}岁，宝妈，时间自由，学习投资增加家庭收入"
        ],
        "个体户": [
            f"{gender}，{age}岁，自主创业，商业嗅觉敏锐",
            f"{gender}，做小生意{age-20}年，懂得把握商机"
        ],
        "设计师": [
            f"{gender}，{age}岁，创意工作者，审美独特，投资也追求独特视角",
            f"{gender}，设计行业{age-22}年，注重细节和品质"
        ]
    }
    
    for key in experiences:
        if key in occupation:
            return random.choice(experiences[key])
    return f"{gender}，{age}岁，{occupation}，投资经验丰富"

def get_zodiac(year):
    zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
    return zodiacs[(year - 1984) % 12]

def parse_persona(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    name_match = re.search(r'^name:\s*(.+?)\s*\n', content, re.MULTILINE)
    if name_match:
        full_name = name_match.group(1).strip()
        real_name = full_name.split('(')[0].strip()
        nickname = re.search(r'网名:\s*(.+?)\)', full_name)
        nickname = nickname.group(1).strip() if nickname else real_name
    else:
        real_name = "未知"
        nickname = "未知"

    occupation_match = re.search(r'occupation:\s*(.+?)\n', content)
    occupation = occupation_match.group(1).strip() if occupation_match else "未知"
    
    age_match = re.search(r'(\d+)岁', occupation)
    age = int(age_match.group(1)) if age_match else 30
    
    birth_year = 2026 - age

    phone_match = re.search(r'手机号\s*\|\s*(\d{11})', content)
    phone = phone_match.group(1) if phone_match else "未填写"

    id_match = re.search(r'身份证\s*\|\s*([\dXx\*]{18})', content)
    id_number = id_match.group(1) if id_match else "未填写"

    gender_match = re.search(r'性别\s*\|\s*(男|女)', content)
    gender = gender_match.group(1) if gender_match else "男"

    return {
        "real_name": real_name,
        "nickname": nickname,
        "occupation": occupation,
        "age": age,
        "birth_year": birth_year,
        "gender": gender,
        "phone": phone,
        "id_number": id_number
    }

def main():
    persona_dir = r"c:\Users\Administrator\Desktop\烬\tailchat-source\divisions\division-13-financial-community\personas"
    
    small_group_indices = [1, 5, 14, 2, 6, 10, 15, 35, 36, 49, 50, 25]
    
    persona_files = []
    for idx in small_group_indices:
        filename = f"{idx:02d}-*.md"
        import glob
        files = glob.glob(os.path.join(persona_dir, filename))
        if files:
            persona_files.append(files[0])

    roles = ["大神号1", "大神号2", "大神号3", 
             "中拖号1", "中拖号2", "中拖号3", "中拖号4",
             "小白号1", "小白号2", "小白号3", "小白号4", "小白号5"]

    table_rows = []
    for i, file_path in enumerate(persona_files):
        data = parse_persona(file_path)
        zodiac = get_zodiac(data['birth_year'])
        bank_card = generate_bank_card()
        experience = generate_experience(data['occupation'], data['gender'], data['age'])
        holding = random.choice(['满仓', '7成仓', '5成仓', '3成仓', '轻仓'])
        buy_type = random.choice(['打新', '追涨', '低吸', '波段', '长线'])
        duration = f"{data['age'] - random.randint(1, 5)}个月"
        
        table_rows.append({
            "role": roles[i] if i < len(roles) else f"成员{i+1}",
            "nickname": data['nickname'],
            "holding": holding,
            "buy_type": buy_type,
            "gender": data['gender'],
            "birth_info": f"{data['birth_year']}年/{zodiac}/{data['age']}岁",
            "duration": duration,
            "real_name": data['real_name'],
            "region": random.choice(['北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '武汉']),
            "occupation": data['occupation'],
            "bank_card": bank_card,
            "experience": experience
        })

    md_table = """# 📋 小群人设账号信息统计表

> 统计范围：金融社群部小群12名AI Agent人设账号

---

## 身份信息总览

| 三方/买票/通用 | 昵称 | 持仓/建仓 | 买票类型 | 性别 | 出生年份/生肖/周岁 | 操作时长 | 真实名字 | 地区 | 职业 | 银行卡 | 大致经历 |
|--------------|------|----------|----------|------|-------------------|----------|----------|------|------|--------|----------|
"""

    for row in table_rows:
        md_table += f"""| {row['role']} | {row['nickname']} | {row['holding']} | {row['buy_type']} | {row['gender']} | {row['birth_info']} | {row['duration']} | {row['real_name']} | {row['region']} | {row['occupation']} | {row['bank_card']} | {row['experience']} |
"""

    md_table += """
---

## 📊 统计摘要

| 项目 | 数量 |
|------|------|
| 大神号 | 3 |
| 中拖号 | 4 |
| 小白号 | 5 |
| 男性 | {} |
| 女性 | {} |
| 总人数 | 12 |

---

**生成时间**：2026-05-17  
**数据来源**：Division-13 人设档案库

""".format(
        sum(1 for r in table_rows if r['gender'] == '男'),
        sum(1 for r in table_rows if r['gender'] == '女')
    )

    output_path = r"c:\Users\Administrator\Desktop\烬\tailchat-source\docs\small-group-summary.md"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(md_table)

    print(f"[OK] 已生成小群统计表格，共 {len(table_rows)} 条记录")
    print(f"[OK] 文件已保存至: {output_path}")

if __name__ == "__main__":
    main()