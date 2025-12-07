# QuizAI

App to help with learning text material by answering closed and open questions related to it.

## Features

### Core Features

- Generate closed (multiple choice) and open questions from any text
- Support for PDF and TXT file uploads
- OpenAI API integration (API key stored securely in browser)
- Spaced repetition learning with configurable question pool
- Progress tracking with learning and accuracy bars
- Dark theme UI with modern design
- Settings persistence in localStorage
- Quiz progress saved across page reloads

### Learning Assistance

- **Hints**: Get AI-generated guidance without revealing the answer (doesn't count as wrong)
- **Explanations**: After answering, see why the answer is correct with direct quotes from the source text
- **Show Answer**: Reveal the correct answer when stuck (counts as incorrect for learning purposes)
- **Accept My Answer**: Override AI's judgment if you believe your answer is correct
- **Remove Question**: Remove poorly generated questions from the quiz

### Question Generation Options

- **Question Style**: Choose between Conceptual (tests understanding) or Text-based (tests recall)
- **Content Focus**: Focus on important content only or include everything
- **Difficulty Level**: Easy, Medium, Hard, or Mixed
- **Custom Instructions**: Add your own instructions for question generation

### Import & Export

- Export quizzes to JSON format
- Import questions from JSON files
- Share quizzes with others

### Settings

- Configure number of closed/open questions
- Allow/force multiple correct answers
- Customize learning pool behavior (initial copies, retry copies)
- Configure question style, difficulty, and content focus

## Future Plans

- Points system and timer
- User profiles and text library

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/michaeleight/QuizAI.git
   cd QuizAI
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run development server:

   ```bash
   npm run dev
   ```

4. Open the app in your browser and enter your OpenAI API key when prompted.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- OpenAI API

## Contributing

Contributions are welcome! Fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.
