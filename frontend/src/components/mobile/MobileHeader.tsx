
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  title: string;
  onProfileClick: () => void;
}

const MobileHeader = ({ title, onProfileClick }: MobileHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
      <h1 className="text-xl font-bold">{title}</h1>
      <Button
        onClick={onProfileClick}
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/20 p-2"
      >
        <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default MobileHeader;
