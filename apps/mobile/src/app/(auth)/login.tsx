import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';

const BRAND = {
  dark: '#201b51',
  orange: '#f29200',
  white: '#FFFFFF',
  muted: '#b8b5d0',
  inputBg: 'rgba(255,255,255,0.08)',
  inputBorder: 'rgba(255,255,255,0.15)',
  inputBorderFocus: '#f29200',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña');
      return;
    }

    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Credenciales incorrectas. Intenta de nuevo.';
      setError(msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.topSection}>
          <View style={styles.brandHeader}>
            <View style={styles.logoRow}>
              <Image source={require('../../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
          </View>

          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              Tu presencia digital,{'\n'}
              <Text style={styles.heroAccent}>simplificada.</Text>
            </Text>
            <Text style={styles.heroDesc}>
              Crea sitios web profesionales, captura leads y administra tu negocio desde un solo lugar.
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>100+</Text>
              <Text style={styles.statLabel}>Negocios activos</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>99.9%</Text>
              <Text style={styles.statLabel}>Uptime</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>24/7</Text>
              <Text style={styles.statLabel}>Soporte</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Iniciar sesión</Text>
            <Text style={styles.formSubtitle}>Ingresa tus credenciales para acceder al panel</Text>

            {error && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={18} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={[
                styles.inputContainer,
                focused === 'email' && styles.inputContainerFocused,
              ]}>
                <Feather name="mail" size={18} color={focused === 'email' ? BRAND.orange : '#94a3b8'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="tu@correo.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(null); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={[
                styles.inputContainer,
                focused === 'password' && styles.inputContainerFocused,
              ]}>
                <Feather name="lock" size={18} color={focused === 'password' ? BRAND.orange : '#94a3b8'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(null); }}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={BRAND.white} />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Iniciar sesión</Text>
                  <Feather name="arrow-right" size={18} color={BRAND.white} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            © 2026 Build Iceberg Agency
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.dark,
  },
  keyboardView: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 24,
  },
  brandHeader: {
    marginBottom: 32,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 200,
    height: 56,
    tintColor: '#FFFFFF',
  },
  heroSection: {
    marginBottom: 28,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: BRAND.white,
    lineHeight: 34,
    marginBottom: 10,
  },
  heroAccent: {
    color: BRAND.orange,
  },
  heroDesc: {
    fontSize: 14,
    color: BRAND.muted,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  stat: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.orange,
  },
  statLabel: {
    fontSize: 11,
    color: BRAND.muted,
    marginTop: 2,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: BRAND.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    alignItems: 'center',
  },
  formCard: {
    width: '100%',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 14,
  },
  inputContainerFocused: {
    borderColor: BRAND.orange,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: BRAND.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: BRAND.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.white,
  },
  footer: {
    marginTop: 24,
    fontSize: 12,
    color: '#94a3b8',
  },
});
