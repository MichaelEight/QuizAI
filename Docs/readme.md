# QuizAI

App to help with learning text material by answering closed and open questions related to it.

## Features

### DONE
- Make OPENAI API requests
- Prepare prompts for generating questions and answers
- Detect forbidden text
- Handle API errors
- Method of checking if given open answer is correct (%-based)

### FIXME
- Allow multiple correct answers (fix prompt or handling, like generating N 2-answers, M 3-answers and O 4-answers, where N+M+O = amount of multi-answers questions)

### TODO
- Frontend (React)
- Communication frontend-backend
- Pages
    - text input with settings
    - questions with answers
- Methods of learning
    - If the answer is wrong, add 3 copies of the same question to the pool
    - Allow user to disagree with answer provided by AI (since its a tool for learners anyway):
        - remove question
        - accept given answer
    - Hint and explanation:
        - what does the question mean
        - why these answers are correct (quote the source)
    - Points system and timer, because psychology
    - (toggle) partial points e.g. if all selected answers are correct, but there is one more correct 
- Save set of questions and load them in the future
- Improve styling

## Future plans
- User profiles
- Database with texts library (id, title, author, source text, closed questions, open questions, rating, savings) with features:
    - Get all texts (with filtering)
    - Rate 1-5
    - Save to favorites
    - Load set
    - Reuse text
- Different levels of questions e.g. basic/simple, academic, phd etc.
- Deduction i.e. does the answer must be direct in the text or could be deducted? (e.g. if all A are B, then something, so obviously A is not C)

## Installation
1. Set your OpenAI API KEY to environmental variable: `OPENAI_API_KEY`

1. Clone the repository:
    ```bash
    git clone https://github.com/michaeleight/QuizAI.git
    ```

1. Install backend dependencies
    ```bash
    pip install -r .\Backend\requirements.txt
    ```

1. Run backend server
    ```bash
    python -m Backend.main
    ```

    or just run the `/start_backend.bat` file.

1. Install frontend dependencies:

   *WORK IN PROGRESS...*

1. Run frontend app

   *WORK IN PROGRESS...*

## Contributing

Although this is a part of coding everyday challenge, any contributions are welcome! You can fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.