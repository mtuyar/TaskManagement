import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [usernameChecking, setUsernameChecking] = useState(false);
  
  const { signUp, loading, checkUsernameAvailability } = useAuth();

  // Form güncelleme
  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Hata varsa temizle
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Username kontrolü
  const checkUsername = async (username) => {
    if (!username || username.length < 3) return;
    
    setUsernameChecking(true);
    
    try {
      const result = await checkUsernameAvailability(username);
      
      if (result.error) {
        setErrors(prev => ({ ...prev, username: result.error }));
      } else if (!result.available) {
        setErrors(prev => ({ ...prev, username: 'Bu kullanıcı adı zaten kullanımda' }));
      } else {
        setErrors(prev => ({ ...prev, username: null }));
      }
    } catch (error) {
      console.error('Username check error:', error);
    } finally {
      setUsernameChecking(false);
    }
  };

  // Form validasyonu
  const validateForm = () => {
    const newErrors = {};
    const { email, password, confirmPassword, username, displayName } = formData;

    // E-posta
    if (!email.trim()) {
      newErrors.email = 'E-posta adresi gerekli';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    // Username
    if (!username.trim()) {
      newErrors.username = 'Kullanıcı adı gerekli';
    } else if (username.length < 3) {
      newErrors.username = 'Kullanıcı adı en az 3 karakter olmalı';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Kullanıcı adı sadece harf, rakam ve _ içerebilir';
    }

    // Display name
    if (!displayName.trim()) {
      newErrors.displayName = 'Görünen ad gerekli';
    } else if (displayName.length < 2) {
      newErrors.displayName = 'Görünen ad en az 2 karakter olmalı';
    }

    // Şifre
    if (!password.trim()) {
      newErrors.password = 'Şifre gerekli';
    } else if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
    }

    // Şifre onayı
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Şifre onayı gerekli';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Kayıt ol
  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      const { email, password, username, displayName } = formData;
      
      const result = await signUp(
        email.trim(), 
        password, 
        username.trim(), 
        displayName.trim()
      );
      
      if (result.success) {
        Alert.alert(
          'Kayıt Başarılı', 
          result.message || 'Hesabınız oluşturuldu! Lütfen e-postanızı kontrol edin.',
          [
            { 
              text: 'Tamam', 
              onPress: () => navigation.navigate('Login') 
            }
          ]
        );
      } else {
        // Email validation hatası özel olarak handle et
        const errorMessage = result.error || 'Bir hata oluştu';
        let title = 'Kayıt Hatası';
        let message = errorMessage;
        
        if (errorMessage.includes('Email address') && errorMessage.includes('invalid')) {
          title = 'Geçersiz E-posta';
          message = 'Lütfen geçerli bir e-posta adresi girin.\n\nÖrnekler:\n• yourname@gmail.com\n• example@outlook.com\n• test123@hotmail.com\n\nNot: Basit test email\'leri (test@gmail.com) kabul edilmez.';
        } else if (errorMessage.includes('already registered')) {
          title = 'E-posta Zaten Kayıtlı';
          message = 'Bu e-posta adresi zaten kullanılıyor. Giriş yapmayı deneyin.';
        } else if (errorMessage.includes('username')) {
          title = 'Kullanıcı Adı Hatası';
          message = 'Bu kullanıcı adı zaten alınmış. Farklı bir kullanıcı adı deneyin.';
        }
        
        Alert.alert(title, message);
      }
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#4A6FFF', '#6C63FF', '#8A84FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <Icon name="account-plus" size={60} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>
              Vazife takibine başlamak için kayıt ol
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* E-posta */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>E-posta</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Icon name="email-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="ornek@email.com"
                  placeholderTextColor="#999"
                  value={formData.email}
                  onChangeText={(text) => updateForm('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Kullanıcı Adı */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Kullanıcı Adı</Text>
              <View style={[styles.inputWrapper, errors.username && styles.inputError]}>
                <Icon name="account-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="kullanici_adi"
                  placeholderTextColor="#999"
                  value={formData.username}
                  onChangeText={(text) => updateForm('username', text.toLowerCase())}
                  onBlur={() => checkUsername(formData.username)}
                  autoCapitalize="none"
                  autoComplete="username"
                />
                {usernameChecking && (
                  <ActivityIndicator size="small" color="#666" />
                )}
              </View>
              {errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}
              {!errors.username && formData.username.length >= 3 && !usernameChecking && (
                <Text style={styles.successText}>✓ Kullanıcı adı uygun</Text>
              )}
            </View>

            {/* Görünen Ad */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Görünen Ad</Text>
              <View style={[styles.inputWrapper, errors.displayName && styles.inputError]}>
                <Icon name="account-circle-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Adınız Soyadınız"
                  placeholderTextColor="#999"
                  value={formData.displayName}
                  onChangeText={(text) => updateForm('displayName', text)}
                  autoComplete="name"
                />
              </View>
              {errors.displayName && (
                <Text style={styles.errorText}>{errors.displayName}</Text>
              )}
            </View>

            {/* Şifre */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Şifre</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="En az 6 karakter"
                  placeholderTextColor="#999"
                  value={formData.password}
                  onChangeText={(text) => updateForm('password', text)}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Şifre Onayı */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Şifre Onayı</Text>
              <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                <Icon name="lock-check-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Şifrenizi tekrar girin"
                  placeholderTextColor="#999"
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateForm('confirmPassword', text)}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon 
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Kayıt Ol Butonu */}
            <TouchableOpacity
              style={[styles.signUpButton, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.signUpButtonText}>Kayıt Ol</Text>
                  <Icon name="account-check" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Giriş Yap Linki */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Zaten hesabın var mı? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signInLink}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#F8F9FA',
  },
  inputError: {
    borderColor: '#F44336',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
    marginLeft: 4,
  },
  successText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    marginLeft: 4,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A6FFF',
    borderRadius: 12,
    height: 50,
    marginBottom: 20,
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    color: '#666',
  },
  signInLink: {
    fontSize: 14,
    color: '#4A6FFF',
    fontWeight: '600',
  },
});

export default RegisterScreen; 