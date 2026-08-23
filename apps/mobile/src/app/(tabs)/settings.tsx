import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { useAuthStore } from '../../stores/auth-store';
import { useTheme } from '../../stores/theme-store';
import { useThemeStore } from '../../stores/theme-store';
import api from '../../lib/api';

export default function SettingsScreen() {
  const { logout, user } = useAuthStore();
  const [pushEnabled, setPushEnabled] = useState(true);
  
  const { colors, isDarkMode } = useTheme();
  const setDarkMode = useThemeStore(state => state.setDarkMode);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const pushVal = await AsyncStorage.getItem('@push_enabled');
        if (pushVal !== null) setPushEnabled(pushVal === 'true');
      } catch (e) {
        console.error('Error loading preferences', e);
      }
    };
    loadPreferences();
  }, []);

  const handlePushToggle = async (value: boolean) => {
    setPushEnabled(value);
    await AsyncStorage.setItem('@push_enabled', String(value));
    
    try {
      if (value) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          Alert.alert('Notificaciones', 'Las notificaciones push han sido activadas.');
        } else {
          setPushEnabled(false);
          await AsyncStorage.setItem('@push_enabled', 'false');
          Alert.alert('Permiso denegado', 'Debes habilitar las notificaciones desde los ajustes de tu teléfono.');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Salir", 
          style: "destructive",
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.profileSection, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Text style={[styles.avatarText, { color: colors.text }]}>{user?.email ? user.email.charAt(0).toUpperCase() : 'U'}</Text>
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>{user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Administrador'}</Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || 'usuario@plataforma.com'}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={styles.sectionTitle}>Preferencias</Text>
        <View style={[styles.settingItem, { borderTopColor: colors.borderLight }]}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconBox, { backgroundColor: colors.iconBg }]}>
              <Feather name="bell" size={18} color={colors.iconPrimary} />
            </View>
            <Text style={[styles.settingText, { color: colors.text }]}>Notificaciones Push</Text>
          </View>
          <Switch 
            value={pushEnabled} 
            onValueChange={handlePushToggle}
            trackColor={{ true: colors.primary, false: colors.border }} 
            thumbColor="#FFFFFF"
          />
        </View>
        <View style={[styles.settingItem, { borderTopColor: colors.borderLight }]}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconBox, { backgroundColor: colors.iconBg }]}>
              <Feather name="moon" size={18} color={colors.iconPrimary} />
            </View>
            <Text style={[styles.settingText, { color: colors.text }]}>Modo Oscuro</Text>
          </View>
          <Switch 
            value={isDarkMode} 
            onValueChange={setDarkMode}
            trackColor={{ true: colors.primary, false: colors.border }} 
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={styles.sectionTitle}>Herramientas</Text>
        <TouchableOpacity style={[styles.settingItem, { borderTopColor: colors.borderLight }]} onPress={() => router.push('/(tabs)/whatsapp')} activeOpacity={0.7}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
              <Feather name="message-circle" size={18} color="#15803D" />
            </View>
            <Text style={[styles.settingText, { color: colors.text }]}>Integración WhatsApp</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingItem, { borderTopColor: colors.borderLight }]} onPress={() => router.push('/(tabs)/seo')} activeOpacity={0.7}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Feather name="search" size={18} color="#1D4ED8" />
            </View>
            <Text style={[styles.settingText, { color: colors.text }]}>Optimización SEO</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={styles.sectionTitle}>Equipo y Ayuda</Text>
        <TouchableOpacity style={[styles.settingItem, { borderTopColor: colors.borderLight }]} onPress={() => router.push('/(tabs)/users')} activeOpacity={0.7}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <Feather name="users" size={18} color="#B45309" />
            </View>
            <Text style={[styles.settingText, { color: colors.text }]}>Gestión de Usuarios</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingItem, { borderTopColor: colors.borderLight }]} onPress={() => router.push('/(tabs)/support')} activeOpacity={0.7}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
              <Feather name="life-buoy" size={18} color="#6D28D9" />
            </View>
            <Text style={[styles.settingText, { color: colors.text }]}>Soporte Técnico</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBg }]} onPress={handleLogout} activeOpacity={0.8}>
        <Feather name="log-out" size={18} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  profileSection: { 
    alignItems: 'center', 
    padding: 40, 
    borderBottomWidth: 1, 
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    borderWidth: 1,
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16 
  },
  avatarText: { 
    fontSize: 28, 
    fontWeight: '800', 
  },
  userName: { 
    fontSize: 20, 
    fontWeight: '800', 
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  userEmail: { 
    fontSize: 14, 
    fontWeight: '500',
  },
  section: { 
    marginTop: 24, 
    borderTopWidth: 1, 
    borderBottomWidth: 1, 
  },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#A1A1AA', 
    textTransform: 'uppercase', 
    letterSpacing: 1,
    paddingHorizontal: 24, 
    paddingVertical: 16,
    paddingBottom: 8,
  },
  settingItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 14, 
    paddingHorizontal: 24, 
    borderTopWidth: 1, 
  },
  settingLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16 
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: { 
    fontSize: 15, 
    fontWeight: '500',
  },
  logoutButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    marginTop: 32, 
    marginBottom: 50, 
    marginHorizontal: 24, 
    padding: 16, 
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
});
