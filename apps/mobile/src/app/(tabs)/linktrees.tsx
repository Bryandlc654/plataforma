import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator, Alert, SafeAreaView, Switch, ScrollView, Linking } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../stores/theme-store';

export default function LinktreesScreen() {
  const [linktrees, setLinktrees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const { colors } = useTheme();

  const fetchLinktrees = useCallback(async () => {
    setIsLoading(true);
    try {
      const response: any = await api.get('/linktrees');
      const resData = response.data || response;
      setLinktrees(Array.isArray(resData?.items) ? resData.items : (Array.isArray(resData?.data) ? resData.data : []));
    } catch (error) {
      console.error('Failed to fetch linktrees:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLinktrees(); }, [fetchLinktrees]);

  const toggleActive = async (id: string, current: boolean) => {
    try {
      setLinktrees(prev => prev.map(l => l.id === id ? { ...l, isActive: !current } : l));
      await api.put(`/linktrees/${id}`, { isActive: !current });
    } catch {
      setLinktrees(prev => prev.map(l => l.id === id ? { ...l, isActive: current } : l));
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Eliminar Bio Link', '¿Estás seguro? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/linktrees/${id}`);
            setLinktrees(prev => prev.filter(l => l.id !== id));
            if (selected?.id === id) setSelected(null);
          } catch {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        }
      }
    ]);
  };

  const copyUrl = (slug: string) => {
    const url = `https://www.rodriplast.com/${slug}`;
    Linking.openURL(url);
  };

  const linkCount = (lt: any) => (lt.links || []).length;
  const socialCount = (lt: any) => (lt.socials || []).length;

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <View style={styles.cardTitleRow}>
            {item.logoUrl ? (
              <View style={styles.logoThumb}>
                <Feather name="image" size={14} color={colors.primary} />
              </View>
            ) : (
              <View style={[styles.logoThumb, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.logoInitial, { color: colors.primary }]}>{(item.title || '?')[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.slug}>/{item.slug}</Text>
            </View>
          </View>
        </View>
        <Switch
          value={item.isActive}
          onValueChange={() => toggleActive(item.id, item.isActive)}
          trackColor={{ false: '#cbd5e1', true: colors.primary + '80' }}
          thumbColor={item.isActive ? colors.primary : '#f8fafc'}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Feather name="link" size={13} color="#64748b" />
          <Text style={styles.statText}>{linkCount(item)} enlaces</Text>
        </View>
        <View style={styles.stat}>
          <Feather name="share-2" size={13} color="#64748b" />
          <Text style={styles.statText}>{socialCount(item)} redes</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => copyUrl(item.slug)}>
          <Feather name="external-link" size={14} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Abrir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
          <Feather name="trash-2" size={14} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : linktrees.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="link" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>No hay Bio Links</Text>
          <Text style={styles.emptySubtext}>Crea uno desde el panel web</Text>
        </View>
      ) : (
        <FlatList
          data={linktrees}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={fetchLinktrees}
        />
      )}

      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
              <Feather name="x" size={24} color="#0f172a" />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>{selected?.title}</Text>
            <TouchableOpacity onPress={() => selected && copyUrl(selected.slug)} style={styles.closeBtn}>
              <Feather name="external-link" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {selected && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>URL pública</Text>
                <Text style={[styles.detailValue, { color: colors.primary }]}>/{selected.slug}</Text>
              </View>

              {selected.description ? (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Descripción</Text>
                  <Text style={styles.detailValue}>{selected.description}</Text>
                </View>
              ) : null}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Estado</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: selected.isActive ? '#22c55e' : '#cbd5e1' }]} />
                  <Text style={styles.detailValue}>{selected.isActive ? 'Activo' : 'Inactivo'}</Text>
                </View>
              </View>

              {(selected.links || []).length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Enlaces ({selected.links.length})</Text>
                  {selected.links.map((link: any, idx: number) => (
                    <View key={idx} style={styles.itemRow}>
                      <Feather name="link" size={14} color="#94a3b8" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{link.title || 'Sin título'}</Text>
                        <Text style={styles.itemSub} numberOfLines={1}>{link.url}</Text>
                      </View>
                      <Feather name={link.isActive !== false ? 'check-circle' : 'x-circle'} size={14} color={link.isActive !== false ? '#22c55e' : '#cbd5e1'} />
                    </View>
                  ))}
                </View>
              )}

              {(selected.socials || []).length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Redes ({selected.socials.length})</Text>
                  {selected.socials.map((social: any, idx: number) => (
                    <View key={idx} style={styles.itemRow}>
                      <Feather name="share-2" size={14} color="#94a3b8" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{social.platform}</Text>
                        <Text style={styles.itemSub} numberOfLines={1}>{social.url}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Fondo</Text>
                <Text style={styles.detailValue}>
                  {selected.background?.type === 'color' ? `Color: ${selected.background.value}` :
                   selected.background?.type === 'image' ? 'Imagen de fondo' :
                   selected.background?.type === 'gradient' ? 'Degradado' : 'Sin fondo'}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Creado</Text>
                <Text style={styles.detailValue}>{new Date(selected.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardInfo: { flex: 1, marginRight: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoThumb: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  logoInitial: { fontSize: 15, fontWeight: '700' },
  title: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  slug: { fontSize: 12, color: '#64748b', marginTop: 1 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#64748b' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, fontWeight: '500' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#475569', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  closeBtn: { padding: 4 },
  modalContent: { padding: 16, gap: 16 },
  detailSection: { backgroundColor: '#ffffff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  detailLabel: { fontSize: 11, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#0f172a', fontWeight: '500' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  itemTitle: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  itemSub: { fontSize: 12, color: '#64748b', marginTop: 1 },
});
