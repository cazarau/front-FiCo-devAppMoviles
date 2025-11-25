/**
 * Pantalla de Inicio de Sesión
 * 
 * Componente que maneja la autenticación de usuarios con las siguientes características:
 * - Validación de correo electrónico y contraseña
 * - Funcionalidad de "Recordarme" para persistir credenciales
 * - Opciones de visibilidad de contraseña
 * - Manejo de errores con mensajes descriptivos
 * 
 * @component
 */

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() { 
  // === Estados del componente ===
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation();

  /**
   * Efecto: Cargar credenciales guardadas al montar el componente
   * 
   * Se ejecuta una vez al inicializar la pantalla para recuperar
   * las credenciales almacenadas si el usuario previamente seleccionó "Recordarme"
   */
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('savedEmail');
        const savedPassword = await AsyncStorage.getItem('savedPassword');
        const savedRememberMe = await AsyncStorage.getItem('rememberMe');
        
        // Restaurar credenciales solo si se guardaron previamente
        if (savedRememberMe === 'true' && savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (error) {
        console.log('Error al cargar credenciales guardadas: ', error);
      }
    };

    loadSavedCredentials();
  }, []);

  /**
   * Manejador de inicio de sesión
   * 
   * Realiza las siguientes validaciones antes de autenticar:
   * 1. Verifica que el email no esté vacío
   * 2. Verifica que la contraseña no esté vacía
   * 3. Valida el formato del email mediante expresión regular
   * 
   * Si las validaciones pasan:
   * - Guarda las credenciales si "Recordarme" está activado
   * - Almacena el nombre de usuario (parte del email antes del @)
   * - Navega al dashboard de gastos
   */
  const handleLogin = async () => {
    // Validación 1: Email no vacío
    if (!email.trim()) {
      setErrorMessage('Por favor ingrese su correo electrónico');
      return;
    }

    // Validación 2: Contraseña no vacía
    if (!password) {
      setErrorMessage('Por favor ingrese su contraseña');
      return;
    }

    // Validación 3: Formato de email válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Por favor ingrese un correo electrónico válido');
      return;
    }

    try {
      // Gestionar la opción "Recordarme"
      if (rememberMe) {
        // Guardar credenciales para futuras sesiones
        await AsyncStorage.setItem('savedEmail', email);
        await AsyncStorage.setItem('savedPassword', password);
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        // Eliminar credenciales guardadas si la opción no está activada
        await AsyncStorage.removeItem('savedEmail');
        await AsyncStorage.removeItem('savedPassword');
        await AsyncStorage.removeItem('rememberMe');
      }

      // Extraer nombre de usuario del email y guardarlo
      await AsyncStorage.setItem('username', email.split('@')[0]);
      console.log('Usuario autenticado:', email);
      
      // Navegar al dashboard reemplazando la pantalla actual
      navigation.replace('ExpenseDashboard');
    } catch (error) {
      console.log('Error al guardar datos:', error);
      setErrorMessage('Error al iniciar sesión. Por favor intente nuevamente.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* === Logo de la aplicación FiCo === */}
          <View style={styles.logoContainer}>
            {/* Icono de teléfono estilizado con pantalla de recibo */}
            <View style={styles.phoneIcon}>
              <View style={styles.phoneScreen}>
                <Ionicons name="receipt-outline" size={24} color="#fff" />
              </View>
            </View>
            {/* Marca de verificación en esquina del logo */}
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
            <Text style={styles.brandName}>FiCo</Text>
          </View>

          {/* === Textos de bienvenida === */}
          <Text style={styles.welcomeText}>Bienvenido</Text>
          <Text style={styles.instructionText}>
            Ingrese los datos que se solicitan.
          </Text>

          {/* === Mensaje de error === */}
          {/* Solo se muestra si errorMessage tiene contenido */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* === Campo de correo electrónico === */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Ingrese su correo electrónico"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage(''); // Limpiar error al escribir
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {/* Botón para limpiar el campo (solo visible cuando hay texto) */}
              {email.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setEmail('')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* === Campo de contraseña === */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Ingrese su contraseña"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage(''); // Limpiar error al escribir
                }}
                secureTextEntry={!showPassword} // Alternar visibilidad
                autoCapitalize="none"
                autoComplete="password"
              />
              {/* Botón para mostrar/ocultar contraseña */}
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* === Opciones: Recordarme y Olvidé mi contraseña === */}
          <View style={styles.optionsRow}>
            {/* Checkbox "Recordarme" */}
            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Recordarme</Text>
            </TouchableOpacity>

            {/* Link "¿Olvidaste tu contraseña?" */}
            <TouchableOpacity onPress={() => {
              // TODO: Implementar pantalla de recuperación de contraseña
              console.log('Olvidé mi contraseña');
            }}>
              <Text style={styles.forgotPasswordText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>
          </View>

          {/* === Botón de inicio de sesión === */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Ingresar</Text>
          </TouchableOpacity>

          {/* === Link para crear cuenta === */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>No tiene una cuenta? </Text>
            <TouchableOpacity onPress={() => {
              // TODO: Implementar pantalla de registro
              console.log('Crear cuenta');
            }}>
              <Text style={styles.registerLink}>Cree una cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Estilos del componente LoginScreen
 * 
 * Organización de estilos:
 * - Container y layout principal
 * - Logo y branding
 * - Campos de entrada
 * - Botones y controles
 * - Estados y variaciones
 */
const styles = StyleSheet.create({
  // === Contenedores principales ===
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // === Logo y branding ===
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  phoneIcon: {
    width: 64,
    height: 80,
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneScreen: {
    flex: 1,
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 12,
  },
  
  // === Textos informativos ===
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 24,
    textAlign: 'center',
  },
  
  // === Mensajes de error ===
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // === Campos de entrada ===
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111',
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  eyeButton: {
    padding: 4,
  },
  
  // === Opciones adicionales ===
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  
  // === Botones ===
  loginButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  
  // === Registro ===
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
});