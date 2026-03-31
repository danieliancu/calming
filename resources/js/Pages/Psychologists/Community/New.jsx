import PsychologistCommunityGroupForm from '@/Components/PsychologistCommunityGroupForm';
import AppLayout from '@/Layouts/AppLayout';

export default function PsychologistCommunityNew() {
    return (
        <PsychologistCommunityGroupForm
            title="Adaugă grup - Calming Partners"
            heading="Creează un grup de sprijin"
            description="Configurează grupul după modelul din comunitate și invită utilizatori existenți atunci când alegi acces privat."
            submitLabel="Creează grup"
            submitProcessingLabel="Se creează..."
            submitMethod="post"
            submitRoute={route('psychologists.community.store')}
        />
    );
}

PsychologistCommunityNew.layout = (page) => <AppLayout>{page}</AppLayout>;
