import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import api from '../../lib/api';

const { width } = Dimensions.get('window');

interface Site {
  id: string;
  name: string;
import { useTheme } from '../../stores/theme-store';

export default function SitesScreen() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    let isMounted = true;
    const fetchSites = async () => {
      setLoading(true);
      try {
        const response: any = await api.get('/sites');
        if (isMounted) {
          const resData = response.data || response;
          if (Array.isArray(resData?.items)) {
            setSites(resData.items);
          } else if (Array.isArray(resData)) {
            setSites(resData);
          } else {
            setSites([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch sites:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSites();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <FlatList
        data={sites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Tus Proyectos</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Solo visualización. Crea o edita desde la web.</Text>
              </View>
            </View>
            <View style={[styles.infoBanner, { backgroundColor: colors.iconBg }]}>
              <Feather name="info" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoBannerText, { color: colors.text }]}>
                Para crear nuevos sitios o editar los existentes, por favor ingresa a la plataforma web desde tu computadora.
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.iconBg }]}>
              <Feather name="layout" size={32} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin Proyectos</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Aún no has creado ningún sitio web. Ingresa a la plataforma web para empezar.</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const isPublished = item.status === 'PUBLISHED';
          const isActive = item.isActive;
          
          return (
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.7}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
                  <Feather name="globe" size={24} color={colors.iconPrimary} />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.siteName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: isPublished ? colors.statusConvertedDot : colors.statusContactedDot }]} />
                    <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                      {isPublished ? 'Publicado' : 'Borrador'}
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={colors.textMuted} />
              </View>

              <View style={[styles.cardFooter, { borderTopColor: colors.borderLight }]}>
                <View style={styles.footerItem}>
                  <Feather name="link" size={14} color={colors.textSecondary} />
                  <Text style={[styles.footerText, { color: colors.textSecondary }]} numberOfLines={1}>{item.slug}.mi-plataforma.com</Text>
                </View>
                
                {isActive === false && (
                  <View style={[styles.inactiveBadge, { backgroundColor: colors.statusArchivedBg }]}>
                    <Text style={[styles.inactiveText, { color: colors.statusArchivedText }]}>Inactivo</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 32,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
    gap: 8,
  },
  infoBannerText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  list: {
    padding: 24,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  siteName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 12,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inactiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inactiveText: {
    fontSize: 11,
    fontWeight: '600',
  },
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
    marginBottom: 16,
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
});
