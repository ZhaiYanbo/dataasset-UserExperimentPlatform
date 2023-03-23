from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
import json
# Create your views here.

from .models import Record


@require_POST
def register_user(request):
    """
    用户注册
    :param request:
    :return:
    """
    # 获取用户信息
    data = json.loads(request.body.decode('utf-8'))
    name = data.get('name')
    sex = data.get('sex')
    major = data.get('major')
    telephone = data.get('major')

    # 查询信息
    record = Record.objects.filter(name=name).first()
    if (not record):
        # 不存在则创建新的
        record = Record(name=name, sex=sex, major=major, telephone=telephone)
    else:
        # 否则直接更新
        record.sex = sex
        record.major = major
        record.telephone = telephone

    record.save()
    return JsonResponse({'res': 'success', 'code': 200}, safe=False)


@require_POST
def submit_ans(request):
    """
    提交问题回答
    :param request:
    :return:
    """
    # 获取题目信息以及答案
    name, ans = read_answer(request)

    # 更新记录的值
    record = Record.objects.filter(name=name).first()
    for key, value in ans.items():
        setattr(record, key, value)
    record.save()

    return JsonResponse({'res': 'success', 'code': 200}, safe=False)


def read_answer(request):
    """
    根据题目信息获取相关的回答记录
    :param request:
    :return:
    """
    # 读取前端传递的数据
    data = json.loads(request.body.decode('utf-8'))
    name = data.get('name')  # 用户名称
    ans_obj = data.get('ansObj')
    parseAns = {}  # 解析后的数据库键值对
    for key, value in ans_obj.items():
        parseAns[key] = value

    return name, parseAns


def view_record(request):
    """
    预览所有记录数据
    :param request:
    :return:
    """
    record = list(Record.objects.all().values())
    return JsonResponse(record, safe=False)
