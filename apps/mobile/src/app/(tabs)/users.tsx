import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/auth-store';

interface Role {
  id: string;
  name: string;
  level: string;
}

export default function UsersScreen() {
  const [members, setMembers] = useState<any[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  
  const tenantId = useAuthStore(state => state.tenantId);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      if (!tenantId) return;
      try {
        const response: any = await api.get(`/tenants/${tenantId}/users`);
        if (isMounted) {
          const usersData = response.data || response;
          // The endpoint returns tenant members, we map them for the UI
          setMembers(usersData.map((item: any) => ({
            id: item.user?.id || item.id,
            userTenantId: item.id,
            name: (item.user?.firstName || '') + ' ' + (item.user?.lastName || ''),
            email: item.user?.email || '',
            isOwner: item.role?.name === 'Propietario',
            roles: item.role?.name ? [item.role.name] : ['Sin Rol']
          })));
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const fetchRoles = async () => {
      try {
        const response: any = await api.get('/roles');
        if (isMounted) {
          const arr = Array.isArray(response.data || response) ? (response.data || response) : [];
          setAvailableRoles(arr);
          if (arr.length > 0) setSelectedRole(arr[0]);
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      }
    };

    fetchUsers();
    fetchRoles();
    return () => { isMounted = false; };
  }, [tenantId]);

  const handleInvite = async () => {
    if (!inviteEmail || !tenantId) return;
    try {
      await api.post(`/invitations`, {
        email: inviteEmail,
        roleId: selectedRole?.id,
        tenantId
      });
      setShowInvite(false);
      setInviteEmail('');
      Alert.alert('Éxito', 'Invitación enviada');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo invitar');
    }
  };

  const removeMember = async (userTenantId: string, id: string) => {
    try {
      await api.delete(`/tenants/${tenantId}/members/${userTenantId}`);
      setMembers(members.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo remover al usuario');
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
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => setShowInvite(true)}>
          <MaterialIcons name="person-add" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={members}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>
              </View>
              {!item.isOwner && (
                <TouchableOpacity onPress={() => removeMember(item.userTenantId, item.id)}>
                  <MaterialIcons name="person-remove" size={22} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.rolesContainer}>
              {item.isOwner ? (
                <View style={[styles.roleChip, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                  <Text style={[styles.roleText, { color: '#1d4ed8' }]}>Propietario</Text>
                </View>
              ) : (
                <>
                  {(item.roles as string[]).map((r: string) => (
                    <View key={r} style={styles.roleChip}>
                      <Text style={styles.roleText}>{r}</Text>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addRoleChip}>
                    <MaterialIcons name="add" size={14} color="#64748b" />
                    <Text style={styles.addRoleText}>Añadir Rol</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      />

      <Modal visible={showInvite} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invitar Usuario</Text>
            <TouchableOpacity onPress={() => setShowInvite(false)} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.field}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="usuario@email.com"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Asignar Rol</Text>
              <View style={styles.roleSelectGrid}>
                {availableRoles.map(r => (
                  <TouchableOpacity 
                    key={r.id}
                    style={[styles.roleSelectBtn, selectedRole?.id === r.id && styles.roleSelectBtnActive]}
                    onPress={() => setSelectedRole(r)}
                  >
                    <Text style={[styles.roleSelectText, selectedRole?.id === r.id && styles.roleSelectTextActive]}>{r.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleInvite}>
              <Text style={styles.btnPrimaryText}>Enviar Invitación</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  list: { padding: 20, gap: 16 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  userEmail: { fontSize: 13, color: '#64748b' },
  rolesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f8fafc', borderRadius: 999, borderWidth: 1, borderColor: '#e2e8f0' },
  roleText: { fontSize: 12, fontWeight: '500', color: '#475569' },
  addRoleChip: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'white', borderRadius: 999, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed' },
  addRoleText: { fontSize: 12, fontWeight: '500', color: '#64748b' },

  modalSafe: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  closeBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 },
  modalContent: { padding: 20 },
  field: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  roleSelectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleSelectBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10 },
  roleSelectBtnActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  roleSelectText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  roleSelectTextActive: { color: '#1d4ed8', fontWeight: 'bold' },
  btnPrimary: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  btnPrimaryText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
