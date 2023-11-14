/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';

import createAgoraRtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  VideoSourceType,
} from 'react-native-agora';

import {MainBundlePath} from 'react-native-fs';

import {useAsyncEffect} from 'use-async-effect';

// Banuba Constants
export const BNBKeyVendorName = 'Banuba';
export const BNBKeyExtensionName = 'BanubaFilter';
export const BNBKeyLoadEffect = 'load_effect';
export const BNBKeyUnloadEffect = 'unload_effect';
export const BNBKeySetBanubaLicenseToken =
  Platform.OS === 'android' ? 'initialize' : 'set_banuba_license_token';
export const BNBKeySetEffectsPath = 'set_effects_path';
export const BNBKeyEvalJSMethod = 'eval_js';
export const banubaLicenseToken = 'YOUR_BANUBA_LICENSE_TOKEN';

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const engine = useRef(createAgoraRtcEngine());
  const [joinChannelSuccess, setJoinChannelSuccess] = useState(false);

  const onJoinChannelSuccess = useCallback(() => {
    engine.current.setExtensionProperty(
      BNBKeyVendorName,
      BNBKeyExtensionName,
      BNBKeyLoadEffect,
      'TrollGrandma',
    );
    setJoinChannelSuccess(true);
  }, []);
  const onLeaveChannel = useCallback(() => {
    engine.current.setExtensionProperty(
      BNBKeyVendorName,
      BNBKeyExtensionName,
      BNBKeyUnloadEffect,
      'TrollGrandma',
    );
    setJoinChannelSuccess(false);
  }, []);

  useEffect(() => {
    engine.current.addListener('onJoinChannelSuccess', onJoinChannelSuccess);
    engine.current.addListener('onLeaveChannel', onLeaveChannel);

    const engineCopy = engine.current;
    return () => {
      engineCopy.removeListener('onJoinChannelSuccess', onJoinChannelSuccess);
      engineCopy.removeListener('onLeaveChannel', onLeaveChannel);
    };
  }, [onJoinChannelSuccess, onLeaveChannel]);

  useAsyncEffect(async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        'android.permission.RECORD_AUDIO',
        'android.permission.CAMERA',
      ]);
    }

    engine.current.initialize({
      appId: 'YOUR_AGORA_APP_ID',
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    });
    if (Platform.OS === 'android') {
      engine.current.loadExtensionProvider('banuba-plugin');
    }
    engine.current.enableExtension(BNBKeyVendorName, BNBKeyExtensionName, true);
    engine.current.enableVideo();
    engine.current.setClientRole(ClientRoleType.ClientRoleBroadcaster);
    engine.current.startPreview();

    if (Platform.OS === 'ios') {
      engine.current.setExtensionProperty(
        BNBKeyVendorName,
        BNBKeyExtensionName,
        BNBKeySetEffectsPath,
        MainBundlePath,
      );
    }

    engine.current.setExtensionProperty(
      BNBKeyVendorName,
      BNBKeyExtensionName,
      BNBKeySetBanubaLicenseToken,
      banubaLicenseToken,
    );

    engine.current.joinChannel('', 'lxh', 0, {});

    const engineCopy = engine.current;
    return () => {
      engineCopy.leaveChannel();
      engineCopy.release();
    };
  }, []);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      {joinChannelSuccess ? (
        <RtcSurfaceView
          style={styles.preview}
          canvas={{uid: 0, sourceType: VideoSourceType.VideoSourceCamera}}
        />
      ) : undefined}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  preview: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
});

export default App;
