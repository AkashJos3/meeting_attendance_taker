import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, UserPlus, ArrowRight } from 'lucide-react';

const API_URL = '/api';

const Home = () => {
    const [title, setTitle] = useState('');
    const [createdMeeting, setCreatedMeeting] = useState(null);
    const [joinId, setJoinId] = useState('');
    const navigate = useNavigate();

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!title) return;
        try {
            const res = await axios.post(`${API_URL}/meetings`, { title });
            setCreatedMeeting(res.data);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || err.message || 'Unknown error';
            alert(`Error creating meeting: ${msg}`);
        }
    };

    const handleJoin = (e) => {
        e.preventDefault();
        if (joinId) navigate(`/join/${joinId}`);
    };

    const goToAdmin = () => {
        if (createdMeeting) {
            // Pass secret via state, but also user should know strictly about it.
            // We will rely on localStorage for persistence in this session? 
            // Or just url? User rules say "No login", so getting back in is hard if we don't save it.
            // Let's save a "recents" list in localStorage for convenience.
            const saved = JSON.parse(localStorage.getItem('my_meetings') || '[]');
            saved.push({ id: createdMeeting.id, title: createdMeeting.title, secret: createdMeeting.admin_secret, date: new Date().toISOString() });
            localStorage.setItem('my_meetings', JSON.stringify(saved));

            navigate(`/admin/${createdMeeting.id}`, { state: { secret: createdMeeting.admin_secret } });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Attendance<span className="text-blue-600">Now</span></h1>
                <p className="text-center text-gray-500 mb-8">Instant, one-time meeting attendance.</p>

                {!createdMeeting ? (
                    <>
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-700">
                                <PlusCircle className="mr-2" size={20} /> Organizer
                            </h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Meeting Title (e.g. Dept Weekly)"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
                                    Create Meeting
                                </button>
                            </form>
                        </div>

                        <div className="border-t pt-8">
                            <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-700">
                                <UserPlus className="mr-2" size={20} /> Attendee
                            </h2>
                            <form onSubmit={handleJoin} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Enter Meeting ID"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    value={joinId}
                                    onChange={(e) => setJoinId(e.target.value)}
                                    required
                                />
                                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors">
                                    Join Meeting
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                        <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">
                            <h3 className="font-bold text-xl mb-2">Meeting Created!</h3>
                            <p className="text-sm">Your meeting is ready.</p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-left mb-6 text-sm text-yellow-800">
                            <p className="font-bold mb-1">⚠️ Save this Secret Key!</p>
                            <p>You need this key to control the meeting. If you lose it, you cannot access the admin panel.</p>
                            <code className="block bg-white p-2 mt-2 rounded border border-yellow-200 font-mono text-center select-all">
                                {createdMeeting.admin_secret}
                            </code>
                        </div>

                        <button
                            onClick={goToAdmin}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center"
                        >
                            Go to Dashboard <ArrowRight className="ml-2" size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Recents Helper - Optional */}
            <div className="mt-8 text-sm text-gray-400">
                <p>No login required. Cookies used for session only.</p>
            </div>
        </div>
    );
};

export default Home;
