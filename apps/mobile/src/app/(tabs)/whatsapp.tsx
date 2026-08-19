import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../lib/api';

export default function WhatsAppScreen() {
  const [settings, setSettings] = useState({
    enabled: true,
    phoneNumber: '',
    message: '',
    buttonColor: '#25D366',
    buttonPosition: 'right', // 'left' | 'right'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const response: any = await api.get('/whatsapp/settings');
        if (isMounted && response.data) {
          // Merge API data with default layout state (if missing)
          setSettings({
            enabled: response.data.enabled ?? false,
            phoneNumber: response.data.phoneNumber ?? '',
            message: response.data.message ?? '',
            buttonColor: response.data.buttonColor ?? '#25D366',
            buttonPosition: response.data.buttonPosition ?? 'right'
          });
        }
      } catch (error) {
        console.error('Failed to fetch whatsapp settings:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSettings();
    return () => { isMounted = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/whatsapp/settings', settings);
      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      console.error('Failed to save whatsapp settings:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Integración WhatsApp</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Configura el botón flotante de WhatsApp que aparecerá en tus sitios web.
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.labelTitle}>Activar botón</Text>
              <Text style={styles.labelSub}>Mostrar botón flotante de WhatsApp en tus sitios</Text>
            </View>
            <Switch 
              value={settings.enabled} 
              onValueChange={(v) => setSettings({ ...settings, enabled: v })}
              trackColor={{ true: '#2563EB' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.labelTitle}>Número de WhatsApp</Text>
            <TextInput
              style={styles.input}
              value={settings.phoneNumber}
              onChangeText={(t) => setSettings({ ...settings, phoneNumber: t })}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.labelTitle}>Mensaje predeterminado</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={settings.message}
              onChangeText={(t) => setSettings({ ...settings, message: t })}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.labelTitle}>Color (HEX)</Text>
              <TextInput
                style={styles.input}
                value={settings.buttonColor}
                onChangeText={(t) => setSettings({ ...settings, buttonColor: t })}
                autoCapitalize="characters"
              />
            </View>
            <View style={[styles.colorPreview, { backgroundColor: settings.buttonColor }]} />
          </View>

          <View style={styles.field}>
            <Text style={styles.labelTitle}>Posición</Text>
            <View style={styles.toggleGroup}>
              <TouchableOpacity 
                style={[styles.toggleBtn, settings.buttonPosition === 'left' && styles.toggleBtnActive]}
                onPress={() => setSettings({ ...settings, buttonPosition: 'left' })}
              >
                <Text style={[styles.toggleText, settings.buttonPosition === 'left' && styles.toggleTextActive]}>Izquierda</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, settings.buttonPosition === 'right' && styles.toggleBtnActive]}
                onPress={() => setSettings({ ...settings, buttonPosition: 'right' })}
              >
                <Text style={[styles.toggleText, settings.buttonPosition === 'right' && styles.toggleTextActive]}>Derecha</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Live Preview */}
          {settings.enabled && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Vista previa del sitio</Text>
              <View style={styles.previewScreen}>
                <Text style={styles.previewText}>Contenido del sitio web...</Text>
                
                <View style={[
                  styles.previewFab, 
                  { backgroundColor: settings.buttonColor },
                  settings.buttonPosition === 'left' ? { left: 16 } : { right: 16 }
                ]}>
                  <FontAwesome name="whatsapp" size={24} color="white" />
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar configuración'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  container: { flex: 1 },
  content: { padding: 20 },
  description: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 16 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
  labelTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  labelSub: { fontSize: 12, color: '#64748b' },
  field: { marginVertical: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0f172a', marginTop: 6 },
  textArea: { height: 80, textAlignVertical: 'top' },
  colorPreview: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 20 },
  toggleGroup: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4, marginTop: 6 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  toggleText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  toggleTextActive: { color: '#0f172a' },
  previewContainer: { marginTop: 24, padding: 16, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  previewTitle: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 12 },
  previewScreen: { height: 160, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  previewText: { color: '#cbd5e1', fontSize: 14 },
  previewFab: { position: 'absolute', bottom: 16, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  saveBtn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 32 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
