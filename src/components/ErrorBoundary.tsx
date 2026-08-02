import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-lg font-bold text-[hsl(var(--ink))]">حدث خطأ غير متوقع</h1>
          <p className="text-sm text-muted-foreground max-w-sm break-words" dir="ltr">
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="h-11 px-6 rounded-xl bg-[hsl(var(--sprout))] text-white font-bold text-sm active:translate-y-[2px] shadow-[0_3px_0_hsl(var(--sprout-dark))]"
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
