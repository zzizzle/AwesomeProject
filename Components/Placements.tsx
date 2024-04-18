import React, { useEffect, useState } from 'react';
import RNTapResearch from 'react-native-tapresearch';
import { Button, StyleSheet, View, Text } from 'react-native';
import { useTapResearch } from './TapResearchProvider';

const onSurveyButtonPressed = (placement) => {
  if (typeof placement !== 'undefined' && placement.isSurveyWallAvailable) {
    console.log('Showing the survey wall');
    console.log(`Is a hot survey = ${placement.hasHotSurvey}`);
    if (placement.isEventAvailable) {
      RNTapResearch.displayEvent(placement);
    } else {
      RNTapResearch.showSurveyWallWithParams(placement, {
        foos: 'buzz',
        fizz: 'boos'
      });
    }
  } else {
    console.log('Placement not ready');
  }
};

export default function Placements() {
  const { isLoading, placements } = useTapResearch();

  return (
    <View>
      {isLoading && (
        <View style={styles.flowRight}>
          <Text>{"It's loading ..."}</Text>
        </View>
      )}

      <View key={placements.length}>
        {placements.length > 0 &&
          placements.map((placement) => (
            <View
              style={styles.container}
              key={placement.placementIdentifier + 'a'}
            >
              <Button
                key={placement.placementIdentifier}
                onPress={() => onSurveyButtonPressed(placement)}
                title={`Show ${
                  placement.isEventAvailable ? 'Event' : 'Survey Wall'
                } for "${placement.currencyName}"
                  ${placement.placementIdentifier}`}
                color={placement.isEventAvailable ? 'green' : 'blue'}
              />
            </View>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    marginTop: 15,
    alignItems: 'center'
  },
  flowRight: {
    marginTop: 50,
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'center'
  }
});
