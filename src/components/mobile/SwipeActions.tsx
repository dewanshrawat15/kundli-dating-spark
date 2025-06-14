
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Button } from "@/components/ui/button";

interface SwipeActionsProps {
  onLike: () => void;
  onPass: () => void;
  disabled: boolean;
}

const SwipeActions = ({ onLike, onPass, disabled }: SwipeActionsProps) => {
  return (
    <div className="flex justify-center gap-8 mt-6 px-4">
      <Button
        onClick={onPass}
        size="lg"
        className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all duration-200 hover:scale-105"
        disabled={disabled}
      >
        <FontAwesomeIcon icon={faTimes} className="h-8 w-8" />
      </Button>
      <Button
        onClick={onLike}
        size="lg"
        className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all duration-200 hover:scale-105"
        disabled={disabled}
      >
        <FontAwesomeIcon icon={faHeart} className="h-8 w-8" />
      </Button>
    </div>
  );
};

export default SwipeActions;
