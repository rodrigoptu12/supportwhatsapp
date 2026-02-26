import { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '../services/socket.service';

export interface MassMessageProgress {
  sent: number;
  total: number;
  successCount: number;
}

const MassMessageProgressContext = createContext<MassMessageProgress | null>(null);

export function MassMessageProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<MassMessageProgress | null>(null);

  useEffect(() => {
    const onProgress = (data: unknown) => {
      const p = data as MassMessageProgress;
      setProgress(p);
    };
    const onDone = () => {
      // Keep for 3 s so it's visible, then clear
      setTimeout(() => setProgress(null), 3000);
    };

    socketService.on('mass_message_progress', onProgress);
    socketService.on('mass_message_done', onDone);

    return () => {
      socketService.off('mass_message_progress', onProgress);
      socketService.off('mass_message_done', onDone);
    };
  }, []);

  return (
    <MassMessageProgressContext.Provider value={progress}>
      {children}
    </MassMessageProgressContext.Provider>
  );
}

export const useMassMessageProgress = () => useContext(MassMessageProgressContext);
