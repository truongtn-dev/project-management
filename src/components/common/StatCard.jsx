import React from 'react';
import '../../styles/global.css';

const StatCard = ({ icon: Icon, label, value, footer, type = 'primary' }) => {
    return (
        <div className="stat-card glass-card">
            <div className={`stat-icon ${type}`}>
                <Icon size={24} />
            </div>
            <div className="stat-content">
                <p className="stat-label">{label}</p>
                <h2 className="stat-value">{value}</h2>
                {footer && <div className="stat-footer">{footer}</div>}
            </div>
        </div>
    );
};

export default StatCard;
