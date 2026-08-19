import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: '#0f172a',
        },
      }}
    >
      <Tabs.Screen
        name="sites"
        options={{
          title: 'Sitios',
          tabBarIcon: ({ color }) => <MaterialIcons name="web" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <MaterialIcons name="insert-chart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Leads',
          tabBarIcon: ({ color }) => <MaterialIcons name="people" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="whatsapp"
        options={{
          title: 'WhatsApp',
          href: null,
        }}
      />
      <Tabs.Screen
        name="seo"
        options={{
          title: 'SEO',
          href: null,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Usuarios',
          href: null,
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Soporte',
          href: null,
        }}
      />
    </Tabs>
  );
}
