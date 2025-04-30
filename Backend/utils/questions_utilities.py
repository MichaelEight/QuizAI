import random
import re

TRAILING_COMMA_REGEX = r',\s*([\]\}])'

def generate_single_multiple_distribution(total):
    single_amount = random.randint(0, total)
    multiple_amount = total - single_amount
    return single_amount, multiple_amount

# remove trailing commas before object/array ends to ensure valid JSON
def correct_trailing_comma(text):
    return re.sub(TRAILING_COMMA_REGEX, r'\1', text)