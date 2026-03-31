import PsychologistArticleForm from '@/Components/PsychologistArticleForm';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';

export default function PsychologistArticleEdit({ article, topics = [] }) {
    return (
        <>
            <Head title="Editează articol - Calming Partners" />
            <PsychologistArticleForm
                article={article}
                topics={topics}
                submitRoute={route('psychologists.articles.update', article.id)}
                method="put"
                title="Editează articol"
                description="Actualizează conținutul articolului. Modificările vor intra din nou în procesul de validare."
                submitLabel="Salveaza modificarile"
            />
        </>
    );
}

PsychologistArticleEdit.layout = (page) => <AppLayout>{page}</AppLayout>;
