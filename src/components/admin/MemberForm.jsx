import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, firebaseConfig } from "../../config/firebase";
import { X, AlertCircle, Camera, Loader2, Upload } from "lucide-react";
import { uploadToCloudinary } from '../../services/upload-service';

const MemberForm = ({ onClose, onSuccess, initialData = null }) => {
    const isEditing = !!initialData;
    const isApproving = initialData?.isApproving;

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        role: 'Nhân viên',
        phone: '',
        expertise: '',
        photoURL: null
    });

    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const roles = [
        'CEO', 'CTO', 'CCO', 'CMO', 'CPO', 'CLO',
        'Admin', 'Quản lý', 'Nhân viên'
    ];

    useEffect(() => {
        if (initialData) {
            setFormData({
                displayName: initialData.displayName || '',
                email: initialData.email || '',
                password: '',
                role: initialData.role || 'Nhân viên',
                phone: initialData.phone || '',
                expertise: initialData.expertise || '',
                photoURL: initialData.photoURL || null
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setError('');

        try {
            const url = await uploadToCloudinary(file);
            setFormData(prev => ({ ...prev, photoURL: url }));
        } catch (error) {
            console.error(error);
            setError('Lỗi tải ảnh: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const createUserIdeally = async (email, password) => {
        let secondaryApp;
        try {
            const appName = `secondaryApp-${Date.now()}`;
            secondaryApp = initializeApp(firebaseConfig, appName);
            const secondaryAuth = getAuth(secondaryApp);
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            await signOut(secondaryAuth);
            return userCredential.user;
        } finally {
            // Cleanup handled by Firebase internally usually
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isEditing) {
                const updates = {
                    displayName: formData.displayName,
                    role: formData.role,
                    phone: formData.phone,
                    expertise: formData.expertise,
                    photoURL: formData.photoURL
                };

                if (isApproving) {
                    updates.status = 'active';
                }

                await updateDoc(doc(db, 'users', initialData.id || initialData.uid), updates);
            } else {
                if (!formData.displayName || !formData.email || !formData.password) {
                    throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
                }

                if (formData.password.length < 6) {
                    throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
                }

                const newUser = await createUserIdeally(formData.email, formData.password);

                await setDoc(doc(db, 'users', newUser.uid), {
                    uid: newUser.uid,
                    email: formData.email,
                    displayName: formData.displayName,
                    role: formData.role,
                    status: 'active',
                    phone: formData.phone || '',
                    expertise: formData.expertise || '',
                    photoURL: formData.photoURL || null,
                    createdAt: new Date().toISOString()
                });
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving member:', err);
            let errorMessage = err.message;
            if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'Email này đã được sử dụng';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900">
                        {isApproving
                            ? 'Phê duyệt thành viên'
                            : isEditing
                                ? 'Chỉnh sửa thông tin'
                                : 'Thêm thành viên mới'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg flex items-start gap-2 text-sm">
                            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {isApproving && (
                        <div className="mb-4 p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg flex items-start gap-2 text-sm">
                            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                            <span>Vui lòng kiểm tra và cập nhật Vai trò trước khi duyệt.</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Avatar Upload */}
                        <div className="flex justify-center mb-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 group-hover:border-primary-500 transition-colors">
                                    {isUploading ? (
                                        <Loader2 className="animate-spin text-primary-500" size={32} />
                                    ) : formData.photoURL ? (
                                        <img src={formData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-gray-400 flex flex-col items-center">
                                            <Camera size={24} />
                                            <span className="text-[10px] mt-1">Upload</span>
                                        </div>
                                    )}
                                </div>

                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <Upload size={20} />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={isUploading}
                                    />
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="displayName"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                placeholder="Nguyễn Văn A"
                                value={formData.displayName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                placeholder="example@company.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={isEditing}
                            />
                        </div>

                        {!isEditing && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mật khẩu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                    placeholder="Tối thiểu 6 ký tự"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                                <p className="text-xs text-gray-500 mt-1">Mật khẩu tạm thời cho lần đăng nhập đầu tiên</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Vai trò <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="role"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                >
                                    {roles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                    placeholder="0901234567"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên môn chính</label>
                            <textarea
                                name="expertise"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm resize-none"
                                placeholder="Ví dụ: Quản lý dự án, UI/UX Design..."
                                rows={3}
                                value={formData.expertise}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="pt-4 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                disabled={loading}
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {loading ? 'Đang xử lý...' : (isApproving ? 'Lưu & Phê Duyệt' : isEditing ? 'Cập nhật' : 'Tạo tài khoản')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MemberForm;
