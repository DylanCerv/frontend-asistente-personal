import Ionicons from '@react-native-vector-icons/ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { CaptureActivityItem } from '@/components/capture-activity-item';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenSafeArea } from '@/components/screen-safe-area';
import {
  APP_ACCENT,
  APP_BACKGROUND,
  APP_BORDER,
  APP_DANGER,
  APP_ON_ACCENT,
  APP_SURFACE,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';
import { listJobs, type CaptureJobRow } from '@/services/audio/list-jobs';

const PAGE_SIZE = 15;

export default function ActivityScreen() {
  const [jobs, setJobs] = useState<CaptureJobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canGoBack = page > 0;
  const canGoNext = page + 1 < pageCount;

  const loadPage = useCallback(async (nextPage: number, mode: 'load' | 'refresh' = 'load') => {
    if (mode === 'refresh') setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const result = await listJobs({
        limit: PAGE_SIZE,
        offset: nextPage * PAGE_SIZE,
      });
      setJobs(result.data);
      setTotal(result.count);
      setPage(nextPage);
      setError(null);
    } catch {
      setError('No pude cargar el registro de actividad.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(0);
  }, [loadPage]);

  const rangeLabel = useMemo(() => {
    if (total === 0) return 'Sin capturas';
    const start = page * PAGE_SIZE + 1;
    const end = Math.min(total, (page + 1) * PAGE_SIZE);
    return `${start}–${end} de ${total}`;
  }, [page, total]);

  return (
    <ScreenSafeArea>
      <View className="flex-1" style={{ backgroundColor: APP_BACKGROUND }}>
        <ScreenHeader
          title="Actividad"
          subtitle="Registro de lo que Kivo entendió de cada captura"
        />

        {isLoading && jobs.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={APP_ACCENT} />
          </View>
        ) : error && jobs.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-center text-sm" style={{ color: APP_DANGER }}>
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadPage(page)}
              className="mt-4 rounded-xl px-4 py-2.5 active:opacity-80"
              style={{ backgroundColor: APP_SURFACE, borderWidth: 1, borderColor: APP_BORDER }}>
              <Text className="text-sm font-semibold" style={{ color: APP_ACCENT }}>
                Reintentar
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => void loadPage(page, 'refresh')}
                tintColor={APP_ACCENT}
                colors={[APP_ACCENT]}
              />
            }
            ListEmptyComponent={
              <Text className="px-1 py-8 text-center text-sm leading-5" style={{ color: APP_TEXT_MUTED }}>
                Aún no hay capturas. Habla o escribe y aquí verás exactamente qué hizo Kivo.
              </Text>
            }
            renderItem={({ item }) => <CaptureActivityItem job={item} />}
            ListFooterComponent={
              total > 0 ? (
                <View className="mt-4 gap-3">
                  <Text className="text-center text-[12px]" style={{ color: APP_TEXT_MUTED }}>
                    {rangeLabel}
                  </Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Página anterior"
                      disabled={!canGoBack || isLoading}
                      onPress={() => void loadPage(page - 1)}
                      className="min-h-[44px] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border active:opacity-80"
                      style={{
                        borderColor: APP_BORDER,
                        backgroundColor: APP_SURFACE,
                        opacity: !canGoBack || isLoading ? 0.45 : 1,
                      }}>
                      <Ionicons name="chevron-back" size={16} color={APP_ACCENT} />
                      <Text className="text-[13px] font-semibold" style={{ color: APP_ACCENT }}>
                        Anterior
                      </Text>
                    </Pressable>
                    <View
                      className="min-h-[44px] min-w-[72px] items-center justify-center rounded-xl"
                      style={{ backgroundColor: APP_ACCENT }}>
                      <Text className="text-[13px] font-bold" style={{ color: APP_ON_ACCENT }}>
                        {page + 1}/{pageCount}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Página siguiente"
                      disabled={!canGoNext || isLoading}
                      onPress={() => void loadPage(page + 1)}
                      className="min-h-[44px] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border active:opacity-80"
                      style={{
                        borderColor: APP_BORDER,
                        backgroundColor: APP_SURFACE,
                        opacity: !canGoNext || isLoading ? 0.45 : 1,
                      }}>
                      <Text className="text-[13px] font-semibold" style={{ color: APP_ACCENT }}>
                        Siguiente
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={APP_ACCENT} />
                    </Pressable>
                  </View>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </ScreenSafeArea>
  );
}
