import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Upload form state
  const [file, setFile] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedEmail = localStorage.getItem('userEmail');

    if (storedToken && storedEmail) {
      setAuthToken(storedToken);
      setUserEmail(storedEmail);
      setIsAuthenticated(true);
    }
  }, []);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginEmail.trim()) {
      setLoginError('Please enter your email address');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: loginEmail.trim() })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store token and email
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userEmail', data.email);

      setAuthToken(data.token);
      setUserEmail(data.email);
      setIsAuthenticated(true);
      setLoginEmail('');

    } catch (err) {
      setLoginError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    setAuthToken(null);
    setUserEmail('');
    setIsAuthenticated(false);
    setFile(null);
    setTeamName('');
    setSpecialInstructions('');
    setError('');
    setSuccess(false);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    // Validate file type
    if (selectedFile && !selectedFile.name.endsWith('.xlsx')) {
      setError('Please select a valid Excel file (.xlsx)');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!file) {
      setError('Please select an Excel file');
      return;
    }

    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('teamName', teamName.trim());
      if (specialInstructions.trim()) {
        formData.append('specialInstructions', specialInstructions.trim());
      }

      // Call API with Authorization header
      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData,
      });

      if (response.status === 401) {
        // Token expired or invalid - redirect to login
        setError('Your session has expired. Please log in again.');
        handleLogout();
        return;
      }

      if (!response.ok) {
        // Try to parse error message
        const errorData = await response.json().catch(() => ({ error: 'Failed to process file' }));
        throw new Error(errorData.error || 'Failed to generate report');
      }

      // Get PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Strategic_Maturity_Assessment_${teamName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Reset form
      setSuccess(true);
      setFile(null);
      setTeamName('');
      setSpecialInstructions('');

      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      setError(err.message || 'An error occurred while generating the report');
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <div className="App">
        <div className="container login-container">
          <header className="header">
            <h1>Strategic Maturity Assessment</h1>
            <p className="subtitle">Please log in to continue</p>
          </header>

          <form onSubmit={handleLogin} className="form">
            <div className="form-group">
              <label htmlFor="login-email">
                Email Address <span className="required">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="your.email@company.com"
                disabled={loginLoading}
                className="text-input"
                autoComplete="email"
              />
              <p className="help-text">Enter your authorized email address</p>
            </div>

            {loginError && (
              <div className="message error-message">
                <strong>Error:</strong> {loginError}
              </div>
            )}

            {loginLoading && (
              <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Verifying your email...</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="submit-button"
            >
              {loginLoading ? 'Verifying...' : 'Continue'}
            </button>
          </form>

          <footer className="footer">
            <p>Powered by Claude AI • Built by Ramsey Solutions</p>
          </footer>
        </div>
      </div>
    );
  }

  // If authenticated, show upload form
  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>Strategic Maturity Assessment</h1>
          <p className="subtitle">Generate comprehensive team analysis reports</p>
          <div className="user-info">
            <span className="user-email">{userEmail}</span>
            <button onClick={handleLogout} className="logout-button">
              Log out
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="form">
          {/* File Upload */}
          <div className="form-group">
            <label htmlFor="file-input">
              Excel File <span className="required">*</span>
            </label>
            <input
              id="file-input"
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              disabled={loading}
              className="file-input"
            />
            {file && <p className="file-name">Selected: {file.name}</p>}
            <p className="help-text">Upload your Microsoft Forms export (.xlsx file)</p>
          </div>

          {/* Team Name */}
          <div className="form-group">
            <label htmlFor="team-name">
              Team Name <span className="required">*</span>
            </label>
            <input
              id="team-name"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., Executive Team"
              disabled={loading}
              className="text-input"
            />
          </div>

          {/* Special Instructions (Optional) */}
          <div className="form-group">
            <label htmlFor="special-instructions">
              Special Instructions <span className="optional">(optional)</span>
            </label>
            <textarea
              id="special-instructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any specific analysis focus or questions you'd like addressed..."
              disabled={loading}
              className="textarea-input"
              rows="4"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="message error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="message success-message">
              <strong>Success!</strong> Your report has been downloaded. Check your downloads folder.
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">
                Generating your report... This may take 30-60 seconds.
              </p>
              <p className="loading-subtext">
                We're analyzing your data and generating AI-powered insights.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Generating Report...' : 'Generate Report'}
          </button>
        </form>

        <footer className="footer">
          <p>Powered by Claude AI • Built by Ramsey Solutions</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
