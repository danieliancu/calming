import PsychologistArticleForm from '@/Components/PsychologistArticleForm';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';

export default function AssistantArticleNew({ topics = [] }) {
    return (
        <>
            <Head title="Articol nou - Calming" />
            <PsychologistArticleForm
                topics={topics}
                submitRoute={route('superadmin.articles.direct.store')}
                method="post"
                title="Articol nou"
                description="Completează articolul în același editor folosit de specialiști. La publicare, articolul este aprobat direct și va afișa semnătura Autor invitat."
                submitLabel="Publica articolul"
                backHref={route('superadmin.dashboard')}
                cancelHref={route('superadmin.dashboard')}
                authorNameEnabled
                authorNameLabel="Nume autor"
            />
        </>
    );
}

AssistantArticleNew.layout = (page) => <AppLayout>{page}</AppLayout>;
