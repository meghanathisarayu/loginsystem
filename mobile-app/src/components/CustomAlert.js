import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  Animated 
} from 'react-native';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info,
  AlertCircle
} from 'lucide-react-native';
import { theme } from '../styles/theme';

const CustomAlert = ({ 
  visible, 
  type = 'info', 
  title, 
  message, 
  onClose, 
  onConfirm, 
  confirmText = 'OK', 
  cancelText = 'Cancel',
  showCancel = false 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 size={50} color={theme.colors.success} />;
      case 'error': return <XCircle size={50} color={theme.colors.error} />;
      case 'warning': return <AlertTriangle size={50} color="#f59e0b" />;
      default: return <Info size={50} color={theme.colors.primary} />;
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case 'success': return theme.colors.success;
      case 'error': return theme.colors.error;
      case 'warning': return '#f59e0b';
      default: return theme.colors.primary;
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <View style={[styles.iconContainer, { backgroundColor: getHeaderColor() + '15' }]}>
            {getIcon()}
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {showCancel && (
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: getHeaderColor() }]} 
              onPress={onConfirm || onClose}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textMain,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  }
});

export default CustomAlert;
