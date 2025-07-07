import { Wifi, WifiOff, Loader } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const ConnectionStatus = ({
  isConnected,
  status,
}: ConnectionStatusProps) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'connecting':
        return {
          icon: Loader,
          text: 'Connecting to server...',
          color: 'text-text-secondary',
          animate: 'animate-spin',
        };
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected - Live updates active',
          color: 'text-success-green',
          animate: '',
        };
      case 'error':
        return {
          icon: WifiOff,
          text: 'Connection error - Retrying...',
          color: 'text-warning-red',
          animate: '',
        };
      default:
        return {
          icon: WifiOff,
          text: 'Disconnected - Using cached data',
          color: 'text-text-secondary',
          animate: '',
        };
    }
  };

  const { icon: Icon, text, color, animate } = getStatusInfo();

  return (
    <div
      className={`flex items-center justify-center space-x-2 text-sm ${color}`}
    >
      <Icon className={`w-4 h-4 ${animate}`} />
      <span>{text}</span>
    </div>
  );
};
