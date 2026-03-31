import PsychologistArticleForm from '@/Components/PsychologistArticleForm';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';

export default function PsychologistArticleNew({ topics = [] }) {
    return (
        <>
            <Head title="Adaugă articol - Calming Partners" />
            <PsychologistArticleForm
                topics={topics}
                submitRoute={route('psychologists.articles.store')}
                method="post"
                title="Adaugă articol"
                description="Completeaza campurile de mai jos pentru a propune un articol nou. Echipa editoriala il va valida inainte de publicare."
                submitLabel="Trimite articol"
            />
        </>
    );
}

PsychologistArticleNew.layout = (page) => <AppLayout>{page}</AppLayout>;
