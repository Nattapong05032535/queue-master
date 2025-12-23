'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { handleLogin } from '@/app/actions';
import { useSearchParams } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition duration-300 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          เข้าสู่ระบบ
          <svg 
            className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </>
      )}
    </button>
  );
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [state, formAction] = useFormState(handleLogin, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <div className="w-full max-w-md px-6 relative z-10">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
          {/* Logo / Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl mb-6 shadow-xl shadow-indigo-500/20 transform -rotate-6">
              <span className="text-white text-3xl font-bold italic">L</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2">Limitless Club</h1>
            <p className="text-slate-400">Admin Authentication Portal</p>
          </div>

          <form action={formAction} className="space-y-6">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">ชื่อผู้ใช้</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  name="username"
                  type="text"
                  required
                  placeholder="Username"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 pl-12 pr-4 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">รหัสผ่าน</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 pl-12 pr-4 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            {state?.success === false && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm py-3 px-4 rounded-xl flex items-center gap-3 animate-shake">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {state.message}
              </div>
            )}

            <SubmitButton />
          </form>

          {/* Footer Decoration */}
          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Limitless Club Team. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}
