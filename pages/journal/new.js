import Head from "next/head";
import { useRouter } from "next/router";
import JournalModal from "@/components/JournalModal";

export default function NewJournalPage() {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>Jurnal - Nota completa</title>
      </Head>
      <JournalModal onClose={() => { router.replace("/journal"); }} />
    </>
  );
}
