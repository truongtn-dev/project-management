import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const result = await resetPassword(email);

        if (result.success) {
            setMessage({
                type: 'success',
                text: 'Email khôi phục mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư đến của bạn.'
            });
            setEmail('');
        } else {
            console.error("Reset Password Error:", result.error);
            let msg = result.error;
            if (msg.includes('auth/user-not-found')) {
                msg = 'Email không tồn tại trong hệ thống.';
            } else if (msg.includes('auth/invalid-email')) {
                msg = 'Email không hợp lệ.';
            } else {
                msg = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
            }
            setMessage({ type: 'error', text: msg });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            <div className="bg-white/80 backdrop-blur-xl w-full max-w-md rounded-2xl shadow-xl border border-white/50 p-8 relative z-10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600">
                        <KeyRound size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu?</h1>
                    <p className="text-gray-500 mt-2">Nhập email của bạn để nhận liên kết đặt lại mật khẩu</p>
                </div>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                        {message.type === 'success' ? (
                            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                        )}
                        <span className="text-sm font-medium">{message.text}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="email"
                                className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-900 placeholder:text-gray-400"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>Đang gửi...</span>
                            </>
                        ) : (
                            <span>Gửi liên kết khôi phục</span>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link to="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors gap-1">
                        <ArrowLeft size={16} />
                        Quay lại trang đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
