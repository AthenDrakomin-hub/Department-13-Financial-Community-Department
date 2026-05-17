import random
import os
import re
from datetime import datetime

class IdentityGenerator:
    AREA_CODES = [
        "110000", "120000", "130000", "140000", "150000",
        "210000", "220000", "230000", "310000", "320000",
        "330000", "340000", "350000", "360000", "370000",
        "410000", "420000", "430000", "440000", "450000",
        "460000", "500000", "510000", "520000", "530000",
        "540000", "610000", "620000", "630000", "640000",
        "650000"
    ]

    PHONE_PREFIXES = [
        '130', '131', '132', '133', '134', '135', '136', '137', '138', '139',
        '150', '151', '152', '153', '155', '156', '157', '158', '159',
        '170', '176', '177', '178', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189'
    ]

    CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
    WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]

    def generate_phone(self):
        prefix = random.choice(self.PHONE_PREFIXES)
        suffix = ''.join([str(random.randint(0, 9)) for _ in range(8)])
        return prefix + suffix

    def generate_id_number(self, age, gender):
        current_year = datetime.now().year
        birth_year = current_year - age - random.randint(0, 1)
        birth_month = random.randint(1, 12)
        birth_day = random.randint(1, 28)

        province_code = random.choice(self.AREA_CODES)

        if gender == 'M':
            seq = random.randint(0, 499)
        else:
            seq = random.randint(500, 999)

        id_base = (
            province_code +
            f"{birth_year:04d}" +
            f"{birth_month:02d}" +
            f"{birth_day:02d}" +
            f"{seq:03d}"
        )

        total = sum(int(id_base[i]) * self.WEIGHTS[i] for i in range(17))
        check_code = self.CHECK_CODES[total % 11]

        return id_base + check_code

    def get_gender_from_id(self, id_number):
        gender_digit = int(id_number[16])
        return 'M' if gender_digit % 2 == 1 else 'F'

    def get_birth_date_from_id(self, id_number):
        return f"{id_number[6:10]}-{id_number[10:12]}-{id_number[12:14]}"

def get_age_from_occupation(occupation):
    match = re.search(r'(\d+)岁', occupation)
    if match:
        return int(match.group(1))
    return random.randint(30, 60)

def get_gender_from_name(name):
    female_chars = ['红', '英', '敏', '静', '丽', '芳', '华', '梅', '兰', '菊', '珍', '珠', '萍', '霞', '云', '月', '莲', '荷', '凤', '娥', '娇', '娣', '姑']
    male_chars = ['超', '杰', '磊', '刚', '强', '勇', '军', '涛', '明', '龙', '飞', '虎', '威', '浩', '宇', '博', '凯', '辉', '鹏', '程', '健', '阳', '光', '星']

    if name.endswith('姐') or name.endswith('姨') or name.endswith('妈') or name.endswith('婆'):
        return 'F'

    last_char = name[-1] if len(name) > 1 else name[0]
    if last_char in female_chars:
        return 'F'
    if last_char in male_chars:
        return 'M'

    return random.choice(['M', 'F'])

def update_persona_file(file_path, generator):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    name_match = re.search(r'^name:\s*(.+?)\s*\n', content, re.MULTILINE)
    occupation_match = re.search(r'occupation:\s*(.+?)\n', content)

    name = name_match.group(1).strip().split('(')[0].strip() if name_match else "未知"
    occupation = occupation_match.group(1).strip() if occupation_match else ""

    age = get_age_from_occupation(occupation)
    gender = get_gender_from_name(name)

    phone = generator.generate_phone()
    id_number = generator.generate_id_number(age, gender)
    gender_display = '男' if gender == 'M' else '女'
    birth_date = generator.get_birth_date_from_id(id_number)

    privacy_id = id_number[:6] + '********' + id_number[14:]

    existing_section = re.search(r'## 📱 联系方式.*?(?=\n## |\n---|\Z)', content, re.DOTALL)
    if existing_section:
        content = content[:existing_section.start()] + content[existing_section.end():]

    content = content.strip()

    new_section = f"""## 📱 联系方式
| 信息类型 | 内容 | 说明 |
|---------|------|------|
| 手机号 | {phone} | 虚拟运营商号段 |
| 身份证 | {privacy_id} | 隐私脱敏 |
| 出生日期 | {birth_date} | 根据年龄推算 |
| 性别 | {gender_display} | 根据姓名推断 |

"""

    insert_marker = '\n## 🔄 角色互动关系'
    if insert_marker in content:
        content = content.replace(insert_marker, new_section + insert_marker)
    else:
        content = content + '\n' + new_section

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"[OK] {os.path.basename(file_path):20s} | {phone} | {gender_display} | {birth_date}")

def main():
    persona_dir = r"c:\Users\Administrator\Desktop\烬\tailchat-source\divisions\division-13-financial-community\personas"

    generator = IdentityGenerator()

    persona_files = sorted(
        [f for f in os.listdir(persona_dir) if f.endswith('.md')],
        key=lambda x: int(re.match(r'(\d+)', x).group(1))
    )

    print(f"Found {len(persona_files)} personas, generating contact info...\n")

    for filename in persona_files:
        file_path = os.path.join(persona_dir, filename)
        update_persona_file(file_path, generator)

    print(f"\nDone! Updated {len(persona_files)} personas")

if __name__ == "__main__":
    main()