import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { usePlans } from '@/contexts/PlansContext';
import { Plan } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

interface PlanForm {
  name: string;
  type: 'hours' | 'days';
  duration: string;
  price: string;
  uploadSpeed: string;
  downloadSpeed: string;
}

const EMPTY_FORM: PlanForm = {
  name: '',
  type: 'hours',
  duration: '1',
  price: '1.00',
  uploadSpeed: '5',
  downloadSpeed: '5',
};

function validateForm(form: PlanForm): string | null {
  if (!form.name.trim()) return 'El nombre es requerido';
  const dur = Number(form.duration);
  if (!Number.isInteger(dur) || dur < 1) return 'Duración debe ser un número entero positivo';
  const price = Number(form.price);
  if (isNaN(price) || price < 0) return 'Precio inválido';
  const up = Number(form.uploadSpeed);
  const down = Number(form.downloadSpeed);
  if (isNaN(up) || up <= 0) return 'Velocidad de subida inválida';
  if (isNaN(down) || down <= 0) return 'Velocidad de bajada inválida';
  return null;
}

function PlanFormModal({
  visible,
  editPlan,
  onClose,
  onSave,
}: {
  visible: boolean;
  editPlan: Plan | null;
  onClose: () => void;
  onSave: (form: PlanForm) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<PlanForm>(
    editPlan
      ? {
          name: editPlan.name,
          type: editPlan.type,
          duration: String(editPlan.duration),
          price: String(editPlan.price),
          uploadSpeed: String(editPlan.uploadSpeed),
          downloadSpeed: String(editPlan.downloadSpeed),
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (visible) {
      setForm(
        editPlan
          ? {
              name: editPlan.name,
              type: editPlan.type,
              duration: String(editPlan.duration),
              price: String(editPlan.price),
              uploadSpeed: String(editPlan.uploadSpeed),
              downloadSpeed: String(editPlan.downloadSpeed),
            }
          : EMPTY_FORM,
      );
      setError('');
    }
  }, [visible, editPlan]);

  function handleSave() {
    const err = validateForm(form);
    if (err) { setError(err); return; }
    onSave(form);
  }

  const inputStyle = [
    styles.modalInput,
    { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <KeyboardAwareScrollViewCompat bottomOffset={20} keyboardShouldPersistTaps="handled">
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 },
            ]}
          >
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editPlan ? 'Editar Plan' : 'Nuevo Plan'}
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {/* Name */}
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Nombre del plan</Text>
            <TextInput
              style={inputStyle}
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
              placeholder="Ej. 1 Hora, 1 Día..."
              placeholderTextColor={colors.mutedForeground}
            />

            {/* Type selector */}
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Tipo de duración</Text>
            <View style={styles.typeRow}>
              {(['hours', 'days'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setForm({ ...form, type: t })}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: form.type === t ? colors.primary : colors.input,
                      borderColor: form.type === t ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      { color: form.type === t ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {t === 'hours' ? 'Horas' : 'Días'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Duration */}
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Duración (número de {form.type === 'hours' ? 'horas' : 'días'})
            </Text>
            <TextInput
              style={inputStyle}
              value={form.duration}
              onChangeText={(t) => setForm({ ...form, duration: t })}
              placeholder="1"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
            />

            {/* Price */}
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Precio ($)</Text>
            <TextInput
              style={inputStyle}
              value={form.price}
              onChangeText={(t) => setForm({ ...form, price: t })}
              placeholder="1.00"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
            />

            {/* Speed */}
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Velocidad de bajada (Mbps)</Text>
            <TextInput
              style={inputStyle}
              value={form.downloadSpeed}
              onChangeText={(t) => setForm({ ...form, downloadSpeed: t })}
              placeholder="5"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
            />
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Velocidad de subida (Mbps)</Text>
            <TextInput
              style={inputStyle}
              value={form.uploadSpeed}
              onChangeText={(t) => setForm({ ...form, uploadSpeed: t })}
              placeholder="5"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
            />

            {error ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            ) : null}

            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
                {editPlan ? 'Guardar Cambios' : 'Crear Plan'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAwareScrollViewCompat>
      </View>
    </Modal>
  );
}

export default function PlansScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plans, isLoading, addPlan, updatePlan, deletePlan } = usePlans();
  const [modalVisible, setModalVisible] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);

  const paddingTop = insets.top + (Platform.OS === 'web' ? 67 : 0);

  async function handleSave(form: PlanForm) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const planData = {
      name: form.name.trim(),
      type: form.type,
      duration: Number(form.duration),
      price: Number(form.price),
      uploadSpeed: Number(form.uploadSpeed),
      downloadSpeed: Number(form.downloadSpeed),
    };
    if (editPlan) {
      await updatePlan(editPlan.id, planData);
    } else {
      await addPlan(planData);
    }
    setModalVisible(false);
    setEditPlan(null);
  }

  function handleDelete(plan: Plan) {
    Alert.alert('Eliminar Plan', `¿Eliminar "${plan.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deletePlan(plan.id);
        },
      },
    ]);
  }

  function handleEdit(plan: Plan) {
    setEditPlan(plan);
    setModalVisible(true);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Planes</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {plans.length} plan{plans.length !== 1 ? 'es' : ''}
          </Text>
        </View>
        <Pressable
          onPress={() => { setEditPlan(null); setModalVisible(true); }}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="plus" size={22} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : plans.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="clock-outline" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin planes</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Toca el botón + para crear tu primer plan
          </Text>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={[styles.planRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View
                style={[styles.planIcon, { backgroundColor: colors.primary + '22' }]}
              >
                <MaterialCommunityIcons
                  name={item.type === 'hours' ? 'clock-outline' : 'calendar-outline'}
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={styles.planInfo}>
                <Text style={[styles.planName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.planMeta, { color: colors.mutedForeground }]}>
                  {item.duration} {item.type === 'hours' ? 'h' : 'd'} · ↓{item.downloadSpeed}/↑{item.uploadSpeed} Mbps
                </Text>
              </View>
              <Text style={[styles.planPrice, { color: colors.primary }]}>
                ${item.price.toFixed(2)}
              </Text>
              <Pressable
                onPress={() => handleEdit(item)}
                hitSlop={10}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Feather name="edit-2" size={17} color={colors.mutedForeground} />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(item)}
                hitSlop={10}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Feather name="trash-2" size={17} color={colors.destructive} />
              </Pressable>
            </View>
          )}
        />
      )}

      <PlanFormModal
        visible={modalVisible}
        editPlan={editPlan}
        onClose={() => { setModalVisible(false); setEditPlan(null); }}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 60 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', maxWidth: 260 },
  listContent: { paddingBottom: 24, gap: 10 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  planIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planInfo: { flex: 1 },
  planName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  planMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  planPrice: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 6, marginTop: 12 },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 6 },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
