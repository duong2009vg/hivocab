// src/components/common/ErrorBoundary.jsx
// Catches unhandled runtime rendering errors and displays a user-friendly UI instead of blank screen
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.hash = '';
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/20 shadow-sm">
            <span className="material-symbols-outlined text-[32px]">warning</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-on-surface mb-2">
            Đã có lỗi xảy ra khi hiển thị
          </h2>
          <p className="text-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
            Ứng dụng gặp sự cố tạm thời khi tải nội dung này. Vui lòng thử tải lại hoặc quay về trang chủ.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-medium text-sm flex items-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>Tải lại trang</span>
            </button>

            <button
              onClick={this.handleGoHome}
              className="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-medium text-sm border border-outline-variant/30 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span>Về trang chủ</span>
            </button>
          </div>

          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <details className="mt-8 text-left max-w-xl w-full bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 text-xs text-on-surface-variant font-mono overflow-auto max-h-48">
              <summary className="cursor-pointer font-bold text-error mb-2">Chi tiết lỗi (dành cho lập trình viên)</summary>
              <pre className="whitespace-pre-wrap">{this.state.error.toString()}</pre>
              {this.state.errorInfo?.componentStack && (
                <pre className="mt-2 text-[10px] text-on-surface-variant/70 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
