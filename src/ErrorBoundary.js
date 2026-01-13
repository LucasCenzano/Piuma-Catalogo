
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    fontFamily: 'Montserrat, sans-serif',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa'
                }}>
                    <h1 style={{ color: '#d32f2f', marginBottom: '1rem' }}>¡Ups! Algo salió mal.</h1>
                    <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#555' }}>
                        No pudimos cargar la página correctamente.
                    </p>
                    <div style={{ marginBottom: '2rem' }}>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '12px 24px',
                                fontSize: '1rem',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                transition: 'background-color 0.3s'
                            }}
                        >
                            🔄 Recargar Página
                        </button>
                    </div>

                    <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left', marginTop: '20px', color: '#777', maxWidth: '800px' }}>
                        <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Ver detalles técnicos (para soporte)</summary>
                        <div style={{ background: '#eee', padding: '15px', borderRadius: '5px', overflowX: 'auto', fontSize: '0.9rem' }}>
                            {this.state.error && this.state.error.toString()}
                            <br />
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </div>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
