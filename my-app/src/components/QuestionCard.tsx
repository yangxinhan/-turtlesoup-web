interface QuestionCardProps {
  id: string;
  question: string;
  askedBy: string;
  timestamp: string;
  answer?: 'correct' | 'incorrect';
  isHost?: boolean;
  onAnswer?: (id: string, isCorrect: boolean) => void;
}

export default function QuestionCard({
  id,
  question,
  askedBy,
  timestamp,
  answer,
  isHost,
  onAnswer
}: QuestionCardProps) {
  const getCardStyle = () => {
    if (answer === 'correct') return 'border-green-500 bg-green-50';
    if (answer === 'incorrect') return 'border-red-500 bg-red-50';
    return 'border-gray-200 bg-gray-50';
  };

  return (
    <div className={`border-2 rounded-lg p-3 hover:bg-gray-100 transition-colors ${getCardStyle()}`}>
      <p className="font-medium text-gray-900">{question}</p>
      <div className="flex justify-between text-sm text-gray-600 mt-2">
        <span>提問者：{askedBy}</span>
        <span>{timestamp}</span>
      </div>
      {isHost && !answer && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onAnswer?.(id, true)}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            正確
          </button>
          <button
            onClick={() => onAnswer?.(id, false)}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            錯誤
          </button>
        </div>
      )}
    </div>
  );
}
