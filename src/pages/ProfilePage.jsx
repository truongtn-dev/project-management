import { useState, useRef } from 'react';
import { useAuth } from '../contexts/auth-context';
import { uploadToCloudinary } from '../services/upload-service';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Camera, Save, User, Mail, Shield, Loader2, Phone, Briefcase, Calendar, Activity, Fingerprint, Lock, KeyRound } from 'lucide-react';

const ProfilePage = () => {
    const { currentUser, userProfile, userRole, changePassword } = useAuth();
    const [displayName, setDisplayName] = useState(userProfile?.displayName || currentUser?.displayName || '');
    const [phone, setPhone] = useState(userProfile?.phone || '');
    const [expertise, setExpertise] = useState(userProfile?.expertise || '');
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    // Use profile photo or fallback
    const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || currentUser?.photoURL);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setMessage({ type: '', text: '' });

        try {
            const url = await uploadToCloudinary(file);
            setPhotoURL(url);
            setMessage({ type: 'success', text: 'Tải ảnh lên thành công. Hãy nhấn "Lưu thay đổi" để cập nhật.' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Lỗi tải ảnh: ' + error.message });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            setMessage({ type: 'error', text: 'Tên hiển thị không được để trống' });
            return;
        }

        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                displayName,
                phone,
                expertise,
                photoURL
            });

            setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Lỗi cập nhật hồ sơ: ' + error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin.' });
            return;
        }

        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordMessage({ type: 'error', text: 'Mật khẩu mới không được trùng với mật khẩu cũ.' });
            return;
        }

        setIsChangingPassword(true);
        setPasswordMessage({ type: '', text: '' });

        const result = await changePassword(currentPassword, newPassword);

        if (result.success) {
            setPasswordMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            console.error("Change Password Error:", result.error);
            let msg = result.error;
            if (msg.includes('auth/wrong-password')) {
                msg = 'Mật khẩu hiện tại không chính xác.';
            } else if (msg.includes('auth/too-many-requests')) {
                msg = 'Quá nhiều lần thử. Vui lòng thử lại sau.';
            } else {
                msg = 'Lỗi đổi mật khẩu: ' + msg;
            }
            setPasswordMessage({ type: 'error', text: msg });
        }
        setIsChangingPassword(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>

            {/* General Info Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6 flex flex-col items-center sm:items-start sm:flex-row sm:gap-6">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-md flex items-center justify-center">
                                {photoURL ? (
                                    <img
                                        src={photoURL}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-4xl font-bold text-gray-400">
                                        {(displayName?.[0] || 'U').toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-lg border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                title="Thay đổi ảnh đại diện"
                            >
                                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        <div className="mt-4 sm:mt-16 text-center sm:text-left">
                            <h2 className="text-2xl font-bold text-gray-900">{displayName || 'Người dùng'}</h2>
                            <p className="text-sm text-gray-500">{userRole || 'Nhân viên'}</p>
                        </div>
                    </div>

                    {message.text && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {message.type === 'success' ? <div className="w-2 h-2 rounded-full bg-green-500" /> : <div className="w-2 h-2 rounded-full bg-red-500" />}
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    )}

                    <div className="grid gap-6 max-w-2xl">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <User size={16} />
                                Tên hiển thị
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Nhập tên hiển thị của bạn"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Phone size={16} />
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Nhập số điện thoại"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Briefcase size={16} />
                                Chuyên môn
                            </label>
                            <input
                                type="text"
                                value={expertise}
                                onChange={(e) => setExpertise(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Ví dụ: Thiết kế UI/UX, Backend dev..."
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Mail size={16} />
                                Email
                            </label>
                            <input
                                type="email"
                                value={currentUser?.email || ''}
                                disabled
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500">Email không thể thay đổi.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Shield size={16} />
                                    Vai trò
                                </label>
                                <input
                                    type="text"
                                    value={userRole || ''}
                                    disabled
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Activity size={16} />
                                    Trạng thái
                                </label>
                                <input
                                    type="text"
                                    value={userProfile?.status === 'active' ? 'Đang hoạt động' : 'Vô hiệu hóa'}
                                    disabled
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Calendar size={16} />
                                    Ngày tham gia
                                </label>
                                <input
                                    type="text"
                                    value={userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('vi-VN') : ''}
                                    disabled
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Fingerprint size={16} />
                                    User ID
                                </label>
                                <input
                                    type="text"
                                    value={currentUser?.uid || ''}
                                    disabled
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed font-mono text-xs"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleSave}
                                disabled={isSaving || isUploading}
                                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <KeyRound size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Đổi mật khẩu</h2>
                </div>

                <div className="p-8">
                    {passwordMessage.text && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {passwordMessage.type === 'success' ? <div className="w-2 h-2 rounded-full bg-green-500" /> : <div className="w-2 h-2 rounded-full bg-red-500" />}
                            <p className="text-sm font-medium">{passwordMessage.text}</p>
                        </div>
                    )}

                    <div className="grid gap-6 max-w-2xl">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Lock size={16} />
                                Mật khẩu hiện tại
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Nhập mật khẩu hiện tại"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Lock size={16} />
                                Mật khẩu mới
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Lock size={16} />
                                Xác nhận mật khẩu mới
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Nhập lại mật khẩu mới"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleChangePassword}
                                disabled={isChangingPassword}
                                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isChangingPassword ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                Cập nhật mật khẩu
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
