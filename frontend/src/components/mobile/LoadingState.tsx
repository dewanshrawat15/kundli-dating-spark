
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';

interface LoadingStateProps {
  message: string;
  processingCount?: number;
}

const LoadingState = ({ message, processingCount }: LoadingStateProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="text-white text-center">
        <FontAwesomeIcon icon={faClock} className="h-12 w-12 mx-auto mb-4 animate-spin" />
        <div className="text-xl mb-2">{message}</div>
        {processingCount && processingCount > 0 && (
          <div className="text-sm text-purple-200">
            Calculating astrological compatibility for {processingCount} profiles...
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingState;
