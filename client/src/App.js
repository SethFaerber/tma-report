import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

      // Call API
      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        body: formData,
      });

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

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>Strategic Maturity Assessment</h1>
          <p className="subtitle">Generate comprehensive team analysis reports</p>
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
