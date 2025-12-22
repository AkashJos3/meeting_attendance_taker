import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Play, Square, Download, Users, Lock, RefreshCw } from 'lucide-react';

const API_URL = '/api';

const AdminDashboard = () => {
  const { id } = useParams();
  const location = useLocation();
  const [secret, setSecret] = useState(location.state?.secret || '');
  const [meeting, setMeeting] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [serverIp, setServerIp] = useState(window.location.hostname);

  // Fetch Server IP - Need to fetch the REAL LAN IP from backend for the QR code
  useEffect(() => {
    axios.get(`${API_URL}/config`)
      .then(res => {
        if (res.data.ip && res.data.ip !== 'localhost') {
          setServerIp(res.data.ip);
        }
      })
      .catch(err => console.error("Failed to fetch IP config"));
  }, []);

  // Initial Check / Fetch
  useEffect(() => {
    if (secret) {
      verifyAndFetch();
    } else {
      setLoading(false);
    }
  }, [id, secret]);

  // Polling for attendees
  useEffect(() => {
    if (!isAuthenticated || meeting?.status === 'ENDED') return;
    const interval = setInterval(fetchAttendees, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, meeting?.status]);

  const verifyAndFetch = async () => {
    setLoading(true);
    try {
      // Fetch Core Info
      const res = await axios.get(`${API_URL}/meetings/${id}`);
      setMeeting(res.data);

      // Verify Secret by trying to fetch attendees (protected route)
      await fetchAttendees();

      setIsAuthenticated(true);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        alert('Invalid Secret Key');
        setSecret(''); // clear invalid secret
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async () => {
    try {
      const res = await axios.get(`${API_URL}/meetings/${id}/attendees`, { params: { admin_secret: secret } });
      setAttendees(res.data);
    } catch (err) {
      console.error('Failed to fetch attendees');
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await axios.post(`${API_URL}/meetings/${id}/status`, { status: newStatus, admin_secret: secret });
      // Update local state immediately for UI response
      setMeeting(prev => ({ ...prev, status: newStatus }));
      fetchAttendees(); // get latest
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const downloadReport = (type) => {
    window.open(`${API_URL}/meetings/${id}/export/${type}?admin_secret=${secret}`, '_blank');
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full">
          <h2 className="text-xl font-bold mb-4 flex items-center"><Lock className="mr-2" /> Admin Access</h2>
          <p className="mb-4 text-sm text-gray-600">Enter the Secret Key for this meeting to manage it.</p>
          <input
            type="text"
            className="w-full p-3 border rounded mb-4"
            placeholder="Secret Key"
            value={secret}
            onChange={e => setSecret(e.target.value)}
          />
          <button
            onClick={verifyAndFetch}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700"
          >
            Access Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  const joinLink = `${window.location.protocol}//${serverIp}:${window.location.port}/join/${id}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{meeting.title}</h1>
            <p className="text-sm text-gray-500">ID: {meeting.id}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${meeting.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
            meeting.status === 'ENDED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}>
            {meeting.status}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Column: Controls & QR */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold text-gray-700 mb-4">Meeting Controls</h3>

            {meeting.status === 'PENDING' && (
              <button
                onClick={() => updateStatus('ACTIVE')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded flex items-center justify-center text-lg"
              >
                <Play className="mr-2" /> Start Meeting
              </button>
            )}

            {meeting.status === 'ACTIVE' && (
              <button
                onClick={() => updateStatus('ENDED')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded flex items-center justify-center text-lg"
              >
                <Square className="mr-2" /> End Meeting
              </button>
            )}

            {meeting.status === 'ENDED' && (
              <div className="text-center p-4 bg-gray-50 rounded text-gray-500 font-medium">
                Meeting has ended.
              </div>
            )}

            {/* Export Actions - Always visible if records exist, but logical after meeting */}
            <div className="mt-6 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Exports</p>
              <button onClick={() => downloadReport('pdf')} className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded flex items-center justify-center">
                <Download className="mr-2" size={16} /> Download PDF
              </button>
              <button onClick={() => downloadReport('csv')} className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded flex items-center justify-center">
                <Download className="mr-2" size={16} /> Download CSV
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col items-center">
            <h3 className="font-semibold text-gray-700 mb-4">Join via QR Code</h3>
            <div className="bg-white p-2 border rounded">
              <QRCodeSVG value={joinLink} size={180} />
            </div>
            <p className="mt-4 text-center text-sm text-gray-500 break-all">{joinLink}</p>
          </div>
        </div>

        {/* Right Column: Attendees */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-700 flex items-center">
                <Users className="mr-2" size={20} /> Attendees
                <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{attendees.length}</span>
              </h3>
              <button onClick={fetchAttendees} className="text-blue-600 hover:text-blue-800">
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="divide-y max-h-[600px] overflow-y-auto">
              {attendees.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No attendees yet. Waiting for joiners...
                </div>
              ) : (
                attendees.map((att) => (
                  <div key={att.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="font-bold text-gray-800">{att.name}</p>
                      <p className="text-xs text-gray-500">{new Date(att.timestamp).toLocaleTimeString()}</p>
                    </div>
                    {att.signature && (
                      <img src={att.signature} alt="sig" className="h-8 object-contain opacity-50 border rounded" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div >
  );
};

export default AdminDashboard;
