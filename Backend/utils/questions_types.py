class QuestionTypes:
    CLOSED = 'closed'
    OPEN = 'open'
    CLOSED_MULTI = 'closed-multi'

class Instructions:
    CLOSED_QUESTION = '''
    Each closed question object must have:
    - "question": string,
    - "answers": array of exactly 4 items, where each item must be built in form: {{"content": string, "isCorrect": boolean}}
    Each answer must have exactly one "isCorrect": true property and three "isCorrect": false properties.
    '''
    CLOSED_QUESTION_MULTIPLE_ANSWERS = '''
    Each closed question object must have:
    - "question": string,
    - "answers": array of exactly 4 items, where each item must be built in form: {{"content": string, "isCorrect": boolean}}
    There must be at least two "isCorrect": true properties and not more than three "isCorrect": false properties.
    There can be 2, 3 or 4 "isCorrect": true properties.
    ''' 
    OPEN_QUESTION = '''
    Each open question object must have:
    - "question": string
    '''

    @staticmethod
    def get_instruction(type_of_question):
        if type_of_question == QuestionTypes.CLOSED:
            return Instructions.CLOSED_QUESTION
        elif type_of_question == QuestionTypes.OPEN:
            return Instructions.OPEN_QUESTION
        elif type_of_question == QuestionTypes.CLOSED_MULTI:
            return Instructions.CLOSED_QUESTION_MULTIPLE_ANSWERS
