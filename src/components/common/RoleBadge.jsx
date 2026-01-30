import { Crown, Cpu, Scale, Shield, Users, User, Briefcase, Megaphone, Layers, Gem } from 'lucide-react';

const RoleBadge = ({ role }) => {
    const config = {
        'CEO': {
            icon: Crown,
            color: 'bg-rose-100 text-rose-700 border-rose-200',
            label: 'CEO'
        },
        'CTO': {
            icon: Cpu,
            color: 'bg-violet-100 text-violet-700 border-violet-200',
            label: 'CTO'
        },
        'CPO': {
            icon: Layers,
            color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            label: 'CPO'
        },
        'CMO': {
            icon: Megaphone,
            color: 'bg-pink-100 text-pink-700 border-pink-200',
            label: 'CMO'
        },
        'CCO': {
            icon: Gem,
            color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
            label: 'CCO'
        },
        'CLO': {
            icon: Scale,
            color: 'bg-amber-100 text-amber-700 border-amber-200',
            label: 'CLO'
        },
        'Quản lý': {
            icon: Briefcase,
            color: 'bg-blue-100 text-blue-700 border-blue-200',
            label: 'Quản lý'
        },
        'Admin': {
            icon: Shield,
            color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            label: 'Admin'
        },
        'Nhân viên': {
            icon: User,
            color: 'bg-slate-100 text-slate-700 border-slate-200',
            label: 'Nhân viên'
        }
    };

    // Default for unknown roles
    const safeRole = role || 'Nhân viên';
    const settings = config[safeRole] || {
        icon: User,
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        label: safeRole
    };

    const Icon = settings.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${settings.color}`}>
            <Icon size={12} className="stroke-[2.5px]" />
            {settings.label.toUpperCase()}
        </span>
    );
};

export default RoleBadge;
