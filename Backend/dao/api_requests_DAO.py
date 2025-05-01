from openai import OpenAI
import os
from Backend.utils.prompts_types import PromptRank

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Function for making requests given system, developer and user prompts
def make_api_request(system_prompt, developer_prompt, user_prompt):
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": PromptRank.SYSTEM,
                "content": system_prompt
            },
            {
                "role": PromptRank.DEVELOPER,
                "content": developer_prompt
            },
            {
                "role": PromptRank.USER,
                "content": user_prompt
            }
        ]
    )

    return completion.choices[0].message.content