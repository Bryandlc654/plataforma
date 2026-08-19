import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../stores/theme-store';

export default function LeadsScreen() {
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    let isMounted = true;
    const fetchLeads = async () => {
      setIsLoading(true);
      try {
        const response: any = await api.get('/leads');
        if (isMounted) {
          const resData = response.data || response;
          setLeads(Array.isArray(resData?.items) ? resData.items : (Array.isArray(resData) ? resData : []));
        }
      } catch (error) {
        console.error('Failed to fetch leads:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchLeads();
    return () => { isMounted = false; };
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new': return { dot: colors.statusNewDot, text: colors.statusNewText, bg: colors.statusNewBg, label: 'Nuevo' };
      case 'contacted': return { dot: colors.statusContactedDot, text: colors.statusContactedText, bg: colors.statusContactedBg, label: 'Contactado' };
      case 'qualified': return { dot: colors.statusQualifiedDot, text: colors.statusQualifiedText, bg: colors.statusQualifiedBg, label: 'Calificado' };
      case 'converted': return { dot: colors.statusConvertedDot, text: colors.statusConvertedText, bg: colors.statusConvertedBg, label: 'Convertido' };
      case 'archived': return { dot: colors.statusArchivedDot, text: colors.statusArchivedText, bg: colors.statusArchivedBg, label: 'Archivado' };
      default: return { dot: colors.statusArchivedDot, text: colors.statusArchivedText, bg: colors.statusArchivedBg, label: status || 'Desconocido' };
    }
  };

  const filteredLeads = leads.filter(l => 
    (l.name && l.name.toLowerCase().includes(search.toLowerCase())) || 
    (l.email && l.email.toLowerCase().includes(search.toLowerCase()))
  );

  const updateStatus = async (id: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      await api.put(`/leads/${id}/status`, { status: newStatus.toUpperCase() });
      setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus.toUpperCase() } : l));
      if (selectedLead && selectedLead.id === id) {
        setSelectedLead({ ...selectedLead, status: newStatus.toUpperCase() });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Leads</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Gestión de prospectos</Text>
        </View>
        <View style={[styles.searchBox, { backgroundColor: colors.iconBg }]}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar por nombre o email..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <>
          {/* Stats Row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>TOTAL</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{leads.length}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>CONVERTIDOS</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {leads.filter(l => l.status === 'CONVERTED').length}
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>NUEVOS</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {leads.filter(l => l.status === 'NEW').length}
              </Text>
            </View>
          </ScrollView>

          {/* Leads List */}
          <FlatList
            data={filteredLeads}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconContainer, { backgroundColor: colors.iconBg }]}>
                  <Feather name="users" size={32} color={colors.textMuted} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin Leads</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>No hay prospectos que coincidan con tu búsqueda.</Text>
              </View>
            )}
            renderItem={({ item }) => {
              const statusStyle = getStatusStyle(item.status);
              return (
                <TouchableOpacity style={[styles.leadCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setSelectedLead(item)} activeOpacity={0.7}>
                  <View style={styles.cardHeader}>
                    <View style={styles.leadInfo}>
                      <Text style={[styles.leadName, { color: colors.text }]} numberOfLines={1}>{item.name || 'Sin nombre'}</Text>
                      <Text style={[styles.leadEmail, { color: colors.textSecondary }]} numberOfLines={1}>{item.email || 'Sin email'}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                      <View style={[styles.badgeDot, { backgroundColor: statusStyle.dot }]} />
                      <Text style={[styles.badgeText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                    </View>
                  </View>
                  <View style={[styles.cardFooter, { borderTopColor: colors.borderLight }]}>
                    <View style={styles.footerItem}>
                      <Feather name="globe" size={12} color={colors.textMuted} />
                      <Text style={[styles.footerText, { color: colors.textSecondary }]}>{item.source || 'Directo'}</Text>
                    </View>
                    <View style={styles.footerItem}>
                      <Feather name="calendar" size={12} color={colors.textMuted} />
                      <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        {new Date(item.createdAt || new Date()).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* Detail Modal */}
          <Modal visible={!!selectedLead} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedLead(null)}>
            {selectedLead && (
              <View style={[styles.modalContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>{selectedLead.name || 'Sin nombre'}</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{selectedLead.email || 'Sin email'}{selectedLead.phone ? ` · ${selectedLead.phone}` : ''}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedLead(null)} style={[styles.closeBtn, { backgroundColor: colors.iconBg }]}>
                    <Feather name="x" size={20} color={colors.iconPrimary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.sectionTitle}>DATOS DEL FORMULARIO</Text>
                  <View style={[styles.dataBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {Object.entries(selectedLead.data || {}).length === 0 ? (
                      <View style={styles.dataRow}>
                        <Text style={[styles.dataValue, { color: colors.text }]}>No hay datos adicionales proporcionados.</Text>
                      </View>
                    ) : (
                      Object.entries(selectedLead.data || {}).map(([key, value], index, arr) => (
                        <View key={key} style={[styles.dataRow, { borderBottomColor: colors.borderLight }, index === arr.length - 1 && { borderBottomWidth: 0 }]}>
                          <Text style={[styles.dataKey, { color: colors.textSecondary }]}>{key.toUpperCase()}</Text>
                          <Text style={[styles.dataValue, { color: colors.text }]}>{String(value)}</Text>
                        </View>
                      ))
                    )}
                  </View>

                  <Text style={styles.sectionTitle}>ACTUALIZAR ESTADO</Text>
                  <View style={styles.statusButtons}>
                    {['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'ARCHIVED'].map((st) => {
                      const s = getStatusStyle(st);
                      const isActive = selectedLead.status === st;
                      return (
                        <TouchableOpacity
                          key={st}
                          onPress={() => updateStatus(selectedLead.id, st)}
                          activeOpacity={0.7}
                          style={[
                            styles.statusBtn, 
                            { backgroundColor: colors.card, borderColor: colors.border },
                            isActive && [styles.statusBtnActive, { borderColor: colors.primary, backgroundColor: colors.backgroundSecondary }]
                          ]}
                        >
                          <View style={styles.statusBtnInner}>
                            <View style={[styles.badgeDot, { backgroundColor: s.dot, marginRight: 8 }]} />
                            <Text style={[
                              styles.statusBtnText, { color: colors.textSecondary },
                              isActive && [styles.statusBtnTextActive, { color: colors.text }]
                            ]}>
                              {s.label}
                            </Text>
                          </View>
                          {isActive && <Feather name="check" size={16} color={colors.primary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  
                  {isUpdating && (
                    <View style={styles.updatingOverlay}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.updatingText, { color: colors.textSecondary }]}>Guardando...</Text>
                    </View>
                  )}
                  <View style={{ height: 40 }} />
                </ScrollView>
              </View>
            )}
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: { 
    padding: 24, 
    paddingBottom: 16,
    paddingTop: 20,
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 12, 
    paddingHorizontal: 14, 
    height: 44, 
    gap: 10 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 15, 
    height: '100%',
  },
  statsScroll: { 
    height: 180,
    flexGrow: 0 
  },
  statsContainer: { 
    paddingHorizontal: 24, 
    paddingVertical: 24,
    gap: 12 
  },
  statCard: { 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    minWidth: 150, 
    minHeight: 120,
    justifyContent: 'center',
  },
  statLabel: { 
    fontSize: 10, 
    fontWeight: '700', 
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  statValue: { 
    fontSize: 24, 
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  list: { 
    padding: 24, 
    paddingTop: 24, 
    gap: 12 
  },
  leadCard: { 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 16 
  },
  leadInfo: {
    flex: 1,
    marginRight: 12,
  },
  leadName: { 
    fontSize: 16, 
    fontWeight: '700', 
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  leadEmail: { 
    fontSize: 13, 
    fontWeight: '400',
  },
  badge: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: { 
    fontSize: 11, 
    fontWeight: '600' 
  },
  cardFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 14, 
    borderTopWidth: 1, 
    gap: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: { 
    fontSize: 12, 
    fontWeight: '500',
  },
  
  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },

  /* Modal Styles */
  modalContainer: { 
    flex: 1, 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    padding: 24, 
    borderBottomWidth: 1, 
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  modalSubtitle: { 
    fontSize: 14, 
  },
  closeBtn: { 
    padding: 8, 
    borderRadius: 20,
    marginLeft: 16,
  },
  modalContent: { 
    padding: 24 
  },
  sectionTitle: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: '#A1A1AA', 
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  dataBox: { 
    borderRadius: 16, 
    borderWidth: 1, 
    marginBottom: 32 
  },
  dataRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 16, 
    borderBottomWidth: 1, 
  },
  dataKey: { 
    fontSize: 13, 
    fontWeight: '600', 
    width: '40%' 
  },
  dataValue: { 
    flex: 1, 
    fontSize: 14, 
    textAlign: 'right',
    fontWeight: '500',
  },
  statusButtons: { 
    gap: 8 
  },
  statusBtn: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
  },
  statusBtnActive: {
  },
  statusBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBtnText: { 
    fontSize: 15, 
    fontWeight: '600' 
  },
  statusBtnTextActive: {
  },
  updatingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  updatingText: {
    fontSize: 14,
    fontWeight: '500',
  }
});
