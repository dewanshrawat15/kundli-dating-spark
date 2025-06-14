
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: 'error' | 'waiting' | 'noProfiles';
  message: string;
  actionText?: string;
  onAction?: () => void;
  currentCity?: string;
}

const EmptyState = ({ type, message, actionText, onAction, currentCity }: EmptyStateProps) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return faStar;
      case 'waiting':
        return faUsers;
      default:
        return faStar;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'error':
        return 'Astrological Setup Required';
      case 'waiting':
        return 'Building Your Community';
      default:
        return 'No more profiles for now';
    }
  };

  return (
    <div className="px-4">
      <Card className="bg-white/95 backdrop-blur border-white/20 overflow-hidden shadow-xl">
        <CardContent className="p-8 text-center">
          <FontAwesomeIcon icon={getIcon()} className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {getTitle()}
          </h2>
          <p className="text-gray-700 mb-4">{message}</p>
          
          {type === 'waiting' && currentCity && (
            <div className="bg-purple-100 rounded-lg p-4 mb-4 border border-purple-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FontAwesomeIcon icon={faUsers} className="h-5 w-5 text-purple-600" />
                <span className="text-purple-800 font-medium">{currentCity}</span>
              </div>
              <p className="text-purple-700 text-sm">
                We need at least 10 users in your city to start showing matches. 
                Invite friends to join and build your local community!
              </p>
            </div>
          )}
          
          {actionText && onAction && (
            <Button 
              onClick={onAction}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {actionText}
            </Button>
          )}
          
          {type === 'waiting' && (
            <p className="text-gray-600 text-sm mt-4">
              ✨ More people are joining every day. Check back soon!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmptyState;
