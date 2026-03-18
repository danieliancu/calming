import PsychologistCommunityGroupForm from '@/Components/PsychologistCommunityGroupForm';
import AppLayout from '@/Layouts/AppLayout';

export default function PsychologistCommunityNew() {
    return (
        <PsychologistCommunityGroupForm
            title="Adauga grup - Calming Partners"
            heading="Creeaza un grup de sprijin"
            description="Configureaza grupul dupa modelul din comunitate si invita utilizatori existenti atunci cand alegi acces privat."
            submitLabel="Creeaza grup"
            submitProcessingLabel="Se creeaza..."
            submitMethod="post"
            submitRoute={route('psychologists.community.store')}
        />
    );
}

PsychologistCommunityNew.layout = (page) => <AppLayout>{page}</AppLayout>;
