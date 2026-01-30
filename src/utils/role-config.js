import { Crown, Cpu, Scale, Shield, Users, User, Briefcase, Megaphone, Layers, Gem } from 'lucide-react';

export const ROLE_CONFIG = {
    'CEO': {
        icon: Crown,
        color: 'text-rose-700',
        bgColor: 'bg-rose-100',
        borderColor: 'border-rose-200',
        label: 'CEO'
    },
    'CTO': {
        icon: Cpu,
        color: 'text-violet-700',
        bgColor: 'bg-violet-100',
        borderColor: 'border-violet-200',
        label: 'CTO'
    },
    'CPO': {
        icon: Layers,
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-100',
        borderColor: 'border-emerald-200',
        label: 'CPO'
    },
    'CMO': {
        icon: Megaphone,
        color: 'text-pink-700',
        bgColor: 'bg-pink-100',
        borderColor: 'border-pink-200',
        label: 'CMO'
    },
    'CCO': {
        icon: Gem,
        color: 'text-cyan-700',
        bgColor: 'bg-cyan-100',
        borderColor: 'border-cyan-200',
        label: 'CCO'
    },
    'CLO': {
        icon: Scale,
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200',
        label: 'CLO'
    },
    'Quản lý': {
        icon: Briefcase,
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        label: 'Quản lý'
    },
    'Admin': {
        icon: Shield,
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-100',
        borderColor: 'border-indigo-200',
        label: 'Admin'
    },
    'Nhân viên': {
        icon: User,
        color: 'text-slate-700',
        bgColor: 'bg-slate-100',
        borderColor: 'border-slate-200',
        label: 'Nhân viên'
    }
};

export const getRoleSettings = (role) => {
    return ROLE_CONFIG[role] || ROLE_CONFIG['Nhân viên'];
};
