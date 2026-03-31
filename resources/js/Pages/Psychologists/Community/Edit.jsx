import PsychologistCommunityGroupForm from '@/Components/PsychologistCommunityGroupForm';
import AppLayout from '@/Layouts/AppLayout';

export default function PsychologistCommunityEdit({ group }) {
    return (
        <PsychologistCommunityGroupForm
            title="Editează grup - Calming Partners"
            heading="Editează grupul de sprijin"
            description="Actualizează descrierea, accesul, întâlnirile live și lista de invitații pentru grupul tău."
            submitLabel="Salveaza modificarile"
            submitProcessingLabel="Se salveaza..."
            submitMethod="put"
            submitRoute={route('psychologists.community.update', group.id)}
            group={group}
        />
    );
}

PsychologistCommunityEdit.layout = (page) => <AppLayout>{page}</AppLayout>;
