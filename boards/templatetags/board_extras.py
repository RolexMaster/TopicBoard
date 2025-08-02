from django import template

register = template.Library()


@register.filter
def get_item(dictionary, key):
    """딕셔너리에서 키로 값을 가져오는 필터"""
    return dictionary.get(key, [])


@register.filter
def priority_color(priority):
    """우선순위에 따른 색상 반환"""
    color_map = {
        'low': 'success',
        'medium': 'warning',
        'high': 'danger',
        'urgent': 'danger'
    }
    return color_map.get(priority, 'secondary')