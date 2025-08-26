import { useEffect } from "react";
import { AppState } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { SignupProvider } from "./src/contexts/SignupContext";
import HomeIcon from "./src/components/HomeIcon";
import MapIcon from "./src/components/MapIcon";
import HeartIcon from "./src/components/HeartIcon";
import HomeScreen from "./src/screens/HomeScreen";
import MapScreen from "./src/screens/MapScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import RoommateSearchScreen from "./src/screens/RoommateSearchScreen";
import PersonalityTestScreen from "./src/screens/PersonalityTestScreen";
import PersonalityResultScreen from "./src/screens/PersonalityResultScreen";
import MatchResultsScreen from "./src/screens/MatchResultsScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import SignupStep1Screen from "./src/screens/SignupStep1Screen";
import SignupStep2Screen from "./src/screens/SignupStep2Screen";
import IDVerificationScreen from "./src/screens/IDVerificationScreen";
import IDVerificationCompleteScreen from "./src/screens/IDVerificationCompleteScreen";
import SchoolVerificationScreen from "./src/screens/SchoolVerificationScreen";
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
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupStep1Screen} />
      <Stack.Screen name="SignupStep2" component={SignupStep2Screen} />
      <Stack.Screen name="IDVerification" component={IDVerificationScreen} />
      <Stack.Screen name="IDVerificationComplete" component={IDVerificationCompleteScreen} />
      <Stack.Screen name="SchoolVerification" component={SchoolVerificationScreen} />
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
      <Stack.Screen name="MapMain" component={MapScreen} />
      <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
      <Stack.Screen name="LandlordInfo" component={LandlordInfoScreen} />
      <Stack.Screen name="ContractView" component={ContractViewScreen} />
      <Stack.Screen name="FavoritedUsers" component={FavoritedUsersScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
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
      <Stack.Screen
        name="MatchResults"
        component={MatchResultsScreen}
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
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          if (route.name === '홈') {
            return <HomeIcon size={28} color={color} focused={focused} />;
          } else if (route.name === '지도') {
            return <MapIcon size={28} color={color} focused={focused} />;
          } else if (route.name === '관심목록') {
            return <HeartIcon size={28} color={color} focused={focused} />;
          } else if (route.name === '내 정보') {
            const iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={28} color={color} />;
          }
        },
        tabBarActiveTintColor: '#10B585',
        tabBarInactiveTintColor: '#C0C0C0',
        tabBarStyle: {
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
      })}
    >
      <Tab.Screen name="홈">
        {(props) => <HomeStack {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="지도">
        {(props) => <MapStack {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="관심목록" component={FavoriteRoomsScreen} />
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
        }}
      />
      <Stack.Screen
        name="RoommateSearch"
        component={RoommateSearchScreen}
        options={{
          headerShown: false,
        }}
      />
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
      <Stack.Screen
        name="MatchResults"
        component={MatchResultsScreen}
        options={{
          headerShown: false,
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
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false,
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
    <AuthProvider>
      <SignupProvider>
        <AppContent />
      </SignupProvider>
    </AuthProvider>
  );
}
