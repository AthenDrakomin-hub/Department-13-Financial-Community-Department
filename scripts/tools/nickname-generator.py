import os
import re
import random

class NicknameGenerator:
    # 自然元素词汇
    NATURE_WORDS = [
        # 天空相关
        '云', '风', '雨', '雪', '霜', '露', '霞', '虹', '晴', '阳', '星', '月', '晨', '暮',
        # 山水相关
        '山', '水', '溪', '河', '湖', '海', '泉', '岩', '峰', '谷', '林', '松', '竹', '梅',
        # 植物相关
        '花', '草', '叶', '木', '柳', '桃', '荷', '兰', '菊', '桂', '杏', '梨', '樱', '桐',
        # 季节相关
        '春', '夏', '秋', '冬', '暖', '凉', '润', '清', '静', '雅', '柔', '悠', '淡', '恬'
    ]
    
    # 生活场景词汇
    LIFE_WORDS = [
        '书', '茶', '墨', '香', '琴', '棋', '画', '诗', '酒', '茶', '居', '行',
        '梦', '想', '心', '情', '意', '志', '道', '德', '仁', '义', '礼', '智', '信', '和',
        '安', '宁', '康', '乐', '福', '祥', '瑞', '吉', '顺', '平', '稳', '恒', '久', '远'
    ]
    
    # 积极寓意词汇
    POSITIVE_WORDS = [
        '明', '亮', '光', '辉', '耀', '华', '荣', '盛', '兴', '旺', '昌', '隆', '富', '贵',
        '强', '健', '勇', '毅', '刚', '韧', '坚', '卓', '越', '超', '达', '通', '博', '广'
    ]
    
    # 需要排除的词汇（身份标识词）
    EXCLUDED_WORDS = ['爸', '妈', '哥', '姐', '叔', '姨', '爷', '奶', '弟', '妹']
    
    def generate_nickname(self, real_name, gender):
        """根据真实姓名和性别生成自然风格的网名"""
        # 从姓名中提取一个字作为基础
        base_char = real_name[-1] if len(real_name) > 0 else '明'
        
        # 确保基础字不在排除列表中
        if base_char in self.EXCLUDED_WORDS:
            base_char = '明'
        
        # 随机选择组合方式
        style = random.choice([1, 2, 3, 4])
        
        if style == 1:
            # 自然元素 + 姓名字
            nature = random.choice(self.NATURE_WORDS)
            nickname = f"{nature}{base_char}"
        elif style == 2:
            # 姓名字 + 生活词汇
            life = random.choice(self.LIFE_WORDS)
            nickname = f"{base_char}{life}"
        elif style == 3:
            # 自然元素 + 积极词汇
            nature = random.choice(self.NATURE_WORDS)
            positive = random.choice(self.POSITIVE_WORDS)
            nickname = f"{nature}{positive}"
        else:
            # 双自然元素组合
            n1 = random.choice(self.NATURE_WORDS)
            n2 = random.choice([w for w in self.NATURE_WORDS if w != n1])
            nickname = f"{n1}{n2}"
        
        # 检查是否包含排除词汇
        for excluded in self.EXCLUDED_WORDS:
            if excluded in nickname:
                return self.generate_nickname(real_name, gender)
        
        return nickname
    
    def generate_unique_nicknames(self, names):
        """为一组姓名生成不重复的网名"""
        used = set()
        nicknames = {}
        
        for real_name in names:
            attempts = 0
            max_attempts = 50
            while attempts < max_attempts:
                nickname = self.generate_nickname(real_name, 'M')
                if nickname not in used:
                    used.add(nickname)
                    nicknames[real_name] = nickname
                    break
                attempts += 1
        
        return nicknames

def extract_real_names(persona_dir):
    """从人设档案中提取真实姓名"""
    names = []
    for filename in os.listdir(persona_dir):
        if filename.endswith('.md'):
            file_path = os.path.join(persona_dir, filename)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                match = re.search(r'name:\s*(.+?)\s*\(', content)
                if match:
                    names.append(match.group(1).strip())
    return names

def update_persona_nickname(file_path, new_nickname):
    """更新人设档案中的网名"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 替换 name 行中的网名部分
    old_pattern = r'(name:\s*.+?\()\s*[^)]+\s*(\))'
    new_content = re.sub(old_pattern, rf'\g<1>{new_nickname}\g<2>', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"[OK] {os.path.basename(file_path):20s} -> {new_nickname}")

def main():
    persona_dir = r"c:\Users\Administrator\Desktop\烬\tailchat-source\divisions\division-13-financial-community\personas"
    
    # 提取所有真实姓名
    names = extract_real_names(persona_dir)
    print(f"Found {len(names)} personas")
    
    # 生成不重复的网名
    generator = NicknameGenerator()
    nicknames = generator.generate_unique_nicknames(names)
    
    print(f"\nGenerated {len(nicknames)} unique nicknames:\n")
    
    # 更新所有人设档案
    for filename in os.listdir(persona_dir):
        if filename.endswith('.md'):
            file_path = os.path.join(persona_dir, filename)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                match = re.search(r'name:\s*(.+?)\s*\(', content)
                if match:
                    real_name = match.group(1).strip()
                    if real_name in nicknames:
                        update_persona_nickname(file_path, nicknames[real_name])
    
    print(f"\nDone! Updated all personas with new nicknames")
    
    # 输出生成的网名对照表
    print("\n" + "="*50)
    print("网名对照表")
    print("="*50)
    for real_name, nickname in sorted(nicknames.items()):
        print(f"{real_name:10s} -> {nickname}")

if __name__ == "__main__":
    main()
