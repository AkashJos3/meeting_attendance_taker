import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';
import { CheckCircle, Clock, Lock, PenTool } from 'lucide-react';

const API_URL = '/api';

const AttendeeView = () => {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [logs, setLogs] = useState([]);
  const sigCanvas = useRef({});

  const addLog = (msg) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  // Check local storage primarily
  useEffect(() => {
    addLog('Component mounted');
    const local = localStorage.getItem(`attended_${id}`);
    if (local) {
      setSubmitted(true);
    }
  }, [id]);

  // Poll for status
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/meetings/${id}`);
      setMeeting(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    addLog('Submit clicked');

    if (!name.trim()) {
      addLog('Validation failed: No name');
      setErrorMsg('Please enter your name');
      return;
    }
    if (sigCanvas.current.isEmpty()) {
      addLog('Validation failed: No signature');
      setErrorMsg('Please sign your name');
      return;
    }

    setIsSubmitting(true);
    addLog('Generating signature...');
    let signature;
    try {
      if (!sigCanvas.current) throw new Error('Canvas ref missing');
      const canvas = sigCanvas.current.getCanvas();
      addLog('Canvas retrieved (Raw)');
      signature = canvas.toDataURL('image/png');
      addLog(`Signature generated (${signature.length} chars)`);
    } catch (e) {
      addLog(`SIG ERROR: ${e.message}`);
      setIsSubmitting(false);
      return;
    }

    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2);
      localStorage.setItem('device_id', deviceId);
    }

    try {
      addLog(`Sending POST to ${API_URL}/attend...`);
      await axios.post(`${API_URL}/attend`, {
        meeting_id: id,
        name,
        signature,
        ip_hash: deviceId
      }, { timeout: 10000 });

      addLog('Success response received');
      localStorage.setItem(`attended_${id}`, 'true');
      setSubmitted(true);
    } catch (err) {
      addLog(`Error: ${err.message}`);
      if (err.response) {
        addLog(`Status: ${err.response.status}`);
      }
      console.error(err);
      if (err.response?.status === 409) {
        setSubmitted(true);
      } else {
        setErrorMsg(`Failed: ${err.message}`);
        setIsSubmitting(false);
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (!meeting) return <div className="p-8 text-center text-red-500">Meeting not found.</div>;

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-6 text-center">
        <div className="bg-white p-8 rounded-full shadow-lg mb-6">
          <CheckCircle size={64} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-green-800 mb-2">You're Checked In!</h1>
        <p className="text-green-700">Thank you for attending <strong>{meeting.title}</strong>.</p>
        <p className="text-sm text-green-600 mt-4">You can close this tab now.</p>
      </div>
    );
  }

  // State: PENDING
  if (meeting.status === 'PENDING') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="bg-white p-6 rounded-full shadow-lg mb-6 animate-pulse">
          <Clock size={48} className="text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{meeting.title}</h1>
        <p className="text-gray-600">The meeting hasn't started yet.</p>
        <p className="text-sm text-gray-500 mt-2">Please wait, this page will update automatically...</p>
      </div>
    );
  }

  // State: ENDED
  if (meeting.status === 'ENDED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="bg-white p-6 rounded-full shadow-lg mb-6">
          <Lock size={48} className="text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{meeting.title}</h1>
        <p className="text-gray-600">This meeting has ended.</p>
        <p className="text-sm text-gray-500 mt-2">Attendance is closed.</p>
      </div>
    );
  }

  // State: ACTIVE (Form)
  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-xl font-bold">{meeting.title}</h1>
          <p className="opacity-90 text-sm">Please sign in below</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Your Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center">
              <span>Signature</span>
              <span className="text-xs text-gray-400 font-normal">Draw below</span>
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-1 bg-gray-50 relative flex justify-center"
              style={{ touchAction: 'none' }}
            >
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{
                  width: 320,
                  height: 160,
                  className: 'bg-white rounded cursor-crosshair'
                }}
              />
              <button
                type="button"
                onClick={clearSignature}
                className="absolute top-2 right-2 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-600"
              >
                Clear
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-100 text-red-700 p-3 rounded text-sm text-center">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white font-bold py-4 rounded-lg shadow transition-all transform active:scale-95 
              ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Attendance'}
          </button>
        </form>

        {/* Debug Console */}
        <div className="bg-black text-green-400 p-4 text-xs font-mono h-40 overflow-y-auto">
          <p className="border-b border-gray-700 mb-2 pb-1">Debug Console:</p>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendeeView;
