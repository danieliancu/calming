import Head from "next/head";
import { useRouter } from "next/router";
import JournalModal from "@/components/JournalModal";

export default function NewJournalPage() {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>Jurnal ? Intrare | CalmMind</title>
      </Head>
      <JournalModal onClose={() => { router.push("/", undefined, { shallow: true }); }} />
    </>
  );
}
