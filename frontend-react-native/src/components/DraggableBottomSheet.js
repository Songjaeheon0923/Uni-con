import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DraggableBottomSheet = ({
  children,
  isVisible,
  onClose,
  snapPoints = [0.3, 0.7, 0.9], // 30%, 70%, 90% of screen height
  initialHeight = null // 초기 높이 (없으면 snapPoints[1] 사용)
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      const newY = context.startY + event.translationY;
      // 위로는 최소 높이(10%)까지만 허용
      const minY = SCREEN_HEIGHT * (1 - snapPoints[snapPoints.length - 1]);
      translateY.value = Math.max(minY, Math.min(SCREEN_HEIGHT, newY));
    },
    onEnd: (event) => {
      const velocity = event.velocityY;
      const currentY = translateY.value;
      const currentHeightPercent = (SCREEN_HEIGHT - currentY) / SCREEN_HEIGHT;

      // 가장 가까운 스냅 포인트 찾기
      let targetSnapPoint = snapPoints[0];
      let minDistance = Math.abs(currentHeightPercent - snapPoints[0]);

      snapPoints.forEach(point => {
        const distance = Math.abs(currentHeightPercent - point);
        if (distance < minDistance) {
          minDistance = distance;
          targetSnapPoint = point;
        }
      });

      // 빠른 아래쪽 제스처면 닫기
      if (velocity > 1000 && currentHeightPercent < 0.5) {
        translateY.value = withSpring(SCREEN_HEIGHT, {
          damping: 50,
          stiffness: 300,
        });
        runOnJS(onClose)();
        return;
      }

      // 스냅 포인트로 이동
      const targetY = SCREEN_HEIGHT * (1 - targetSnapPoint);
      translateY.value = withSpring(targetY, {
        damping: 50,
        stiffness: 300,
      });
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  useEffect(() => {
    if (isVisible) {
      // initialHeight가 있으면 사용, 없으면 두 번째 스냅포인트 사용 (중간 높이)
      const sheetHeight = SCREEN_HEIGHT * 0.9;
      const targetHeightRatio = initialHeight || snapPoints[0]; // 기본값은 중간 높이
      const targetHeight = SCREEN_HEIGHT * targetHeightRatio;
      const initialY = sheetHeight - targetHeight; // 시트 내에서의 위치
      translateY.value = withSpring(initialY, {
        damping: 25,
        stiffness: 200,
      });
    } else {
      // 닫기
      translateY.value = withSpring(SCREEN_HEIGHT * 0.9, {
        damping: 25,
        stiffness: 200,
      });
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <GestureHandlerRootView style={styles.gestureContainer}>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.bottomSheet, animatedStyle]}>
            {/* 드래그 핸들 */}
            <View style={styles.dragHandle} />
            {children}
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  gestureContainer: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    width: '100%',
    height: SCREEN_HEIGHT * 0.9, // 화면의 90%만 사용
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    zIndex: 1000,
    bottom: 0, // 바닥에서 시작
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
});

export default DraggableBottomSheet;
