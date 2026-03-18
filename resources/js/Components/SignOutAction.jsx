import { FiLogOut } from '@/lib/icons';

export default function SignOutAction({ onClick, className = 'settings-signout-card', label = 'Iesi din cont' }) {
    return (
        <button type="button" className={className} onClick={onClick}>
            <FiLogOut size={18} />
            <span>{label}</span>
        </button>
    );
}
