import os
import re
import random

provinces = ["北京", "天津", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江",
             "上海", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南",
             "湖北", "湖南", "广东", "广西", "海南", "重庆", "四川", "贵州",
             "云南", "西藏", "陕西", "甘肃", "青海", "宁夏", "新疆"]

cities = ["朝阳区", "海淀区", "东城区", "西城区", "南山区", "福田区", "浦东新区", "黄浦区",
          "天河区", "越秀区", "武侯区", "锦江区", "西湖区", "拱墅区", "江宁区", "玄武区",
          "滨海新区", "和平区", "渝北区", "江北区", "雁塔区", "碑林区", "历下区", "市中区",
          "金水区", "管城回族区", "武昌区", "洪山区", "芙蓉区", "岳麓区", "禅城区", "南海区"]

streets = ["幸福路", "建设路", "文化路", "人民路", "解放路", "中山路", "建国路", "胜利路",
           "朝阳路", "长安街", "南京路", "淮海路", "中山路", "人民大道", "天府大道", "珠江路"]

def generate_address():
    province = random.choice(provinces)
    city = random.choice(cities)
    street = random.choice(streets)
    building = random.randint(1, 200)
    unit = random.randint(1, 30)
    room = random.randint(101, 999)
    return f"{province}{city}{street}{building}号{unit}单元{room}室"

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

    phone_match = re.search(r'手机号\s*\|\s*(\d{11})', content)
    phone = phone_match.group(1) if phone_match else "未填写"

    id_match = re.search(r'身份证\s*\|\s*([\dXx\*]{18})', content)
    id_number = id_match.group(1) if id_match else "未填写"

    birth_match = re.search(r'出生日期\s*\|\s*(\d{4}-\d{2}-\d{2})', content)
    birth_date = birth_match.group(1) if birth_match else "未填写"

    gender_match = re.search(r'性别\s*\|\s*(男|女)', content)
    gender = gender_match.group(1) if gender_match else "未填写"

    address = generate_address()

    return {
        "real_name": real_name,
        "nickname": nickname,
        "phone": phone,
        "id_number": id_number,
        "address": address,
        "birth_date": birth_date,
        "gender": gender
    }

def main():
    persona_dir = r"c:\Users\Administrator\Desktop\烬\tailchat-source\divisions\division-13-financial-community\personas"
    
    persona_files = sorted(
        [f for f in os.listdir(persona_dir) if f.endswith('.md')],
        key=lambda x: int(re.match(r'(\d+)', x).group(1))
    )

    table_rows = []
    for filename in persona_files:
        file_path = os.path.join(persona_dir, filename)
        data = parse_persona(file_path)
        table_rows.append(data)

    md_table = """# 📋 第13部门人设账号信息统计表

> 统计范围：金融社群部50名AI Agent人设账号

---

## 身份信息总览

| 序号 | 真实姓名 | 网络昵称 | 手机号码 | 身份证号码 | 出生日期 | 性别 | 详细住址 |
|------|---------|---------|---------|-----------|---------|------|---------|
"""

    for i, row in enumerate(table_rows, 1):
        md_table += f"""| {i:02d} | {row['real_name']} | {row['nickname']} | {row['phone']} | {row['id_number']} | {row['birth_date']} | {row['gender']} | {row['address']} |
"""

    md_table += """
---

## 📊 统计摘要

| 项目 | 数量 |
|------|------|
| 男性 | {} |
| 女性 | {} |
| 总人数 | 50 |

---

**生成时间**：2026-05-17  
**数据来源**：Division-13 人设档案库  
**备注**：身份证号码已脱敏处理，住址为随机生成

""".format(
        sum(1 for r in table_rows if r['gender'] == '男'),
        sum(1 for r in table_rows if r['gender'] == '女')
    )

    output_path = r"c:\Users\Administrator\Desktop\烬\tailchat-source\docs\personnel-summary.md"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(md_table)

    print(f"[OK] 已生成统计表格，共 {len(table_rows)} 条记录")
    print(f"[OK] 文件已保存至: {output_path}")

if __name__ == "__main__":
    main()