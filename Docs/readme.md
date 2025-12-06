# QuizAI

App to help with learning text material by answering closed and open questions related to it.

## Features

### Implemented

- Generate closed (multiple choice) and open questions from any text
- OpenAI API integration (API key stored securely in browser)
- Spaced repetition learning with configurable question pool
- Progress tracking with learning and accuracy bars
- Dark theme UI with modern design
- Settings persistence in localStorage
- Quiz progress saved across page reloads

### Settings

- Configure number of closed/open questions
- Allow/force multiple correct answers
- Customize learning pool behavior (initial copies, retry copies)

## Future Plans

- Allow user to disagree with AI answers (remove question, accept answer)
- Hints and explanations (quote source text)
- Points system and timer
- Save/load question sets
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
