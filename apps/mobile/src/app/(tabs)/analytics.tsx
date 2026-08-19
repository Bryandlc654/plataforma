import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../stores/theme-store';

const PERIODS = [
  { label: '7 días', value: '7d' },
  { label: '30 días', value: '30d' },
  { label: '90 días', value: '90d' },
];

export default function AnalyticsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const { colors } = useTheme();

  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response: any = await api.get(`/analytics/overview?period=${period}`);
        if (isMounted) setData(response.data || response);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAnalytics();
    return () => { isMounted = false; };
  }, [period]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!data) return null;

  const maxViews = Math.max(...data.dailyViews.map((d: any) => d.views), 1);
  const conversionRate = data.summary.totalViews > 0 
    ? Math.round((data.summary.totalConversions / data.summary.totalViews) * 100) 
    : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header & Period Selector */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Analíticas</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Resumen de rendimiento</Text>
        </View>
        <View style={[styles.periodSelector, { backgroundColor: colors.iconBg }]}>
          {PERIODS.map((p) => (
            <TouchableOpacity 
              key={p.value} 
              onPress={() => setPeriod(p.value)}
              activeOpacity={0.7}
              style={[
                styles.periodBtn, 
                period === p.value && styles.periodBtnActive,
                period === p.value && { backgroundColor: colors.card, shadowColor: colors.primary }
              ]}
            >
              <Text style={[
                styles.periodText, { color: colors.textSecondary },
                period === p.value && styles.periodTextActive,
                period === p.value && { color: colors.text }
              ]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* KPI Grid */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.kpiHeader}>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>VISITAS</Text>
            <Feather name="eye" size={14} color={colors.textMuted} />
          </View>
          <Text style={[styles.kpiValue, { color: colors.text }]}>{data.summary.totalViews}</Text>
        </View>
        
        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.kpiHeader}>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>CONVERSIONES</Text>
            <Feather name="trending-up" size={14} color={colors.textMuted} />
          </View>
          <Text style={[styles.kpiValue, { color: colors.text }]}>{data.summary.totalConversions}</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.kpiHeader}>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>CLICS</Text>
            <Feather name="mouse-pointer" size={14} color={colors.textMuted} />
          </View>
          <Text style={[styles.kpiValue, { color: colors.text }]}>{data.summary.totalClicks}</Text>
        </View>
      </View>

      {/* Native Bar Chart (Flex based) */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Visitas diarias</Text>
          <Feather name="bar-chart-2" size={18} color={colors.textSecondary} />
        </View>
        <View style={styles.chartContainer}>
          {data.dailyViews.map((day: any, i: number) => {
            const heightPct = (day.views / maxViews) * 100;
            const isToday = i === data.dailyViews.length - 1;
            return (
              <View key={i} style={styles.chartCol}>
                <Text style={[styles.chartValue, { color: colors.textMuted }]}>{day.views > 0 ? day.views : ''}</Text>
                <View style={styles.chartBarWrapper}>
                  <View style={[
                    styles.chartBar, { backgroundColor: colors.border },
                    { height: `${Math.max(heightPct, 4)}%` },
                    isToday && [styles.chartBarActive, { backgroundColor: colors.primary }]
                  ]} />
                </View>
                <Text style={[
                  styles.chartDate, { color: colors.textMuted }, 
                  isToday && [styles.chartDateActive, { color: colors.text }]
                ]}>
                  {day.date.slice(8)} {/* Just show the day number if possible, or keep slice(5) */}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Top Pages */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Páginas más visitadas</Text>
        </View>
        {data.topPages.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No hay datos suficientes</Text>
        ) : (
          data.topPages.map((p: any, i: number) => (
            <View key={i} style={[styles.listItem, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.listLeft}>
                <Text style={[styles.listIndex, { color: colors.textMuted }]}>{i + 1}</Text>
                <Text style={[styles.listPath, { color: colors.text }]} numberOfLines={1}>{p.path}</Text>
              </View>
              <Text style={[styles.listCount, { color: colors.textSecondary }]}>{p.views}</Text>
            </View>
          ))
        )}
      </View>

      {/* Referrers */}
      <View style={[styles.card, { marginBottom: 40, backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Referencias</Text>
        </View>
        {data.referrers.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No hay datos suficientes</Text>
        ) : (
          data.referrers.map((r: any, i: number) => (
            <View key={i} style={[styles.listItem, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.listLeft}>
                <Feather name="globe" size={14} color={colors.textMuted} style={{ width: 16 }} />
                <Text style={[styles.listPath, { color: colors.text }]} numberOfLines={1}>
                  {r.referrer === 'direct' ? 'Directo' : r.referrer}
                </Text>
              </View>
              <Text style={[styles.listCount, { color: colors.textSecondary }]}>{r.count}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  centerContainer: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  content: { 
    padding: 24,
    paddingBottom: 40,
  },
  header: { 
    marginBottom: 32,
    marginTop: 20,
    gap: 20,
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
  periodSelector: { 
    flexDirection: 'row', 
    borderRadius: 10, 
    padding: 4,
  },
  periodBtn: { 
    flex: 1,
    paddingVertical: 8, 
    borderRadius: 8,
    alignItems: 'center',
  },
  periodBtnActive: { 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2, 
    elevation: 1 
  },
  periodText: { 
    fontSize: 13, 
    fontWeight: '500', 
  },
  periodTextActive: { 
    fontWeight: '600',
  },
  kpiGrid: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 24 
  },
  kpiCard: { 
    flex: 1, 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: { 
    fontSize: 10, 
    fontWeight: '700', 
    letterSpacing: 0.5,
  },
  kpiValue: { 
    fontSize: 24, 
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  card: { 
    padding: 20, 
    borderRadius: 16, 
    borderWidth: 1, 
    marginBottom: 16 
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    letterSpacing: -0.3,
  },
  chartContainer: { 
    flexDirection: 'row', 
    height: 160, 
    alignItems: 'flex-end', 
    justifyContent: 'space-between' 
  },
  chartCol: { 
    flex: 1, 
    alignItems: 'center', 
    height: '100%' 
  },
  chartValue: { 
    fontSize: 10, 
    marginBottom: 6,
    fontWeight: '500',
  },
  chartBarWrapper: { 
    flex: 1, 
    width: '100%', 
    justifyContent: 'flex-end', 
    alignItems: 'center' 
  },
  chartBar: { 
    width: 24, 
    borderRadius: 4,
  },
  chartBarActive: {
  },
  chartDate: { 
    fontSize: 11, 
    marginTop: 8,
    fontWeight: '500',
  },
  chartDateActive: {
    fontWeight: '700',
  },
  listItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
  },
  listLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    flex: 1,
    paddingRight: 16,
  },
  listIndex: { 
    fontSize: 13, 
    fontWeight: '600', 
    width: 16 
  },
  listPath: { 
    fontSize: 14, 
    fontWeight: '500',
  },
  listCount: { 
    fontSize: 14, 
    fontWeight: '600', 
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  }
});
