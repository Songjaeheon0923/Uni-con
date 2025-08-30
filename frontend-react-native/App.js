import { useEffect } from "react";
import { AppState, Text } from "react-native";
import { NavigationContainer, getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// 전역 폰트 설정
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = { fontFamily: 'Pretendard' };
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { SignupProvider } from "./src/contexts/SignupContext";
import HomeIcon from "./src/components/HomeIcon";
import MapIcon from "./src/components/MapIcon";
import HeartIcon from "./src/components/HeartIcon";
import SplashScreen from "./src/screens/SplashScreen";
import HomeScreen from "./src/screens/HomeScreen";
import MapScreen from "./src/screens/MapScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import RoommateSearchScreen from "./src/screens/RoommateSearchScreen";
import PersonalityTestScreen from "./src/screens/PersonalityTestScreen";
import PersonalityResultScreen from "./src/screens/PersonalityResultScreen";
import MatchResultsScreen from "./src/screens/MatchResultsScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupStep1Screen from "./src/screens/SignupStep1Screen";
import VerificationMainScreen from "./src/screens/VerificationMainScreen";
import IDVerificationCompleteScreen from "./src/screens/IDVerificationCompleteScreen";
import ChatScreen from "./src/screens/ChatScreen";
import ContractVerificationScreen from "./src/screens/ContractVerificationScreen";
import ContractCameraScreen from "./src/screens/ContractCameraScreen";
import ContractResultScreen from "./src/screens/ContractResultScreen";
import RoomDetailScreen from "./src/screens/RoomDetailScreen";
import LandlordInfoScreen from "./src/screens/LandlordInfoScreen";
import ContractViewScreen from "./src/screens/ContractViewScreen";
import FavoritedUsersScreen from "./src/screens/FavoritedUsersScreen";
import FavoriteRoomsScreen from "./src/screens/FavoriteRoomsScreen";
import UserProfileScreen from "./src/screens/UserProfileScreen";
import RoommateChoiceScreen from "./src/screens/RoommateChoiceScreen";
import ChatListScreen from "./src/screens/ChatListScreen";
import PolicyChatbotScreen from "./src/screens/PolicyChatbotScreen";
import PolicyDetailScreen from "./src/screens/PolicyDetailScreen";
import ShareRoomScreen from "./src/screens/ShareRoomScreen";
import api from "./src/services/api";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack({ user }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,  // 헤더 완전히 숨기기
      }}
    >
      <Stack.Screen
        name="HomeMain"
        options={{
          headerShown: false,
        }}
      >
        {(props) => <HomeScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Stack.Screen
        name="ContractVerification"
        component={ContractVerificationScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ContractCamera"
        component={ContractCameraScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ContractResult"
        component={ContractResultScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="RoomDetail"
        component={RoomDetailScreen}
        options={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Stack.Screen
        name="LandlordInfo"
        component={LandlordInfoScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ContractView"
        component={ContractViewScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FavoritedUsers"
        component={FavoritedUsersScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PolicyChatbot"
        component={PolicyChatbotScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PolicyDetail"
        component={PolicyDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={({ route }) => {
        const routeName = route.name;

        // 스플래시에서 로그인으로, 로그인에서 회원가입으로 갈 때는 fade 애니메이션 유지
        if (routeName === 'Splash' || routeName === 'Login') {
          return {
            headerShown: false,
            transitionSpec: {
              open: {
                animation: 'timing',
                config: {
                  duration: 500,
                },
              },
              close: {
                animation: 'timing',
                config: {
                  duration: 500,
                },
              },
            },
            cardStyleInterpolator: ({ current }) => ({
              cardStyle: {
                opacity: current.progress,
              },
            }),
          };
        }

        // 나머지 회원가입 관련 화면들은 슬라이드 애니메이션
        return {
          headerShown: false,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
          cardStyleInterpolator: ({ current, next, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        };
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupStep1Screen} />
      <Stack.Screen name="SignupStep2" component={VerificationMainScreen} />
      <Stack.Screen name="IDVerificationComplete" component={IDVerificationCompleteScreen} />
    </Stack.Navigator>
  );
}

function MapStack({ user }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MapMain">
        {(props) => <MapScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen
        name="RoomDetail"
        component={RoomDetailScreen}
        options={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Stack.Screen name="LandlordInfo" component={LandlordInfoScreen} />
      <Stack.Screen name="ContractView" component={ContractViewScreen} />
      <Stack.Screen name="ContractResult" component={ContractResultScreen} />
      <Stack.Screen name="FavoritedUsers" component={FavoritedUsersScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  );
}

function FavoriteStack({ user }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="FavoriteMain">
        {(props) => <FavoriteRoomsScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen
        name="RoomDetail"
        component={RoomDetailScreen}
        options={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Stack.Screen name="LandlordInfo" component={LandlordInfoScreen} />
      <Stack.Screen name="ContractView" component={ContractViewScreen} />
      <Stack.Screen name="ContractResult" component={ContractResultScreen} />
      <Stack.Screen name="FavoritedUsers" component={FavoritedUsersScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="ShareRoom" component={ShareRoomScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack({ user, onLogout }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        options={{
          headerShown: false,
        }}
      >
        {(props) => <ProfileScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen
        name="PersonalityTest"
        component={PersonalityTestScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PersonalityResult"
        component={PersonalityResultScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { user, logout } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => {
        const routeName = getFocusedRouteNameFromRoute(route) ?? '';

        return {
          tabBarIcon: ({ focused, color }) => {
            if (route.name === '홈') {
              return <HomeIcon size={28} color={color} focused={focused} />;
            } else if (route.name === '지도') {
              return <MapIcon size={28} color={color} focused={focused} />;
            } else if (route.name === '관심매물') {
              return <HeartIcon size={28} color={color} focused={focused} />;
            } else if (route.name === '내 정보') {
              const iconName = focused ? 'person' : 'person-outline';
              return <Ionicons name={iconName} size={28} color={color} />;
            }
          },
          tabBarActiveTintColor: '#000000',
          tabBarInactiveTintColor: '#C0C0C0',
          tabBarStyle: routeName === 'UserProfile'
            ? { display: 'none' }
            : {
                height: 100,
                paddingBottom: 30,
                paddingTop: 15,
                backgroundColor: '#FFFFFF',
                borderTopWidth: 0,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 8,
              },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
          headerShown: false,
        };
      }}
      screenListeners={({ navigation, route }) => ({
        tabPress: (e) => {
          // 홈 탭을 눌렀을 때만 스택 초기화, 이미 홈 화면에 있으면 무시
          if (e.target.includes('홈')) {
            const currentRoute = navigation.getState()?.routes?.find(r => r.name === '홈')?.state?.routes?.slice(-1)?.[0]?.name;
            if (currentRoute !== 'HomeMain') {
              navigation.navigate('홈', { screen: 'HomeMain' });
            }
          }
        },
      })}
    >
      <Tab.Screen
        name="홈"
        options={({ route }) => ({
          tabBarStyle: (() => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeMain';
            const baseStyle = {
              height: 100,
              paddingBottom: 30,
              paddingTop: 15,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 8,
            };

            // 네비게이션 바를 숨겨야 하는 화면들 - HomeMain이 아닌 경우만 숨김
            if (routeName !== 'HomeMain' && (
                routeName === 'Chat' ||
                routeName === 'ContractVerification' ||
                routeName === 'ContractCamera' ||
                routeName === 'RoomDetail' ||
                routeName === 'LandlordInfo' ||
                routeName === 'ContractView' ||
                routeName === 'UserProfile' ||
                routeName === 'FavoritedUsers' ||
                routeName === 'PolicyChatbot' ||
                routeName === 'PolicyDetail')) {
              return { display: 'none' };
            }
            return baseStyle;
          })(),
        })}
      >
        {(props) => <HomeStack {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="지도">
        {(props) => <MapStack {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="관심매물">
        {(props) => <FavoriteStack {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="내 정보">
        {(props) => <ProfileStack {...props} user={user} onLogout={logout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function MainApp() {
  const { user, logout } = useAuth();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="RoommateChoice"
        component={RoommateChoiceScreen}
        options={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Stack.Screen
        name="PersonalityTest"
        component={PersonalityTestScreen}
        options={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Stack.Screen
        name="PersonalityResult"
        component={PersonalityResultScreen}
        options={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Stack.Screen
        name="MatchResults"
        component={MatchResultsScreen}
        options={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Stack.Screen
        name="RoommateSearch"
        component={RoommateSearchScreen}
        options={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { user, isLoading, isAuthenticated, handleUnauthorized, validateToken, checkAuthState } = useAuth();

  useEffect(() => {
    // API 서비스에 401 에러 핸들러 등록
    api.setAuthErrorHandler(handleUnauthorized);

    // 앱 시작 시 즉시 토큰 검증
    if (isAuthenticated && !isLoading) {
      validateToken();
    }
  }, [handleUnauthorized, isAuthenticated, isLoading, validateToken]);

  useEffect(() => {
    // 앱이 포그라운드로 돌아올 때마다 세션 검증
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && isAuthenticated) {
        // 앱이 활성화될 때 토큰 유효성 검사
        validateToken();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated, validateToken]);

  if (isLoading) {
    return null; // 또는 로딩 스피너
  }

  return (
    <NavigationContainer>
      {isAuthenticated && user ? (
        <MainApp />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SignupProvider>
          <AppContent />
        </SignupProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
