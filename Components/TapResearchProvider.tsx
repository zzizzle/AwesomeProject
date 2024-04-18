import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import RNTapResearch, {
  tapResearchEmitter,
  PLACEMENT_CODE_SDK_NOT_READY,
} from 'react-native-tapresearch';
import Toast from 'react-native-toast-message';
import Config from 'react-native-config';

export interface Placement {
  currencyName: string;
  events: Event[];
  hasHotSurvey: boolean;
  isEventAvailable: number;
  isSurveyWallAvailable: boolean;
  maxPayoutInCurrency: number;
  maxSurveyLength: number;
  minPayoutInCurrency: number;
  minSurveyLength: number;
  placementCode: number;
  placementErrorMessage: string;
  placementIdentifier: string;
}

const showToast = (text) => {
  Toast.show({
    type: 'success',
    text1: text + '🤑'
    // text2: 'This is some something 👋',
  });
};

const onSurveyWallClosed = () => {
  console.log('onSurveyWallClosed');
};

const onEventOpened = (placement) => {
  console.log('onEventOpened with placement: ', placement);
};

const onEventDismissed = (placement) => {
  Toast.show({
    type: 'info',
    text1: 'Event Dismissed',
    position: 'bottom',
    autoHide: false,
    onPress: () => Toast.hide()
  });
  console.log('onEventDismissed', placement);
};

const createOnPlacementUnavailable = (
  setPlacements: React.Dispatch<React.SetStateAction<Placement[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsLoading(false);
  return (placement) => {
    console.log('placement unavailable: ' + placement.placementId);
    setPlacements((placements) => [
      ...placements.filter(
        (p) => p.placementIdentifier !== placement.placementIdentifier
      ),
      placement
    ]);
  };
};

const tapResearchOnReceivedRewardCollection = (rewards) => {
  console.log('rewards: ', rewards);
  const sum = rewards.reduce(
    (partialSum, reward) => partialSum + reward.rewardAmount,
    0
  );
  showToast(`Rewards ${sum} of ${rewards[rewards.length - 1].currencyName}`);
};


const onSurveyWallOpened = (placement) => {
  console.log('Survey Wall Opened with, placement: ', placement);
};

const createOnPlacementReady = (
  setPlacements: React.Dispatch<React.SetStateAction<Placement[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  return (placement) => {
    setIsLoading(false);
    console.log('onPlacementReady: ', placement);
    if (
      placement.placementCode !== PLACEMENT_CODE_SDK_NOT_READY &&
      !!placement.isSurveyWallAvailable
    ) {
      setPlacements((placements) => [
        ...placements.filter(
          (p) => p.placementIdentifier !== placement.placementIdentifier
        ),
        placement
      ]);
    }
  };
};

const setup = (
  setPlacements: React.Dispatch<React.SetStateAction<Placement[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  console.log(
    `Setting up callbacks. API token ${Config.API_TOKEN}, unique user ${Config.USER_IDENTIFIER}`
  );
  tapResearchEmitter.addListener(
    'tapResearchOnPlacementReady',
    createOnPlacementReady(setPlacements, setIsLoading)
  );

  tapResearchEmitter.addListener(
    'tapResearchOnPlacementUnavailable',
    createOnPlacementUnavailable(setPlacements, setIsLoading)
  );

  tapResearchEmitter.addListener(
    'tapResearchOnReceivedRewardCollection',
    (rewards) => {
      tapResearchOnReceivedRewardCollection(rewards);
    }
  );

  tapResearchEmitter.addListener(
    'tapResearchOnSurveyWallOpened',
    (placement) => {
      onSurveyWallOpened(placement);
    }
  );

  tapResearchEmitter.addListener('tapResearchOnSurveyWallDismissed', () => {
    // Should make a call to fetch placements again
    onSurveyWallClosed();
  });

  tapResearchEmitter.addListener('tapResearchOnEventOpened', (event) => {
    onEventOpened(event);
  });

  tapResearchEmitter.addListener('tapResearchOnEventDismissed', (event) => {
    onEventDismissed(event);
  });
};

interface TapResearchContextValue {
  placements: Placement[];
  isLoading: boolean;
}

const TapResearchContext = createContext<TapResearchContextValue | undefined>(
  undefined
);

export const useTapResearch = (): TapResearchContextValue => {
  const context = useContext(TapResearchContext);
  if (!context) {
    throw new Error('useTapResearch must be used within a TapResearchProvider');
  }
  return context;
};

// Provider component
export const TapResearchProvider: React.FC<{ children: ReactNode; }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [placements, setPlacements] = useState<Placement[]>([]);

  useEffect(() => {
    console.log(Config.API_TOKEN, Config.USER_IDENTIFIER);
    RNTapResearch.initWithApiToken(Config.API_TOKEN);
    RNTapResearch.setUniqueUserIdentifier(Config.USER_IDENTIFIER);
    RNTapResearch.setReceiveRewardCollection(true);
    console.log('API_TOKEN', Config.API_TOKEN);
    console.log('USER_IDENTIFIER', Config.USER_IDENTIFIER);
  }, []);

  useEffect(() => {
    setup(setPlacements, setIsLoading);
  }, []);

  const value = {
    placements,
    isLoading,
  }

  return (
    <TapResearchContext.Provider value={value}>
      {children}
    </TapResearchContext.Provider>
  );
};