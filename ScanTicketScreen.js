/**
 * Pantalla de Escaneo de Tickets
 * 
 * Permite al usuario escanear tickets/recibos usando la cámara del dispositivo.
 * Características:
 * - Acceso y control de la cámara del dispositivo
 * - Solicitud y manejo de permisos de cámara
 * - Captura de fotos de tickets
 * - Frame de guía para posicionar el ticket
 * - Controles de flash y galería (preparados para futura implementación)
 * - Alternancia entre cámara frontal y trasera
 * 
 * NOTA: Actualmente la funcionalidad OCR (reconocimiento de texto) no está
 * implementada. Las fotos capturadas redirigen a entrada manual.
 * 
 * @component
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

export default function ScanTicketScreen({ navigation }) {
  // Hook de permisos de cámara de Expo
  const [permission, requestPermission] = useCameraPermissions();
  
  // Estados del componente
  const [cameraRef, setCameraRef] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing, setFacing] = useState('back'); // 'back' o 'front'

  /**
   * Efecto: Solicitar permisos de cámara al montar el componente
   * 
   * Si los permisos no están otorgados pero se pueden solicitar,
   * automáticamente abre el diálogo de permisos.
   */
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  /**
   * Capturar foto del ticket
   * 
   * Toma una foto con la cámara y muestra un diálogo informativo.
   * En producción, aquí se procesaría la imagen con OCR para extraer
   * texto y datos del ticket.
   * 
   * TODO: Implementar procesamiento OCR real
   */
  const takePicture = async () => {
    if (cameraRef && !isProcessing) {
      setIsProcessing(true);
      try {
        // Capturar foto con configuración de calidad
        const photo = await cameraRef.takePictureAsync({
          quality: 0.8, // 0-1, donde 1 es máxima calidad
          base64: true, // Incluir representación base64 para procesamiento
        });

        // Informar al usuario sobre la captura
        Alert.alert(
          'Ticket Capturado',
          'La imagen se ha capturado correctamente. En producción, aquí se procesaría el texto del ticket usando OCR.',
          [
            {
              text: 'Ingresar manualmente',
              onPress: () => navigation.replace('ManualEntry')
            },
            {
              text: 'Intentar de nuevo',
              onPress: () => setIsProcessing(false)
            }
          ]
        );
      } catch (error) {
        console.error('Error al capturar foto:', error);
        Alert.alert('Error', 'No se pudo capturar la imagen');
        setIsProcessing(false);
      }
    }
  };

  // === Pantalla de Carga ===
  // Mientras se verifica el estado de permisos
  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Solicitando permisos de cámara...</Text>
      </View>
    );
  }

  // === Pantalla de Permisos Denegados ===
  // Cuando el usuario no ha otorgado permisos de cámara
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off" size={64} color="#fff" />
        <Text style={styles.noPermissionText}>
          No hay acceso a la cámara
        </Text>
        <Text style={styles.noPermissionSubtext}>
          Por favor, habilita los permisos de cámara en la configuración de tu dispositivo
        </Text>
        {/* Botón para reintentar solicitud de permisos */}
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Solicitar Permiso</Text>
        </TouchableOpacity>
        {/* Botón para volver */}
        <TouchableOpacity 
          style={styles.backButtonAlt}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // === Pantalla Principal de Escaneo ===
  return (
    <View style={styles.container}>
      {/* Vista de la cámara (capa de fondo) */}
      <CameraView 
        style={styles.camera} 
        ref={ref => setCameraRef(ref)}
        facing={facing}
      />
      
      {/* Overlay con controles (capa superior) */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* === Header === */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#111" />
            <Text style={styles.backText}>Regresar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Escanear</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* === Frame de Guía === */}
        {/* Indica al usuario dónde posicionar el ticket */}
        <View style={styles.frameContainer} pointerEvents="none">
          <View style={styles.frame}>
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera-outline" size={48} color="#fff" />
            </View>
          </View>
          <Text style={styles.instructionText}>
            Colocar el recibo en el marco
          </Text>
          <Text style={styles.instructionSubtext}>
            Asegurarse de que todas las esquinas estén visibles
          </Text>
        </View>

        {/* === Controles Inferiores === */}
        <View style={styles.controls}>
          {/* Botón de Flash (preparado para futura implementación) */}
          <TouchableOpacity style={styles.flashButton}>
            <Ionicons name="flash-off-outline" size={24} color="#fff" />
          </TouchableOpacity>
          
          {/* Botón de Captura (principal) */}
          <TouchableOpacity 
            style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isProcessing}
          >
            <View style={styles.captureButtonInner}>
              <Ionicons name="camera-outline" size={32} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Botón de Galería (preparado para futura implementación) */}
          <TouchableOpacity style={styles.galleryButton}>
            <Ionicons name="images-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/**
 * Estilos del componente ScanTicketScreen
 */
const styles = StyleSheet.create({
  // === Contenedor principal ===
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // === Estados de carga y permisos ===
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  
  // === Vista de cámara ===
  camera: {
    ...StyleSheet.absoluteFillObject, // Ocupa toda la pantalla
  },
  
  // === Overlay ===
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 58, 138, 0.7)', // Tinte azul semi-transparente
  },
  
  // === Header ===
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40, // Safe area para iOS
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  backText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  headerSpacer: {
    width: 100,
  },
  
  // === Frame de guía ===
  frameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  frame: {
    width: '100%',
    aspectRatio: 0.7, // Proporción típica de un recibo
    borderWidth: 2,
    borderColor: '#fff',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cameraIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
  },
  instructionSubtext: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
  
  // === Controles ===
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  flashButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.5, // Visual de deshabilitado
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // === Pantalla de permisos ===
  noPermissionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noPermissionSubtext: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
  },
  permissionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonAlt: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});