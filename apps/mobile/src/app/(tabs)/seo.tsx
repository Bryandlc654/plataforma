import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../lib/api';

export default function SEOScreen() {
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  
  const [globalTitle, setGlobalTitle] = useState('');
  const [globalDesc, setGlobalDesc] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        const sitesResp: any = await api.get('/sites');
        const sitesData = sitesResp.data || sitesResp;
        if (isMounted && sitesData.length > 0) {
          setSites(sitesData);
          setSelectedSite(sitesData[0]);
          // Fetch SEO for first site
          const seoResp: any = await api.get(`/seo/sites/${sitesData[0].id}/meta`);
          const seoData = seoResp.data || seoResp;
          setGlobalTitle(seoData?.title || '');
          setGlobalDesc(seoData?.description || '');
        }
      } catch (error) {
        console.error('Failed to fetch SEO data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  const handleSave = async () => {
    if (!selectedSite) return;
    setSaving(true);
    try {
      await api.put(`/seo/sites/${selectedSite.id}/meta`, {
        title: globalTitle,
        description: globalDesc
      });
      Alert.alert('Éxito', 'Configuración SEO guardada');
    } catch (error) {
      console.error('Failed to save SEO config:', error);
      Alert.alert('Error', 'No se pudo guardar');
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

  if (!selectedSite) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#64748b' }}>No tienes sitios creados todavía.</Text>
      </View>
    );
  }

  const TITLE_MAX = 60;
  const DESC_MAX = 155;

  const titleColor = globalTitle.length > TITLE_MAX ? '#ef4444' : globalTitle.length > TITLE_MAX * 0.8 ? '#f59e0b' : '#64748b';
  const descColor = globalDesc.length > DESC_MAX ? '#ef4444' : globalDesc.length > DESC_MAX * 0.8 ? '#f59e0b' : '#64748b';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Optimización SEO</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Controla cómo tu sitio aparece en Google y en redes sociales.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sitio seleccionado</Text>
          <View style={styles.siteSelector}>
            <Text style={styles.siteSelectorText}>{selectedSite.name} ({selectedSite.domain})</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#64748b" />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="public" size={20} color="#64748b" />
            <Text style={styles.sectionTitle}>Datos Generales</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.labelTitle}>Título SEO</Text>
            <TextInput
              style={styles.input}
              value={globalTitle}
              onChangeText={setGlobalTitle}
            />
            <Text style={[styles.charCount, { color: titleColor }]}>
              {globalTitle.length} / {TITLE_MAX}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.labelTitle}>Descripción SEO</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={globalDesc}
              onChangeText={setGlobalDesc}
              multiline
              numberOfLines={3}
            />
            <Text style={[styles.charCount, { color: descColor }]}>
              {globalDesc.length} / {DESC_MAX}
            </Text>
          </View>
        </View>

        {/* Google SERP Preview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="search" size={20} color="#64748b" />
            <Text style={styles.sectionTitle}>Vista previa de Google</Text>
          </View>
          
          <View style={styles.serpPreview}>
            <View style={styles.serpTop}>
              <View style={styles.serpIcon}>
                <Text style={styles.serpIconText}>{selectedSite.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.serpDomainName}>{selectedSite.name}</Text>
                <Text style={styles.serpUrl}>https://{selectedSite.domain}</Text>
              </View>
            </View>
            <Text style={styles.serpTitle} numberOfLines={1}>
              {globalTitle || 'Título de tu sitio'}
            </Text>
            <Text style={styles.serpDesc} numberOfLines={2}>
              {globalDesc || 'Descripción de tu sitio...'}
            </Text>
          </View>
        </View>

        {/* Open Graph Preview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="share" size={20} color="#64748b" />
            <Text style={styles.sectionTitle}>Vista previa al compartir</Text>
          </View>
          
          <View style={styles.ogPreview}>
            <View style={styles.ogImagePlaceholder}>
              <MaterialIcons name="image" size={32} color="#cbd5e1" />
              <Text style={styles.ogImageText}>Imagen Open Graph</Text>
            </View>
            <View style={styles.ogContent}>
              <Text style={styles.ogDomain}>{selectedSite.domain.toUpperCase()}</Text>
              <Text style={styles.ogTitle} numberOfLines={1}>{globalTitle || 'Título'}</Text>
              <Text style={styles.ogDesc} numberOfLines={2}>{globalDesc || 'Descripción'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
        </TouchableOpacity>
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
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  siteSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 12 },
  siteSelectorText: { fontSize: 15, color: '#334155', fontWeight: '500' },
  field: { marginBottom: 16 },
  labelTitle: { fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0f172a' },
  textArea: { height: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4, fontWeight: '500' },
  
  /* SERP Preview */
  serpPreview: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16 },
  serpTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  serpIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  serpIconText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  serpDomainName: { fontSize: 13, color: '#202124', fontWeight: '500' },
  serpUrl: { fontSize: 11, color: '#4d5156' },
  serpTitle: { fontSize: 18, color: '#1a0dab', fontWeight: '500', marginBottom: 4 },
  serpDesc: { fontSize: 13, color: '#4d5156', lineHeight: 18 },

  /* Open Graph Preview */
  ogPreview: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden' },
  ogImagePlaceholder: { backgroundColor: '#f1f5f9', height: 160, alignItems: 'center', justifyContent: 'center' },
  ogImageText: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  ogContent: { padding: 16, backgroundColor: '#f8fafc' },
  ogDomain: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  ogTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  ogDesc: { fontSize: 13, color: '#475569' },

  saveBtn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 16, marginBottom: 40 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
