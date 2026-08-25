import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator, Alert, SafeAreaView, Switch } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../stores/theme-store';

export default function SorteosScreen() {
  const [sorteos, setSorteos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSorteo, setSelectedSorteo] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    fetchSorteos();
  }, []);

  const fetchSorteos = async () => {
    setIsLoading(true);
    try {
      const response: any = await api.get('/sorteos');
      const resData = response.data || response;
      setSorteos(Array.isArray(resData?.items) ? resData.items : (Array.isArray(resData?.data) ? resData.data : (Array.isArray(resData) ? resData : [])));
    } catch (error) {
      console.error('Failed to fetch sorteos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParticipants = async (id: string) => {
    setLoadingParticipants(true);
    try {
      const response: any = await api.get(`/sorteos/${id}/participants?limit=50`);
      const resData = response.data || response;
      setParticipants(Array.isArray(resData?.items) ? resData.items : (Array.isArray(resData?.data) ? resData.data : []));
    } catch (error) {
      console.error('Failed to fetch participants:', error);
      Alert.alert('Error', 'No se pudieron cargar los participantes');
    } finally {
      setLoadingParticipants(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      setSorteos(sorteos.map(s => s.id === id ? { ...s, isActive: !current } : s));
      await api.put(`/sorteos/${id}`, { isActive: !current });
    } catch (error) {
      setSorteos(sorteos.map(s => s.id === id ? { ...s, isActive: current } : s));
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const openParticipants = (sorteo: any) => {
    setSelectedSorteo(sorteo);
    fetchParticipants(sorteo.id);
  };

  const renderSorteo = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.slug}>/{item.slug}</Text>
        </View>
        <Switch
          value={item.isActive}
          onValueChange={() => toggleActive(item.id, item.isActive)}
          trackColor={{ false: '#cbd5e1', true: colors.primary + '80' }}
          thumbColor={item.isActive ? colors.primary : '#f8fafc'}
        />
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.statsContainer}>
          <MaterialIcons name="people" size={16} color="#64748b" />
          <Text style={styles.statsText}>{item.participantCount || 0} Participantes</Text>
        </View>
        <TouchableOpacity style={styles.viewButton} onPress={() => openParticipants(item)}>
          <Text style={styles.viewButtonText}>Ver registros</Text>
          <Feather name="chevron-right" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : sorteos.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="gift" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>No hay sorteos creados</Text>
          <Text style={styles.emptySubtext}>Crea uno desde el panel de control web</Text>
        </View>
      ) : (
        <FlatList
          data={sorteos}
          keyExtractor={(item) => item.id}
          renderItem={renderSorteo}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={fetchSorteos}
        />
      )}

      <Modal visible={!!selectedSorteo} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedSorteo(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedSorteo(null)} style={styles.closeButton}>
              <Feather name="x" size={24} color="#0f172a" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Participantes</Text>
            <View style={{ width: 24 }} />
          </View>
          
          {loadingParticipants ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : participants.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay participantes aún</Text>
            </View>
          ) : (
            <FlatList
              data={participants}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.participantsList}
              renderItem={({ item }) => (
                <View style={styles.participantCard}>
                  <Text style={styles.participantName}>{item.data?.nombre} {item.data?.apellido}</Text>
                  <Text style={styles.participantEmail}>{item.data?.correo}</Text>
                  {item.data?.telefono ? <Text style={styles.participantPhone}>{item.data.telefono}</Text> : null}
                  <Text style={styles.participantDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
              )}
            />
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  slug: { fontSize: 13, color: '#64748b' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  statsContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statsText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  viewButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewButtonText: { fontSize: 13, color: '#2563EB', fontWeight: '500' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#475569', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  closeButton: { padding: 4 },
  participantsList: { padding: 16, gap: 8 },
  participantCard: { backgroundColor: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  participantName: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  participantEmail: { fontSize: 13, color: '#475569' },
  participantPhone: { fontSize: 12, color: '#64748b', marginTop: 2 },
  participantDate: { fontSize: 11, color: '#94a3b8', marginTop: 6 },
});
