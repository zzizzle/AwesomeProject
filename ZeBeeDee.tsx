import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform } from 'react-native';
import styled from 'styled-components/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import RNTapResearch, { tapResearchEmitter, PLACEMENT_CODE_SDK_NOT_READY } from 'react-native-tapresearch';

// Components
import { Icon } from '../../icon';
import { AnimatedTouchable } from '../../animated-touchable';

// Utils
import { navigate } from '../../../router/navigation-service';
import { getAdId } from '../../../utils/analytics';

// Constants
import { colors, spacing, typo, vars } from '../../../theme';
import { ENABLE_TRACKING_ROUTE } from '../../../constants/routes';
import { BANNER_SECTION_ID_DAILY_POOL } from '../../../constants/tests';
import { PLATFORM_ANDROID } from '../../../constants/platform';

// Assets
import dailyPollImage from '../../../assets/images/earn/tap-research.png';

import { ICONS } from '../../../constants/icons';
import { CONFIG_ENV } from '../../../config/env';
import { selectAccountUserId } from '../../../selectors/account';
import { toastError } from '../../../utils/toast';

const InnerWrapper = styled.View`
  position: relative;
  border-radius: 10px;
  height: 100px;
  overflow: hidden;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background7};
  border-radius: ${vars.borderRadius}px;
  padding: ${spacing.base * 3}px 0 ${spacing.base * 3.5}px ${spacing.base * 2}px;
  margin-right: ${spacing.base * 2}px;
  flex: 1;
`;

const HeaderText = styled.Text`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${typo.size.large}px;
  font-family: ${typo.main.whyteRegular};
`;

const BottomDesc = styled.Text`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${typo.main.whyteRegular};
  margin-right: 4px;
  margin-left: 2px;
`;

const LabelText = styled(BottomDesc)`
  line-height: 19px;
  font-size: 14px;
  margin-left: -1px;
`;

const RightImage = styled.Image`
  height: 100px;
  width: 88px;
`;

const IconTextWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 3px;
`;
interface Event {
  end_time: string;
  event_type: 'currency_sale';
  identifier: string;
  placement_type: 'interstitial';
  start_time: string;
}
interface Placement {
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

const createOnPlacementUnavailable = (
  setPlacements: React.Dispatch<React.SetStateAction<Placement>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsLoading(false);
  return (placement) => {
    console.log('placement unavailable: ' + placement.placementId);
    setPlacements((placements) => [
      ...placements.filter((p) => p.placementIdentifier !== placement.placementIdentifier),
      placement,
    ]);
  };
};

const onSurveyButtonPressed = (placement) => {
  if (typeof placement !== 'undefined') {
    console.log(`Is a hot survey = ${placement.hasHotSurvey}`);
    RNTapResearch.initPlacementEvent(placement.placementId || placement.placementIdentifier);
    if (placement.isEventAvailable) {
      RNTapResearch.displayEvent(placement);
    } else {
      RNTapResearch.showSurveyWallWithParams(placement, {
        foos: 'buzz',
        fizz: 'boos',
      });
    }
  } else {
    console.log('Placement not ready!!');
  }
};
const onSurveyWallOpened = (placement) => {
  console.log('Survey Wall Opened with, placement: ', placement);
};

const createOnPlacementReady = (
  setPlacements: React.Dispatch<React.SetStateAction<Placement>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsLoading(false);
  return (placement) => {
    console.log('onPlacementReady: ', placement);
    if (placement.placementCode !== PLACEMENT_CODE_SDK_NOT_READY && !!placement.isSurveyWallAvailable) {
      setPlacements((placements) => [
        ...placements.filter((p) => p.placementIdentifier !== placement.placementIdentifier),
        placement,
      ]);
    }
  };
};

const setup = (
  setPlacements: React.Dispatch<React.SetStateAction<Placement>>,
  setButtonPressed: React.Dispatch<React.SetStateAction<boolean>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  console.log('TAP RESEARCH SETUP');
  // setButtonPressed(false);
  tapResearchEmitter.addListener('tapResearchOnPlacementReady', createOnPlacementReady(setPlacements, setIsLoading));

  tapResearchEmitter.addListener(
    'tapResearchOnPlacementUnavailable',
    createOnPlacementUnavailable(setPlacements, setIsLoading)
  );

  tapResearchEmitter.addListener('tapResearchOnSurveyWallOpened', (placement) => {
    onSurveyWallOpened(placement);
  });
};

export const TapResearchCard = () => {
  const userId = 'zach-hardcoded-user-id'
  const [placements, setPlacements] = useState<Placement | []>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setButtonPressed] = useState(false);

  const initSdk = async () => {
    const init = await RNTapResearch.initWithApiToken(CONFIG_ENV.TAP_RESEARCH_API_TOKEN);
    console.log('INIT ===', init);
    await RNTapResearch.setUniqueUserIdentifier(userId);
    await RNTapResearch.setReceiveRewardCollection(true);
    setup(setPlacements, setButtonPressed, setIsLoading);
  };

  useEffect(() => {
    initSdk();
  }, []);

  useEffect(() => {
    console.log('PLACEMENTS === ', placements);
  }, [placements]);

  const handleCardPress = async () => {
    const adId = await getAdId();
    if (!adId && Platform.OS !== PLATFORM_ANDROID) return navigate(ENABLE_TRACKING_ROUTE);
    if (placements[0]) onSurveyButtonPressed(placements[0]);
    else toastError('No surveys available');
  };

  return (
    <Animated.View entering={FadeInDown}>
      <AnimatedTouchable
        testID={BANNER_SECTION_ID_DAILY_POOL}
        onPress={handleCardPress}
        style={{
          marginHorizontal: spacing.base * 3,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <InnerWrapper>
          <HeaderText>TapResearch</HeaderText>
          <BottomDesc>{'Take surveys and earn sats'}</BottomDesc>
          <IconTextWrapper>
            <LabelText style={{ color: colors?.black }}> {`for your thoughts`}</LabelText>
            {isLoading ? (
              <ActivityIndicator size={10} color={colors.purple2} />
            ) : (
              <Icon size={16} name={ICONS.ARROW_RIGHT} color={colors.purple2} />
            )}
          </IconTextWrapper>
        </InnerWrapper>
        <RightImage source={dailyPollImage} />
      </AnimatedTouchable>
    </Animated.View>
  );
};