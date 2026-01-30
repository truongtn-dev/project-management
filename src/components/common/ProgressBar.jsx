import React from 'react';
import '../../styles/global.css';

const ProgressBar = ({ progress, type = 'primary', showText = false }) => {
    const getProgressColor = (percent) => {
        if (percent >= 100) return 'success';
        if (percent > 0) return 'primary';
        return 'neutral';
    };

    const colorClass = type === 'primary' ? getProgressColor(progress) : type;

    return (
        <div className="progress-wrapper">
            <div className="progress-container">
                <div
                    className={`progress-bar ${colorClass}`}
                    style={{ width: `${Math.max(0, Math.min(100, progress || 0))}%` }}
                ></div>
            </div>
            {showText && <div className="progress-text">{progress}%</div>}
        </div>
    );
};

export default ProgressBar;
