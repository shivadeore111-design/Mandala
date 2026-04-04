import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useMandalas, useCreateMandala, Mandala } from '@/hooks/useMandala';

function MandalaListCard({ mandala }: { mandala: Mandala }) {
  const progress = mandala.target_days > 0 ? mandala.completed_days / mandala.target_days : 0;
  return (
    <View
      style={{
        backgroundColor: '#1A1A2E',
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
        marginHorizontal: 20,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 16, flex: 1 }}>
          {mandala.practice_name}
        </Text>
        <Text style={{ color: '#AFA9EC', fontWeight: '700' }}>🔥 {mandala.current_streak}</Text>
      </View>
      <Text style={{ color: '#8888AA', fontSize: 13, marginBottom: 12 }}>
        {mandala.practice_description || mandala.practice_type}
      </Text>

      <View style={{ backgroundColor: '#0F0F1A', borderRadius: 4, height: 6, marginBottom: 8 }}>
        <View
          style={{
            backgroundColor: '#7F77DD',
            borderRadius: 4,
            height: 6,
            width: `${Math.min(progress * 100, 100)}%`,
          }}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: '#8888AA', fontSize: 12 }}>
          {mandala.completed_days}/{mandala.target_days} days
        </Text>
        <Text style={{ color: '#8888AA', fontSize: 12 }}>
          Longest: {Math.max(mandala.current_streak, 0)} 🔥
        </Text>
      </View>
    </View>
  );
}

export default function MandalasScreen() {
  const { data: mandalas, isLoading } = useMandalas();
  const createMandala = useCreateMandala();
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDays, setTargetDays] = useState('40');
  const [formError, setFormError] = useState('');

  const inputStyle = {
    backgroundColor: '#0F0F1A',
    borderRadius: 10,
    padding: 14,
    color: '#F5F5F5',
    fontSize: 15,
    marginTop: 6,
  } as const;

  const handleCreate = async () => {
    if (!title.trim()) {
      setFormError('Practice name is required.');
      return;
    }
    const days = parseInt(targetDays, 10);
    if (isNaN(days) || days < 1) {
      setFormError('Target days must be a positive number.');
      return;
    }
    setFormError('');
    await createMandala.mutateAsync({
      practice_name: title.trim(),
      practice_type: 'custom',
      practice_description: description.trim(),
      target_days: days,
    });
    setModalVisible(false);
    setTitle('');
    setDescription('');
    setTargetDays('40');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F1A' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 60,
          paddingBottom: 20,
        }}
      >
        <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 24 }}>My Mandalas</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{
            backgroundColor: '#7F77DD',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>+ New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#7F77DD" />
        </View>
      ) : (
        <FlatList
          data={mandalas ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MandalaListCard mandala={item} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔱</Text>
              <Text style={{ color: '#8888AA', fontSize: 16, textAlign: 'center' }}>
                No active mandalas.{'\n'}Tap + New to begin one.
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      {/* Create Mandala Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: '#0F0F1A' }}
        >
          <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
              <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 22 }}>
                New Mandala
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#8888AA', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {formError ? (
              <Text style={{ color: '#F44336', marginBottom: 12 }}>{formError}</Text>
            ) : null}

            <Text style={{ color: '#8888AA', fontSize: 13 }}>Practice name *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Morning meditation"
              placeholderTextColor="#555577"
              style={inputStyle}
            />

            <Text style={{ color: '#8888AA', fontSize: 13, marginTop: 18 }}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What does this practice involve?"
              placeholderTextColor="#555577"
              multiline
              numberOfLines={3}
              style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
            />

            <Text style={{ color: '#8888AA', fontSize: 13, marginTop: 18 }}>Target days</Text>
            <TextInput
              value={targetDays}
              onChangeText={setTargetDays}
              keyboardType="number-pad"
              placeholder="40"
              placeholderTextColor="#555577"
              style={inputStyle}
            />

            <TouchableOpacity
              onPress={handleCreate}
              disabled={createMandala.isPending}
              style={{
                backgroundColor: '#7F77DD',
                borderRadius: 14,
                padding: 16,
                alignItems: 'center',
                marginTop: 32,
              }}
            >
              {createMandala.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                  Begin Mandala
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
