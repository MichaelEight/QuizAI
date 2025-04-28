# QuizAI

App to help with learning text material by answering closed and open questions related to it.

## Features

### DONE
- Make OPENAI API requests
- Prepare prompts for generating questions and answers
- Detect forbidden text
- Handle API errors

### TODO
- Allow multiple correct answers
- Method of checking if given open answer is correct (%-based)
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
- Save questions and load them in the future
- Improve styling

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/michaeleight/QuizAI.git
    ```
2. Install and run backend
    ```bash
    cd Backend
    ```

    ```bash
    pip install -r requirements.txt
    ```

    ```bash
    python main.py
    ```
3. Install and run frontend:
    
   *WORK IN PROGRESS...*

## Contributing

Although this is a part of coding everyday challenge, any contributions are welcome! You can fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.