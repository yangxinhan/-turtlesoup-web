interface QuestionCardProps {
  question: string;
  askedBy: string;
  timestamp: string;
  answer?: string;
}

export default function QuestionCard({ question, askedBy, timestamp, answer }: QuestionCardProps) {
  return (
    <div className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100">
      <p className="font-medium text-gray-900">{question}</p>
      <div className="flex justify-between text-sm text-gray-600 mt-2">
        <span>提問者：{askedBy}</span>
        <span>{timestamp}</span>
      </div>
      {answer && (
        <div className="mt-2 p-2 bg-white rounded">
          <p className="text-sm text-gray-800">答：{answer}</p>
        </div>
      )}
    </div>
  );
}
