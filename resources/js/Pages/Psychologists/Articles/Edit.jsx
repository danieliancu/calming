import PsychologistArticleForm from '@/Components/PsychologistArticleForm';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';

export default function PsychologistArticleEdit({ article, topics = [] }) {
    return (
        <>
            <Head title="Editeaza articol - Calming Partners" />
            <PsychologistArticleForm
                article={article}
                topics={topics}
                submitRoute={route('psychologists.articles.update', article.id)}
                method="put"
                title="Editeaza articol"
                description="Actualizeaza continutul articolului. Modificarile vor intra din nou in proces de validare."
                submitLabel="Salveaza modificarile"
            />
        </>
    );
}

PsychologistArticleEdit.layout = (page) => <AppLayout>{page}</AppLayout>;
