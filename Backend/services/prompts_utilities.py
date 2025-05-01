from Backend.utils.questions_types import Instructions
from Backend.utils.prompts_types import Prompts, PromptRank

def get_sys_prompt(type_of_prompt, args=None):
    return Prompts.get_prompt(type_of_prompt, PromptRank.SYSTEM, args)

def get_dev_prompt(type_of_prompt, args=None):
    return Prompts.get_prompt(type_of_prompt, PromptRank.DEVELOPER, args)

def get_user_prompt(type_of_prompt, args=None):
    return Prompts.get_prompt(type_of_prompt, PromptRank.USER, args)
