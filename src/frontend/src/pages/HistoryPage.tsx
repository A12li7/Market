import { AnalysisDetailModal } from "@/components/AnalysisDetailModal";
import { AnalysisHistoryCard } from "@/components/AnalysisHistoryCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteAnalysis, useListAnalyses } from "@/hooks/useQueries";
import type { AnalysisRecord } from "@/types";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CandlestickChart,
  History,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

const SKELETON_IDS = Array.from(
  { length: 4 },
  (_, i) => `history-skeleton-${i}`,
);

export function HistoryPage() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useListAnalyses();
  const deleteAnalysis = useDeleteAnalysis();

  const [selected, setSelected] = useState<AnalysisRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AnalysisRecord | null>(
    null,
  );

  const records = data ?? [];

  function handleOpen(record: AnalysisRecord) {
    setSelected(record);
    setDetailOpen(true);
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    deleteAnalysis.mutate(target.id, {
      onSuccess: () => setPendingDelete(null),
      onError: () => setPendingDelete(null),
    });
  }

  return (
    <div className="container py-8 md:py-12" data-ocid="history.page">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
            <History className="size-4" aria-hidden="true" />
            أرشيف التحليلات
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            سجل التحليلات
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            كل التحليلات الفنية التي أنشأتها محفوظة هنا. افتح أي تحليل لعرض
            تفاصيله الكاملة أو احذفه من السجل.
          </p>
        </div>

        {!isLoading && !isError && records.length > 0 && (
          <p className="shrink-0 text-sm text-muted-foreground">
            <span className="tabular font-semibold text-foreground">
              {records.length}
            </span>{" "}
            {records.length === 1 ? "تحليل محفوظ" : "تحليلات محفوظة"}
          </p>
        )}
      </header>

      {isLoading && (
        <div
          className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2"
          data-ocid="history.loading_state"
        >
          {SKELETON_IDS.map((id) => (
            <div
              key={id}
              className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-11 rounded-md" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div
          className="mt-6 flex flex-col items-center gap-4 rounded-lg border border-destructive/40 bg-destructive/5 px-6 py-12 text-center"
          data-ocid="history.error_state"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">
              تعذّر تحميل السجل
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error && error.message
                ? error.message
                : "حدث خطأ أثناء جلب التحليلات المحفوظة."}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            data-ocid="history.retry_button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw
              className={isFetching ? "size-4 animate-spin" : "size-4"}
              aria-hidden="true"
            />
            إعادة المحاولة
          </Button>
        </div>
      )}

      {!isLoading && !isError && records.length === 0 && (
        <div
          className="mt-6 flex flex-col items-center gap-5 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center"
          data-ocid="history.empty_state"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow-primary">
            <CandlestickChart className="size-8" aria-hidden="true" />
          </span>
          <div className="max-w-md">
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
              لا توجد تحليلات محفوظة بعد
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              ابدأ بتحليل شارت سهم أو عملة رقمية، وسيظهر التحليل هنا تلقائياً
              للرجوع إليه لاحقاً.
            </p>
          </div>
          <Button
            asChild
            data-ocid="history.empty_cta_button"
            className="gap-2"
          >
            <Link to="/">
              <CandlestickChart className="size-4" aria-hidden="true" />
              اذهب إلى تحليل الشارت
            </Link>
          </Button>
        </div>
      )}

      {deleteAnalysis.isError && (
        <p
          data-ocid="history.delete_error"
          className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground"
        >
          {deleteAnalysis.error instanceof Error && deleteAnalysis.error.message
            ? deleteAnalysis.error.message
            : "تعذّر حذف التحليل. حاول مرة أخرى."}
        </p>
      )}

      {!isLoading && !isError && records.length > 0 && (
        <div
          className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2"
          data-ocid="history.list"
        >
          {records.map((record, index) => (
            <AnalysisHistoryCard
              key={record.id.toString()}
              record={record}
              index={index + 1}
              onOpen={handleOpen}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <AnalysisDetailModal
        record={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent
          data-ocid="history.delete_dialog"
          className="border-border bg-card text-right"
        >
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="font-display text-lg font-bold text-foreground">
              حذف التحليل؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              سيتم حذف تحليل{" "}
              <span className="font-semibold text-foreground">
                {pendingDelete?.assetName}
              </span>{" "}
              نهائياً من السجل. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start">
            <AlertDialogCancel
              data-ocid="history.cancel_button"
              className="mt-0"
            >
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="history.confirm_button"
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default HistoryPage;
