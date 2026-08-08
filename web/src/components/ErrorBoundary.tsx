import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#ff8fa3', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          Error al renderizar el visor 3D:{'\n'}
          {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}
