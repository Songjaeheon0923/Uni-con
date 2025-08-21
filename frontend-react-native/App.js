import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { SignupProvider } from "./src/contexts/SignupContext";
import HomeScreen from "./src/screens/HomeScreen";
import MapScreen from "./src/screens/MapScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import RoommateSearchScreen from "./src/screens/RoommateSearchScreen";
import PersonalityTestScreen from "./src/screens/PersonalityTestScreen";
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
        name="MatchResults" 
        component={MatchResultsScreen}
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
          headerShown: true,
          headerTitle: '내 정보',
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerTransparent: false,
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
        name="MatchResults" 
        component={MatchResultsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

function MainApp() {
  const { user, logout } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === '홈') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === '지도') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === '내 정보') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6600',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="홈">
        {(props) => <HomeStack {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="지도">
        {(props) => <MapStack {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="내 정보">
        {(props) => <ProfileStack {...props} user={user} onLogout={logout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AppContent() {
  const { user, isLoading, isAuthenticated, handleUnauthorized } = useAuth();

  useEffect(() => {
    // API 서비스에 401 에러 핸들러 등록
    api.setAuthErrorHandler(handleUnauthorized);
  }, [handleUnauthorized]);

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
