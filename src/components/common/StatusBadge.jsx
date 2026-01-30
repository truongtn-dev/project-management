import React from 'react';
import '../../styles/global.css';

const StatusBadge = ({ status, type = 'neutral' }) => {
    // Map specific statuses to types if not provided
    const getType = (status) => {
        const map = {
            'Hoàn thành': 'success',
            'Đang thực hiện': 'primary',
            'Chưa bắt đầu': 'warning',
            'Tạm dừng': 'danger', // or neutral
            'Hủy bỏ': 'danger',
            'Thấp': 'success',
            'Trung bình': 'primary',
            'Cao': 'danger'
        };
        return map[status] || type;
    };

    const badgeType = type === 'neutral' ? getType(status) : type;

    return (
        <span className={`badge badge-${badgeType}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
