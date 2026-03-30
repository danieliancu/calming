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
                description="Completeaza articolul in acelasi editor folosit de specialisti. La publicare, articolul este aprobat direct si va afisa semnatura Autor invitat."
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
