import { Link } from "react-router";

export default function Homepage() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="text-center py-16">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-6">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
          <span className="text-indigo-400 text-sm font-medium">Powered by AI</span>
        </div>

        <h1 className="text-5xl font-bold text-slate-100 mb-4">
          Generate Quizzes
          <span className="text-indigo-400"> Instantly</span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
          Transform any text into interactive quizzes with AI. Perfect for studying,
          teaching, or testing your knowledge.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/sourcePage"
            className="bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white font-semibold rounded-lg px-8 py-4 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-500/25"
          >
            Get Started
          </Link>
          <Link
            to="/settingsPage"
            className="bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold rounded-lg px-8 py-4 transition-all duration-200 active:scale-[0.98]"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <FeatureCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          title="AI-Powered"
          description="Advanced AI generates relevant questions directly from your text content."
          delay="stagger-1"
        />

        <FeatureCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
          title="Hints & Explanations"
          description="Get AI-generated hints when stuck and detailed explanations with source quotes after answering."
          delay="stagger-2"
        />

        <FeatureCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Spaced Repetition"
          description="Failed questions return to the pool for review. Master every concept through smart repetition."
          delay="stagger-3"
        />
      </div>

      {/* Second row of features */}
      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <FeatureCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          title="Multiple Types"
          description="Create both multiple-choice and open-ended questions for comprehensive testing."
          delay="stagger-1"
        />

        <FeatureCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
          title="Conceptual Learning"
          description="Questions test understanding of concepts, not just text recall. Toggle between conceptual and text-based styles."
          delay="stagger-2"
        />

        <FeatureCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          }
          title="Import & Export"
          description="Save your quizzes and progress. Import questions from JSON or export to share with others."
          delay="stagger-3"
        />
      </div>

      {/* How it works */}
      <div className="mt-20">
        <h2 className="text-2xl font-bold text-slate-100 text-center mb-12">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <StepCard
            number="1"
            title="Paste Your Text"
            description="Enter or paste any text you want to create a quiz from."
          />
          <StepCard
            number="2"
            title="Generate Questions"
            description="AI analyzes your text and creates relevant questions."
          />
          <StepCard
            number="3"
            title="Take the Quiz"
            description="Answer questions and get instant feedback on your performance."
          />
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: string;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-slate-600 animate-fade-in opacity-0 ${delay}`}>
      <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}

interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}
