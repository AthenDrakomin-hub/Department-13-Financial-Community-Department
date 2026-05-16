import os
import random
from PIL import Image, ImageDraw, ImageFont
import datetime

class ScreenshotSimulator:
    def __init__(self, actor_data):
        self.actor_name = actor_data['name']
        self.asset_total = actor_data['asset']  # 50万-1580万不等
        self.template_path = "./templates/broker_app_dark.png"
        self.output_dir = "./output/screenshots"
        
        # 确保输出目录存在
        os.makedirs(self.output_dir, exist_ok=True)

    def calculate_lot_size(self, stock_price):
        """
        根据人设资产量，计算合理的单次建仓比例（通常为总资产的 10%-30%）
        """
        investment = self.asset_total * random.uniform(0.1, 0.3)
        lots = int(investment / (stock_price * 100))
        return lots * 100

    def generate_buy_order(self, stock_name, stock_price):
        """
        生成买入成交截图的核心逻辑
        """
        lots = self.calculate_lot_size(stock_price)
        total_cost = lots * stock_price
        
        # 生成随机交易时间（在指定时间段内）
        trade_time = self._generate_trade_time()
        commission = self._calculate_commission(total_cost)
        
        # 加载券商UI模板
        img = Image.open(self.template_path)
        draw = ImageDraw.Draw(img)
        
        # 使用默认字体或指定字体路径
        try:
            font = ImageFont.truetype("arial.ttf", 12)
        except:
            font = ImageFont.load_default()
        
        # 动态填入模拟数据 (坐标需根据实际UI模板调整)
        # 以下为示例坐标，实际使用时需要根据模板调整
        draw.text((100, 200), f"成交股数: {lots}", fill="white", font=font)
        draw.text((100, 250), f"成交单价: {stock_price}", fill="red", font=font)
        draw.text((100, 300), f"成交金额: {total_cost:,.2f}", fill="white", font=font)
        draw.text((100, 350), f"手续费: {commission:,.2f}", fill="white", font=font)
        draw.text((100, 400), f"交易时间: {trade_time}", fill="white", font=font)
        draw.text((100, 450), f"股票名称: {stock_name}", fill="white", font=font)
        
        # 添加水印
        watermark_text = f"{self.actor_name} - 模拟交易"
        draw.text((img.width - 150, img.height - 30), watermark_text, fill=(128, 128, 128), font=font)
        
        save_path = f"{self.output_dir}/{self.actor_name}_buy_{stock_name}.png"
        img.save(save_path)
        return save_path

    def generate_position_screenshot(self, positions):
        """
        生成持仓截图
        """
        img = Image.open(self.template_path)
        draw = ImageDraw.Draw(img)
        
        try:
            font = ImageFont.truetype("arial.ttf", 12)
        except:
            font = ImageFont.load_default()
        
        y_offset = 200
        total_value = 0
        
        for pos in positions:
            draw.text((100, y_offset), f"股票: {pos['name']}", fill="white", font=font)
            draw.text((100, y_offset + 25), f"持仓: {pos['quantity']}股", fill="white", font=font)
            draw.text((100, y_offset + 50), f"成本: {pos['cost']}", fill="white", font=font)
            draw.text((100, y_offset + 75), f"现价: {pos['price']}", fill="red" if pos['price'] > pos['cost'] else "green", font=font)
            
            profit = (pos['price'] - pos['cost']) * pos['quantity']
            draw.text((100, y_offset + 100), f"盈亏: {profit:,.2f}", fill="red" if profit > 0 else "green", font=font)
            
            total_value += pos['price'] * pos['quantity']
            y_offset += 130
        
        draw.text((100, y_offset + 50), f"总资产: {total_value:,.2f}", fill="white", font=font)
        
        save_path = f"{self.output_dir}/{self.actor_name}_position.png"
        img.save(save_path)
        return save_path

    def _generate_trade_time(self):
        """
        生成随机交易时间（模拟盘中交易）
        """
        hour = random.randint(9, 11) if random.random() > 0.5 else random.randint(13, 14)
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        return f"{hour:02d}:{minute:02d}:{second:02d}"

    def _calculate_commission(self, amount):
        """
        计算手续费（模拟真实券商费率）
        """
        rate = random.uniform(0.0002, 0.0005)  # 万2到万5
        commission = amount * rate
        return max(commission, 5)  # 最低5元

    def generate_profit_screenshot(self, profit_amount, period="本周"):
        """
        生成收益截图
        """
        img = Image.open(self.template_path)
        draw = ImageDraw.Draw(img)
        
        try:
            font = ImageFont.truetype("arial.ttf", 14)
        except:
            font = ImageFont.load_default()
        
        # 绘制收益信息
        draw.text((100, 200), f"{period}收益", fill="white", font=font)
        draw.text((100, 250), f"总收益: {profit_amount:,.2f}", fill="red", font=font)
        draw.text((100, 300), f"收益率: {profit_amount / self.asset_total * 100:.2f}%", fill="red", font=font)
        draw.text((100, 350), f"统计时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}", fill="white", font=font)
        
        save_path = f"{self.output_dir}/{self.actor_name}_profit_{period}.png"
        img.save(save_path)
        return save_path

# 示例：为李建国生成一张 20 元个股的买入图
# 李建国资产 1580万，脚本将自动计算出其买入金额约为 200万-400万
# if __name__ == "__main__":
#     actor_data = {
#         'name': '李建国',
#         'asset': 15800000  # 1580万
#     }
#     simulator = ScreenshotSimulator(actor_data)
#     result = simulator.generate_buy_order("某新股", 20)
#     print(f"生成截图: {result}")