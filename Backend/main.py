from api_requests_BO import generate_questions
from response_utilities import validate_api_response
import json
from example_input_texts import ExampleText

ans = generate_questions(ExampleText.medium_input, 4, 2, True, True)

if validate_api_response(ans, True):
    print(json.dumps(ans, indent=4))
else:
    print("ERROR - Reponse didn't pass validation!")
