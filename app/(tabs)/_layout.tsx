import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const THEME_PRIMARY = "#8C1A7A";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME_PRIMARY,
        tabBarInactiveTintColor: "#9E9E9E",
        tabBarStyle: {
          borderTopColor: "#E4E4E4",
          backgroundColor: "#FFFFFF",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Нүүр",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Ангилал",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="basket"
        options={{
          title: "Сагс",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Хадгалсан",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профайл",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

