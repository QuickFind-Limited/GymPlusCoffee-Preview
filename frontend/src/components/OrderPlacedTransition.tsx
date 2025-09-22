
import React, { useEffect, useState } from "react";

interface Props {
  onComplete: () => void;
}

const OrderPlacedTransition: React.FC<Props> = ({ onComplete }) => {
  const [phase, setPhase] = useState<"placing" | "sending" | "syncing">("placing");

  useEffect(() => {
    // Step 1: Placing orders...
    const placingTimer = setTimeout(() => {
      setPhase("sending");

      // Step 2: Sending emails...
      const sendingTimer = setTimeout(() => {
        setPhase("syncing");

        // Step 3: Syncing with ERP then complete
        const syncingTimer = setTimeout(() => {
          onComplete();
        }, 1500);

        return () => clearTimeout(syncingTimer);
      }, 1500);

      return () => clearTimeout(sendingTimer);
    }, 1500);

    return () => clearTimeout(placingTimer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background animate-fade-in">
      <div className="text-center mt-[-40px]">
        {phase === "placing" && (
          <h1
            className="text-2xl font-semibold text-black dark:text-white animate-in fade-in-0 animate-fade-in animate-slide-in-up"
            style={{
              animation:
                "fade-in 0.55s cubic-bezier(0.4,0,0.6,1), slide-in-up 0.5s cubic-bezier(0.4,0,0.6,1)",
            }}
          >
            Placing orders...
          </h1>
        )}
        {phase === "sending" && (
          <h1
            className="text-2xl font-semibold text-black dark:text-white animate-in fade-in-0 animate-fade-in animate-slide-in-up"
            style={{
              animation:
                "fade-in 0.55s cubic-bezier(0.4,0,0.6,1), slide-in-up 0.5s cubic-bezier(0.4,0,0.6,1)",
            }}
          >
            Sending emails to suppliers
          </h1>
        )}
        {phase === "syncing" && (
          <h1
            className="text-2xl font-semibold text-black dark:text-white animate-in fade-in-0 animate-fade-in animate-slide-in-up"
            style={{
              animation:
                "fade-in 0.55s cubic-bezier(0.4,0,0.6,1), slide-in-up 0.5s cubic-bezier(0.4,0,0.6,1)",
            }}
          >
            Syncing with ERP
          </h1>
        )}
      </div>
    </div>
  );
};

export default OrderPlacedTransition;
