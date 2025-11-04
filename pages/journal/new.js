import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback } from "react";
import JournalModal from "@/components/JournalModal";
import { useToast } from "@/contexts/ToastContext";

export default function NewJournalPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const handleClose = useCallback(() => {
    router.replace("/journal");
  }, [router]);

  const handleSaved = useCallback(async () => {
    showToast({
      message: "Nota a fost salvata.",
      actionHref: "/journal",
      actionLabel: "Vezi jurnalul",
    });
    await router.replace("/journal");
  }, [router, showToast]);

  return (
    <>
      <Head>
        <title>Jurnal - Nota completa</title>
      </Head>
      <JournalModal onClose={handleClose} onSaved={handleSaved} />
    </>
  );
}
