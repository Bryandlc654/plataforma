import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/auth-store';

export default function SupportScreen() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [images, setImages] = useState<any[]>([]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages([...images, ...result.assets]);
    }
  };

  const fetchTickets = async () => {
    try {
      const response: any = await api.get('/tickets');
      const resData = response.data || response;
      setTickets(Array.isArray(resData) ? resData : (Array.isArray(resData?.items) ? resData.items : []));
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const openTicket = async (ticket: any) => {
    setActiveTicket(ticket);
    try {
      const response: any = await api.get(`/tickets/${ticket.id}`);
      const data = response.data || response;
      setReplies(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch ticket messages:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'open': return { label: 'Abierto', color: '#3b82f6', bg: '#eff6ff' };
      case 'in_progress': return { label: 'En progreso', color: '#d97706', bg: '#fef3c7' };
      case 'closed': return { label: 'Cerrado', color: '#16a34a', bg: '#dcfce7' };
      default: return { label: status || 'Desconocido', color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#3b82f6';
      default: return '#64748b';
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeTicket) return;
    setSending(true);
    try {
      await api.post(`/tickets/${activeTicket.id}/reply`, { message: replyText });
      // Optimistic update
      setReplies([...replies, { id: Date.now().toString(), message: replyText, isStaffReply: false, createdAt: new Date().toISOString() }]);
      setReplyText('');
    } catch (error) {
      console.error('Failed to send reply:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const createTicket = async () => {
    if (!newSubject.trim() || !newDescription.trim()) {
      Alert.alert('Error', 'Por favor completa el asunto y la descripción');
      return;
    }
    setSending(true);
    try {
      let uploadedImages: string[] = [];
      if (images.length > 0) {
        for (const img of images) {
          const formData = new FormData();
          formData.append('file', {
            uri: img.uri,
            name: img.fileName || img.uri.split('/').pop(),
            type: img.mimeType || 'image/jpeg',
          } as any);

          const res: any = await api.post('/media/upload?folder=tickets', formData);
          
          if (res.data?.url) uploadedImages.push(res.data.url);
          else if (res.url) uploadedImages.push(res.url);
        }
      }

      const response: any = await api.post('/tickets', {
        subject: newSubject,
        description: newDescription,
        priority: 'medium',
        images: uploadedImages,
      });
      const data = response.data || response;
      setTickets([data, ...tickets]);
      setShowCreate(false);
      setNewSubject('');
      setNewDescription('');
      setImages([]);
      Alert.alert('Éxito', 'Ticket creado correctamente');
    } catch (error) {
      console.error('Failed to create ticket:', error);
      Alert.alert('Error', 'No se pudo crear el ticket');
    } finally {
      setSending(false);
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
      {/* Inbox View */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Soporte Técnico</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => setShowCreate(true)}>
          <MaterialIcons name="add-comment" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tickets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const status = getStatusBadge(item.status);
          return (
            <TouchableOpacity style={styles.ticketCard} onPress={() => setActiveTicket(item)}>
              <View style={styles.ticketTop}>
                <Text style={styles.ticketSubject}>{item.subject}</Text>
                <View style={[styles.badge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <Text style={styles.ticketPreview} numberOfLines={2}>
                {item.messages && item.messages.length > 0 ? item.messages[0].message : ''}
              </Text>
              <View style={styles.ticketBottom}>
                <View style={styles.ticketMeta}>
                  <MaterialIcons name="person" size={14} color="#94a3b8" />
                  <Text style={styles.ticketMetaText}>{item.user?.firstName || 'Usuario'}</Text>
                </View>
                <View style={styles.ticketMeta}>
                  <MaterialIcons name="flag" size={14} color={getPriorityColor(item.priority)} />
                  <Text style={styles.ticketMetaText}>Prioridad</Text>
                </View>
                <Text style={styles.ticketDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Create Ticket Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.backBtn}>
              <MaterialIcons name="close" size={24} color="#0f172a" />
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatSubject}>Nuevo Ticket</Text>
            </View>
            <View style={styles.backBtn} />
          </View>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.chatContent}>
              <Text style={styles.label}>Asunto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Problema con mi dominio..."
                value={newSubject}
                onChangeText={setNewSubject}
              />
              <Text style={[styles.label, { marginTop: 16 }]}>Descripción detallada</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe el problema o consulta con el mayor detalle posible..."
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                textAlignVertical="top"
              />
              <Text style={[styles.label, { marginTop: 16 }]}>Imágenes adjuntas (opcional)</Text>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                <MaterialIcons name="add-photo-alternate" size={24} color="#2563EB" />
                <Text style={styles.imagePickerText}>Seleccionar imágenes</Text>
              </TouchableOpacity>
              
              {images.length > 0 && (
                <View style={styles.imagesContainer}>
                  {images.map((img, i) => (
                    <View key={i} style={styles.imageBadge}>
                      <Text style={styles.imageBadgeText} numberOfLines={1}>{img.fileName || `Imagen ${i+1}`}</Text>
                      <TouchableOpacity onPress={() => setImages(images.filter((_, idx) => idx !== i))}>
                        <MaterialIcons name="close" size={16} color="#ef4444" style={{marginLeft: 4}} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity 
                style={[styles.btnPrimary, (!newSubject.trim() || !newDescription.trim()) && { backgroundColor: '#94a3b8' }]} 
                onPress={createTicket}
                disabled={!newSubject.trim() || !newDescription.trim() || sending}
              >
                {sending ? <ActivityIndicator color="white" /> : <Text style={styles.btnPrimaryText}>Crear Ticket</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Chat Modal View */}
      <Modal visible={!!activeTicket} animationType="slide">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setActiveTicket(null)} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatSubject} numberOfLines={1}>{activeTicket?.subject}</Text>
              <Text style={styles.chatSubtitle}>Ticket #{activeTicket?.id} · {getStatusBadge(activeTicket?.status || 'open').label}</Text>
            </View>
            <View style={styles.backBtn} />
          </View>

          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.chatInfo}>
              <Text style={styles.chatDescription}>{activeTicket?.description}</Text>
              {activeTicket?.images && activeTicket.images.length > 0 && (
                <View style={styles.ticketImagesContainer}>
                  {activeTicket.images.map((img: string, i: number) => (
                    <Image key={i} source={{ uri: img }} style={styles.ticketImage} />
                  ))}
                </View>
              )}
            </View>
            <FlatList
              data={replies}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.chatContent}
              renderItem={({ item }) => (
                <View style={[styles.messageBubble, item.isStaffReply ? styles.messageStaff : styles.messageUser]}>
                  {item.isStaffReply && <Text style={styles.staffName}>Soporte Técnico</Text>}
                  <Text style={[styles.messageText, !item.isStaffReply && { color: 'white' }]}>{item.message}</Text>
                  <Text style={[styles.messageTime, !item.isStaffReply && { color: '#93c5fd' }]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )}
            />

            {activeTicket?.status !== 'closed' && (
              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Escribe tu respuesta..."
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                />
                <TouchableOpacity 
                  style={[styles.sendBtn, !replyText.trim() && { backgroundColor: '#e2e8f0' }]}
                  onPress={sendReply}
                  disabled={!replyText.trim()}
                >
                  <MaterialIcons name="send" size={20} color={replyText.trim() ? "white" : "#94a3b8"} />
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
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
  ticketCard: { backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  ticketSubject: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  ticketPreview: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  ticketBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 12 },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ticketMetaText: { fontSize: 12, color: '#64748b' },
  ticketDate: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },

  /* Chat Modal */
  modalSafe: { flex: 1, backgroundColor: '#f8fafc' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  chatHeaderInfo: { flex: 1, alignItems: 'center' },
  chatSubject: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  chatSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  chatContent: { padding: 20, gap: 12 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  messageStaff: { alignSelf: 'flex-start', backgroundColor: 'white', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  messageUser: { alignSelf: 'flex-end', backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
  staffName: { fontSize: 11, fontWeight: 'bold', color: '#3b82f6', marginBottom: 4 },
  messageText: { fontSize: 15, color: '#0f172a', lineHeight: 22 },
  messageTime: { fontSize: 10, color: '#94a3b8', marginTop: 4, alignSelf: 'flex-end' },
  chatInputContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  chatInput: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  textArea: { height: 120, paddingTop: 14 },
  imagePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe', borderStyle: 'dashed' },
  imagePickerText: { marginLeft: 8, color: '#2563EB', fontWeight: '500' },
  imagesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  imageBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  imageBadgeText: { fontSize: 12, color: '#475569', maxWidth: 100 },
  chatInfo: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  chatDescription: { fontSize: 14, color: '#334155', lineHeight: 20 },
  ticketImagesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  ticketImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f1f5f9' },
  btnPrimary: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  btnPrimaryText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
