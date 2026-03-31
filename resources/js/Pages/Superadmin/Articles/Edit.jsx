import PsychologistArticleForm from '@/Components/PsychologistArticleForm';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';

export default function SuperadminArticleEdit({ article, topics = [] }) {
    return (
        <>
            <Head title="Editează articol invitat - Calming" />
            <PsychologistArticleForm
                article={article}
                topics={topics}
                submitRoute={route('superadmin.articles.update', article.id)}
                method="put"
                title="Editează articol invitat"
                description="Actualizează articolul publicat de autor invitat. Modificările rămân aprobate direct."
                submitLabel="Salveaza modificarile"
                backHref={route('superadmin.dashboard')}
                cancelHref={route('superadmin.dashboard')}
                authorNameEnabled
                authorNameLabel="Nume autor"
            />
        </>
    );
}

SuperadminArticleEdit.layout = (page) => <AppLayout>{page}</AppLayout>;
