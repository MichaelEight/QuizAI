from ..services.api_requests_BO import get_dev_prompt

print(get_dev_prompt(2, 2, True, True))
print()
print(get_dev_prompt(2, 2, True, False))
print()
print(get_dev_prompt(2, 2, False, True))
print()
print(get_dev_prompt(0, 2, False, True))
print()
print(get_dev_prompt(2, 0, False, True))
print()