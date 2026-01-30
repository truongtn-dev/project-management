import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAuth } from '../contexts/auth-context';
import { LogIn, Mail, Lock, AlertCircle, CheckCircle, Briefcase, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [successMsg, setSuccessMsg] = useState('');

    const location = useLocation();
    useEffect(() => {
        if (location.state?.message) {
            if (location.state.type === 'success') {
                setSuccessMsg(location.state.message);
            } else {
                setError(location.state.message);
            }
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            if (result.user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData.status === 'pending') {
                            await auth.signOut();
                            setError('Tài khoản đang chờ phê duyệt. Vui lòng liên hệ Admin.');
                            setLoading(false);
                            return;
                        } else if (userData.status === 'rejected') {
                            await auth.signOut();
                            setError('Tài khoản đã bị từ chối truy cập.');
                            setLoading(false);
                            return;
                        }
                    }
                    navigate('/');
                } catch (err) {
                    console.error('Check status error:', err);
                    navigate('/');
                }
            } else {
                navigate('/');
            }
        } else {
            console.error("Login Error:", result.error);
            let msg = result.error;
            if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
                msg = 'Email hoặc mật khẩu không chính xác.';
            } else if (msg.includes('auth/too-many-requests')) {
                msg = 'Quá nhiều lần thử đăng nhập thất bại. Vui lòng thử lại sau.';
            }
            setError(msg);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            <div className="bg-white/80 backdrop-blur-xl w-full max-w-md rounded-2xl shadow-xl border border-white/50 p-8 relative z-10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl shadow-lg shadow-primary-500/30 flex items-center justify-center mx-auto mb-4 text-white">
                        <Briefcase size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản Lý Dự Án</h1>
                    <p className="text-gray-500 mt-2">Đăng nhập để tiếp tục vào hệ thống</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600">
                        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {successMsg && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3 text-green-600">
                        <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">{successMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="email"
                                className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 placeholder:text-gray-400"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 ml-1">Mật khẩu</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="w-full pl-11 pr-12 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 placeholder:text-gray-400"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Đang xử lý...</span>
                            </>
                        ) : (
                            <>
                                <span>Đăng Nhập</span>
                                <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
