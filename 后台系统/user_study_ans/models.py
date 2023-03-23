from django.db import models


# Create your models here.
class Record(models.Model):
    # 基本信息
    name = models.CharField(max_length=20)  # 姓名
    sex = models.CharField(max_length=4)  # 性别
    major = models.CharField(max_length=20)  # 专业
    telephone = models.CharField(max_length=11)  # 联系电话
    lastUpdateTime = models.DateTimeField(auto_now=True) # 上一次更新时间

    # 问题回答记录
    # Task_S1 增强语义图元视觉编码
    # Task_S1-others
    # S1 case1 回答，找出图中某种类型节点有多少个
    S1_others_T1_ans = models.CharField(max_length=20, blank=True, null=True)
    S1_others_T1_time = models.CharField(max_length=20, blank=True, null=True)  # S1 case1 用时
    S1_others_T2_ans = models.CharField(max_length=20, blank=True, null=True)  # S1 case2 回答
    S1_others_T2_time = models.CharField(max_length=20, blank=True, null=True)  # S1 case2 用时
    S1_others_T3_ans = models.CharField(max_length=20, blank=True, null=True)  # S1 case3 回答
    S1_others_T3_time = models.CharField(max_length=20, blank=True, null=True)  # S1 case3 用时
    S1_others_indicator_readability = models.IntegerField(blank=True, null=True)  # S1 评价指标 易读性
    S1_others_indicator_learnability = models.IntegerField(blank=True, null=True)  # S1 评价指标 易学性
    S1_others_indicator_beauty = models.IntegerField(blank=True, null=True)  # S1 评价指标 美观性
    S1_others_indicator_satisfaction = models.IntegerField(blank=True, null=True)  # S1 评价指标 满意度
    # Task_S1-ours
    S1_ours_T1_ans = models.CharField(max_length=20, blank=True, null=True)
    S1_ours_T1_time = models.CharField(max_length=20, blank=True, null=True)
    S1_ours_T2_ans = models.CharField(max_length=20, blank=True, null=True)
    S1_ours_T2_time = models.CharField(max_length=20, blank=True, null=True)
    S1_ours_T3_ans = models.CharField(max_length=20, blank=True, null=True)
    S1_ours_T3_time = models.CharField(max_length=20, blank=True, null=True)
    S1_ours_indicator_readability = models.IntegerField(blank=True, null=True)
    S1_ours_indicator_learnability = models.IntegerField(blank=True, null=True)
    S1_ours_indicator_beauty = models.IntegerField(blank=True, null=True)
    S1_ours_indicator_satisfaction = models.IntegerField(blank=True, null=True)

    # Task_S2 高聚合点边视觉抽象化简
    # Task_S2-others
    # S2 case1 回答，找出图中第二大连通子图内数据表的数目
    S2_others_T1_ans = models.CharField(max_length=20, blank=True, null=True)
    S2_others_T1_time = models.CharField(max_length=20, blank=True, null=True)
    S2_others_T2_ans = models.CharField(max_length=20, blank=True, null=True)
    S2_others_T2_time = models.CharField(max_length=20, blank=True, null=True)
    S2_others_T3_ans = models.CharField(max_length=20, blank=True, null=True)
    S2_others_T3_time = models.CharField(max_length=20, blank=True, null=True)
    S2_others_indicator_readability = models.IntegerField(blank=True, null=True)
    S2_others_indicator_learnability = models.IntegerField(blank=True, null=True)
    S2_others_indicator_beauty = models.IntegerField(blank=True, null=True)
    S2_others_indicator_satisfaction = models.IntegerField(blank=True, null=True)
    # Task_S2-ours
    S2_ours_T1_ans = models.CharField(max_length=20, blank=True, null=True)
    S2_ours_T1_time = models.CharField(max_length=20, blank=True, null=True)
    S2_ours_T2_ans = models.CharField(max_length=20, blank=True, null=True)
    S2_ours_T2_time = models.CharField(max_length=20, blank=True, null=True)
    S2_ours_T3_ans = models.CharField(max_length=20, blank=True, null=True)
    S2_ours_T3_time = models.CharField(max_length=20, blank=True, null=True)
    S2_ours_indicator_readability = models.IntegerField(blank=True, null=True)
    S2_ours_indicator_learnability = models.IntegerField(blank=True, null=True)
    S2_ours_indicator_beauty = models.IntegerField(blank=True, null=True)
    S2_ours_indicator_satisfaction = models.IntegerField(blank=True, null=True)

    # Task_S3 图骨干计算与分层布局
    # Task_S3-others
    # S3 case1 回答，找出图中连通图数量
    S3_others_T1_ans = models.CharField(max_length=20, blank=True, null=True)
    S3_others_T1_time = models.CharField(max_length=20, blank=True, null=True)
    S3_others_T2_ans = models.CharField(max_length=20, blank=True, null=True)
    S3_others_T2_time = models.CharField(max_length=20, blank=True, null=True)
    S3_others_T3_ans = models.CharField(max_length=20, blank=True, null=True)
    S3_others_T3_time = models.CharField(max_length=20, blank=True, null=True)
    S3_others_indicator_readability = models.IntegerField(blank=True, null=True)
    S3_others_indicator_learnability = models.IntegerField(blank=True, null=True)
    S3_others_indicator_beauty = models.IntegerField(blank=True, null=True)
    S3_others_indicator_satisfaction = models.IntegerField(blank=True, null=True)
    # Task_S3-ours
    S3_ours_T1_ans = models.CharField(max_length=20, blank=True, null=True)
    S3_ours_T1_time = models.CharField(max_length=20, blank=True, null=True)
    S3_ours_T2_ans = models.CharField(max_length=20, blank=True, null=True)
    S3_ours_T2_time = models.CharField(max_length=20, blank=True, null=True)
    S3_ours_T3_ans = models.CharField(max_length=20, blank=True, null=True)
    S3_ours_T3_time = models.CharField(max_length=20, blank=True, null=True)
    S3_ours_indicator_readability = models.IntegerField(blank=True, null=True)
    S3_ours_indicator_learnability = models.IntegerField(blank=True, null=True)
    S3_ours_indicator_beauty = models.IntegerField(blank=True, null=True)
    S3_ours_indicator_satisfaction = models.IntegerField(blank=True, null=True)

    # Task_S4 主结构保持的增量布局
    # Task_S4-others
    # S4 case1 让用户进行增量操作，手指出哪些是新增结构那些是原有结构，人工统计结果正确百分率，比如 6/12=50%表示进行了12次增量，其中6次回答正确
    S4_others_T1_ans = models.CharField(max_length=20, blank=True, null=True)
    S4_others_T1_time = models.CharField(max_length=20, blank=True, null=True)
    S4_others_T2_ans = models.CharField(max_length=20, blank=True, null=True)
    S4_others_T2_time = models.CharField(max_length=20, blank=True, null=True)
    S4_others_T3_ans = models.CharField(max_length=20, blank=True, null=True)
    S4_others_T3_time = models.CharField(max_length=20, blank=True, null=True)
    S4_others_indicator_readability = models.IntegerField(blank=True, null=True)
    S4_others_indicator_learnability = models.IntegerField(blank=True, null=True)
    S4_others_indicator_beauty = models.IntegerField(blank=True, null=True)
    S4_others_indicator_satisfaction = models.IntegerField(blank=True, null=True)
    # Task_S4-ours
    S4_ours_T1_ans = models.CharField(max_length=20, blank=True, null=True)
    S4_ours_T1_time = models.CharField(max_length=20, blank=True, null=True)
    S4_ours_T2_ans = models.CharField(max_length=20, blank=True, null=True)
    S4_ours_T2_time = models.CharField(max_length=20, blank=True, null=True)
    S4_ours_T3_ans = models.CharField(max_length=20, blank=True, null=True)
    S4_ours_T3_time = models.CharField(max_length=20, blank=True, null=True)
    S4_ours_indicator_readability = models.IntegerField(blank=True, null=True)
    S4_ours_indicator_learnability = models.IntegerField(blank=True, null=True)
    S4_ours_indicator_beauty = models.IntegerField(blank=True, null=True)
    S4_ours_indicator_satisfaction = models.IntegerField(blank=True, null=True)

    # Task_S5 图混合布局
    # Task_S5-others
    # S5 case1 让用户进行全局和子图布局切换操作，人工统计切换正确的百分率
    S5_others_T1_ans = models.CharField(max_length=20, blank=True, null=True)
    S5_others_T1_time = models.CharField(max_length=20, blank=True, null=True)
    S5_others_T2_ans = models.CharField(max_length=20, blank=True, null=True)
    S5_others_T2_time = models.CharField(max_length=20, blank=True, null=True)
    S5_others_T3_ans = models.CharField(max_length=20, blank=True, null=True)
    S5_others_T3_time = models.CharField(max_length=20, blank=True, null=True)
    S5_others_indicator_readability = models.IntegerField(blank=True, null=True)
    S5_others_indicator_learnability = models.IntegerField(blank=True, null=True)
    S5_others_indicator_beauty = models.IntegerField(blank=True, null=True)
    S5_others_indicator_satisfaction = models.IntegerField(blank=True, null=True)
    # Task_S5-ours
    S5_ours_T1_ans = models.CharField(max_length=20, blank=True, null=True)
    S5_ours_T1_time = models.CharField(max_length=20, blank=True, null=True)
    S5_ours_T2_ans = models.CharField(max_length=20, blank=True, null=True)
    S5_ours_T2_time = models.CharField(max_length=20, blank=True, null=True)
    S5_ours_T3_ans = models.CharField(max_length=20, blank=True, null=True)
    S5_ours_T3_time = models.CharField(max_length=20, blank=True, null=True)
    S5_ours_indicator_readability = models.IntegerField(blank=True, null=True)
    S5_ours_indicator_learnability = models.IntegerField(blank=True, null=True)
    S5_ours_indicator_beauty = models.IntegerField(blank=True, null=True)
    S5_ours_indicator_satisfaction = models.IntegerField(blank=True, null=True)

    # Task_S6 基本图交互分析技术
    # Task_S6-ours
    # S6 case1 让用户体验基本交互操作
    S6_ours_indicator_readability = models.IntegerField(blank=True, null=True)
    S6_ours_indicator_learnability = models.IntegerField(blank=True, null=True)
    S6_ours_indicator_beauty = models.IntegerField(blank=True, null=True)
    S6_ours_indicator_satisfaction = models.IntegerField(blank=True, null=True)

    # Task_S7 智能化图交互分析导航
    # Task_S7-others
    # S7 case1 让用户通过节点选择和扩展，找到目标节点，找到ans为True，否则为False，限制180s
    S7_others_T1_ans = models.CharField(max_length=20, blank=True, null=True)
    S7_others_T1_time = models.CharField(max_length=20, blank=True, null=True)
    S7_others_T2_ans = models.CharField(max_length=20, blank=True, null=True)
    S7_others_T2_time = models.CharField(max_length=20, blank=True, null=True)
    S7_others_T3_ans = models.CharField(max_length=20, blank=True, null=True)
    S7_others_T3_time = models.CharField(max_length=20, blank=True, null=True)
    S7_others_indicator_readability = models.IntegerField(blank=True, null=True)
    S7_others_indicator_learnability = models.IntegerField(blank=True, null=True)
    S7_others_indicator_beauty = models.IntegerField(blank=True, null=True)
    S7_others_indicator_satisfaction = models.IntegerField(blank=True, null=True)
    # Task_S7-ours
    S7_ours_T1_ans = models.CharField(max_length=20, blank=True, null=True)
    S7_ours_T1_time = models.CharField(max_length=20, blank=True, null=True)
    S7_ours_T2_ans = models.CharField(max_length=20, blank=True, null=True)
    S7_ours_T2_time = models.CharField(max_length=20, blank=True, null=True)
    S7_ours_T3_ans = models.CharField(max_length=20, blank=True, null=True)
    S7_ours_T3_time = models.CharField(max_length=20, blank=True, null=True)
    S7_ours_indicator_readability = models.IntegerField(blank=True, null=True)
    S7_ours_indicator_learnability = models.IntegerField(blank=True, null=True)
    S7_ours_indicator_beauty = models.IntegerField(blank=True, null=True)
    S7_ours_indicator_satisfaction = models.IntegerField(blank=True, null=True)

    # Task_S8-1 基于关系链路的图计算
    # Task_S8-1-others
    # S8-1 case1 让用户逐一点击直至串联一条路径，ans为路径长度
    S8_1_others_T1_ans = models.CharField(max_length=20, blank=True, null=True)
    S8_1_others_T1_time = models.CharField(max_length=20, blank=True, null=True)
    S8_1_others_T2_ans = models.CharField(max_length=20, blank=True, null=True)
    S8_1_others_T2_time = models.CharField(max_length=20, blank=True, null=True)
    S8_1_others_T3_ans = models.CharField(max_length=20, blank=True, null=True)
    S8_1_others_T3_time = models.CharField(max_length=20, blank=True, null=True)
    # Task_S8-1-ours
    S8_1_ours_indicator_readability = models.IntegerField(blank=True, null=True)
    S8_1_ours_indicator_learnability = models.IntegerField(blank=True, null=True)
    S8_1_ours_indicator_beauty = models.IntegerField(blank=True, null=True)
    S8_1_ours_indicator_satisfaction = models.IntegerField(blank=True, null=True)

    # Task_S8-2 基于社群的图计算
    # Task_S8-2-others
    # S8-2 case1 让用户手指出社群数目，人工统计指对的社群数目
    S8_2_others_T1_ans = models.CharField(max_length=20, blank=True, null=True)
    S8_2_others_T1_time = models.CharField(max_length=20, blank=True, null=True)
    S8_2_others_T2_ans = models.CharField(max_length=20, blank=True, null=True)
    S8_2_others_T2_time = models.CharField(max_length=20, blank=True, null=True)
    S8_2_others_T3_ans = models.CharField(max_length=20, blank=True, null=True)
    S8_2_others_T3_time = models.CharField(max_length=20, blank=True, null=True)
    # Task_S8-1-ours
    S8_2_ours_indicator_readability = models.IntegerField(blank=True, null=True)
    S8_2_ours_indicator_learnability = models.IntegerField(blank=True, null=True)
    S8_2_ours_indicator_beauty = models.IntegerField(blank=True, null=True)
    S8_2_ours_indicator_satisfaction = models.IntegerField(blank=True, null=True)

    # Task_S8-3 基于中心性的图计算
    # Task_S8-3-others
    # S8-3 case1 告诉用户有多少个中心性节点，让用户点击，后台计算其中对的数目
    S8_3_others_T1_ans = models.CharField(max_length=20, blank=True, null=True)
    S8_3_others_T1_time = models.CharField(max_length=20, blank=True, null=True)
    S8_3_others_T2_ans = models.CharField(max_length=20, blank=True, null=True)
    S8_3_others_T2_time = models.CharField(max_length=20, blank=True, null=True)
    S8_3_others_T3_ans = models.CharField(max_length=20, blank=True, null=True)
    S8_3_others_T3_time = models.CharField(max_length=20, blank=True, null=True)
    # Task_S8-1-ours
    S8_3_ours_indicator_readability = models.IntegerField(blank=True, null=True)
    S8_3_ours_indicator_learnability = models.IntegerField(blank=True, null=True)
    S8_3_ours_indicator_beauty = models.IntegerField(blank=True, null=True)
    S8_3_ours_indicator_satisfaction = models.IntegerField(blank=True, null=True)

    # Task_S9 原型系统
    # Task_S9-others
    S9_others_indicator_readability = models.IntegerField(blank=True, null=True)
    S9_others_indicator_learnability = models.IntegerField(blank=True, null=True)
    S9_others_indicator_beauty = models.IntegerField(blank=True, null=True)
    S9_others_indicator_satisfaction = models.IntegerField(blank=True, null=True)
    # Task_S9-ours
    S9_ours_indicator_readability = models.IntegerField(blank=True, null=True)
    S9_ours_indicator_learnability = models.IntegerField(blank=True, null=True)
    S9_ours_indicator_beauty = models.IntegerField(blank=True, null=True)
    S9_ours_indicator_satisfaction = models.IntegerField(blank=True, null=True)
