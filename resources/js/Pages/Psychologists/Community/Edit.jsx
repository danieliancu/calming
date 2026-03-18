import PsychologistCommunityGroupForm from '@/Components/PsychologistCommunityGroupForm';
import AppLayout from '@/Layouts/AppLayout';

export default function PsychologistCommunityEdit({ group }) {
    return (
        <PsychologistCommunityGroupForm
            title="Editeaza grup - Calming Partners"
            heading="Editeaza grupul de sprijin"
            description="Actualizeaza descrierea, accesul, intalnirile live si lista de invitatii pentru grupul tau."
            submitLabel="Salveaza modificarile"
            submitProcessingLabel="Se salveaza..."
            submitMethod="put"
            submitRoute={route('psychologists.community.update', group.id)}
            group={group}
        />
    );
}

PsychologistCommunityEdit.layout = (page) => <AppLayout>{page}</AppLayout>;
