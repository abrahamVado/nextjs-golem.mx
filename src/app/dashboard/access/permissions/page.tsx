import { redirect } from 'next/navigation';

export default function PermissionsPage() {
    redirect('/dashboard/access/roles');
}
