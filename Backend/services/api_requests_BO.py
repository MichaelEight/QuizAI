import json
from Backend.dao.api_requests_DAO import make_api_request
from Backend.utils.questions_types import QuestionTypes
from Backend.utils.questions_utilities import generate_single_multiple_distribution, correct_trailing_comma
from Backend.services.prompts_utilities import get_sys_prompt, get_dev_prompt, get_user_prompt
from Backend.utils.prompts_types import PromptTypes

'''
Returns a JSON with questions of different types
'''
def generate_questions(text, closed_amount = 1, open_amount = 1, allow_multiple_correct_answers = False, force_multiple_correct_answers = False):
    all_questions = []

    if open_amount > 0:
        all_questions += generate_questions_per_type(text, open_amount, QuestionTypes.OPEN)
    
    if closed_amount > 0:
        if force_multiple_correct_answers:
            all_questions += generate_questions_per_type(text, closed_amount, QuestionTypes.CLOSED_MULTI)            
        elif allow_multiple_correct_answers:
            single_amount, multiple_amount = generate_single_multiple_distribution(closed_amount)
            all_questions += generate_questions_per_type(text, single_amount, QuestionTypes.CLOSED)            
            all_questions += generate_questions_per_type(text, multiple_amount, QuestionTypes.CLOSED_MULTI)            
        else:
            all_questions += generate_questions_per_type(text, closed_amount, QuestionTypes.CLOSED)            
    
    return all_questions


'''
Returns a JSON with questions of given type
'''
def generate_questions_per_type(text, amount, type):
    sys_prompt = get_sys_prompt(PromptTypes.GENERATE_QUESTIONS, args={'questions_amount': amount, 'type_of_question': type})
    user_prompt = get_user_prompt(PromptTypes.GENERATE_QUESTIONS, args={'user_text': text})

    ans = make_api_request(sys_prompt, "", user_prompt)
    ans = correct_trailing_comma(ans)

    try:
        return json.loads(ans)
    except json.JSONDecodeError:
        return {
            "status": "error",
            "content": "invalid answer format"
        }

'''
Returns a number in range 0-100 representing score.
Returns -1 in case of error
'''
def check_open_answer(text, question, answer):
    sys_prompt = get_sys_prompt(PromptTypes.CHECK_OPEN_QUESTION)
    dev_prompt = get_dev_prompt(PromptTypes.CHECK_OPEN_QUESTION, args={'text': text, 'question': question})
    user_prompt = get_user_prompt(PromptTypes.CHECK_OPEN_QUESTION, args={'answer': answer})

    ans = make_api_request(sys_prompt, dev_prompt, user_prompt)

    try:
        return int(ans)
    except ValueError:
        print("Value error in check_open_answer. The response was: ", ans)
        return -1