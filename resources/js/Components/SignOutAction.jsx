import { FiLogOut } from '@/lib/icons';

export default function SignOutAction({ onClick, className = 'settings-signout-card', label = 'Iesire cont' }) {
    return (
        <button type="button" className={className} onClick={onClick}>
            <span>{label}</span>
        </button>
    );
}
