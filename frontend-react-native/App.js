import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "./src/screens/HomeScreen";
import SearchScreen from "./src/screens/SearchScreen";
import WishlistScreen from "./src/screens/WishlistScreen";
import ProfileScreen from "./src/screens/ProfileScreen";


const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="홈" component={HomeScreen} />
        <Tab.Screen name="검색" component={SearchScreen} />
        <Tab.Screen name="찜" component={WishlistScreen} />
        <Tab.Screen name="마이" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
